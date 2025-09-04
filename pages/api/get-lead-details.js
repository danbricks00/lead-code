import { google } from 'googleapis';

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
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId } = req.query;
    if (!quoteId) {
        return res.status(400).json({ success: false, error: 'Quote ID is required' });
    }

    try {
        const { privateKey } = JSON.parse(process.env.GOOGLE_PRIVATE_KEY || '{}');
        const auth = new google.auth.JWT(
            process.env.GOOGLE_CLIENT_EMAIL, null, privateKey,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // 1. Find the quote in the "Quotes" tab to get the Lead ID.
        console.log(`Searching for Quote ID: ${quoteId} in "Quotes" tab...`);
        const quoteData = await getSheetsData({
            sheets, spreadsheetId, 
            tab: 'Quotes', 
            searchColumn: 'Quote ID', 
            searchValue: quoteId, 
            columnsToFetch: ['Lead ID']
        });

        if (!quoteData || !quoteData['Lead ID']) {
            console.error(`Quote ID ${quoteId} not found in Quotes sheet or it has no Lead ID.`);
            return res.status(404).json({ success: false, error: 'Quote not found.' });
        }
        console.log(`Found Lead ID: ${quoteData['Lead ID']}`);

        // 2. Find all lead details from the "Leads" tab using the Lead ID.
        const leadId = quoteData['Lead ID'];
        const leadData = await getSheetsData({
            sheets, spreadsheetId,
            tab: 'Leads',
            searchColumn: 'Lead ID',
            searchValue: leadId,
            columnsToFetch: [
                'Customer Name', 'Customer Email', 'Customer Phone', 
                'Service Type', 'Rooms', 'Area', 'Suburb', 'Timeline'
            ]
        });

        if (!leadData) {
            console.error(`Lead with ID ${leadId} not found in Leads sheet.`);
            return res.status(404).json({ success: false, error: 'Lead data not found for this quote.' });
        }
        
        console.log("Successfully fetched lead data:", leadData);
        res.status(200).json({ success: true, data: leadData });

    } catch (error) {
        console.error('FATAL: Error fetching lead details:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve lead details from Google Sheets.' });
    }
}
