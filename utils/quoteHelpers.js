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
 * @param {number} [def=0] The default value to return if conversion is not possible.
 * @returns {number} The numeric value.
 */
export function toNum(v, def = 0) {
  if (v === null || v === undefined) return def;
  if (typeof v === 'number') return v;
  const s = ('' + v).replace(/[$,\s]/g, '');
  if (s === '') return def;
  const n = Number(s);
  return Number.isNaN(n) ? def : n;
}

/**
 * Computes line totals and a grand total from a rooms/items array.
 * @param {Array<object>} items - Array of items with qty, price/unitPrice.
 * @returns {{itemsWithTotals: Array<object>, grandTotal: number}} - The items with totals and the grand total.
 */
export function computeLineTotals(items) {
  if (!Array.isArray(items)) {
    return { itemsWithTotals: [], grandTotal: 0 };
  }

  let grandTotal = 0;
  const itemsWithTotals = items.map(item => {
    const qty = toNum(item.qty, 1);
    const unitPrice = toNum(item.unitPrice || item.price, 0);
    const lineTotal = qty * unitPrice;
    grandTotal += lineTotal;

    return {
      ...item,
      qty,
      unitPrice,
      lineTotal: lineTotal.toFixed(2),
    };
  });

  return { itemsWithTotals, grandTotal };
}

/**
 * Generates HTML table rows for quote line items, hiding rows with zero value
 * unless all items are zero.
 * @param {Array<object>} lineItems - Array of line items with `label` and `value`.
 * @returns {string} HTML string of table rows.
 */
export function generateLineItemsHtml(lineItems) {
  const nonZeroItems = lineItems.filter(item => toNum(item.value) > 0);
  const itemsToRender = nonZeroItems.length > 0 ? nonZeroItems : lineItems;

  return itemsToRender
    .map(item => `<tr><td>${item.label}</td><td style="text-align: right;">$${toNum(item.value).toFixed(2)}</td></tr>`)
    .join('');
}