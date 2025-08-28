/**
 * Format team value properly for FPL
 * FPL stores team values in a specific format where:
 * - Values >= 100 need to be divided by 10 to get the actual value
 * - Values < 100 are already in the correct format
 * 
 * Examples:
 * - 999.0 -> 99.90 (999/10 = 99.9)
 * - 100.5 -> 100.5 (already correct)
 * - 50.0 -> 50.0 (already correct)
 * 
 * @param value - The raw team value from FPL API
 * @returns Formatted team value string
 */
export function formatTeamValue(value: number): string {
  if (!value || value <= 0) return "0.0";
  
  // If value is >= 100, divide by 10 to get proper format
  if (value >= 100) {
    return (value / 10).toFixed(2);
  }
  
  // Otherwise, just format with 1 decimal place
  return value.toFixed(1);
}

/**
 * Format team value with currency symbol
 * @param value - The raw team value from FPL API
 * @returns Formatted team value with £ symbol and 'm' suffix
 */
export function formatTeamValueWithCurrency(value: number): string {
  return `£${formatTeamValue(value)}m`;
}

/**
 * Parse team value from FPL format to actual value
 * @param value - The raw team value from FPL API
 * @returns Actual team value as number
 */
export function parseTeamValue(value: number): number {
  if (!value || value <= 0) return 0;
  
  // If value is >= 100, divide by 10 to get actual value
  if (value >= 100) {
    return value / 10;
  }
  
  // Otherwise, return as is
  return value;
}
