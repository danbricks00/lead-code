/**
 * Standardized date utilities for consistent DD/MM/YYYY formatting throughout the system
 * All dates should be formatted according to New Zealand standards
 */

/**
 * Format a date as DD/MM/YYYY (New Zealand format)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date as DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDateDDMMYYYY:', date);
    return '';
  }
  
  return dateObj.toLocaleDateString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date as DD/MM/YYYY HH:mm (New Zealand format with time)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date as DD/MM/YYYY HH:mm
 */
export function formatDateTimeDDMMYYYY(date = new Date()) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    console.warn('Invalid date provided to formatDateTimeDDMMYYYY:', date);
    return '';
  }
  
  return dateObj.toLocaleString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Parse a date string that could be in various formats and return DD/MM/YYYY
 * Prioritizes DD/MM/YYYY parsing for New Zealand dates
 * @param {string} dateString - Date string to parse
 * @returns {string} - Formatted date as DD/MM/YYYY or empty string if invalid
 */
export function parseAndFormatDate(dateString) {
  if (!dateString) return '';
  
  try {
    // Try DD/MM/YYYY format first (New Zealand standard)
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        // Validate date components
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020) {
          const date = new Date(year, month - 1, day); // month is 0-indexed
          if (!isNaN(date.getTime())) {
            return formatDateDDMMYYYY(date);
          }
        }
      }
    }
    
    // Try parsing as regular date and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return formatDateDDMMYYYY(date);
    }
    
    return '';
  } catch (error) {
    console.warn('Error parsing date:', dateString, error);
    return '';
  }
}

/**
 * Get current NZ timestamp formatted as DD/MM/YYYY HH:mm
 * @returns {string} - Current NZ time formatted as DD/MM/YYYY HH:mm
 */
export function getCurrentNZTimestamp() {
  return formatDateTimeDDMMYYYY(new Date());
}

/**
 * Get current NZ date formatted as DD/MM/YYYY
 * @returns {string} - Current NZ date formatted as DD/MM/YYYY
 */
export function getCurrentNZDate() {
  return formatDateDDMMYYYY(new Date());
}

/**
 * Add days to a date and return as DD/MM/YYYY
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {string} - New date formatted as DD/MM/YYYY
 */
export function addDaysAndFormat(date, days) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const newDate = new Date(dateObj.getTime() + (days * 24 * 60 * 60 * 1000));
  return formatDateDDMMYYYY(newDate);
}

/**
 * Get a date 14 days from now formatted as DD/MM/YYYY (default quote expiry)
 * @returns {string} - Date 14 days from now as DD/MM/YYYY
 */
export function getDefaultQuoteExpiry() {
  const now = new Date();
  return addDaysAndFormat(now, 14);
}

/**
 * Get a date 7 days from now formatted as DD/MM/YYYY (fallback expiry)
 * @returns {string} - Date 7 days from now as DD/MM/YYYY
 */
export function getFallbackQuoteExpiry() {
  const now = new Date();
  return addDaysAndFormat(now, 7);
}
