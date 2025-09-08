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

// Get quote row by QuoteId
export async function getQuoteRowByQuoteId(quoteId) {
    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        if (!spreadsheetId) {
            throw new Error('Google Sheets not configured');
        }

        console.log(`[SHEETS] Looking up quoteId: ${quoteId}`);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A:AJ',
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) {
            console.log(`[SHEETS] No quotes found for quoteId: ${quoteId}`);
            return null;
        }

        const header = rows[0];
        const quoteIdIndex = header.findIndex(h => h.toLowerCase().includes('quoteid'));
        
        if (quoteIdIndex === -1) {
            throw new Error('QuoteID column not found in Quotes sheet');
        }

        // Find all rows with matching quoteId
        const matchingRows = [];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][quoteIdIndex] === quoteId) {
                const rowData = {};
                header.forEach((colName, index) => {
                    rowData[colName] = rows[i][index] || '';
                });
                matchingRows.push({
                    rowIndex: i + 1, // +1 because Sheets is 1-indexed
                    data: rowData
                });
            }
        }

        if (matchingRows.length === 0) {
            console.log(`[SHEETS] No matching rows found for quoteId: ${quoteId}`);
            return null;
        }

        if (matchingRows.length > 1) {
            console.warn(`[SHEETS] Multiple rows found for quoteId: ${quoteId}, count: ${matchingRows.length}`);
            // Return the most recent one (last in array)
            const latest = matchingRows[matchingRows.length - 1];
            console.log(`[SHEETS] Returning most recent row at index: ${latest.rowIndex}`);
            return latest;
        }

        console.log(`[SHEETS] Found single row for quoteId: ${quoteId} at index: ${matchingRows[0].rowIndex}`);
        return matchingRows[0];

    } catch (error) {
        console.error(`[SHEETS] Error getting quote row for ${quoteId}:`, error.message);
        throw error;
    }
}

// Update existing quote row
export async function updateQuoteRow(rowIndex, data) {
    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        if (!spreadsheetId) {
            throw new Error('Google Sheets not configured');
        }

        console.log(`[SHEETS] Updating row ${rowIndex} with data keys:`, Object.keys(data));

        // Get current row to preserve existing data
        const currentResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `Quotes!A${rowIndex}:AJ${rowIndex}`,
        });

        const currentRow = currentResponse.data.values?.[0] || [];
        const header = await getQuotesHeader();
        
        // Create updated row preserving existing data
        const updatedRow = [...currentRow];
        Object.entries(data).forEach(([key, value]) => {
            const colIndex = header.findIndex(h => h.toLowerCase() === key.toLowerCase());
            if (colIndex !== -1) {
                updatedRow[colIndex] = value;
            }
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex}:AJ${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [updatedRow] }
        });

        console.log(`[SHEETS] Successfully updated row ${rowIndex}`);
        return { success: true, rowIndex };

    } catch (error) {
        console.error(`[SHEETS] Error updating row ${rowIndex}:`, error.message);
        throw error;
    }
}

// Append new quote row
export async function appendQuoteRow(data) {
    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        if (!spreadsheetId) {
            throw new Error('Google Sheets not configured');
        }

        console.log(`[SHEETS] Appending new row with data keys:`, Object.keys(data));

        const header = await getQuotesHeader();
        const row = new Array(header.length).fill('');
        
        // Map data to row positions
        Object.entries(data).forEach(([key, value]) => {
            const colIndex = header.findIndex(h => h.toLowerCase() === key.toLowerCase());
            if (colIndex !== -1) {
                row[colIndex] = value;
            }
        });

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Quotes!A:AJ',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [row] }
        });

        console.log(`[SHEETS] Successfully appended new row`);
        return { success: true, action: 'APPEND' };

    } catch (error) {
        console.error(`[SHEETS] Error appending row:`, error.message);
        throw error;
    }
}

// Get quotes sheet header
async function getQuotesHeader() {
    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A1:AJ1',
        });

        return response.data.values?.[0] || [];
    } catch (error) {
        console.error('[SHEETS] Error getting quotes header:', error.message);
        throw error;
    }
}

// Main upsert function with idempotency
export async function upsertQuoteRow(quoteId, data) {
    try {
        console.log(`[SHEETS] Starting upsert for quoteId: ${quoteId}`);
        
        // Check for existing row
        const existing = await getQuoteRowByQuoteId(quoteId);
        
        if (existing) {
            console.log(`[SHEETS] upsert quoteId=${quoteId} foundRow=YES action=UPDATE rowIndex=${existing.rowIndex}`);
            
            // Check idempotency
            const mutationId = data.LastMutationId;
            if (mutationId && existing.data.LastMutationId === mutationId) {
                console.log(`[SHEETS] Idempotency hit for quoteId=${quoteId} mutationId=${mutationId} - skipping update`);
                return { success: true, action: 'IDEMPOTENT', rowIndex: existing.rowIndex };
            }
            
            // Update existing row
            await updateQuoteRow(existing.rowIndex, data);
            return { success: true, action: 'UPDATE', rowIndex: existing.rowIndex };
        } else {
            console.log(`[SHEETS] upsert quoteId=${quoteId} foundRow=NO action=APPEND`);
            
            // Append new row
            await appendQuoteRow(data);
            
            // Verify the row was created
            const verification = await getQuoteRowByQuoteId(quoteId);
            if (!verification) {
                throw new Error(`Failed to verify quote row creation for ${quoteId}`);
            }
            
            // Check for duplicates after append
            const allMatches = await getAllQuoteRowsByQuoteId(quoteId);
            if (allMatches.length > 1) {
                console.warn(`[SHEETS] Multiple rows found after append for quoteId=${quoteId}, count: ${allMatches.length}`);
                // Keep the most recent and mark others as VOID
                const sorted = allMatches.sort((a, b) => b.rowIndex - a.rowIndex);
                const keep = sorted[0];
                
                for (let i = 1; i < sorted.length; i++) {
                    await updateQuoteRow(sorted[i].rowIndex, { Status: 'VOID' });
                    console.log(`[SHEETS] Marked duplicate row ${sorted[i].rowIndex} as VOID`);
                }
                
                return { success: true, action: 'APPEND_AND_CLEANUP', rowIndex: keep.rowIndex };
            }
            
            return { success: true, action: 'APPEND', rowIndex: verification.rowIndex };
        }

    } catch (error) {
        console.error(`[SHEETS] Error in upsert for quoteId ${quoteId}:`, error.message);
        throw error;
    }
}

// Get all quote rows by QuoteId (for duplicate detection)
async function getAllQuoteRowsByQuoteId(quoteId) {
    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A:AJ',
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) return [];

        const header = rows[0];
        const quoteIdIndex = header.findIndex(h => h.toLowerCase().includes('quoteid'));
        
        if (quoteIdIndex === -1) return [];

        const matchingRows = [];
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][quoteIdIndex] === quoteId) {
                const rowData = {};
                header.forEach((colName, index) => {
                    rowData[colName] = rows[i][index] || '';
                });
                matchingRows.push({
                    rowIndex: i + 1,
                    data: rowData
                });
            }
        }

        return matchingRows;
    } catch (error) {
        console.error(`[SHEETS] Error getting all rows for quoteId ${quoteId}:`, error.message);
        return [];
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
