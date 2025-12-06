/**
 * Format date consistently across server and client
 * @param date Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US');
}

/**
 * Format date for display in charts
 * @param date Date string or Date object
 * @returns Formatted date string for charts
 */
export function formatDateForChart(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}