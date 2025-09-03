import { ErrorType } from '@/types/validation';

/**
 * User-friendly error messages and recovery suggestions
 */
export const ERROR_MESSAGES = {
  [ErrorType.NETWORK_ERROR]: {
    title: 'Connection Issue',
    description: 'Unable to connect to FPL servers. This could be due to network issues or FPL server maintenance.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'FPL servers may be temporarily down',
    ],
    canRetry: true,
    retryText: 'Retry Connection',
    fallbackText: 'Save Anyway',
  },
  [ErrorType.RATE_LIMIT]: {
    title: 'Too Many Requests',
    description: 'FPL servers are limiting requests. This is normal during busy periods.',
    suggestions: [
      'Wait 30 seconds before trying again',
      'FPL servers are busy during popular times',
      'Try during off-peak hours for faster response',
    ],
    canRetry: true,
    retryText: 'Wait and Retry',
    fallbackText: 'Save for Later',
  },
  [ErrorType.INVALID_ID]: {
    title: 'Manager ID Not Found',
    description: 'The Manager ID you entered does not exist in the FPL database.',
    suggestions: [
      'Double-check your Manager ID in your FPL account',
      'Look for the number after "/entry/" in your FPL URL',
      'Make sure you\'re using your own Manager ID, not your team ID',
    ],
    canRetry: false,
    retryText: '',
    fallbackText: '',
  },
  [ErrorType.TIMEOUT]: {
    title: 'Request Timeout',
    description: 'The validation is taking longer than expected. FPL servers may be slow.',
    suggestions: [
      'FPL servers are responding slowly',
      'Try again with a fresh request',
      'Consider saving anyway and verifying later',
    ],
    canRetry: true,
    retryText: 'Try Again',
    fallbackText: 'Save Anyway',
  },
  [ErrorType.SERVER_ERROR]: {
    title: 'FPL Server Error',
    description: 'Fantasy Premier League servers are experiencing issues.',
    suggestions: [
      'FPL is having technical difficulties',
      'Your Manager ID will be saved for verification later',
      'Check FPL\'s official social media for updates',
    ],
    canRetry: true,
    retryText: 'Retry',
    fallbackText: 'Save for Later',
  },
  [ErrorType.UNKNOWN]: {
    title: 'Unexpected Error',
    description: 'Something unexpected happened during validation.',
    suggestions: [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists',
    ],
    canRetry: true,
    retryText: 'Try Again',
    fallbackText: 'Save Anyway',
  },
} as const;

/**
 * Get formatted error message for display
 */
export function getErrorMessage(errorType: ErrorType): typeof ERROR_MESSAGES[ErrorType] {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorType.UNKNOWN];
}

/**
 * Get retry delay message based on error type and attempt count
 */
export function getRetryDelayMessage(errorType: ErrorType, delayMs: number): string {
  const seconds = Math.ceil(delayMs / 1000);
  
  switch (errorType) {
    case ErrorType.RATE_LIMIT:
      return `Waiting ${seconds} seconds for FPL servers...`;
    case ErrorType.NETWORK_ERROR:
      return `Retrying in ${seconds} seconds...`;
    case ErrorType.TIMEOUT:
      return `Trying again in ${seconds} seconds...`;
    case ErrorType.SERVER_ERROR:
      return `Retrying in ${seconds} seconds...`;
    default:
      return `Retrying in ${seconds} seconds...`;
  }
}

/**
 * Get success message based on verification status
 */
export function getSuccessMessage(isVerified: boolean): { title: string; description: string } {
  if (isVerified) {
    return {
      title: 'Manager ID Verified!',
      description: 'Your FPL Manager ID has been successfully verified and saved.',
    };
  } else {
    return {
      title: 'Manager ID Saved',
      description: 'Your Manager ID has been saved. We\'ll verify it with FPL when their servers are available.',
    };
  }
}

/**
 * Get verification status display info
 */
export function getVerificationStatusInfo(isVerified: boolean | null): {
  label: string;
  color: string;
  icon: string;
  description: string;
} {
  if (isVerified === true) {
    return {
      label: 'Verified',
      color: 'green',
      icon: '✓',
      description: 'Your Manager ID has been verified with FPL',
    };
  } else if (isVerified === false) {
    return {
      label: 'Unverified',
      color: 'yellow',
      icon: '⚠',
      description: 'Manager ID saved but not yet verified with FPL',
    };
  } else {
    return {
      label: 'Unknown',
      color: 'gray',
      icon: '?',
      description: 'Verification status unknown',
    };
  }
}