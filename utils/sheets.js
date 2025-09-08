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
export async function appendQuoteRow(data) {
  console.log(`[DEBUG] appendQuoteRow: Appending new row with data keys: ${Object.keys(data).join(', ')}`);
  
  try {
    const sheets = await getGoogleSheetsClient();
    
    // Get headers first
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
    
    // Append the row
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Quotes!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData],
      },
    });
    
    // Get the index of the newly appended row
    const updatedRange = appendResponse.data.updates.updatedRange;
    const rowIndex = parseInt(updatedRange.split(':')[0].match(/\d+/)[0]);
    
    console.log(`[DEBUG] appendQuoteRow: Successfully appended new row at index ${rowIndex}`);
    return { rowIndex, data, action: 'APPEND' };
  } catch (error) {
    console.error(`[DEBUG] appendQuoteRow: Error appending quote row:`, error);
    throw error;
  }
}

/**
 * Upsert a quote row in Google Sheets (update if exists, append if not)
 * @param {string} quoteId - The quote ID to upsert
 * @param {Object} data - The data to upsert
 * @returns {Promise<Object>} - The upserted row data and action taken
 */
export async function upsertQuoteRow(quoteId, data) {
  console.log(`[DEBUG] upsertQuoteRow: Upserting data for quoteId=${quoteId}, source=payload`);
  
  try {
    // Check for idempotency if LastMutationId is provided
    if (data.LastMutationId) {
      const existingRow = await getQuoteRowByQuoteId(quoteId);
      if (existingRow && existingRow.rowData.LastMutationId === data.LastMutationId) {
        console.log(`[DEBUG] upsertQuoteRow: Idempotent operation detected with mutationId=${data.LastMutationId}`);
        return { rowIndex: existingRow.rowIndex, data: existingRow.rowData, action: 'IDEMPOTENT' };
      }
    }

    // Check if row exists
    const existingRow = await getQuoteRowByQuoteId(quoteId);
    
    if (existingRow) {
      // Update existing row
      console.log(`[DEBUG] upsertQuoteRow: Found existing row at index ${existingRow.rowIndex}, performing UPDATE`);
      
      // Merge existing data with new data to preserve fields not included in the update
      const mergedData = { ...existingRow.rowData, ...data };
      
      return await updateQuoteRow(existingRow.rowIndex, mergedData);
    } else {
      // Append new row
      console.log(`[DEBUG] upsertQuoteRow: No existing row found, performing APPEND`);
      
      const sheets = await getGoogleSheetsClient();
      
      // Get headers first
      const headerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Quotes!A1:Z1',
      });
      
      const headers = headerResponse.data.values[0];
      
      // Create a row array with values in the correct positions
      const rowData = Array(headers.length).fill(''); // Initialize with empty strings
      
      // Ensure quoteId is included in the data
      const dataWithQuoteId = { ...data, QuoteId: quoteId };
      
      // Fill in the values based on the headers
      Object.entries(dataWithQuoteId).forEach(([key, value]) => {
        const index = headers.findIndex(header => header === key);
        if (index !== -1) {
          rowData[index] = value;
        }
      });
      
      // Append the row
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Quotes!A1',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [rowData],
        },
      });
      
      // Get the index of the newly appended row
      const updatedRange = appendResponse.data.updates.updatedRange;
      const rowIndex = parseInt(updatedRange.split(':')[0].match(/\d+/)[0]);
      
      console.log(`[DEBUG] upsertQuoteRow: Successfully appended new row at index ${rowIndex}`);
      
      // Check for duplicates after append and mark them as VOID
      await checkAndMarkDuplicates(quoteId, rowIndex);
      
      return { rowIndex, data: dataWithQuoteId, action: 'APPEND' };
    }
  } catch (error) {
    console.error(`[DEBUG] upsertQuoteRow: Error upserting quote row:`, error);
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
