import { google } from 'googleapis';
import { sendEmailViaGmailAPI, validateEmail, logEmailAttempt } from './gmail-api-helper.js';
import { generateQuoteDocument } from './word-document-generator.js';

// Helper function to format timestamp in NZT
function formatNZTTime(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' NZT';
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown time';
  }
}

// Generate mobile-friendly HTML quote
function generateHtmlQuote(quoteData) {
  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        // Return 2 weeks from now as fallback
        const fallbackDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        return fallbackDate.toLocaleDateString('en-NZ', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('❌ Invalid date in quote-submission.js:', dateString);
        // Return 2 weeks from now as fallback
        const fallbackDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        return fallbackDate.toLocaleDateString('en-NZ', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      return date.toLocaleDateString('en-NZ', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Date formatting error in quote-submission.js:', error);
      // Return 2 weeks from now as fallback
      const fallbackDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      return fallbackDate.toLocaleDateString('en-NZ', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote - ${quoteData.quoteNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .quote-container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
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
            font-size: 20px;
            color: #7f8c8d;
            margin-bottom: 10px;
        }
        .quote-number {
            font-size: 18px;
            color: #e74c3c;
            font-weight: bold;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        .info-label {
            font-weight: bold;
            color: #2c3e50;
            font-size: 14px;
        }
        .info-value {
            color: #555;
            margin-top: 5px;
        }
        .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .breakdown-table th {
            background: #2c3e50;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }
        .breakdown-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #ecf0f1;
        }
        .breakdown-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        .total-row {
            background: #e8f5e8 !important;
            font-weight: bold;
            font-size: 16px;
        }
        .total-amount {
            font-size: 24px;
            color: #27ae60;
            text-align: center;
            padding: 20px;
            background: #e8f5e8;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .quote-container { padding: 20px; }
            .info-grid { grid-template-columns: 1fr; }
            .breakdown-table { font-size: 14px; }
            .breakdown-table th, .breakdown-table td { padding: 8px 10px; }
        }
    </style>
</head>
<body>
    <div class="quote-container">
        <div class="header">
            <div class="company-name">Kiwi Trade</div>
            <div class="quote-title">Professional Quote</div>
            <div class="quote-number">${quoteData.quoteNumber}</div>
        </div>

        <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Customer Name</div>
                    <div class="info-value">${quoteData.customerName || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${quoteData.customerEmail || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Phone</div>
                    <div class="info-value">${quoteData.customerPhone || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Location</div>
                    <div class="info-value">${quoteData.location || 'Not specified'}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Project Details</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Service Type</div>
                    <div class="info-value">${quoteData.serviceType || 'Underfloor Heating'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Project Size</div>
                    <div class="info-value">${quoteData.projectSize || 'Not specified'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Valid Until</div>
                    <div class="info-value">${formatDate(quoteData.validUntil)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tradesman</div>
                    <div class="info-value">${quoteData.tradesmanName}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Cost Breakdown</div>
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateBreakdownRows(quoteData)}
                    <tr class="total-row">
                        <td colspan="2"><strong>Total</strong></td>
                        <td><strong>$${parseFloat(quoteData.totalAmount).toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="total-amount">
            Total Quote Amount: $${parseFloat(quoteData.totalAmount).toFixed(2)}
        </div>

        ${quoteData.additionalNotes ? `
        <div class="section">
            <div class="section-title">Additional Notes</div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #f39c12;">
                ${quoteData.additionalNotes}
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p><strong>Thank you for choosing Kiwi Trade!</strong></p>
            <p>This quote is valid until ${formatDate(quoteData.validUntil)}</p>
            <p>For questions or to accept this quote, please contact us.</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

// Generate breakdown table rows
function generateBreakdownRows(quoteData) {
  const rows = [];
  
  // Parse item breakdown if available
  if (quoteData.itemBreakdown) {
    const breakdownLines = quoteData.itemBreakdown.split('\n').filter(line => line.trim());
    breakdownLines.forEach(line => {
      if (line.includes(':')) {
        const [item, description] = line.split(':');
        const amountMatch = description.match(/\\$([0-9.]+)/);
        const amount = amountMatch ? amountMatch[1] : '0.00';
        rows.push(`
          <tr>
            <td>${item.trim()}</td>
            <td>${description.replace(/\\$[0-9.]+/, '').trim()}</td>
            <td>$${amount}</td>
          </tr>
        `);
      }
    });
  }
  
  // If no breakdown or empty, show default structure
  if (rows.length === 0) {
    rows.push(`
      <tr>
        <td>Underfloor Heating Installation</td>
        <td>Professional installation service</td>
        <td>$${parseFloat(quoteData.totalAmount).toFixed(2)}</td>
      </tr>
    `);
  }
  
  return rows.join('');
}

export default async function handler(req, res) {
  console.log('🔍 Quote submission API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { 
      quoteId, 
      leadId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      serviceType, 
      projectDetails, 
      projectSize, 
      budget, 
      timeline, 
      location 
    } = req.query;
    
    const queryParams = new URLSearchParams();
    if (leadId) queryParams.append('leadId', leadId);
    if (quoteId) queryParams.append('quoteId', quoteId);
    if (customerName) queryParams.append('customerName', customerName);
    if (customerEmail) queryParams.append('customerEmail', customerEmail);
    if (customerPhone) queryParams.append('customerPhone', customerPhone);
    if (serviceType) queryParams.append('serviceType', serviceType);
    if (projectDetails) queryParams.append('projectDetails', projectDetails);
    if (projectSize) queryParams.append('projectSize', projectSize);
    if (budget) queryParams.append('budget', budget);
    if (timeline) queryParams.append('timeline', timeline);
    if (location) queryParams.append('location', location);
    
    const queryString = queryParams.toString();
    const redirectUrl = `/quote-submit/${leadId}${queryString ? '?' + queryString : ''}`;
    
    return res.redirect(redirectUrl);
  }

  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      console.log('✅ Quote received:', quoteData);

      // Basic validation with detailed logging
      console.log('🔍 Validating quote data...');
      console.log('📝 Tradesman Name:', quoteData.tradesmanName);
      console.log('📧 Tradesman Email:', quoteData.tradesmanEmail);
      console.log('💰 Total Amount:', quoteData.totalAmount);
      console.log('📞 Tradesman Phone:', quoteData.tradesmanPhone);
      console.log('📅 Valid Until:', quoteData.validUntil);
      console.log('🔢 Quote Number:', quoteData.quoteNumber);
      
      // Check for pattern validation issues
      if (quoteData.tradesmanPhone && !/^[\+]?[0-9\s\-\(\)]+$/.test(quoteData.tradesmanPhone)) {
        console.log('❌ Phone number pattern validation failed:', quoteData.tradesmanPhone);
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Please use only numbers, spaces, hyphens, and parentheses.'
        });
      }
      
      if (quoteData.tradesmanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(quoteData.tradesmanEmail)) {
          console.log('❌ Email pattern validation failed:', quoteData.tradesmanEmail);
          return res.status(400).json({
            success: false,
            error: 'Invalid email format. Please enter a valid email address.'
          });
        }
        
        // Check for invalid domain patterns (like .x.x for Outlook)
        const domain = quoteData.tradesmanEmail.split('@')[1];
        const invalidDomainPatterns = [
            /\.x\.x$/i,           // .x.x pattern
            /\.x\.\w+$/i,         // .x.anything pattern
            /\.\w+\.x$/i,         // .anything.x pattern
            /\.x$/i,              // .x pattern
            /\.\d+\.\d+$/i,       // .number.number pattern
            /\.\d+$/i,            // .number pattern
        ];
        
        for (const pattern of invalidDomainPatterns) {
            if (pattern.test(domain)) {
                console.log(`❌ Invalid domain pattern detected: ${domain}`);
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email domain format'
                });
            }
        }
      }
      
      if (!quoteData.tradesmanName || !quoteData.tradesmanEmail || !quoteData.totalAmount) {
        console.log('❌ Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: tradesmanName, tradesmanEmail, totalAmount'
        });
      }

      // Check if this tradesman has already submitted a quote for this lead
      if (quoteData.leadId && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          // Check the Quotes sheet for existing quotes from this tradesman for this lead
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:AZ',
          });

          const rows = response.data.values || [];
          console.log('🔍 Checking for existing quotes. Looking for:', { leadId: quoteData.leadId, tradesmanEmail: quoteData.tradesmanEmail });
          console.log('📊 Total rows in Quotes sheet:', rows.length);
          
          const existingQuote = rows.find(row => 
            row[1] === quoteData.leadId && // leadId column (B)
            row[4] === quoteData.tradesmanEmail // tradesmanEmail column (E)
          );

          if (existingQuote) {
            console.log('🔍 Found existing quote for this tradesman and lead');
            console.log('📊 Existing quote details:', existingQuote);
            
            // Get the header row to identify column positions
            const header = rows[0];
            const adminStatusIndex = header.indexOf('Admin Status');
            const resubmissionAllowedIndex = header.indexOf('Reesubmission Allowed');
            const quoteDateIndex = header.indexOf('Quote Date') || header.indexOf('Date');
            
            const adminStatus = adminStatusIndex !== -1 ? existingQuote[adminStatusIndex] : '';
            const resubmissionAllowed = resubmissionAllowedIndex !== -1 ? existingQuote[resubmissionAllowedIndex] : '';
            const quoteDate = quoteDateIndex !== -1 ? existingQuote[quoteDateIndex] : '';
            
            console.log('📋 Quote status check:', { adminStatus, resubmissionAllowed });
            
            // Check if resubmission is allowed after admin decline
            if (adminStatus === 'Declined' && resubmissionAllowed === 'Yes') {
              console.log('✅ RESUBMISSION ALLOWED: Admin declined but resubmission is permitted');
              // Continue with submission - this will overwrite the declined quote
            } else {
              // Quote exists and no resubmission allowed
              console.log('❌ Tradesman already submitted quote for this lead');
              
              const formatNZDate = (dateString) => {
                if (!dateString) return 'an unknown date';
                try {
                  const date = new Date(dateString);
                  return date.toLocaleString('en-NZ', {
                    timeZone: 'Pacific/Auckland',
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) + ' NZT';
                } catch (e) {
                  return dateString;
                }
              };
              
              const formattedDate = formatNZDate(quoteDate);
              
              return res.status(400).json({
                success: false,
                error: `You have already submitted a quote for this lead on ${formattedDate}. Only one quote per tradesman per lead is allowed.`,
                quoteExists: true,
                existingQuoteData: {
                  quoteId: existingQuote[0], // QuoteID column (A)
                  leadId: existingQuote[1],
                  submissionDate: formattedDate,
                  adminStatus: adminStatus || 'Pending',
                  canResubmit: false
                }
              });
            }
          }
          
          console.log('✅ No existing quote found - proceeding with submission');
        } catch (sheetsError) {
          console.error('❌ Google Sheets error checking existing quotes:', sheetsError.message);
          // Continue with submission if we can't check (fail open for reliability)
        }
      }

      // Clean and validate data
      try {
        quoteData.tradesmanName = quoteData.tradesmanName.trim();
        quoteData.tradesmanEmail = quoteData.tradesmanEmail.trim();
        quoteData.totalAmount = quoteData.totalAmount.toString().replace(/[^0-9.]/g, '');
        quoteData.tradesmanPhone = quoteData.tradesmanPhone ? quoteData.tradesmanPhone.trim() : '';
        quoteData.itemBreakdown = quoteData.itemBreakdown ? quoteData.itemBreakdown.trim() : '';
        quoteData.additionalNotes = quoteData.additionalNotes ? quoteData.additionalNotes.trim() : '';
        
        console.log('✅ Data cleaned successfully');
        console.log('🧹 Cleaned data:', {
          tradesmanName: quoteData.tradesmanName,
          tradesmanEmail: quoteData.tradesmanEmail,
          totalAmount: quoteData.totalAmount,
          tradesmanPhone: quoteData.tradesmanPhone
        });
      } catch (cleanError) {
        console.error('❌ Error cleaning data:', cleanError);
        return res.status(400).json({
          success: false,
          error: 'Error processing form data: ' + cleanError.message
        });
      }

      // Fetch customer data from Google Sheets if missing
      if ((!quoteData.customerName || !quoteData.customerEmail || !quoteData.customerPhone) && quoteData.leadId && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:K',
          });

          const rows = response.data.values || [];
          const leadRow = rows.find(row => row[13] === quoteData.leadId);

          if (leadRow) {
            quoteData.customerName = quoteData.customerName || leadRow[1] || '';
            quoteData.customerEmail = quoteData.customerEmail || leadRow[2] || '';
            quoteData.customerPhone = quoteData.customerPhone || leadRow[3] || '';
            quoteData.serviceType = quoteData.serviceType || leadRow[4] || 'Underfloor Heating';
            quoteData.projectDetails = quoteData.projectDetails || leadRow[5] || '';
            quoteData.location = quoteData.location || leadRow[10] || 'Auckland';
            console.log('✅ Customer data fetched from Google Sheets');
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error fetching customer data:', sheetsError.message);
        }
      }

      // Initialize status variables
      let sheetsUpdated = false;
      let tradesmanEmailSent = false;
      let customerEmailSent = false;

      // 1. Save to Google Sheets
      if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          const values = [
            [
              // Standardized column structure (A through AJ) - WITH CALCULATED TOTALS
              new Date().toISOString(), // A: Timestamp
              quoteData.quoteId, // B: QuoteID
              quoteData.leadId, // C: LeadID
              quoteData.tradesmanName, // D: TradePersonName
              quoteData.tradesmanEmail, // E: TradespersonEmail
              quoteData.tradesmanPhone, // F: TradespersonPhone
              'submitted', // G: CustomerStatus
              'submitted', // H: TradespersonStatus
              'Not Required', // I: AdminStatus
              quoteData.labourRate, // J: LabourRate
              quoteData.labourHours, // K: LabourHours
              quoteData.labourRate * quoteData.labourHours, // L: LabourTotal
              quoteData.materialsCost, // M: MaterialsCost
              quoteData.materialsQuantity, // N: MaterialsQuantity
              quoteData.materialsCost * quoteData.materialsQuantity, // O: MaterialsTotal
              quoteData.travelCost, // P: TravelCost
              quoteData.travelDistance, // Q: TravelDistance
              quoteData.travelCost * quoteData.travelDistance, // R: TravelTotal
              quoteData.installationCost, // S: InstallationCost
              quoteData.subtotal, // T: Subtotal
              quoteData.gst, // U: GST
              quoteData.totalQuote, // V: TotalQuote
              quoteData.additionalNotes || '', // W: Notes
              quoteData.validUntil, // X: ValidUntil
              'No', // Y: ResubmissionAllowed
              '', // Z: Decision
              '', // AA: DecisionTimestamp
              quoteData.customerName, // AB: CustomerName
              quoteData.customerEmail, // AC: CustomerEmail
              quoteData.customerPhone, // AD: CustomerPhone
              quoteData.serviceType, // AE: ServiceType
              quoteData.location, // AF: Location
              quoteData.timeline, // AG: Timeline
              quoteData.budget || '', // AH: Budget
              JSON.stringify(quoteData.rooms || []), // AI: Rooms
              '', // AJ: Breakdown
              new Date().toISOString(),
              quoteData.quoteId,
              quoteData.quoteNumber,
              quoteData.tradesmanName,
              quoteData.tradesmanEmail,
              quoteData.tradesmanPhone,
              quoteData.totalAmount,
              quoteData.itemBreakdown,
              quoteData.validUntil,
              quoteData.additionalNotes,
              'submitted',
              quoteData.customerName,
              quoteData.customerEmail,
              quoteData.customerPhone,
              quoteData.serviceType,
              quoteData.location,
              quoteData.projectDetails,
              quoteData.projectSize,
              quoteData.budget,
              quoteData.timeline,
              // Add detailed breakdown data for admin approval
              quoteData.labourRate,
              quoteData.labourHours,
              quoteData.materialsCost,
              quoteData.materialsQuantity,
              quoteData.travelCost,
              quoteData.travelDistance,
              quoteData.installationCost,
              quoteData.subtotal,
              quoteData.gst,
              quoteData.totalQuote,
              JSON.stringify(quoteData.rooms || []), // Store rooms data as JSON
              quoteData.leadId // Store lead ID for reference
            ]
          ];

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:AZ',
            range: 'Quotes!A:AZ',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
          });

          console.log('✅ Quote saved to Google Sheets');
          sheetsUpdated = true;
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // Email configuration
      const tradesmanEmail = process.env.TRADESMAN_EMAIL;
      const adminEmail = process.env.ADMIN_EMAIL;
      const customerEmail = quoteData.customerEmail;
      
      console.log('📧 Email recipients configured:');
      console.log(`📧 Tradesman: ${tradesmanEmail}`);
      console.log(`📧 Admin: ${adminEmail}`);
      console.log(`📧 Customer: ${customerEmail}`);

      // Validate email addresses
      if (!validateEmail(tradesmanEmail)) {
        throw new Error(`Invalid tradesman email: ${tradesmanEmail}`);
      }
      if (!validateEmail(adminEmail)) {
        throw new Error(`Invalid admin email: ${adminEmail}`);
      }
      if (!validateEmail(customerEmail)) {
        throw new Error(`Invalid customer email: ${customerEmail}`);
      }

      let emailResults = {
        tradesman: { sent: false, error: null },
        admin: { sent: false, error: null },
        customer: { sent: false, error: null }
      };

      // Generate Word document attachment
      let quoteAttachment = null;
      let attachmentFilename = '';
      let attachmentType = 'none';
      
      console.log('📄 Generating Word document quote...');
      try {
        const docResult = await generateQuoteDocument(quoteData);
        quoteAttachment = {
          content: docResult.buffer,
          filename: docResult.filename,
          contentType: docResult.contentType
        };
        attachmentFilename = docResult.filename;
        attachmentType = 'docx';
        console.log(`✅ Word document generated: ${attachmentFilename}`);
      } catch (docError) {
        console.error('❌ Failed to generate Word document:', docError.message);
        console.log('🔄 Attempting HTML fallback for mobile-friendly formatting...');
        
        try {
          // Generate HTML fallback for mobile-friendly formatting
          const htmlQuote = generateHtmlQuote(quoteData);
          const htmlBuffer = Buffer.from(htmlQuote, 'utf-8');
          quoteAttachment = {
            content: htmlBuffer,
            filename: `Quote-${quoteData.quoteNumber}-mobile.html`,
            contentType: 'text/html'
          };
          attachmentFilename = quoteAttachment.filename;
          attachmentType = 'html';
          console.log(`✅ HTML fallback generated: ${attachmentFilename}`);
        } catch (htmlError) {
          console.error('❌ Failed to generate HTML fallback:', htmlError.message);
          // Continue without attachment
        }
      }

             // 2. Send confirmation email to tradesman
       console.log('📧 Step 1: Sending tradesman confirmation...');
       try {
         const currentTime = formatNZTTime(new Date());
         const tradesmanSubject = `Quote Submission Successful - ${quoteData.quoteNumber}`;
         const tradesmanHtml = `
           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
             <h2 style="color: #2c3e50;">✅ Quote Submission Successful!</h2>
             <p>Dear ${quoteData.tradesmanName},</p>
             <p>Your quote has been successfully submitted and is being processed.</p>
       
             <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
               <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
               <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
               <p><strong>Customer:</strong> ${quoteData.customerName || 'Not specified'}</p>
               <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
               <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
               <p><strong>Submitted on:</strong> ${currentTime}</p>
               <p><strong>Status:</strong> Submitted and being processed</p>
             </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>📄 Professional quote document being generated</li>
                <li>📧 Customer will receive quote email with attachment</li>
                <li>📧 Customer can accept or decline the quote</li>
                <li>📊 Quote status will be updated in system</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
          </div>
        `;

        const tradesmanResult = await sendEmailViaGmailAPI(tradesmanEmail, tradesmanSubject, tradesmanHtml, quoteAttachment);
        emailResults.tradesman.sent = true;
        logEmailAttempt(tradesmanEmail, tradesmanSubject, 'SUCCESS', null, quoteAttachment);
        console.log(`✅ Tradesman email sent successfully: ${tradesmanResult.messageId}`);
        tradesmanEmailSent = true;
      } catch (error) {
        emailResults.tradesman.error = error.message;
        logEmailAttempt(tradesmanEmail, 'Quote Submission Successful', 'FAILED', error, quoteAttachment);
        console.error(`❌ Failed to send tradesman email:`, error.message);
      }

      // 3. Send email to admin with attachment
      console.log('📧 Step 2: Sending admin notification...');
      try {
        const adminSubject = `Quote ${quoteData.quoteNumber} Submitted - ${quoteData.tradesmanName}`;
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">📄 Quote Submitted - Admin Copy</h2>
            <p>A quote has been submitted by ${quoteData.tradesmanName} for ${quoteData.customerName}.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
              <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
              <p><strong>Phone:</strong> ${quoteData.tradesmanPhone}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
              <p><strong>Item Breakdown:</strong></p>
              <pre style="background: #f1f1f1; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${quoteData.itemBreakdown}</pre>
              ${quoteData.additionalNotes ? `<p><strong>Additional Notes:</strong> ${quoteData.additionalNotes}</p>` : ''}
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Customer Details:</h3>
              <p><strong>Name:</strong> ${quoteData.customerName || 'Not specified'}</p>
              <p><strong>Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
              <p><strong>Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
              <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
              <p><strong>Location:</strong> ${quoteData.location || 'Auckland'}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Status:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ Quote submitted successfully</li>
                <li>📧 Customer will receive quote with attachment</li>
                <li>📊 Quote status updated in system</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
          </div>
        `;

        const adminResult = await sendEmailViaGmailAPI(adminEmail, adminSubject, adminHtml, quoteAttachment);
        emailResults.admin.sent = true;
        logEmailAttempt(adminEmail, adminSubject, 'SUCCESS', null, quoteAttachment);
        console.log(`✅ Admin email sent successfully: ${adminResult.messageId}`);
      } catch (error) {
        emailResults.admin.error = error.message;
        logEmailAttempt(adminEmail, 'Quote Submitted - Admin Copy', 'FAILED', error, quoteAttachment);
        console.error(`❌ Failed to send admin email:`, error.message);
      }

      // 4. Send email to customer with attachment
      console.log('📧 Step 3: Sending customer quote...');
      try {
        const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const customerSubject = `Your Quote - ${quoteData.quoteNumber} - Kiwi Trade`;
        const customerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Your Quote is Ready!</h2>
            <p>Dear ${quoteData.customerName},</p>
            <p>Thank you for your inquiry. We have prepared a detailed quote for your project.</p>
            
            <!-- Box 1: Quote Summary & Details -->
            <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #3498db;">
              <h3 style="color: #2c3e50; margin-top: 0; font-size: 20px;">📋 Quote Summary & Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <strong style="color: #495057;">Quote Number:</strong><br>
                  <span style="color: #6c757d;">${quoteData.quoteNumber}</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <strong style="color: #495057;">Service Type:</strong><br>
                  <span style="color: #6c757d;">${quoteData.serviceType || 'Underfloor Heating'}</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <strong style="color: #495057;">Total Amount:</strong><br>
                  <span style="color: #28a745; font-weight: bold; font-size: 16px;">$${quoteData.totalAmount}</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <strong style="color: #495057;">Valid Until:</strong><br>
                  <span style="color: #6c757d;">${quoteData.validUntil}</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <strong style="color: #495057;">Location:</strong><br>
                  <span style="color: #6c757d;">${quoteData.location || 'Auckland'}</span>
                </div>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                  <strong style="color: #495057;">Date Created:</strong><br>
                  <span style="color: #6c757d;">${new Date().toLocaleDateString('en-NZ')}</span>
                </div>
              </div>
            </div>
            
            
            <!-- Box 3: Quote Actions -->
            <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; border-left: 5px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0; font-size: 20px;">⚡ Quote Actions</h3>
              <p style="margin: 15px 0; color: #666; font-style: italic;">Choose your action below:</p>
              <div style="margin: 25px 0; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <a href="${currentUrl}/api/customer-accept?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
                   style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                   ✅ Accept Quote
                </a>
                <a href="${currentUrl}/api/customer-decline?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
                   style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                   ❌ Decline Quote
                </a>
              </div>
              <p style="margin: 10px 0; font-size: 14px; color: #856404; font-weight: bold;">⚠️ One time action only</p>
            </div>
            
            <p><strong>Reference:</strong> ${quoteData.quoteNumber}</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade Team</strong></p>
          </div>
        `;

        const customerResult = await sendEmailViaGmailAPI(customerEmail, customerSubject, customerHtml, quoteAttachment);
        emailResults.customer.sent = true;
        logEmailAttempt(customerEmail, customerSubject, 'SUCCESS', null, quoteAttachment);
        console.log(`✅ Customer email sent successfully: ${customerResult.messageId}`);
        customerEmailSent = true;
      } catch (error) {
        emailResults.customer.error = error.message;
        logEmailAttempt(customerEmail, 'Your Quote', 'FAILED', error, quoteAttachment);
        console.error(`❌ Failed to send customer email:`, error.message);
      }

      // Calculate email success rate
      const totalEmails = 3;
      const successfulEmails = Object.values(emailResults).filter(result => result.sent).length;
      const emailSuccessRate = (successfulEmails / totalEmails) * 100;

      // Return success response
      const response = {
        success: emailSuccessRate >= 66, // At least 2 out of 3 emails must succeed
        message: emailSuccessRate >= 66 ? 'Quote submitted successfully! Professional quote has been created and sent to all parties.' : 'Quote submitted successfully! Some notifications may be delayed.',
        data: {
          quoteNumber: quoteData.quoteNumber,
          customerName: quoteData.customerName,
          totalAmount: quoteData.totalAmount,
          tradesmanName: quoteData.tradesmanName
        },
        status: {
          emailResults,
          emailSuccessRate: `${emailSuccessRate.toFixed(1)}%`,
          sheetsUpdated,
          attachmentGenerated: !!quoteAttachment
        }
      };

      console.log('📊 Quote Submission Response:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ Error processing quote submission:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process quote submission',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
