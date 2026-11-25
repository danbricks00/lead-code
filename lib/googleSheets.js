// lib/googleSheets.js
import { google } from 'googleapis';

let sheets;

function getGoogleSheetsClient() {
    if (sheets) {
        return sheets;
    }

    try {
        console.log("Attempting to initialize Google Sheets client...");
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

        if (!clientEmail || !privateKeyRaw) {
            throw new Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");
        }

        // CRITICAL FIX: Replace literal newlines with the escaped \\n sequence.
        const formattedKey = privateKeyRaw.replace(/\n/g, "\\n");

        // This is the robust parsing logic that handles the escaped newlines
        const privateKey = JSON.parse(`"${formattedKey}"`);

        const auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        sheets = google.sheets({ version: 'v4', auth });
        console.log("✅ Google Sheets client initialized successfully.");
        return sheets;

    } catch (error) {
        console.error("❌ FATAL: Could not initialize Google Sheets client.", error.message);
        // We re-throw the error to ensure any calling function knows to stop.
        throw new Error(`Google Sheets initialization failed: ${error.message}`);
    }
}

function getSpreadsheetId() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
        throw new Error("GOOGLE_SPREADSHEET_ID is not configured in environment variables.");
    }
    return spreadsheetId;
}

export { getGoogleSheetsClient, getSpreadsheetId };
