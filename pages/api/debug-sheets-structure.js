import { getGoogleSheetsClient, getSpreadsheetId } from "../../lib/googleSheets.js";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        console.log('🔍 DEBUGGING GOOGLE SHEETS STRUCTURE...');

        // Get Quotes sheet structure
        const quotesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A1:Z20' // Get first 20 rows to see structure
        });
        const quotesRows = quotesResponse.data.values || [];

        // Get Leads sheet structure
        const leadsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Leads!A1:Z20' // Get first 20 rows to see structure
        });
        const leadsRows = leadsResponse.data.values || [];

        const debugInfo = {
            quotes: {
                totalRows: quotesRows.length,
                rows: quotesRows.map((row, index) => ({
                    rowIndex: index + 1,
                    data: row,
                    isEmpty: !row || row.every(cell => !cell || cell.trim() === '')
                }))
            },
            leads: {
                totalRows: leadsRows.length,
                rows: leadsRows.map((row, index) => ({
                    rowIndex: index + 1,
                    data: row,
                    isEmpty: !row || row.every(cell => !cell || cell.trim() === '')
                }))
            }
        };

        console.log('📊 QUOTES SHEET STRUCTURE:');
        quotesRows.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
        });

        console.log('📊 LEADS SHEET STRUCTURE:');
        leadsRows.forEach((row, index) => {
            console.log(`Row ${index + 1}:`, row);
        });

        return res.status(200).json({
            success: true,
            message: 'Google Sheets structure debug completed',
            debugInfo
        });

    } catch (error) {
        console.error('❌ DEBUG ERROR:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
