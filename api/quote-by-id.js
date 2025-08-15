import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const { quoteId, leadId, token } = req.query;
    if (!quoteId || !leadId || !token) return res.status(400).json({ ok:false, error: 'Missing params' });

    // TODO: verify token
    // await verifyToken({ leadId, token });

    // TODO: fetch quote + lead from your storage (Sheet/DB) by quoteId/leadId
    // const data = await getQuoteById({ quoteId, leadId });

    // For now, fetch lead data from Google Sheets
    const leadData = await fetchLeadData(leadId);
    
    if (!leadData) {
      return res.status(404).json({ ok: false, error: 'Quote not found' });
    }

    // Temporary structure (replace with real lookups)
    const data = {
      ok: true,
      quoteId,
      leadId,
      customerName: leadData.customerName || '',
      customerEmail: leadData.customerEmail || '',
      serviceType: leadData.selectedService || 'underfloor_heating',
      location: leadData.location || '',
      projectDetails: leadData.projectDetails || '',
      totals: {
        labour: Number(req.query.labour || 0),
        materials: Number(req.query.materials || 0),
        installation: Number(req.query.installation || 0),
        total: Number(req.query.total || 0)
      },
      tradesman: {
        name: req.query.tradesmanName || '',
        phone: req.query.tradesmanPhone || '',
        email: req.query.tradesmanEmail || ''
      },
      validUntil: req.query.validUntil || '',
      quoteNumber: quoteId
    };

    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:'Server error' });
  }
}

async function fetchLeadData(leadId) {
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return null;
    }

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

    // Get available sheets to find the correct one to use
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Find the correct sheet to use (prefer 'Leads', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // Find the leadId column (second column)
    const leadIdIndex = 1; // Lead ID is the second column (B)

    // Search for the lead with matching leadId
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowLeadId = row[leadIdIndex];
      
      if (rowLeadId === leadId) {
        // Found the lead, map it to the expected structure
        return {
          timestamp: row[0] || '', // Timestamp
          leadId: row[1] || '', // Lead ID
          customerName: row[2] || '', // Customer Name
          customerEmail: row[3] || '', // Customer Email
          customerPhone: row[4] || '', // Customer Phone
          selectedService: row[5] || '', // Service type
          projectDetails: row[6] || '', // Project details
          projectSize: row[7] || '', // Project size
          budget: row[8] || '', // Budget
          timeline: row[9] || '', // Timeline
          location: row[10] || '', // Location
          specificDetails: row[11] || '', // Specific details
          status: row[14] || 'New' // Status (column 15)
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching lead data:', error);
    return null;
  }
}
