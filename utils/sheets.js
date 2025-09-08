import { getGoogleSheetsClient, getSpreadsheetId } from '../lib/googleSheets.js';
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

/**
 * Append a new quote row to Google Sheets
 * @param {Object} data - The data to append
 * @returns {Promise<Object>} - The result of the append operation
 */
// Add these new functions to utils/sheets.js

// Get lead by ID
export async function getLeadById(leadId) {
  try {
    console.log(`[SHEETS] getLeadById: Fetching lead with ID=${leadId}`);
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    // Get all data from the "Leads" tab
    const range = 'Leads!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    
    if (!rows || rows.length < 2) {
      console.log(`[SHEETS] getLeadById: No leads found`);
      return null;
    }
    
    const header = rows[0];
    const leadIndex = header.indexOf('Lead');
    
    if (leadIndex === -1) {
      console.error(`[SHEETS] getLeadById: Lead column not found in sheet`);
      return null;
    }
    
    // Find the row with the matching lead ID
    const dataRow = rows.find(row => row[leadIndex] === leadId);
    
    if (!dataRow) {
      console.log(`[SHEETS] getLeadById: Lead with ID=${leadId} not found`);
      return null;
    }
    
    // Build lead object by mapping headers to values
    const lead = {};
    header.forEach((headerName, index) => {
      if (headerName && dataRow[index] !== undefined) {
        lead[headerName] = dataRow[index];
      }
    });
    
    console.log(`[SHEETS] getLeadById: Successfully retrieved lead with ID=${leadId}`);
    return lead;
  } catch (error) {
    console.error(`[SHEETS] getLeadById: Error fetching lead with ID=${leadId}:`, error);
    throw error;
  }
}

// Get quote by ID
export async function getQuoteById(quoteId) {
  try {
    console.log(`[SHEETS] getQuoteById: Fetching quote with ID=${quoteId}`);
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    // Get all data from the "Quotes" tab
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    
    if (!rows || rows.length < 2) {
      console.log(`[SHEETS] getQuoteById: No quotes found`);
      return null;
    }
    
    const header = rows[0];
    const quoteIdIndex = header.indexOf('QuoteID');
    
    if (quoteIdIndex === -1) {
      console.error(`[SHEETS] getQuoteById: QuoteID column not found in sheet`);
      return null;
    }
    
    // Find the first row with the matching quote ID
    const dataRow = rows.find(row => row[quoteIdIndex] === quoteId);
    
    if (!dataRow) {
      console.log(`[SHEETS] getQuoteById: Quote with ID=${quoteId} not found`);
      return null;
    }
    
    // Build quote object by mapping headers to values
    const quote = {};
    header.forEach((headerName, index) => {
      if (headerName && dataRow[index] !== undefined) {
        quote[headerName] = dataRow[index];
      }
    });
    
    console.log(`[SHEETS] getQuoteById: Successfully retrieved quote with ID=${quoteId}`);
    return quote;
  } catch (error) {
    console.error(`[SHEETS] getQuoteById: Error fetching quote with ID=${quoteId}:`, error);
    throw error;
  }
}

// Update the existing upsertQuoteRow function to ensure it follows the requirements
export async function upsertQuoteRow(quoteId, data) {
  try {
    if (!quoteId) {
      throw new Error('QuoteID is required for upsert operation');
    }
    
    console.log(`[SHEETS] upsert quoteId=${quoteId} starting`);
    
    // Check for idempotency using LastMutationId if provided
    if (data.LastMutationId) {
      const existingQuote = await getQuoteRowByQuoteId(quoteId);
      if (existingQuote && existingQuote.data.LastMutationId === data.LastMutationId) {
        console.log(`[SHEETS] upsert quoteId=${quoteId} skipped - idempotent mutation`);
        return { 
          action: 'SKIP', 
          rowIndex: existingQuote.rowIndex,
          message: 'Idempotent mutation - no changes made'
        };
      }
    }
    
    // Get all quotes to find matches
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      console.log(`[SHEETS] upsert quoteId=${quoteId} matches=0 action=APPEND row=new`);
      // No data in sheet yet, append with headers
      const rowData = createQuoteRowData(quoteId, data, data);
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Quotes!A1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [Object.keys(rowData), Object.values(rowData)]
        }
      });
      return { action: 'APPEND', rowIndex: 2 }; // Row 2 (after header)
    }
    
    const headers = rows[0];
    const quoteIdIndex = headers.indexOf('QuoteID');
    
    if (quoteIdIndex === -1) {
      throw new Error('QuoteID column not found in Quotes sheet');
    }
    
    // Find all rows with matching QuoteID
    const matchingRows = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[quoteIdIndex] && row[quoteIdIndex].trim() === quoteId.trim()) {
        matchingRows.push({ rowIndex: i + 1, row }); // 1-indexed for Google Sheets
      }
    }
    
    console.log(`[SHEETS] upsert quoteId=${quoteId} matches=${matchingRows.length}`);
    
    if (matchingRows.length >= 1) {
      // UPDATE: Use the first (earliest) match
      const existingRow = matchingRows[0];
      console.log(`[SHEETS] upsert quoteId=${quoteId} matches=${matchingRows.length} action=UPDATE row=${existingRow.rowIndex}`);
      
      // Create row data object with merged data
      const rowData = {};
      headers.forEach((header, index) => {
        // Keep existing data if not provided in update
        if (existingRow.row[index] !== undefined && !data[header]) {
          rowData[header] = existingRow.row[index];
        } else {
          rowData[header] = data[header] || '';
        }
      });
      
      // Update the row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Quotes!A${existingRow.rowIndex}:${String.fromCharCode(65 + headers.length - 1)}${existingRow.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [Object.values(rowData)]
        }
      });
      
      // Mark any other rows with the same QuoteID as duplicates
      await checkAndMarkDuplicates(quoteId, existingRow.rowIndex);
      
      return { action: 'UPDATE', rowIndex: existingRow.rowIndex };
    } else {
      // APPEND: No matching rows found
      console.log(`[SHEETS] upsert quoteId=${quoteId} matches=0 action=APPEND row=${rows.length + 1}`);
      
      // Create row data aligned with headers
      const rowData = {};
      headers.forEach(header => {
        rowData[header] = data[header] || '';
      });
      
      // Append the new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Quotes!A1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [Object.values(rowData)]
        }
      });
      
      return { action: 'APPEND', rowIndex: rows.length + 1 };
    }
  } catch (error) {
    console.error(`[SHEETS] upsert quoteId=${quoteId} error:`, error);
    throw error;
  }
}

/**
 * Check for duplicate rows with the same quoteId and mark older ones as VOID
 * @param {string} quoteId - The quote ID to check for duplicates
 * @param {number} currentRowIndex - The row index of the current row (to exclude from voiding)
 */
async function checkAndMarkDuplicates(quoteId, currentRowIndex) {
  console.log(`[DEBUG] checkAndMarkDuplicates: Checking for duplicates of quoteId=${quoteId}`);
  
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Quotes!A:Z',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return; // Only headers or empty sheet
    
    const headers = rows[0];
    const quoteIdIndex = headers.findIndex(header => 
      header.toLowerCase() === 'quoteid' || header.toLowerCase() === 'quote id');
    const statusIndex = headers.findIndex(header => 
      header.toLowerCase() === 'status' || header.toLowerCase() === 'quote status');
    
    if (quoteIdIndex === -1 || statusIndex === -1) {
      console.error(`[DEBUG] checkAndMarkDuplicates: Required columns not found`);
      return;
    }

    // Find all rows with matching quoteId except the current row
    const duplicateRows = [];
    for (let i = 1; i < rows.length; i++) {
      const rowIndex = i + 1; // 1-indexed for Google Sheets
      const row = rows[i];
      
      if (row[quoteIdIndex] === quoteId && rowIndex !== currentRowIndex) {
        duplicateRows.push({ rowIndex, row });
      }
    }

    if (duplicateRows.length === 0) {
      console.log(`[DEBUG] checkAndMarkDuplicates: No duplicates found for quoteId=${quoteId}`);
      return;
    }

    console.log(`[DEBUG] checkAndMarkDuplicates: Found ${duplicateRows.length} duplicate rows for quoteId=${quoteId}`);
    
    // Mark all duplicate rows as VOID
    for (const { rowIndex } of duplicateRows) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: `Quotes!${String.fromCharCode(65 + statusIndex)}${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['VOID - DUPLICATE']],
        },
      });
      console.log(`[DEBUG] checkAndMarkDuplicates: Marked row ${rowIndex} as VOID - DUPLICATE`);
    }
  } catch (error) {
    console.error(`[DEBUG] checkAndMarkDuplicates: Error checking for duplicates:`, error);
    // Don't throw, as this is a cleanup operation that shouldn't fail the main operation
  }
}

// Create full quote row data for upsert
export function createQuoteRowData(quoteId, leadDetails, quoteDetails, additionalData = {}) {
  const nzTimestamp = getNZTimestamp();
  
  return {
    TimeStamp: nzTimestamp,
    QuoteID: quoteId,
    LeadID: leadDetails.Lead || leadDetails.LeadId || '',
    TradePersonName: quoteDetails.tradespersonName || '',
    TradePersonEmail: quoteDetails.tradespersonEmail || '',
    TradePersonPhone: quoteDetails.tradespersonPhone || '',
    CustomerName: leadDetails.CustomerName || leadDetails.customerName || '',
    CustomerEmail: leadDetails.CustomerEmail || leadDetails.customerEmail || '',
    CustomerPhone: leadDetails.CustomerPhone || leadDetails.customerPhone || '',
    ServiceType: leadDetails.ServiceType || leadDetails.serviceType || 'Underfloor Heating',
    Location: leadDetails.Location || leadDetails.location || '',
    ProjectDetails: leadDetails.ProjectDetails || leadDetails.projectDetails || '',
    Budget: leadDetails.Budget || leadDetails.budget || '',
    Timeline: leadDetails.Timeline || leadDetails.Timelline || leadDetails.timeline || '',
    Rooms: leadDetails.Rooms || '',
    LabourRate: quoteDetails.labourRate || 0,
    LabourHours: quoteDetails.labourHours || 0,
    LabourTotal: (parseFloat(quoteDetails.labourRate) || 0) * (parseFloat(quoteDetails.labourHours) || 0),
    MaterialsCost: quoteDetails.materialsCost || 0,
    MaterialsQuantity: quoteDetails.materialsQuantity || 0,
    MaterialsTotal: (parseFloat(quoteDetails.materialsCost) || 0) * (parseFloat(quoteDetails.materialsQuantity) || 0),
    TravelCost: quoteDetails.travelCost || 0,
    TravelDistance: quoteDetails.travelDistance || 0,
    TravelTotal: (parseFloat(quoteDetails.travelCost) || 0) * (parseFloat(quoteDetails.travelDistance) || 0),
    InstallationCost: quoteDetails.installationCost || 0,
    Subtotal: quoteDetails.subtotal || 0,
    GST: quoteDetails.gst || 0,
    TotalQuote: quoteDetails.totalQuote || 0,
    ValidUntil: quoteDetails.validUntil || '',
    ItemBreakdown: quoteDetails.itemBreakdown || '',
    AdditionalNotes: quoteDetails.notes || '',
    AdminPersonStatus: additionalData.AdminPersonStatus || '',
    AdminPersonTimestamp: additionalData.AdminPersonTimestamp || '',
    AdminPersonNotes: additionalData.AdminPersonNotes || '',
    CustomerDecision: additionalData.CustomerDecision || '',
    CustomerDecisionTimestamp: additionalData.CustomerDecisionTimestamp || '',
    CustomerDecisionNotes: additionalData.CustomerDecisionNotes || '',
    FinalStatus: additionalData.FinalStatus || '',
    FinalStatusTimestamp: additionalData.FinalStatusTimestamp || '',
    FinalStatusNotes: additionalData.FinalStatusNotes || '',
    QuoteDate: nzTimestamp,
    QuoteNumber: quoteId,
    QuoteVersion: additionalData.QuoteVersion || '1.0',
    QuoteRevision: additionalData.QuoteRevision || '',
    QuoteRevisionReason: additionalData.QuoteRevisionReason || '',
    QuoteRevisionTimestamp: additionalData.QuoteRevisionTimestamp || '',
    QuoteRevisionNotes: additionalData.QuoteRevisionNotes || '',
    QuoteRevisionApprovedBy: additionalData.QuoteRevisionApprovedBy || '',
    Status: additionalData.Status || 'Submitted',
    LastMutationId: additionalData.LastMutationId || ''
  };
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
      
      await appendRowToSheet('Quotes', QUOTES_HEADERS, data, sheets, spreadsheetId);
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
async function appendRowToSheet(sheetName, headers, data, sheets, spreadsheetId) {
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
