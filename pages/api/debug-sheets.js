import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

async function getSheetHeaders(sheets, spreadsheetId, tabName) {
    try {
        const range = `${tabName}!A1:Z1`; // Read the first row
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        if (rows && rows.length > 0) {
            return { status: 'Success', tab: tabName, headers: rows[0] };
        }
        return { status: 'Error', tab: tabName, error: 'Tab is empty or headers could not be read.' };
    } catch (error) {
        if (error.message.includes('Unable to parse range')) {
             return { status: 'Error', tab: tabName, error: `Tab named "${tabName}" likely does not exist.` };
        }
        return { status: 'Error', tab: tabName, error: error.message };
    }
}


export default async function handler(req, res) {
    try {
        // Use the new centralized client
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        console.log("Debugging Sheets: Fetching headers...");
        const leadsResult = await getSheetHeaders(sheets, spreadsheetId, 'Leads');
        const quotesResult = await getSheetHeaders(sheets, spreadsheetId, 'Quotes');
        const zoneResult = await getSheetHeaders(sheets, spreadsheetId, 'Zone');


        res.status(200).json({
            message: "This is a report of the exact column headers found in your Google Sheet.",
            leadsTabReport: leadsResult,
            quotesTabReport: quotesResult,
            zoneTabReport: zoneResult,
        });

    } catch (error) {
        console.error('FATAL: Sheets Debugger Error:', error);
        res.status(500).json({
            error: 'A fatal error occurred while trying to connect to Google Sheets.',
            details: error.message
        });
    }
}
