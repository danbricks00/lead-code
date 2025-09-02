import { google } from 'googleapis';

async function getSheetsClient() {
    const { privateKey } = JSON.parse(process.env.GOOGLE_PRIVATE_KEY);
    const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
}

async function findRowAndGetData(sheets, spreadsheetId, tab, searchColumnIndex, searchValue, headers) {
    const range = `${tab}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    
    if (!rows) return null;

    const headerRow = rows[0];
    const dataRow = rows.find(row => row[searchColumnIndex] === searchValue);

    if (!dataRow) return null;

    const result = {};
    headers.forEach(header => {
        const index = headerRow.indexOf(header);
        if (index !== -1) {
            result[header] = dataRow[index];
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
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // 1. Find the quote in the "Quotes" tab to get the Lead ID
        const quoteHeaders = ['Lead ID'];
        const quoteData = await findRowAndGetData(sheets, spreadsheetId, 'Quotes', 0, quoteId, quoteHeaders);

        if (!quoteData || !quoteData['Lead ID']) {
            return res.status(404).json({ success: false, error: 'Quote not found in Quotes sheet' });
        }

        const leadId = quoteData['Lead ID'];

        // 2. Find all lead details from the "Leads" tab
        const leadHeaders = [
            'Customer Name', 'Customer Email', 'Customer Phone', 
            'Service Type', 'Rooms', 'Area', 'Suburb', 'Timeline'
        ];
        const leadData = await findRowAndGetData(sheets, spreadsheetId, 'Leads', 0, leadId, leadHeaders);

        if (!leadData) {
            return res.status(404).json({ success: false, error: `Lead with ID ${leadId} not found in Leads sheet` });
        }
        
        res.status(200).json({ success: true, data: leadData });

    } catch (error) {
        console.error('Error fetching lead details:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve lead details' });
    }
}
