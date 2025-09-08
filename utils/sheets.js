import { getGoogleSheetsClient, getSpreadsheetId } from '../lib/googleSheets.js';
import { assertQuoteWriteOnly, assertLeadWriteOnly } from './writeGuard.js';
import crypto from 'crypto';

// NZ timestamp helper function
function getNZTimestamp(date = new Date()) {
    return date.toLocaleString("en-NZ", {
        timeZone: "Pacific/Auckland",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).replace(",", "");
}

// Generate mutation ID for idempotency
export function generateMutationId(quoteId, routeName, body = {}) {
    const bodyHash = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex').substring(0, 8);
    return `${quoteId}:${routeName}:${bodyHash}`;
}

/**
 * Get a quote row by quoteId
 * @param {string} quoteId - The quote ID to search for
 * @returns {Promise<Object|null>} - The quote row data or null if not found
 */
export async function getQuoteRowByQuoteId(quoteId) {
  console.log(`[DEBUG] getQuoteRowByQuoteId: Searching for quoteId=${quoteId}`);
  
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Quotes!A:Z',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.log(`[DEBUG] getQuoteRowByQuoteId: No rows found in Quotes sheet`);
      return null;
    }

    const headers = rows[0];
    const quoteIdIndex = headers.findIndex(header => 
      header.toLowerCase() === 'quoteid' || header.toLowerCase() === 'quote id');
    
    if (quoteIdIndex === -1) {
      console.error(`[DEBUG] getQuoteRowByQuoteId: QuoteId column not found in headers`);
      return null;
    }

    // Find all rows with matching quoteId
    const matchingRows = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[quoteIdIndex] === quoteId) {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = index < row.length ? row[index] : '';
        });
        matchingRows.push({ rowData, rowIndex: i + 1 }); // +1 because Google Sheets is 1-indexed
      }
    }

    if (matchingRows.length === 0) {
      console.log(`[DEBUG] getQuoteRowByQuoteId: No matching rows found for quoteId=${quoteId}`);
      return null;
    }

    // If multiple rows found, use the most recent one (assuming it's the last one)
    if (matchingRows.length > 1) {
      console.log(`[DEBUG] getQuoteRowByQuoteId: Found ${matchingRows.length} rows for quoteId=${quoteId}, using most recent`);
    }
    
    // Return the most recent row (last in the array)
    return matchingRows[matchingRows.length - 1];
  } catch (error) {
    console.error(`[DEBUG] getQuoteRowByQuoteId: Error fetching quote row:`, error);
    throw error;
  }
}

/**
 * Update an existing quote row in Google Sheets
 * @param {number} rowIndex - The row index to update (1-indexed)
 * @param {Object} data - The data to update
 * @returns {Promise<Object>} - The updated row data
 */
export async function updateQuoteRow(rowIndex, data) {
  console.log(`[DEBUG] updateQuoteRow: Updating row at index ${rowIndex}`);
  
  try {
    // First get the headers to ensure we're updating the right columns
    const sheets = await getGoogleSheetsClient();
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Quotes!A1:Z1',
    });
    
    const headers = headerResponse.data.values[0];
    
    // Create a row array with values in the correct positions
    const rowData = Array(headers.length).fill(''); // Initialize with empty strings
    
    // Fill in the values based on the headers
    Object.entries(data).forEach(([key, value]) => {
      const index = headers.findIndex(header => header === key);
      if (index !== -1) {
        rowData[index] = value;
      }
    });
    
    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `Quotes!A${rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowData],
      },
    });
    
    console.log(`[DEBUG] updateQuoteRow: Successfully updated row ${rowIndex}`);
    return { rowIndex, data };
  } catch (error) {
    console.error(`[DEBUG] updateQuoteRow: Error updating quote row:`, error);
    throw error;
  }
}

// Quotes tab headers (exact order from your schema)
const QUOTES_HEADERS = [
  'TimeStamp', 'QuoteID', 'LeadID', 'TradePersonName', 'TradePersonEmail', 'TradePersonPhone',
  'CustomerStatus', 'TradePersonStatus', 'AdminPersonStatus',
  'LabourRate', 'LabourHours', 'LabourTotal', 'MaterialsCost', 'MaterialsQuantity', 'MaterialsTotal',
  'TravelCost', 'TravelDistance', 'TravelTotal', 'InstallationCost',
  'Subtotal', 'GST', 'TotalQuote', 'Notes', 'ValidUntil', 'ResubmissionAllowed',
  'Decision', 'DecisionTimestamp',
  'CustomerName', 'CustomerEmail', 'CustomerPhone', 'ServiceType', 'Location', 'Timeline', 'Budget', 'Rooms', 'BreakDown'
];

/**
 * Upsert a quote row: update first match by QuoteID, or append if none found
 * @param {string} quoteId - The QuoteID to match
 * @param {object} data - Row data object with keys matching QUOTES_HEADERS
 * @param {object} context - { req, caller } for write guard
 * @returns {object} { action: 'UPDATE'|'APPEND', rowIndex: number }
 */
export async function upsertQuoteRow(quoteId, data, context = {}) {
  try {
    // Enforce write guard for Quotes tab
    assertQuoteWriteOnly(context);
    
    const { req, caller } = context;
    const trimmedQuoteId = String(quoteId).trim();
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Read current Quotes sheet
    const { headers, rows } = await readSheetAsObjects('Quotes', sheets, spreadsheetId);
    
    // Find all rows that match this QuoteID
    const matches = [];
    for (let i = 0; i < rows.length; i++) {
      const rowQuoteId = String(rows[i].QuoteID || '').trim();
      if (rowQuoteId === trimmedQuoteId) {
        matches.push(i);
      }
    }

    let action, rowIndex;

    if (matches.length > 0) {
      // UPDATE: Use the first match only
      const targetIndex = matches[0];
      rowIndex = targetIndex + 2; // +2 because sheets are 1-indexed and row 1 is headers
      
      await updateRowByIndex('Quotes', targetIndex, QUOTES_HEADERS, data, sheets, spreadsheetId);
      action = 'UPDATE';
      
      console.log(JSON.stringify({
        tag: 'SHEETS_UPSERT',
        quoteId: trimmedQuoteId,
        matches: matches.length,
        action,
        rowIndex,
        caller: caller || 'unknown'
      }));

    } else {
      // APPEND: No matches found, add new row
      rowIndex = rows.length + 2; // +2 because sheets are 1-indexed and row 1 is headers
      
      await appendRowToSheet('Quotes', QUOTES_HEADERS, data, sheets, spreadsheetId, context);
      action = 'APPEND';
      
      console.log(JSON.stringify({
        tag: 'SHEETS_UPSERT',
        quoteId: trimmedQuoteId,
        matches: 0,
        action,
        rowIndex,
        caller: caller || 'unknown'
      }));
    }

    return { action, rowIndex };

  } catch (error) {
    console.error(JSON.stringify({
      tag: 'SHEETS_UPSERT_ERROR',
      quoteId: String(quoteId).trim(),
      error: String(error?.message || error),
      caller: context?.caller || 'unknown'
    }));
    throw error;
  }
}

/**
 * Helper: Update a specific row by index
 * @param {string} sheetName - Name of the sheet
 * @param {number} rowIndex - 0-based row index (excluding headers)
 * @param {array} headers - Array of column headers
 * @param {object} data - Data object to write
 * @param {object} sheets - Google Sheets client
 * @param {string} spreadsheetId - Spreadsheet ID
 */
async function updateRowByIndex(sheetName, rowIndex, headers, data, sheets, spreadsheetId) {
  // Convert data object to array matching header order
  const values = headers.map(header => {
    const value = data[header];
    return value != null ? String(value) : '';
  });

  // Update the specific row (rowIndex + 2 because sheets are 1-indexed and row 1 is headers)
  const range = `${sheetName}!A${rowIndex + 2}:${getColumnLetter(headers.length)}${rowIndex + 2}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    resource: {
      values: [values]
    }
  });
}

/**
 * Helper: Append a new row to the sheet
 * @param {string} sheetName - Name of the sheet
 * @param {array} headers - Array of column headers
 * @param {object} data - Data object to write
 * @param {object} sheets - Google Sheets client
 * @param {string} spreadsheetId - Spreadsheet ID
 */
async function appendRowToSheet(sheetName, headers, data, sheets, spreadsheetId, context = {}) {
  // Enforce write guards based on sheet name
  if (sheetName === 'Leads') {
    assertLeadWriteOnly(context);
  } else if (sheetName === 'Quotes') {
    assertQuoteWriteOnly(context);
  }
  
  // Convert data object to array matching header order
  const values = headers.map(header => {
    const value = data[header];
    return value != null ? String(value) : '';
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    resource: {
      values: [values]
    }
  });
}

/**
 * Helper: Convert column number to letter (A, B, C, ..., Z, AA, AB, etc.)
 * @param {number} columnNumber - 1-based column number
 * @returns {string} Column letter
 */
function getColumnLetter(columnNumber) {
  let result = '';
  while (columnNumber > 0) {
    columnNumber--;
    result = String.fromCharCode(65 + (columnNumber % 26)) + result;
    columnNumber = Math.floor(columnNumber / 26);
  }
  return result;
}

/**
 * Helper: Read sheet as objects
 * @param {string} sheetName - Name of the sheet to read
 * @param {object} sheets - Google Sheets client
 * @param {string} spreadsheetId - Spreadsheet ID
 * @returns {object} { headers, rows } where rows are objects keyed by headers
 */
export async function readSheetAsObjects(sheetName, sheets, spreadsheetId) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:ZZ`, // Adjust range as needed
    });

    const values = response.data.values || [];
    if (values.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = values[0];
    const rows = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    return { headers, rows };
  } catch (error) {
    console.error(`[SHEETS] Error reading ${sheetName}:`, error);
    throw error;
  }
}

/**
 * Get lead by ID from the Leads sheet
 * @param {string} leadId - The LeadID to find
 * @returns {object|null} Lead data object or null if not found
 */
export async function getLeadById(leadId) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const { headers, rows } = await readSheetAsObjects('Leads', sheets, spreadsheetId);
    
    const leadIdColIndex = headers.findIndex(h => h === 'LeadID' || h === 'Lead');
    if (leadIdColIndex === -1) {
      console.error('LeadID column not found in Leads sheet');
      return null;
    }
    
    for (const row of rows) {
      if (String(row[headers[leadIdColIndex]] || '').trim() === String(leadId).trim()) {
        return row;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[SHEETS] Error getting lead ${leadId}:`, error);
    return null;
  }
}

/**
 * Get quote by ID from the Quotes sheet
 * @param {string} quoteId - The QuoteID to find
 * @returns {object|null} Quote data object or null if not found
 */
export async function getQuoteById(quoteId) {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const { headers, rows } = await readSheetAsObjects('Quotes', sheets, spreadsheetId);
    
    const quoteIdColIndex = headers.findIndex(h => h === 'QuoteID');
    if (quoteIdColIndex === -1) {
      console.error('QuoteID column not found in Quotes sheet');
      return null;
    }
    
    for (const row of rows) {
      if (String(row[headers[quoteIdColIndex]] || '').trim() === String(quoteId).trim()) {
        return row;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[SHEETS] Error getting quote ${quoteId}:`, error);
    return null;
  }
}

// Disable legacy append function to catch rogue calls
export async function appendQuoteRow() {
  throw new Error('appendQuoteRow disabled — use upsertQuoteRow instead');
}
