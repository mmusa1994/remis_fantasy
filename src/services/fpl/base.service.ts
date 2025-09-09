import { FPLAPIError, FPLServiceError } from "./errors";
import type { FPLServiceConfig, FPLCacheConfig } from "../../types/fpl";

/**
 * Base service class for all FPL services
 * Provides common functionality like HTTP requests, caching, rate limiting, etc.
 */
export abstract class BaseFPLService {
  protected readonly baseUrl: string;
  protected readonly config: FPLServiceConfig;
  protected readonly cache: Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >;
  protected readonly requestQueue: Map<string, Promise<any>>;

  constructor(config: Partial<FPLServiceConfig> = {}) {
    this.baseUrl = config.base_url || "https://fantasy.premierleague.com/api";
    this.config = {
      base_url: this.baseUrl,
      timeout: config.timeout || 10000,
      max_retries: config.max_retries || 3,
      retry_delay: config.retry_delay || 1000,
      rate_limit: {
        requests_per_second: config.rate_limit?.requests_per_second || 10,
        burst_limit: config.rate_limit?.burst_limit || 50,
        ...config.rate_limit,
      },
      cache: {
        default_ttl: config.cache?.default_ttl || 300000, // 5 minutes
        bootstrap_ttl: config.cache?.bootstrap_ttl || 600000, // 10 minutes
        live_data_ttl: config.cache?.live_data_ttl || 30000, // 30 seconds
        static_data_ttl: config.cache?.static_data_ttl || 3600000, // 1 hour
        ...config.cache,
      },
      ...config,
    };

    this.cache = new Map();
    this.requestQueue = new Map();
  }

  /**
   * Generic fetch method with retry logic, caching, and error handling
   */
  protected async fetchWithRetry<T>(
    endpoint: string,
    cacheConfig?: FPLCacheConfig,
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = cacheConfig?.key || endpoint;

    // Check cache first
    if (cacheConfig && this.isCacheValid(cacheKey, cacheConfig.ttl)) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    const requestPromise = this.executeRequest<T>(
      url,
      endpoint,
      cacheConfig,
      retryCount
    );
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  private async executeRequest<T>(
    url: string,
    endpoint: string,
    cacheConfig?: FPLCacheConfig,
    retryCount = 0
  ): Promise<T> {
    try {
      // First try direct FPL API call
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Referer: "https://fantasy.premierleague.com/",
          Origin: "https://fantasy.premierleague.com",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "X-Requested-With": "XMLHttpRequest",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // On 403 Forbidden, try proxy fallback (for production deployment)
        if (
          response.status === 403 &&
          (typeof window === "undefined" ||
            process.env.FPL_USE_PROXY === "true")
        ) {
          return this.tryProxyFallback<T>(endpoint, cacheConfig);
        }

        if (response.status === 429 && retryCount < this.config.max_retries) {
          const delay = this.calculateRetryDelay(retryCount);
          await this.sleep(delay);
          return this.executeRequest(
            url,
            endpoint,
            cacheConfig,
            retryCount + 1
          );
        }

        throw new FPLAPIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          endpoint
        );
      }

      const data = (await response.json()) as T;

      // Cache the successful response
      if (cacheConfig) {
        this.setCache(cacheConfig.key || endpoint, data, cacheConfig.ttl);
      }

      return data;
    } catch (error) {
      if (error instanceof FPLAPIError) {
        throw error;
      }

      // Handle abort errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new FPLAPIError(
          `Request timeout after ${this.config.timeout}ms`,
          408,
          endpoint,
          error
        );
      }

      // Retry on network errors
      if (retryCount < this.config.max_retries) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.executeRequest(url, endpoint, cacheConfig, retryCount + 1);
      }

      throw new FPLAPIError(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        undefined,
        endpoint,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async tryProxyFallback<T>(
    endpoint: string,
    cacheConfig?: FPLCacheConfig
  ): Promise<T> {
    // Try multiple proxy methods
    const proxyMethods = [
      `/api/fpl/proxy?endpoint=${encodeURIComponent(endpoint)}`,
      `/api/fpl/cors-proxy?endpoint=${endpoint}`,
    ];

    let lastError: Error | null = null;

    for (const proxyUrl of proxyMethods) {
      try {
        console.log(`🔄 Trying proxy: ${proxyUrl.split("?")[0]}`);

        const response = await fetch(proxyUrl, {
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout for proxies
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || "Proxy returned unsuccessful response"
          );
        }

        console.log(`✅ Proxy success: ${proxyUrl.split("?")[0]}`);

        // Cache the successful response
        if (cacheConfig) {
          this.setCache(
            cacheConfig.key || endpoint,
            result.data,
            cacheConfig.ttl
          );
        }

        return result.data as T;
      } catch (error) {
        console.warn(`❌ Proxy failed: ${proxyUrl.split("?")[0]}`, error);
        lastError =
          error instanceof Error ? error : new Error("Unknown proxy error");
        continue; // Try next proxy
      }
    }

    // All proxy methods failed
    throw new FPLAPIError(
      `All proxy fallbacks failed. Last error: ${
        lastError?.message || "Unknown error"
      }`,
      500,
      endpoint,
      lastError || undefined
    );
  }

  /**
   * Cache management methods
   */
  protected setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  protected getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  protected isCacheValid(key: string, ttl: number): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < ttl;
  }

  protected clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Utility methods
   */
  protected validateId(id: number, fieldName: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new FPLServiceError(
        `Invalid ${fieldName}: must be a positive integer`,
        this.constructor.name,
        "validation"
      );
    }
  }

  protected validateGameweek(gameweek: number): void {
    if (!Number.isInteger(gameweek) || gameweek < 1 || gameweek > 38) {
      throw new FPLServiceError(
        "Invalid gameweek: must be between 1 and 38",
        this.constructor.name,
        "validation"
      );
    }
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retry_delay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 10000); // Max 10 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check method for service monitoring
   */
  public async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    latency?: number;
  }> {
    try {
      const startTime = Date.now();
      await this.fetchWithRetry("/bootstrap-static/", {
        key: "health_check",
        ttl: 5000, // Very short TTL for health checks
      });
      const latency = Date.now() - startTime;

      return { status: "healthy", latency };
    } catch {
      return { status: "unhealthy" };
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    size: number;
    hit_rate?: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      ttl: value.ttl,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}
