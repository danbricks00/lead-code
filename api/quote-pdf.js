import { google } from 'googleapis';

// Add this named export without changing your existing default handler
export async function generateQuotePdfBuffer({ leadId, token }) {
  try {
    // Fetch lead data from Google Sheets
    const leadData = await fetchLeadData(leadId);
    if (!leadData) {
      throw new Error('Lead not found');
    }

    // Generate PDF content (simplified for now - you can enhance this)
    const pdfContent = generatePdfContent(leadData);
    
    // For now, return a simple text buffer
    // In a real implementation, you'd use a PDF library like pdfkit or puppeteer
    const buffer = Buffer.from(pdfContent, 'utf8');
    return buffer;
  } catch (error) {
    console.error('Error generating PDF buffer:', error);
    throw error;
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

function generatePdfContent(leadData) {
  // Generate a simple text-based PDF content
  // In a real implementation, you'd use a proper PDF library
  const content = `
QUOTE DOCUMENT

Customer Information:
Name: ${leadData.customerName}
Email: ${leadData.customerEmail}
Phone: ${leadData.customerPhone}
Location: ${leadData.location}

Service Details:
Service Type: ${leadData.selectedService}
Project Details: ${leadData.projectDetails}
Project Size: ${leadData.projectSize}
Budget: ${leadData.budget}
Timeline: ${leadData.timeline}

Additional Details:
${leadData.specificDetails}

Generated on: ${new Date().toISOString()}
Lead ID: ${leadData.leadId}
  `;
  
  return content;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { leadId, token, download } = req.query;

    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    console.log('🔍 Generating PDF for lead ID:', leadId);

    // Generate PDF buffer
    const pdfBuffer = await generateQuotePdfBuffer({ leadId, token });

    if (download === '1') {
      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quote-${leadId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
    } else {
      // Set headers for inline viewing
      res.setHeader('Content-Type', 'application/pdf');
    }

    // Send the PDF buffer
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return res.status(500).json({
      error: 'Failed to generate PDF',
      details: error.message
    });
  }
}
