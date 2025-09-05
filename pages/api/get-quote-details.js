import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import crypto from 'crypto';

function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

async function getSheetsData(sheets, spreadsheetId, tabName, searchColumn, searchValue) {
    try {
        const range = `${tabName}!A:Z`;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        if (!rows || rows.length < 2) {
            console.log(`No data found in ${tabName} tab`);
            return null;
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        // Find the column index for the search column
        const searchColumnIndex = headers.indexOf(searchColumn);
        if (searchColumnIndex === -1) {
            console.error(`Column "${searchColumn}" not found in ${tabName} tab`);
            return null;
        }

        // Find the row with matching search value
        const matchingRowIndex = dataRows.findIndex(row => row[searchColumnIndex] === searchValue);
        if (matchingRowIndex === -1) {
            console.log(`No row found with ${searchColumn} = ${searchValue} in ${tabName} tab`);
            return null;
        }

        const matchingRow = dataRows[matchingRowIndex];
        
        // Convert row to object using headers as keys
        const result = {};
        headers.forEach((header, index) => {
            result[header] = matchingRow[index] || '';
        });

        return result;
    } catch (error) {
        console.error(`Error getting data from ${tabName}:`, error);
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId) {
        return res.status(400).json({ success: false, error: 'Quote ID is required' });
    }

    // For quote viewing, we'll do a basic token validation if provided
    if (ts && token) {
        const expectedToken = verifyToken(quoteId, ts);
        if (token !== expectedToken) {
            return res.status(403).json({ success: false, error: 'Invalid or expired link' });
        }
    }

    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        console.log(`[1] Fetching quote data for Quote ID: ${quoteId}`);

        // Get quote data from Quotes tab
        const quoteData = await getSheetsData(sheets, spreadsheetId, 'Quotes', 'QuoteID', quoteId);
        if (!quoteData) {
            return res.status(404).json({ success: false, error: 'Quote not found' });
        }

        console.log(`[2] Found quote data, Lead ID: ${quoteData['LeadiD']}`);

        // Get lead data from Leads tab using the Lead ID from the quote
        const leadData = await getSheetsData(sheets, spreadsheetId, 'Leads', 'Lead', quoteData['LeadiD']);
        if (!leadData) {
            console.log('[3] Lead data not found, quote data only');
            return res.status(200).json({ 
                success: true, 
                quote: quoteData, 
                lead: null,
                message: 'Quote found but lead data missing'
            });
        }

        console.log(`[4] Successfully retrieved both quote and lead data`);

        // Return combined data
        return res.status(200).json({
            success: true,
            quote: quoteData,
            lead: leadData
        });

    } catch (error) {
        console.error('Error in get-quote-details:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve quote details from Google Sheets',
            details: error.message 
        });
    }
}
