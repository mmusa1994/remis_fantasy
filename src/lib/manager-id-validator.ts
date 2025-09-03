import { 
  ValidationResult, 
  ErrorDetails, 
  ErrorType, 
  ValidationState, 
  RetryConfig, 
  DEFAULT_RETRY_CONFIG,
  ERROR_PATTERNS 
} from '@/types/validation';

/**
 * Enhanced manager ID validation utility with error handling and retry logic
 */
export class ManagerIdValidator {
  private retryConfig: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Categorize error based on message and response
   */
  private categorizeError(error: any, response?: Response): ErrorType {
    const message = error?.message || '';
    
    if (response?.status === 404 || ERROR_PATTERNS.NOT_FOUND.test(message)) {
      return ErrorType.INVALID_ID;
    }
    
    if (response?.status === 429 || ERROR_PATTERNS.RATE_LIMIT.test(message)) {
      return ErrorType.RATE_LIMIT;
    }
    
    if ((response?.status ?? 0) >= 500 || ERROR_PATTERNS.SERVER_ERROR.test(message)) {
      return ErrorType.SERVER_ERROR;
    }
    
    if (ERROR_PATTERNS.NETWORK.test(message) || error.name === 'TypeError') {
      return ErrorType.NETWORK_ERROR;
    }
    
    if (error.name === 'AbortError') {
      return ErrorType.TIMEOUT;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * Get user-friendly error details
   */
  private getErrorDetails(errorType: ErrorType, managerId: string, retryCount: number): ErrorDetails {
    const canRetry = retryCount < this.retryConfig.maxRetries;
    
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return {
          type: errorType,
          message: 'Network connection failed',
          userMessage: canRetry 
            ? `Can't connect to FPL servers right now. Retrying in ${this.getRetryDelay(retryCount) / 1000} seconds... (Attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`
            : "Connection issue persists. Would you like to save anyway?",
          canRetry,
          retryDelay: this.getRetryDelay(retryCount),
          fallbackAvailable: true,
          actionText: canRetry ? 'Retrying...' : 'Save Anyway'
        };
        
      case ErrorType.RATE_LIMIT:
        return {
          type: errorType,
          message: 'Rate limit exceeded',
          userMessage: canRetry
            ? `FPL servers are busy. Please wait ${Math.ceil(this.getRetryDelay(retryCount) / 1000)} seconds before trying again.`
            : "FPL servers are consistently busy. You can save your ID and we'll verify it later.",
          canRetry,
          retryDelay: this.getRetryDelay(retryCount),
          fallbackAvailable: true,
          actionText: canRetry ? 'Waiting...' : 'Save Unverified'
        };
        
      case ErrorType.INVALID_ID:
        return {
          type: errorType,
          message: 'Manager ID not found',
          userMessage: `Manager ID ${managerId} doesn't exist. Double-check your ID in your FPL account.`,
          canRetry: false,
          fallbackAvailable: false,
          actionText: 'Check ID'
        };
        
      case ErrorType.TIMEOUT:
        return {
          type: errorType,
          message: 'Request timeout',
          userMessage: canRetry
            ? "Validation is taking longer than usual. Retrying..."
            : "Validation is taking too long. Would you like to save anyway?",
          canRetry,
          retryDelay: this.getRetryDelay(retryCount),
          fallbackAvailable: true,
          actionText: canRetry ? 'Retrying...' : 'Save Anyway'
        };
        
      case ErrorType.SERVER_ERROR:
        return {
          type: errorType,
          message: 'FPL server error',
          userMessage: canRetry
            ? "FPL servers are experiencing issues. Retrying..."
            : "FPL servers are down. Your ID will be saved and verified later.",
          canRetry,
          retryDelay: this.getRetryDelay(retryCount),
          fallbackAvailable: true,
          actionText: canRetry ? 'Retrying...' : 'Save for Later'
        };
        
      default:
        return {
          type: errorType,
          message: 'Unknown error',
          userMessage: canRetry
            ? "Something went wrong. Trying again..."
            : "Unable to verify right now. You can save your ID anyway.",
          canRetry,
          retryDelay: this.getRetryDelay(retryCount),
          fallbackAvailable: true,
          actionText: canRetry ? 'Retrying...' : 'Save Anyway'
        };
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, retryCount),
      this.retryConfig.maxDelay
    );
    
    // Add small random jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fallback validation for when FPL API is unavailable
   */
  private fallbackValidation(managerId: string): { isValid: boolean; confidence: number } {
    // Basic format validation
    if (!/^\d{1,10}$/.test(managerId)) {
      return { isValid: false, confidence: 0 };
    }
    
    const id = parseInt(managerId);
    
    // Range validation (typical FPL manager IDs are in certain ranges)
    if (id < 1 || id > 10000000) {
      return { isValid: false, confidence: 0.3 };
    }
    
    // More likely to be valid if it's in common ranges
    if (id >= 100000 && id <= 9000000) {
      return { isValid: true, confidence: 0.7 };
    }
    
    return { isValid: true, confidence: 0.5 };
  }

  /**
   * Validate manager ID with FPL API
   */
  private async validateWithFplApi(managerId: string): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; REMIS-Fantasy/1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { 
          success: false, 
          error: { response, message: `HTTP ${response.status}` }
        };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      return { success: false, error };
    }
  }

  /**
   * Main validation method with retry logic
   */
  async validateManagerId(managerId: string): Promise<ValidationResult> {
    let retryCount = 0;
    let lastError: any = null;
    let lastErrorType: ErrorType = ErrorType.UNKNOWN;

    // Basic format validation first
    if (!managerId || !/^\d{1,10}$/.test(managerId)) {
      return {
        state: ValidationState.FAILED,
        managerId,
        isVerified: false,
        retryCount: 0,
        lastAttempt: new Date(),
        errorType: ErrorType.INVALID_ID,
        canRetry: false,
        fallbackAvailable: false,
      };
    }

    while (retryCount <= this.retryConfig.maxRetries) {
      try {
        const result = await this.validateWithFplApi(managerId);

        if (result.success) {
          return {
            state: ValidationState.SUCCESS,
            managerId,
            isVerified: true,
            retryCount,
            lastAttempt: new Date(),
            canRetry: false,
            fallbackAvailable: false,
          };
        }

        lastError = result.error;
        lastErrorType = this.categorizeError(result.error, result.error?.response);

        // Don't retry for invalid IDs
        if (lastErrorType === ErrorType.INVALID_ID) {
          break;
        }

        if (retryCount < this.retryConfig.maxRetries) {
          const delay = this.getRetryDelay(retryCount);
          await this.sleep(delay);
          retryCount++;
        } else {
          break;
        }

      } catch (error) {
        lastErrorType = this.categorizeError(error);
        
        if (retryCount < this.retryConfig.maxRetries) {
          const delay = this.getRetryDelay(retryCount);
          await this.sleep(delay);
          retryCount++;
        } else {
          break;
        }
      }
    }

    // All retries exhausted or non-retryable error
    if (lastErrorType === ErrorType.INVALID_ID) {
      return {
        state: ValidationState.FAILED,
        managerId,
        isVerified: false,
        retryCount,
        lastAttempt: new Date(),
        errorType: lastErrorType,
        canRetry: false,
        fallbackAvailable: false,
      };
    }

    // Use fallback validation for other errors
    const fallback = this.fallbackValidation(managerId);
    
    if (fallback.isValid) {
      return {
        state: ValidationState.PARTIAL_SUCCESS,
        managerId,
        isVerified: false,
        retryCount,
        lastAttempt: new Date(),
        errorType: lastErrorType,
        canRetry: false,
        fallbackAvailable: true,
        warningMessage: `Unable to verify with FPL servers (${this.getErrorDetails(lastErrorType, managerId, retryCount).userMessage}). Saved as unverified - you can retry later.`,
      };
    }

    return {
      state: ValidationState.FAILED,
      managerId,
      isVerified: false,
      retryCount,
      lastAttempt: new Date(),
      errorType: lastErrorType,
      canRetry: false,
      fallbackAvailable: false,
    };
  }

  /**
   * Get error details for UI display
   */
  getErrorDetailsForType(errorType: ErrorType, managerId: string, retryCount: number): ErrorDetails {
    return this.getErrorDetails(errorType, managerId, retryCount);
  }
}

// Export singleton instance
export const managerIdValidator = new ManagerIdValidator();