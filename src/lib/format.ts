/**
 * Formatting utilities for currency, numbers, and dates
 */

/**
 * Format a number as Vietnamese Dong (VND) currency
 * @param value - The numeric value to format
 * @param showSymbol - Whether to include the đ symbol (default: true)
 * @returns Formatted string (e.g., "1.000.000 đ")
 */
export function formatCurrency(value: number, showSymbol: boolean = true): string {
  // Format with Vietnamese thousand separator (.)
  const formatted = value.toLocaleString('vi-VN');
  return showSymbol ? `${formatted} đ` : formatted;
}

/**
 * Parse a VND currency string to a number
 * Handles formats like:
 * - "1.000.000" → 1000000
 * - "1,000,000" → 1000000
 * - "1000000 đ" → 1000000
 * - "1.000.000 đ" → 1000000
 * @param value - The string to parse
 * @returns Numeric value or 0 if invalid
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;

  // Remove all non-numeric characters except decimal point
  // First remove the đ symbol and any spaces
  let cleaned = value.replace(/đ/g, '').trim();

  // Remove thousand separators (both . and ,)
  cleaned = cleaned.replace(/\./g, '').replace(/,/g, '');

  // Parse to number
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number with Vietnamese thousand separators
 * @param value - The numeric value to format
 * @returns Formatted string (e.g., "1.000.000")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('vi-VN');
}

/**
 * Format a date in Vietnamese locale
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', options);
}

/**
 * Format a date as short format (DD/MM/YYYY)
 * @param date - The date to format
 * @returns Formatted date string (e.g., "15/01/2026")
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format a date with time
 * @param date - The date to format
 * @returns Formatted date-time string (e.g., "15/01/2026 14:30")
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a relative date (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return formatDateShort(dateObj);
  } else if (diffDays > 0) {
    return `${diffDays} ngày trước`;
  } else if (diffHours > 0) {
    return `${diffHours} giờ trước`;
  } else if (diffMins > 0) {
    return `${diffMins} phút trước`;
  } else if (diffSecs > 0) {
    return `${diffSecs} giây trước`;
  } else {
    return 'Vừa xong';
  }
}
