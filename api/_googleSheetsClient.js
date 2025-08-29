// Get authenticated Google Sheets client
async function getSheetsClient() {
  const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
    throw new Error('Google Sheets credentials not found');
  }

  const { google } = await import('googleapis');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: privateKey.replace(/\\n/g, '\n'),
      client_email: serviceAccountEmail,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, spreadsheetId };
}

// Append a row to a sheet
export async function appendRow({ range, values }) {
  const { sheets, spreadsheetId } = await getSheetsClient();
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [values] }
  });
}

// Read a range from a sheet
export async function getRange({ range }) {
  const { sheets, spreadsheetId } = await getSheetsClient();
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range, // e.g. 'QuoteDecisions!A:E'
    majorDimension: 'ROWS',
  });
  
  return res.data.values || [];
}

// Ensure a sheet exists and has the correct header
export async function ensureSheetAndHeader({ sheetTitle, headerValues }) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  // 1) Read spreadsheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheet = meta.data.sheets?.find(s => s.properties?.title === sheetTitle);

  // 2) Create sheet if missing
  if (!existingSheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetTitle } } }]
      }
    });
  }

  // 3) Ensure header row
  const values = await getRange({ range: `${sheetTitle}!A1:Z1` });
  const hasHeader = Array.isArray(values) && values.length && values[0]?.some(cell => cell && String(cell).trim().length > 0);
  
  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetTitle}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headerValues] },
    });
  }
}
