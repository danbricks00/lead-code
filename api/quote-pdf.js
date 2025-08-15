import { google } from 'googleapis';

// Add this named export without changing your existing default handler
export async function generateQuotePdfBuffer({ leadId, token, quoteId, quoteData: passedQuoteData }) {
  try {
    // Use passed quote data if available, otherwise try to fetch it
    let quoteData = passedQuoteData;
    if (!quoteData && quoteId) {
      quoteData = await fetchQuoteData(quoteId);
    }
    
    // Fallback to lead data if no quote data found
    const leadData = quoteData || await fetchLeadData(leadId);
    if (!leadData) {
      throw new Error('Lead not found');
    }

    // Generate HTML content
    const htmlContent = generatePdfContent(leadData, quoteData);
    
    // Return HTML content as buffer for email attachments
    const buffer = Buffer.from(htmlContent, 'utf8');
    return buffer;
  } catch (error) {
    console.error('Error generating quote document buffer:', error);
    throw error;
  }
}

async function fetchQuoteData(quoteId) {
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
    
    // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
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

    // Find the quoteId column (second column)
    const quoteIdIndex = 1; // Quote ID is the second column (B)

    // Search for the quote with matching quoteId
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowQuoteId = row[quoteIdIndex];
      
      if (rowQuoteId === quoteId) {
        // Found the quote, map it to the expected structure
        return {
          timestamp: row[0] || '', // Timestamp
          quoteId: row[1] || '', // Quote ID
          leadId: row[2] || '', // Lead ID
          customerName: row[3] || '', // Customer Name
          customerEmail: row[4] || '', // Customer Email
          customerPhone: row[5] || '', // Customer Phone
          tradesmanName: row[6] || '', // Tradesman Name
          tradesmanEmail: row[7] || '', // Tradesman Email
          tradesmanPhone: row[8] || '', // Tradesman Phone
          serviceType: row[9] || '', // Service Type
          projectDetails: row[10] || '', // Project Details
          projectSize: row[11] || '', // Project Size
          location: row[12] || '', // Location
          budget: row[13] || '', // Budget
          timeline: row[14] || '', // Timeline
          specificDetails: row[15] || '', // Specific Details
          quoteAmount: row[16] || '', // Quote Amount
          labourRate: row[17] || '', // Labour Rate
          labourHours: row[18] || '', // Labour Hours
          labourSubtotal: row[19] || '', // Labour Subtotal
          materialRate: row[20] || '', // Material Rate
          materialSQM: row[21] || '', // Material SQM
          materialSubtotal: row[22] || '', // Material Subtotal
          installationAmount: row[23] || '', // Installation Amount
          installationSubtotal: row[24] || '', // Installation Subtotal
          breakdown: row[25] || '', // Breakdown
          notes: row[26] || '', // Notes
          validUntil: row[27] || '', // Valid Until
          status: row[28] || 'Pending', // Status
          onlineQuoteUrl: row[29] || '', // Online Quote URL
          acceptUrl: row[30] || '', // Accept URL
          declineUrl: row[31] || '' // Decline URL
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching quote data:', error);
    return null;
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

            function generatePdfContent(leadData, quoteData = null) {
               // Generate professional quote HTML matching the sample format
               const quoteNumber = quoteData?.quoteId || `QUOTE${Date.now()}`;
               const currentDate = new Date().toLocaleDateString('en-GB');
               
               // Use custom valid until date if provided, otherwise default to 30 days
               let validUntil;
               if (quoteData?.validUntil) {
                 validUntil = new Date(quoteData.validUntil).toLocaleDateString('en-GB');
               } else {
                 validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
               }
               
               // Use quote data if available, otherwise fallback to budget calculations
               let materials, labor, installation, total;
               if (quoteData) {
                 materials = parseFloat(quoteData.materialSubtotal) || 0;
                 labor = parseFloat(quoteData.labourSubtotal) || 0;
                 installation = parseFloat(quoteData.installationSubtotal) || 0;
                 total = parseFloat(quoteData.quoteAmount) || 0;
               } else {
                 // Calculate totals based on budget (fallback if no quote data)
                 const budget = parseFloat(leadData.budget) || 5000;
                 materials = Math.round(budget * 0.6);
                 labor = Math.round(budget * 0.3);
                 installation = Math.round(budget * 0.1);
                 total = materials + labor + installation;
               }
               
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
                        padding: 8px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .breakdown-table td {
                        padding: 8px;
                        border-bottom: 1px solid #ddd;
                        font-size: 14px;
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
        <div class="company-name">Kiwi Trade</div>
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
                <span class="detail-value">${quoteData?.customerName || leadData.customerName || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${quoteData?.customerEmail || leadData.customerEmail || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${quoteData?.customerPhone || leadData.customerPhone || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${quoteData?.location || leadData.location || 'Not provided'}</span>
            </div>
        </div>
        
        <div class="tradesman-details">
            <div class="details-title">Tradesman Details</div>
            <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${quoteData?.tradesmanName || 'Kiwi Underfloor Heating'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${quoteData?.tradesmanEmail || 'info@kiwitrade.co.nz'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${quoteData?.tradesmanPhone || '021 123 456'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${quoteData?.serviceType || leadData.selectedService || 'Underfloor Heating'}</span>
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
                                <th>Rate per Hour/Unit</th>
                                <th>Amount of Hours/Unit</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materials > 0 ? `
                            <tr>
                                <td>Materials</td>
                                <td>Underfloor heating materials and components</td>
                                <td>$${quoteData ? parseFloat(quoteData.materialRate || 0).toFixed(2) : (leadData.budget ? (parseFloat(leadData.budget) * 0.6 / 25).toFixed(2) : '120.00')} per SQM</td>
                                <td>${quoteData ? parseFloat(quoteData.materialSQM || 0).toFixed(1) : (leadData.projectSize ? parseFloat(leadData.projectSize) : '25')} SQM</td>
                                <td>$${materials.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${labor > 0 ? `
                            <tr>
                                <td>Labor</td>
                                <td>Professional installation services</td>
                                <td>$${quoteData ? parseFloat(quoteData.labourRate || 0).toFixed(2) : (leadData.budget ? (parseFloat(leadData.budget) * 0.3 / 8).toFixed(2) : '56.25')} per hour</td>
                                <td>${quoteData ? parseFloat(quoteData.labourHours || 0).toFixed(1) : '8'} hours</td>
                                <td>$${labor.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${installation > 0 ? `
                            <tr>
                                <td>Installation</td>
                                <td>System setup and configuration</td>
                                <td>Fixed cost</td>
                                <td>-</td>
                                <td>$${installation.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
        
                            <div class="total-section">
                        <div class="total-amount">Total Amount: $${total.toFixed(2)}</div>
                    </div>
    </div>
    
    ${leadData.specificDetails ? `
    <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <p>${leadData.specificDetails}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <div class="footer-text">Kiwi Trade</div>
        <div class="footer-text">Professional underfloor heating solutions for your home</div>
        <div class="footer-text">This quote was generated using our automated system</div>
        <div class="footer-text">Thank you for choosing Kiwi Trade!</div>
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
