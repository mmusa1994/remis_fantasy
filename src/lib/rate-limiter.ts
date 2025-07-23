interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, resetTime: entry.resetTime };
    }

    entry.count++;
    this.store.set(identifier, entry);
    return { allowed: true };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

export const registrationLimiter = new RateLimiter(15 * 60 * 1000, 5);

setInterval(() => {
  registrationLimiter.cleanup();
}, 5 * 60 * 1000);