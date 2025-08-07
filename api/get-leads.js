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
    console.log('📊 Get leads request for:', { email, tradeType });

    if (!email || !tradeType) {
      return res.status(400).json({
        success: false,
        error: 'Email and trade type are required'
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
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPEADSHEET_ID;

    if (!spreadsheetId) {
      console.log('❌ No spreadsheet ID configured');
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured'
      });
    }

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:Z', // Read all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('📊 No data found in spreadsheet');
      return res.json({
        success: true,
        leads: []
      });
    }

    // Get headers (first row)
    const headers = rows[0];
    console.log('📋 Headers:', headers);

    // Find the index of the selectedService column
    const serviceIndex = headers.findIndex(h => 
      h.toLowerCase().includes('service') || 
      h.toLowerCase().includes('selected')
    );

    if (serviceIndex === -1) {
      console.log('❌ Could not find service column');
      return res.status(500).json({
        success: false,
        error: 'Service column not found in spreadsheet'
      });
    }

    // Filter leads for this tradesman's service type
    const filteredLeads = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const service = row[serviceIndex]?.toLowerCase();
      
      // Check if this lead matches the tradesman's service type
      if (service && service.includes(tradeType.toLowerCase())) {
        const lead = {};
        
        // Map all columns to lead object
        headers.forEach((header, index) => {
          if (row[index]) {
            lead[header] = row[index];
          }
        });
        
        // Add timestamp if not present
        if (!lead.timestamp) {
          lead.timestamp = new Date().toISOString();
        }
        
        filteredLeads.push(lead);
      }
    }

    console.log(`📊 Found ${filteredLeads.length} leads for ${tradeType}`);
    
    return res.json({
      success: true,
      leads: filteredLeads,
      total: filteredLeads.length,
      tradeType: tradeType
    });

  } catch (error) {
    console.error('❌ Error getting leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leads',
      details: error.message
    });
  }
} 