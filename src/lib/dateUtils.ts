import { format, isValid } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

/**
 * Safely formats any date string, timestamp, or Date object.
 * Guaranteed NEVER to throw RangeError: Invalid time value.
 */
export function safeFormatDate(
  dateValue: string | number | Date | null | undefined,
  pattern: string = 'dd/MM/yyyy',
  fallback: string = '-',
  options?: { locale?: any }
): string {
  if (!dateValue) return fallback;

  try {
    const dateObj = typeof dateValue === 'string' || typeof dateValue === 'number'
      ? new Date(dateValue)
      : dateValue;

    if (!isValid(dateObj) || isNaN(dateObj.getTime())) {
      return fallback;
    }

    return format(dateObj, pattern, options);
  } catch {
    return fallback;
  }
}

/**
 * Safely extracts the month index (0 to 11) from any date string or Date object.
 * Returns -1 if the date is invalid or missing.
 */
export function safeGetMonthIndex(dateValue: string | number | Date | null | undefined): number {
  if (!dateValue) return -1;

  try {
    const dateObj = typeof dateValue === 'string' || typeof dateValue === 'number'
      ? new Date(dateValue)
      : dateValue;

    if (!isValid(dateObj) || isNaN(dateObj.getTime())) {
      return -1;
    }

    const month = dateObj.getMonth();
    return month >= 0 && month <= 11 ? month : -1;
  } catch {
    return -1;
  }
}

/**
 * Safely extracts the year (e.g. "2024") from any date string or Date object.
 */
export function safeGetYear(dateValue: string | number | Date | null | undefined, fallback: string = ''): string {
  if (!dateValue) return fallback;

  try {
    const dateObj = typeof dateValue === 'string' || typeof dateValue === 'number'
      ? new Date(dateValue)
      : dateValue;

    if (!isValid(dateObj) || isNaN(dateObj.getTime())) {
      return fallback;
    }

    return String(dateObj.getFullYear());
  } catch {
    return fallback;
  }
}
