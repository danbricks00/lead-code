// lib/googleSheets.js
import { google } from 'googleapis';

export function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error('GOOGLE_CLIENT_EMAIL environment variable is not set');
  }

  if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY environment variable is not set');
  }

  // Handle different private key formats
  let cleanPrivateKey = privateKey;
  if (privateKey.includes('\\n')) {
    cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
  }

  // Ensure the key starts and ends with proper newlines
  if (!cleanPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    cleanPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanPrivateKey}\n-----END PRIVATE KEY-----\n`;
  }

  console.log("🔑 Google Auth - Client Email:", clientEmail);
  console.log("🔑 Google Auth - Private Key format check:", cleanPrivateKey.substring(0, 50) + "...");

  const auth = new google.auth.JWT(
    clientEmail,
    null,
    cleanPrivateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return google.sheets({ version: 'v4', auth });
}

export function getSpreadsheetId() {
  return process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
}
