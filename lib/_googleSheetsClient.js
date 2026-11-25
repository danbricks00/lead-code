import { google } from 'googleapis';

export function getGoogleSheetsClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!privateKey || !clientEmail || !spreadsheetId) {
    throw new Error('Missing required Google Sheets environment variables');
  }

  const auth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return google.sheets({ version: 'v4', auth });
}
