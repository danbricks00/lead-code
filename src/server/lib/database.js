import { google } from 'googleapis';

// Initialize Google Sheets API
function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

// Get or create tradesmen sheet
async function getTradesmenSheet() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    console.log('❌ No spreadsheet ID configured for tradesmen database');
    return null;
  }
  
  return { sheets, spreadsheetId };
}

export async function addTradesman(tradesman) {
  try {
    const sheetData = await getTradesmenSheet();
    if (!sheetData) {
      console.log('❌ Could not initialize tradesmen sheet');
      return null;
    }
    
    const { sheets, spreadsheetId } = sheetData;
    
    // Check if tradesmen sheet exists, if not create it
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Tradesmen!A1'
      });
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Tradesmen'
              }
            }
          }]
        }
      });
      
      // Add headers - fix the range to include all 8 columns
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Tradesmen!A1:H1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Email', 'Name', 'TradeType', 'BusinessName', 'Phone', 'Location', 'Status', 'CreatedAt']]
        }
      });
    }
    
    // Add new tradesman
    const rowData = [
      tradesman.email,
      tradesman.name,
      tradesman.tradeType,
      tradesman.businessName,
      tradesman.phone,
      tradesman.location,
      'active',
      new Date().toISOString()
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Tradesmen!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData]
      }
    });
    
    console.log('✅ Tradesman added to sheet:', tradesman.email);
    return tradesman;
    
  } catch (error) {
    console.error('❌ Error adding tradesman:', error);
    return null;
  }
}

export async function getTradesmanByEmail(email) {
  try {
    const sheetData = await getTradesmenSheet();
    if (!sheetData) {
      console.log('❌ Could not initialize tradesmen sheet');
      return null;
    }
    
    const { sheets, spreadsheetId } = sheetData;
    
    // Read all tradesmen data - use proper range format
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Tradesmen!A:H'
    });
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return null; // No data or only headers
    }
    // Find tradesman by email (first column)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === email) {
        return {
          email: row[0],
          name: row[1],
          tradeType: row[2],
          businessName: row[3],
          phone: row[4],
          location: row[5],
          status: row[6] || 'active',
          createdAt: row[7]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting tradesman:', error);
    return null;
  }
}

export async function getAllTradesmen() {
  try {
    const sheetData = await getTradesmenSheet();
    if (!sheetData) {
      return [];
    }
    
    const { sheets, spreadsheetId } = sheetData;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Tradesmen!A:H'
    });
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }
    return rows.slice(1).map(row => ({
      email: row[0],
      name: row[1],
      tradeType: row[2],
      businessName: row[3],
      phone: row[4],
      location: row[5],
      status: row[6] || 'active',
      createdAt: row[7]
    }));
    
  } catch (error) {
    console.error('❌ Error getting all tradesmen:', error);
    return [];
  }
}

export async function updateTradesman(email, updates) {
  try {
    const sheetData = await getTradesmenSheet();
    if (!sheetData) {
      return null;
    }
    
    const { sheets, spreadsheetId } = sheetData;
    
    // Find the row number for this email
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Tradesmen!A:A'
    });
    const rows = response.data.values;
    if (!rows) {
      return null;
    }
    const rowIndex = rows.findIndex(row => row[0] === email);
    if (rowIndex === -1) {
      return null;
    }
    
    // Update the specific row
    const rowNumber = rowIndex + 1;
    const updatesArray = [];
    
    if (updates.name) updatesArray.push({ range: `Tradesmen!B${rowNumber}`, values: [[updates.name]] });
    if (updates.tradeType) updatesArray.push({ range: `Tradesmen!C${rowNumber}`, values: [[updates.tradeType]] });
    if (updates.businessName) updatesArray.push({ range: `Tradesmen!D${rowNumber}`, values: [[updates.businessName]] });
    if (updates.phone) updatesArray.push({ range: `Tradesmen!E${rowNumber}`, values: [[updates.phone]] });
    if (updates.location) updatesArray.push({ range: `Tradesmen!F${rowNumber}`, values: [[updates.location]] });
    if (updates.status) updatesArray.push({ range: `Tradesmen!G${rowNumber}`, values: [[updates.status]] });
    
    if (updatesArray.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updatesArray
        }
      });
    }
    
    return await getTradesmanByEmail(email);
    
  } catch (error) {
    console.error('❌ Error updating tradesman:', error);
    return null;
  }
} 