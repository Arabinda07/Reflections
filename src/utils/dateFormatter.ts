/**
 * Formats a date using the long English format (e.g., "May 5, 2026").
 * Ensures UTC time zone to prevent off-by-one errors across locales.
 */
export const formatLongDateUTC = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
};
