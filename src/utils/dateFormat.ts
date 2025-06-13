import { format, parseISO } from 'date-fns';

/**
 * Formats a date string to the standard format: "MMM DD, HH:MM AM/PM"
 * Example: "Jun 09, 04:35 AM"
 */
export const formatStandardDateTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'MMM dd, hh:mm a');
};

/**
 * Formats a date string to show only the date in "MMM DD, YYYY" format
 * Example: "Jun 09, 2024"
 */
export const formatStandardDate = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'MMM dd, yyyy');
};

/**
 * Formats a date string to show only the time in "HH:MM AM/PM" format
 * Example: "04:35 AM"
 */
export const formatStandardTime = (dateString: string | Date): string => {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
  return format(date, 'hh:mm a');
}; 