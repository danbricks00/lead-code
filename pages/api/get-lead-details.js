import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { google } from 'googleapis'; // Keep for JWT, remove if sheets client handles it all

// This new helper is much more robust. It finds columns by name, not by index.
async function getSheetsData(options) {
    const { sheets, spreadsheetId, tab, searchColumn, searchValue, columnsToFetch } = options;
    
    // 1. Get all data including the header row
    const range = `${tab}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    
    if (!rows || rows.length < 2) return null; // Must have header and at least one data row

    const header = rows[0];

    // 2. Find the index of the column we need to search in
    const searchColumnIndex = header.indexOf(searchColumn);
    if (searchColumnIndex === -1) {
        throw new Error(`Column "${searchColumn}" not found in tab "${tab}".`);
    }

    // 3. Find the specific row that matches our search value
    const dataRow = rows.find(row => row[searchColumnIndex] === searchValue);
    if (!dataRow) return null;

    // 4. Build a result object using the headers we want
    const result = {};
    columnsToFetch.forEach(columnName => {
        const index = header.indexOf(columnName);
        if (index !== -1) {
            result[columnName] = dataRow[index] || ''; // Use empty string for blank cells
        } else {
            // It's better to return something than nothing if a column is missing
            result[columnName] = 'N/A (Column not found)'; 
        }
    });

    return result;
}

export default async function handler(req, res) {
    console.log("\n--- NEW GET-LEAD-DETAILS REQUEST ---");
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId } = req.query;
    console.log(`[1] Received request for QuoteID: ${quoteId}`);
    if (!quoteId) {
        return res.status(400).json({ success: false, error: 'Quote ID is required' });
    }

    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Find the quote in the "Quotes" tab
        const quoteData = await getSheetsData({
            sheets, spreadsheetId, 
            tab: 'Quotes', 
            searchColumn: 'QuoteID',
            searchValue: quoteId, 
            columnsToFetch: ['LeadID']
        });
        console.log(`[2] Result from "Quotes" tab:`, quoteData ? JSON.stringify(quoteData) : 'null');

        if (!quoteData || !quoteData['LeadID']) {
            console.error(`[ERROR] Quote ID ${quoteId} not found in Quotes sheet or it has no LeadID.`);
            return res.status(404).json({ success: false, error: 'Quote not found.' });
        }
        
        const leadId = quoteData['LeadID'];
        console.log(`[3] Extracted LeadID: ${leadId}`);

        // 2. Get all data from the "Leads" tab to handle any column structure
        console.log('[4] Getting all lead data to handle flexible column structure...');
        let leadData;
        try {
            const range = 'Leads!A:Z';
            const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
            const rows = response.data.values;
            
            if (!rows || rows.length < 2) {
                throw new Error('No data found in Leads sheet');
            }
            
            const header = rows[0];
            const dataRow = rows.find(row => row[header.indexOf('Lead')] === leadId);
            
            if (!dataRow) {
                throw new Error(`Lead with ID ${leadId} not found in Leads sheet`);
            }
            
            // Build leadData object by mapping headers to values
            leadData = {};
            header.forEach((headerName, index) => {
                if (headerName && dataRow[index]) {
                    leadData[headerName] = dataRow[index];
                }
            });
            
            console.log(`[5] Lead data retrieved:`, JSON.stringify(leadData, null, 2));
            
            // Look for room data in the Rooms column (according to your schema)
            if (!leadData.Rooms) {
                console.log('[6] Looking for room data in Rooms column...');
                const roomsIndex = header.indexOf('Rooms');
                if (roomsIndex !== -1 && dataRow[roomsIndex]) {
                    leadData.Rooms = dataRow[roomsIndex];
                    console.log(`[7] Found room data in Rooms column:`, leadData.Rooms);
                } else {
                    console.log('[7] No room data found in Rooms column');
                }
            }
            
            console.log(`[8] Final lead data:`, JSON.stringify(leadData, null, 2));
        } catch (error) {
            console.error('[ERROR] Failed to get lead data:', error);
            throw error;
        }

        if (!leadData) {
            console.error(`[ERROR] Lead with ID ${leadId} not found in Leads sheet.`);
            return res.status(404).json({ success: false, error: 'Lead data not found for this quote.' });
        }
        
        console.log("[5] Final leadData object being sent to frontend:", JSON.stringify(leadData, null, 2));
        res.status(200).json({ success: true, data: leadData });

    } catch (error) {
        console.error('--- FATAL GET-LEAD-DETAILS ERROR ---');
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to retrieve lead details from Google Sheets.' });
    }
}
