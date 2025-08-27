/**
 * Custom error classes for FPL service operations
 */

export class FPLAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FPLAPIError';
  }
}

export class FPLServiceError extends Error {
  constructor(
    message: string,
    public service: string,
    public operation?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FPLServiceError';
  }
}

export class FPLCacheError extends Error {
  constructor(
    message: string,
    public cacheKey: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FPLCacheError';
  }
}

export class FPLValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value?: any
  ) {
    super(message);
    this.name = 'FPLValidationError';
  }
}