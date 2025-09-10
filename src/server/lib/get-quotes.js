import { google } from 'googleapis';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, tradeType } = req.body;
    console.log('📊 Get quotes request for:', { email, tradeType });

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
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

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.log('❌ No spreadsheet ID configured');
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured'
      });
    }

    // Read all data from the Quotes sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Quotes!A:AL', // Extended range for all quote fields
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('📊 No quotes found in spreadsheet');
      return res.json({
        success: true,
        quotes: []
      });
    }

    // Check if first row looks like headers
    const firstRow = rows[0];
    console.log('📋 First row:', firstRow);
    
    let headers, dataRows;
    
    // Check if first row contains headers
    const hasHeaders = firstRow.some(cell => 
      cell && typeof cell === 'string' && 
      (cell.toLowerCase().includes('timestamp') || 
       cell.toLowerCase().includes('quote') || 
       cell.toLowerCase().includes('customer') || 
       cell.toLowerCase().includes('email'))
    );
    
    if (hasHeaders) {
      // First row is headers
      headers = firstRow;
      dataRows = rows.slice(1);
      console.log('✅ Using existing headers:', headers);
    } else {
      // First row is data, need to add headers
      console.log('📝 No headers found, adding them...');
      
      // Define standard headers for quotes
      const standardHeaders = [
        'Timestamp',
        'QuoteID',
        'QuoteNumber',
        'CustomerName',
        'CustomerEmail',
        'CustomerPhone',
        'CustomerAddress',
        'ServiceType',
        'ProjectDetails',
        'TradesmanName',
        'TradesmanEmail',
        'TradesmanPhone',
        'CompanyName',
        'Subtotal',
        'GST',
        'TotalAmount',
        'QuoteDate',
        'ExpiryDate',
        'Status',
        'CustomerResponse',
        'ResponseDate',
        'CommissionEarned',
        'Items'
      ];
      
      headers = standardHeaders;
      dataRows = rows;
    }

    // Process quotes data
    const quotes = dataRows.map(row => {
      const quote = {};
      
      // Map each column to its corresponding header
      headers.forEach((header, index) => {
        if (row[index] !== undefined) {
          quote[header] = row[index];
        }
      });

      // Parse items JSON if it exists
      if (quote.Items) {
        try {
          quote.Items = JSON.parse(quote.Items);
        } catch (e) {
          quote.Items = [];
        }
      }

      return quote;
    });

    // Filter quotes based on tradesman email if provided
    let filteredQuotes = quotes;
    if (email) {
      filteredQuotes = quotes.filter(quote => 
        quote.TradesmanEmail && quote.TradesmanEmail.toLowerCase() === email.toLowerCase()
      );
    }

    // Sort quotes by timestamp (newest first)
    filteredQuotes.sort((a, b) => {
      const dateA = new Date(a.Timestamp || a.QuoteDate || 0);
      const dateB = new Date(b.Timestamp || b.QuoteDate || 0);
      return dateB - dateA;
    });

    console.log(`📊 Found ${filteredQuotes.length} quotes for ${email}`);

    res.json({
      success: true,
      quotes: filteredQuotes,
      total: filteredQuotes.length,
             summary: {
         total: filteredQuotes.length,
         accepted: filteredQuotes.filter(q => q.Status === 'customer_accepted').length,
         declined: filteredQuotes.filter(q => q.Status === 'customer_declined').length,
         jobAwardedToAnother: filteredQuotes.filter(q => q.Status === 'job_awarded_to_another').length,
         quoteSent: filteredQuotes.filter(q => q.Status === 'quote_sent').length,
         pending: filteredQuotes.filter(q => !q.Status || q.Status === 'generated').length,
         totalValue: filteredQuotes.reduce((sum, q) => sum + parseFloat(q.TotalAmount || 0), 0).toFixed(2),
         totalCommission: filteredQuotes.reduce((sum, q) => sum + parseFloat(q.CommissionEarned || 0), 0).toFixed(2)
       }
    });

  } catch (error) {
    console.error('❌ Get quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quotes',
      details: error.message
    });
  }
} 