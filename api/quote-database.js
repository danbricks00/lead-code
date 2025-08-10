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

// Get or create quotes sheet
async function getQuotesSheet() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  
  if (!spreadsheetId) {
    console.log('❌ No spreadsheet ID configured for quotes database');
    return null;
  }
  
  return { sheets, spreadsheetId };
}

// Initialize quotes sheet with headers
async function initializeQuotesSheet() {
  try {
    const sheetData = await getQuotesSheet();
    if (!sheetData) return null;
    
    const { sheets, spreadsheetId } = sheetData;
    
    // Check if quotes sheet exists
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: 'Quotes!A1'
      });
    } catch (error) {
      // Sheet doesn't exist, create it
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Quotes'
              }
            }
          }]
        }
      });
      
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Quotes!A1:N1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'QuoteID', 'LeadID', 'CustomerEmail', 'CustomerName', 'ServiceType', 
            'ProjectDetails', 'QuoteAmount', 'Status', 'CreatedDate', 'ExpiryDate', 
            'AssignedTradesman', 'CustomerResponse', 'TradesmanResponse', 'FinalStatus'
          ]]
        }
      });
      
      console.log('✅ Quotes sheet initialized');
    }
    
    return sheetData;
  } catch (error) {
    console.error('❌ Error initializing quotes sheet:', error);
    return null;
  }
}

export async function addQuote(quoteData) {
  try {
    const sheetData = await initializeQuotesSheet();
    if (!sheetData) return null;
    
    const { sheets, spreadsheetId } = sheetData;
    
    // Generate unique quote ID
    const quoteId = `Q${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const rowData = [
      quoteId,
      quoteData.leadId || '',
      quoteData.customerEmail,
      quoteData.customerName,
      quoteData.serviceType,
      quoteData.projectDetails,
      quoteData.quoteAmount,
      'pending',
      new Date().toISOString(),
      expiryDate.toISOString(),
      quoteData.assignedTradesman || '',
      '',
      '',
      'active'
    ];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Quotes!A:A',
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData]
      }
    });
    
    console.log('✅ Quote added to sheet:', quoteId);
    return { ...quoteData, quoteId, status: 'pending', createdDate: new Date().toISOString() };
    
  } catch (error) {
    console.error('❌ Error adding quote:', error);
    return null;
  }
}

export async function getQuoteById(quoteId) {
  try {
    const sheetData = await getQuotesSheet();
    if (!sheetData) return null;
    
    const { sheets, spreadsheetId } = sheetData;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Quotes!A:N'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) return null;
    
    // Find quote by ID (first column)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === quoteId) {
        return {
          quoteId: row[0],
          leadId: row[1],
          customerEmail: row[2],
          customerName: row[3],
          serviceType: row[4],
          projectDetails: row[5],
          quoteAmount: row[6],
          status: row[7],
          createdDate: row[8],
          expiryDate: row[9],
          assignedTradesman: row[10],
          customerResponse: row[11],
          tradesmanResponse: row[12],
          finalStatus: row[13]
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting quote:', error);
    return null;
  }
}

export async function updateQuoteStatus(quoteId, status, response = '') {
  try {
    const sheetData = await getQuotesSheet();
    if (!sheetData) return null;
    
    const { sheets, spreadsheetId } = sheetData;
    
    // Find the row number for this quote
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Quotes!A:A'
    });
    
    const rows = response.data.values;
    if (!rows) return null;
    
    const rowIndex = rows.findIndex(row => row[0] === quoteId);
    if (rowIndex === -1) return null;
    
    const rowNumber = rowIndex + 1;
    const updatesArray = [];
    
    // Update status
    updatesArray.push({ 
      range: `Quotes!H${rowNumber}`, 
      values: [[status]] 
    });
    
    // Update response based on status
    if (status === 'customer_accepted' || status === 'customer_declined') {
      updatesArray.push({ 
        range: `Quotes!L${rowNumber}`, 
        values: [[response]] 
      });
    } else if (status === 'tradesman_accepted' || status === 'tradesman_declined') {
      updatesArray.push({ 
        range: `Quotes!M${rowNumber}`, 
        values: [[response]] 
      });
    }
    
    // Update final status if needed
    if (status === 'completed' || status === 'expired') {
      updatesArray.push({ 
        range: `Quotes!N${rowNumber}`, 
        values: [[status]] 
      });
    }
    
    if (updatesArray.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updatesArray
        }
      });
    }
    
    return await getQuoteById(quoteId);
  } catch (error) {
    console.error('❌ Error updating quote status:', error);
    return null;
  }
}

export async function getAllQuotes() {
  try {
    const sheetData = await getQuotesSheet();
    if (!sheetData) return [];
    
    const { sheets, spreadsheetId } = sheetData;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Quotes!A:N'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];
    
    return rows.slice(1).map(row => ({
      quoteId: row[0],
      leadId: row[1],
      customerEmail: row[2],
      customerName: row[3],
      serviceType: row[4],
      projectDetails: row[5],
      quoteAmount: row[6],
      status: row[7],
      createdDate: row[8],
      expiryDate: row[9],
      assignedTradesman: row[10],
      customerResponse: row[11],
      tradesmanResponse: row[12],
      finalStatus: row[13]
    }));
  } catch (error) {
    console.error('❌ Error getting all quotes:', error);
    return [];
  }
}

export async function getQuotesByCustomer(customerEmail) {
  try {
    const allQuotes = await getAllQuotes();
    return allQuotes.filter(quote => quote.customerEmail === customerEmail);
  } catch (error) {
    console.error('❌ Error getting customer quotes:', error);
    return [];
  }
}

export async function getQuotesByTradesman(tradesmanEmail) {
  try {
    const allQuotes = await getAllQuotes();
    return allQuotes.filter(quote => quote.assignedTradesman === tradesmanEmail);
  } catch (error) {
    console.error('❌ Error getting tradesman quotes:', error);
    return [];
  }
}

export async function getExpiredQuotes() {
  try {
    const allQuotes = await getAllQuotes();
    const now = new Date();
    return allQuotes.filter(quote => {
      const expiryDate = new Date(quote.expiryDate);
      return expiryDate < now && quote.status === 'pending';
    });
  } catch (error) {
    console.error('❌ Error getting expired quotes:', error);
    return [];
  }
} 