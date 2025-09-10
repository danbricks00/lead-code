import { google } from 'googleapis';

async function getSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('[Debug Sheets] Failed to create Google Sheets client:', error);
    throw new Error('Google Sheets client authentication failed.');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  console.log(`\n--- [Debug Sheets] Received request at ${new Date().toISOString()} ---`);

  try {
    console.log('[Debug Sheets] 1. Checking for required environment variables...');
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.error('[Debug Sheets] Missing one or more required Google Sheets environment variables.');
      return res.status(500).json({ success: false, error: 'Server is missing required Google Sheets environment variables.' });
    }
    console.log('[Debug Sheets] All required environment variables are present.');

    console.log('[Debug Sheets] 2. Authenticating with Google Sheets API...');
    const sheets = await getSheetsClient();
    console.log('[Debug Sheets] Authentication successful.');

    console.log('[Debug Sheets] 3. Attempting to read from "Leads" tab...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Leads!A1:I10', // Read the header and first 9 rows
    });

    const rows = response.data.values;
    if (rows && rows.length > 0) {
      console.log(`[Debug Sheets] Successfully read ${rows.length} rows from the "Leads" tab.`);
      return res.status(200).json({
        success: true,
        message: `Successfully read ${rows.length} rows.`,
        rowCount: rows.length,
        data: rows,
      });
    } else {
      console.warn('[Debug Sheets] The "Leads" tab exists but is empty.');
      return res.status(200).json({ success: true, message: 'Successfully connected, but the "Leads" tab is empty.', rowCount: 0, data: [] });
    }

  } catch (error) {
    console.error('[Debug Sheets] CRITICAL ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to connect to or read from Google Sheets.',
      details: error.message,
    });
  }
}
