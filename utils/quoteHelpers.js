/**
 * Helper functions for quote processing.
 */

/**
 * Safely parses a cell value that might contain a JSON string representing rooms.
 * Handles arrays, standard JSON strings, and double-encoded JSON strings.
 * @param {*} cellValue - The value from the sheet cell or request body.
 * @returns {Array} An array of room objects or an empty array if parsing fails.
 */
export function safeParseRooms(cellValue) {
  if (!cellValue) return [];
  if (Array.isArray(cellValue)) return cellValue;

  if (typeof cellValue === 'string') {
    try {
      // First attempt to parse directly
      const parsed = JSON.parse(cellValue);
      if (Array.isArray(parsed)) return parsed;
      // Handle cases where rooms are nested like { rooms: [...] }
      if (parsed && Array.isArray(parsed.rooms)) return parsed.rooms;
    } catch (e) {
      // Ignore if direct parsing fails
    }

    try {
      // Try to unwrap double-quoted JSON string "[{...}]"
      const unquoted = cellValue.replace(/^"(.*)"$/, '$1');
      if (unquoted !== cellValue) { // Check if replacement happened
        const parsed2 = JSON.parse(unquoted);
        if (Array.isArray(parsed2)) return parsed2;
      }
    } catch (e) {
      // Ignore if the second attempt fails
    }
  }

  // In a staging environment, you could add a more tolerant parser if needed.
  // For production, it's safer to return an empty array.
  if (process.env.STAGING === 'true') {
      console.warn('[safeParseRooms] Failed to parse rooms data in staging:', cellValue);
  }

  return [];
}

/**
 * Safely parses a JSON string, returning a fallback value if parsing fails.
 * @param {string} jsonString The JSON string to parse.
 * @param {any} fallback The value to return on error.
 * @returns {any} The parsed object or the fallback value.
 */
export function safeJsonParse(jsonString, fallback = []) {
  if (typeof jsonString !== 'string' || !jsonString.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to parse JSON string:', e);
    return fallback;
  }
}

/**
 * Calculates the total square meters from an array of room objects.
 * @param {Array<object>} rooms - Array of room objects with `sqm` properties.
 * @returns {number} The total square meters.
 */
export function sumRoomsSqm(rooms) {
  if (!Array.isArray(rooms)) {
    return 0;
  }
  return rooms.reduce((total, room) => total + (parseFloat(room.sqm) || 0), 0);
}

/**
 * Converts a value to a number, stripping currency symbols and commas.
 * @param {string|number} value The value to convert.
 * @returns {number} The numeric value, or 0 if conversion fails.
 */
export function toNum(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}