// Enhanced error handling types for manager ID validation

export enum ValidationState {
  IDLE = "idle",
  VALIDATING = "validating",
  RETRYING = "retrying",
  SUCCESS = "success",
  PARTIAL_SUCCESS = "partial_success",
  FAILED = "failed",
}

export enum ErrorType {
  NETWORK_ERROR = "network_error",
  RATE_LIMIT = "rate_limit",
  INVALID_ID = "invalid_id",
  TIMEOUT = "timeout",
  SERVER_ERROR = "server_error",
  UNKNOWN = "unknown",
}

export interface ValidationResult {
  state: ValidationState;
  managerId: string;
  isVerified: boolean;
  warningMessage?: string;
  retryCount: number;
  lastAttempt: Date;
  errorType?: ErrorType;
  canRetry: boolean;
  fallbackAvailable: boolean;
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  userMessage: string;
  canRetry: boolean;
  retryDelay?: number;
  fallbackAvailable: boolean;
  actionText?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ValidationStatus {
  isValidating: boolean;
  isRetrying: boolean;
  retryCount: number;
  errorDetails: ErrorDetails | null;
  showRetryOption: boolean;
  showFallbackOption: boolean;
}

export interface ManagerIdState {
  managerId: string;
  isVerified: boolean;
  lastValidationAttempt: Date;
  validationErrors: ErrorDetails[];
  retryScheduled?: Date;
  validationState: ValidationState;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

// Error type detection patterns
export const ERROR_PATTERNS = {
  NETWORK: /network|connection|timeout|fetch/i,
  RATE_LIMIT: /rate|limit|too many|throttle/i,
  NOT_FOUND: /not found|404|does not exist/i,
  SERVER_ERROR: /500|server error|internal/i,
} as const;