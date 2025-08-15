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

    // Get available sheets to find the correct one to use
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    console.log('📋 Available sheets:', availableSheets);
    
    // Find the correct sheet to use (prefer 'Leads', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }
    
    console.log('🎯 Using sheet for reading leads:', targetSheet);
    
    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`, // Read all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('📊 No data found in spreadsheet');
      return res.json({
        success: true,
        leads: []
      });
    }

    // Check if first row looks like headers or data
    const firstRow = rows[0];
    console.log('📋 First row:', firstRow);
    
    let headers, dataRows;
    
    // Check if first row contains headers (should contain words like 'timestamp', 'customer', 'service', etc.)
    const hasHeaders = firstRow.some(cell => 
      cell && typeof cell === 'string' && 
      (cell.toLowerCase().includes('timestamp') || 
       cell.toLowerCase().includes('customer') || 
       cell.toLowerCase().includes('service') || 
       cell.toLowerCase().includes('email') ||
       cell.toLowerCase().includes('phone'))
    );
    
    if (hasHeaders) {
      // First row is headers
      headers = firstRow;
      dataRows = rows.slice(1);
      console.log('✅ Using existing headers:', headers);
    } else {
      // First row is data, need to add headers
      console.log('📝 No headers found, adding them...');
      
      // Define standard headers based on the data structure
      const standardHeaders = [
        'Timestamp',
        'CustomerName', 
        'CustomerEmail',
        'CustomerPhone',
        'SelectedService',
        'ProjectDetails',
        'ProjectSize',
        'SpecificDetails',
        'Location',
        'Budget',
        'Timeline'
      ];
      
      // Insert headers at the beginning
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1:K1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [standardHeaders]
        }
      });
      
      headers = standardHeaders;
      dataRows = rows; // Include the original first row as data
      console.log('✅ Added headers:', headers);
    }

    // Find the index of the selectedService column
    const serviceIndex = headers.findIndex(h => 
      h.toLowerCase().includes('service') || 
      h.toLowerCase().includes('selected')
    );

    if (serviceIndex === -1) {
      console.log('❌ Could not find service column in headers:', headers);
      return res.status(500).json({
        success: false,
        error: 'Service column not found in spreadsheet headers'
      });
    }

    console.log(`🔍 Service column found at index ${serviceIndex}: ${headers[serviceIndex]}`);

    // Filter leads for this tradesman's service type
    const filteredLeads = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const service = row[serviceIndex]?.toLowerCase();
      
      console.log(`🔍 Row ${i + 1} service: "${service}" vs tradeType: "${tradeType.toLowerCase()}"`);
      
      // Check if this lead matches the tradesman's service type
      if (service && service.includes(tradeType.toLowerCase())) {
        const lead = {};
        
        // Map all columns to lead object with normalized property names
        headers.forEach((header, index) => {
          if (row[index]) {
            // Map to lowercase property names for dashboard compatibility
            const headerLower = header.toLowerCase();
            if (headerLower.includes('customer') && headerLower.includes('name')) {
              lead.customerName = row[index];
            } else if (headerLower.includes('customer') && headerLower.includes('email')) {
              lead.customerEmail = row[index];
            } else if (headerLower.includes('customer') && headerLower.includes('phone')) {
              lead.customerPhone = row[index];
            } else if (headerLower.includes('selected') && headerLower.includes('service')) {
              lead.selectedService = row[index];
            } else if (headerLower.includes('project') && headerLower.includes('details')) {
              lead.projectDetails = row[index];
            } else if (headerLower.includes('project') && headerLower.includes('size')) {
              lead.projectSize = row[index];
            } else if (headerLower.includes('specific') && headerLower.includes('details')) {
              lead.specificDetails = row[index];
            } else if (headerLower.includes('location')) {
              lead.location = row[index];
            } else if (headerLower.includes('budget')) {
              lead.budget = row[index];
            } else if (headerLower.includes('timeline')) {
              lead.timeline = row[index];
            } else if (headerLower.includes('timestamp')) {
              lead.timestamp = row[index];
            } else if (headerLower.includes('status')) {
              lead.status = row[index];
              console.log(`📋 Found status for lead: "${row[index]}"`);
            }
            // Also keep original header for backward compatibility
            lead[header] = row[index];
          }
        });
        
        // Add timestamp if not present
        if (!lead.timestamp && !lead.Timestamp) {
          lead.timestamp = new Date().toISOString();
        }
        
        filteredLeads.push(lead);
        console.log(`✅ Added lead: ${lead.CustomerName || lead.customerName} - ${service}`);
        console.log('📋 Lead data structure:', {
          customerName: lead.customerName,
          customerEmail: lead.customerEmail,
          location: lead.location,
          budget: lead.budget,
          selectedService: lead.selectedService,
          projectDetails: lead.projectDetails
        });
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