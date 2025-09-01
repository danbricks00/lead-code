// lib/googleSheets.js
import { google } from 'googleapis';

export function getGoogleSheetsClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  
  return google.sheets({ version: 'v4', auth });
}

export function getSpreadsheetId() {
  return process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
}
