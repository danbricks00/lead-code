import { google } from 'googleapis';

// Add this named export without changing your existing default handler
export async function generateQuotePdfBuffer({ leadId, token }) {
  try {
    // Fetch lead data from Google Sheets
    const leadData = await fetchLeadData(leadId);
    if (!leadData) {
      throw new Error('Lead not found');
    }

    // Generate HTML content
    const htmlContent = generatePdfContent(leadData);
    
    // Return HTML content as buffer for email attachments
    const buffer = Buffer.from(htmlContent, 'utf8');
    return buffer;
  } catch (error) {
    console.error('Error generating quote document buffer:', error);
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
  // Generate professional quote HTML matching the sample format
  const quoteNumber = `QUOTE${Date.now()}`;
  const currentDate = new Date().toLocaleDateString('en-GB');
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
  
  const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote - ${leadData.customerName}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #2c3e50; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .quote-title {
            font-size: 24px;
            font-weight: bold;
            color: #34495e;
            margin-bottom: 15px;
        }
        .quote-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .customer-details, .tradesman-details {
            flex: 1;
            min-width: 300px;
            margin-bottom: 20px;
        }
        .details-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .detail-row {
            margin: 8px 0;
            display: flex;
        }
        .detail-label {
            font-weight: bold;
            width: 120px;
            flex-shrink: 0;
        }
        .detail-value {
            flex: 1;
        }
        .breakdown-section {
            margin: 30px 0;
        }
        .breakdown-title {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 15px;
        }
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .breakdown-table th {
            background-color: #34495e;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        .breakdown-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        .breakdown-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .total-section {
            text-align: right;
            margin: 20px 0;
        }
        .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #27ae60;
        }
        .notes-section {
            margin: 30px 0;
        }
        .notes-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .footer-text {
            font-size: 14px;
            color: #666;
            margin: 5px 0;
        }
        @media print {
            body { margin: 20px; }
            .footer { background-color: #f8f9fa !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">KIWI UNDERFLOOR HEATING</div>
        <div class="quote-title">QUOTE</div>
        <div style="display: flex; justify-content: space-between; max-width: 600px; margin: 0 auto;">
            <div><strong>Quote Number:</strong> ${quoteNumber}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
            <div><strong>Valid Until:</strong> ${validUntil}</div>
        </div>
    </div>
    
    <div class="quote-info">
        <div class="customer-details">
            <div class="details-title">Customer Details</div>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${leadData.customerName || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${leadData.customerEmail || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${leadData.customerPhone || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${leadData.location || 'Not provided'}</span>
            </div>
        </div>
        
        <div class="tradesman-details">
            <div class="details-title">Tradesman Details</div>
            <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">Kiwi Underfloor Heating</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">info@kiwitrade.co.nz</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">021 123 456</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${leadData.selectedService || 'Underfloor Heating'}</span>
            </div>
        </div>
    </div>
    
    <div class="breakdown-section">
        <div class="breakdown-title">Quote Breakdown</div>
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Materials</td>
                    <td>Underfloor heating materials and components</td>
                    <td>$${leadData.budget ? (parseFloat(leadData.budget) * 0.6).toFixed(0) : '3000'}</td>
                </tr>
                <tr>
                    <td>Labor</td>
                    <td>Professional installation services</td>
                    <td>$${leadData.budget ? (parseFloat(leadData.budget) * 0.3).toFixed(0) : '1500'}</td>
                </tr>
                <tr>
                    <td>Installation</td>
                    <td>System setup and configuration</td>
                    <td>$${leadData.budget ? (parseFloat(leadData.budget) * 0.1).toFixed(0) : '500'}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="total-section">
            <div class="total-amount">Total Amount: $${leadData.budget || '5000'}</div>
        </div>
    </div>
    
    ${leadData.specificDetails ? `
    <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <p>${leadData.specificDetails}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <div class="footer-text">Kiwi Underfloor Heating</div>
        <div class="footer-text">Professional underfloor heating solutions for your home</div>
        <div class="footer-text">This quote was generated using our automated system</div>
        <div class="footer-text">Thank you for choosing Kiwi Underfloor Heating!</div>
        <div class="footer-text" style="margin-top: 15px; font-size: 12px;">Lead ID: ${leadData.leadId}</div>
    </div>
</body>
</html>
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

    console.log('🔍 Generating quote document for lead ID:', leadId);

    // Generate HTML content
    const leadData = await fetchLeadData(leadId);
    if (!leadData) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const htmlContent = generatePdfContent(leadData);

    if (download === '1') {
      // Set headers for file download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="quote-${leadId}.html"`);
    } else {
      // Set headers for inline viewing
      res.setHeader('Content-Type', 'text/html');
    }

    // Send the HTML content
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('❌ Error generating quote document:', error);
    return res.status(500).json({
      error: 'Failed to generate quote document',
      details: error.message
    });
  }
}
