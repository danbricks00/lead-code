import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { generateQuotePdfBuffer, coerceNumeric } from './quote-utils.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      originalQuoteId,
      leadId,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      counterQuoteAmount,
      labourRate,
      labourHours,
      labourSubtotal,
      materialRate,
      materialSQM,
      materialSubtotal,
      installationAmount,
      installationSubtotal,
      breakdown,
      notes,
      validUntil,
      reasonForCounter
    } = req.body;

    if (!originalQuoteId || !leadId || !tradesmanEmail || !counterQuoteAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🔍 Counter quote submission received:', { originalQuoteId, leadId, tradesmanEmail, counterQuoteAmount });

    // Check if a counter quote already exists for this original quote
    const existingCounterQuote = await checkExistingCounterQuote(originalQuoteId);
    if (existingCounterQuote) {
      return res.status(400).json({ 
        error: 'A counter quote already exists for this original quote. Only one counter quote is allowed per declined quote.' 
      });
    }

    // Generate counter quote ID
    const counterQuoteId = `COUNTER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = req.body.token || req.body.hmac || '';

    // Build PDF buffer for attachment
    let pdfBuffer = null;
    let onlineQuoteUrl = '';
    let acceptUrl = '';
    let declineUrl = '';
    let attachments = [];

    // Compute links first - use Vercel's default domain
    const origin = process.env.SITE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    console.log('🌐 Origin URL:', origin);
    
    // Generate URLs for counter quote
    onlineQuoteUrl = `${origin}/counter-quote.html?counterQuoteId=${encodeURIComponent(counterQuoteId)}&originalQuoteId=${encodeURIComponent(originalQuoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`;
    acceptUrl = `${origin}/api/counter-quote-decision?counterQuoteId=${encodeURIComponent(counterQuoteId)}&originalQuoteId=${encodeURIComponent(originalQuoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}&action=accept`;
    declineUrl = `${origin}/api/counter-quote-decision?counterQuoteId=${encodeURIComponent(counterQuoteId)}&originalQuoteId=${encodeURIComponent(originalQuoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}&action=decline`;
    
    console.log('🔗 Generated counter quote URLs:', {
      onlineQuoteUrl,
      acceptUrl,
      declineUrl
    });

    // Prepare counter quote data with URLs
    const counterQuoteData = {
      timestamp: new Date().toISOString(),
      counterQuoteId: counterQuoteId,
      originalQuoteId: originalQuoteId,
      leadId: leadId,
      tradesmanName: tradesmanName,
      tradesmanEmail: tradesmanEmail,
      tradesmanPhone: tradesmanPhone,
      counterQuoteAmount: coerceNumeric(counterQuoteAmount),
      labourRate: coerceNumeric(labourRate),
      labourHours: coerceNumeric(labourHours),
      labourSubtotal: coerceNumeric(labourSubtotal),
      materialRate: coerceNumeric(materialRate),
      materialSQM: coerceNumeric(materialSQM),
      materialSubtotal: coerceNumeric(materialSubtotal),
      installationAmount: coerceNumeric(installationAmount),
      installationSubtotal: coerceNumeric(installationSubtotal),
      breakdown: breakdown,
      notes: notes,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reasonForCounter: reasonForCounter,
      status: 'Pending',
      onlineQuoteUrl: onlineQuoteUrl,
      acceptUrl: acceptUrl,
      declineUrl: declineUrl
    };

    // Save counter quote to Google Sheets
    try {
      await saveCounterQuote(counterQuoteData);
      console.log('✅ Counter quote saved to Google Sheets');
    } catch (saveError) {
      console.error('❌ Failed to save counter quote:', saveError.message);
      return res.status(500).json({ error: 'Failed to save counter quote' });
    }

    // Generate PDF buffer for attachment
    try {
      pdfBuffer = await generateCounterQuotePdfBuffer({
        leadId: leadId,
        token: token,
        counterQuoteId: counterQuoteId,
        counterQuoteData: counterQuoteData
      });

      console.log('✅ Counter quote PDF buffer generated successfully');

      // Prepare attachment
      attachments = [{
        filename: `counter-quote-${counterQuoteId}.html`,
        content: pdfBuffer,
        contentType: 'text/html'
      }];

    } catch (pdfError) {
      console.error('❌ PDF generation error:', pdfError.message);
    }

    // Send emails to all parties
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // Get lead data for customer details
      const leadData = await fetchLeadData(leadId);
      const originalQuoteData = await fetchQuoteData(originalQuoteId);

      // 1. Send customer notification email with counter quote attachment
      if (leadData && leadData.customerEmail) {
        const customerSubject = 'New Counter Quote Available - Kiwi Trade';
        
        const customerHtml = `
          <div style="font-family: Arial, sans-serif; color:#1f2937;">
            <h2>New Counter Quote Available</h2>
            <p>Hi ${leadData.customerName || 'there'},</p>
            <p>The tradesman has provided a new counter quote for your project. This may be due to revised pricing, updated scope, or other considerations.</p>
            
            <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
              <h3 style="margin-top:0;">Counter Quote Details</h3>
              <p><strong>Original Quote ID:</strong> ${originalQuoteId}</p>
              <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
              <p><strong>Tradesman:</strong> ${tradesmanName || 'Not provided'}</p>
              <p><strong>Service:</strong> ${originalQuoteData?.serviceType || leadData.selectedService || 'Underfloor Heating'}</p>
              <p><strong>Location:</strong> ${originalQuoteData?.location || leadData.location || 'Not specified'}</p>
              <p><strong>New Quote Amount:</strong> $${Number(counterQuoteAmount).toFixed(2)}</p>
              <p><strong>Valid Until:</strong> ${validUntil || 'Not specified'}</p>
              ${reasonForCounter ? `<p><strong>Reason for Counter Quote:</strong> ${reasonForCounter}</p>` : ''}
            </div>
            
            <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
              <h3 style="margin-top:0;color:#065f46;">Next Steps</h3>
              <p style="color:#065f46;">You can review this counter quote and:</p>
              <ul style="color:#065f46;">
                <li><a href="${onlineQuoteUrl}" style="color:#10b981;">View your counter quote online</a></li>
                <li><a href="${acceptUrl}" style="color:#10b981;">Accept this counter quote</a></li>
                <li><a href="${declineUrl}" style="color:#ef4444;">Decline this counter quote</a></li>
              </ul>
            </div>
            
            <p style="margin-top:20px;color:#6b7280;">
              If you have any questions about this counter quote, please don't hesitate to contact us at info@kiwitrade.co.nz
            </p>
            
            <p style="margin-top:20px;color:#6b7280;">
              Best regards,<br>
              The Kiwi Trade Team
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: leadData.customerEmail,
          subject: customerSubject,
          html: customerHtml,
          attachments: attachments
        });
        
        console.log('✅ Customer counter quote notification sent with attachment');
      }

      // 2. Send tradesman confirmation email with counter quote attachment
      const tradesmanSubject = 'Counter Quote Submitted Successfully';
      
      const tradesmanHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Counter Quote Submitted</h2>
          <p>Hi ${tradesmanName || 'there'},</p>
          <p>Your counter quote has been submitted successfully and the customer has been notified.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Counter Quote Details</h3>
            <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
            <p><strong>Original Quote ID:</strong> ${originalQuoteId}</p>
            <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>New Quote Amount:</strong> $${Number(counterQuoteAmount).toFixed(2)}</p>
            <p><strong>Valid Until:</strong> ${validUntil || 'Not specified'}</p>
            ${reasonForCounter ? `<p><strong>Reason Provided:</strong> ${reasonForCounter}</p>` : ''}
          </div>
          
          <div style="background:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #f59e0b;">
            <h3 style="margin-top:0;color:#92400e;">What Happens Next</h3>
            <p style="color:#92400e;">The customer will review your counter quote and may:</p>
            <ul style="color:#92400e;">
              <li>Accept the new offer</li>
              <li>Request further adjustments</li>
              <li>Decline the counter quote</li>
            </ul>
            <p style="color:#92400e;">You will be notified of their decision.</p>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            If you need to make any changes, please contact the admin team.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: tradesmanEmail,
        subject: tradesmanSubject,
        html: tradesmanHtml,
        attachments: attachments
      });
      
      console.log('✅ Tradesman counter quote confirmation sent with attachment');

      // 3. Send admin notification email with counter quote attachment
      const adminSubject = `Counter Quote Submitted - ${leadData?.customerName || 'Unknown Customer'}`;
      
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Counter Quote Notification</h2>
          <p>A tradesman has submitted a counter quote for a declined original quote.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Counter Quote Summary</h3>
            <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
            <p><strong>Original Quote ID:</strong> ${originalQuoteId}</p>
            <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>Tradesman:</strong> ${tradesmanName || 'Not provided'}</p>
            <p><strong>Tradesman Email:</strong> ${tradesmanEmail}</p>
            <p><strong>Original Amount:</strong> $${Number(originalQuoteData?.quoteAmount || 0).toFixed(2)}</p>
            <p><strong>New Amount:</strong> $${Number(counterQuoteAmount).toFixed(2)}</p>
            <p><strong>Difference:</strong> $${(Number(counterQuoteAmount) - Number(originalQuoteData?.quoteAmount || 0)).toFixed(2)}</p>
            <p><strong>Valid Until:</strong> ${validUntil || 'Not specified'}</p>
            ${reasonForCounter ? `<p><strong>Reason for Counter:</strong> ${reasonForCounter}</p>` : ''}
          </div>
          
          <div style="background:#e0f2fe;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #0288d1;">
            <h3 style="margin-top:0;color:#01579b;">Status</h3>
            <p style="color:#01579b;">✅ Counter quote submitted successfully</p>
            <p style="color:#01579b;">📧 Customer and tradesman notified</p>
            <p style="color:#01579b;">⏳ Awaiting customer decision</p>
          </div>
          
          <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
            <h3 style="margin-top:0;color:#065f46;">Actions</h3>
            <p style="color:#065f46;">
              <a href="${onlineQuoteUrl}" style="color:#10b981;">View counter quote online</a> | 
              <a href="${acceptUrl}" style="color:#10b981;">Accept counter quote</a> | 
              <a href="${declineUrl}" style="color:#ef4444;">Decline counter quote</a>
            </p>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            This is an automated notification from the Kiwi Trade system.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com', // Admin email
        subject: adminSubject,
        html: adminHtml,
        attachments: attachments
      });
      
      console.log('✅ Admin counter quote notification sent with attachment');

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Counter quote submitted successfully',
      counterQuoteId,
      details: {
        customerEmailSent: !!leadData?.customerEmail,
        tradesmanEmailSent: true,
        adminEmailSent: true,
        sheetsUpdated: true
      }
    });

  } catch (error) {
    console.error('❌ Counter quote error:', error);
    res.status(500).json({
      error: 'Failed to submit counter quote',
      details: error.message
    });
  }
}

async function saveCounterQuote(counterQuoteData) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      throw new Error('Google Sheets credentials not found');
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

    // Get available sheets
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Use 'Counter Quotes' sheet or create it
    let targetSheet = 'Counter Quotes';
    if (!availableSheets.includes('Counter Quotes')) {
      // Create the Counter Quotes sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: 'Counter Quotes'
              }
            }
          }]
        }
      });
    }

    // Prepare data for saving
    const values = [[
      counterQuoteData.timestamp, // Timestamp
      counterQuoteData.counterQuoteId, // Counter Quote ID
      counterQuoteData.originalQuoteId, // Original Quote ID
      counterQuoteData.leadId, // Lead ID
      counterQuoteData.tradesmanName, // Tradesman Name
      counterQuoteData.tradesmanEmail, // Tradesman Email
      counterQuoteData.tradesmanPhone, // Tradesman Phone
      counterQuoteData.counterQuoteAmount, // Counter Quote Amount
      counterQuoteData.labourRate, // Labour Rate
      counterQuoteData.labourHours, // Labour Hours
      counterQuoteData.labourSubtotal, // Labour Subtotal
      counterQuoteData.materialRate, // Material Rate
      counterQuoteData.materialSQM, // Material SQM
      counterQuoteData.materialSubtotal, // Material Subtotal
      counterQuoteData.installationAmount, // Installation Amount
      counterQuoteData.installationSubtotal, // Installation Subtotal
      counterQuoteData.breakdown, // Breakdown
      counterQuoteData.notes, // Notes
      counterQuoteData.validUntil, // Valid Until
      counterQuoteData.reasonForCounter, // Reason for Counter Quote
      counterQuoteData.status, // Status
      counterQuoteData.onlineQuoteUrl, // Online Quote URL
      counterQuoteData.acceptUrl, // Accept URL
      counterQuoteData.declineUrl // Decline URL
    ]];

    // Save to Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('✅ Counter quote saved to Google Sheets');

  } catch (error) {
    console.error('Error saving counter quote:', error);
    throw error;
  }
}

async function fetchLeadData(leadId) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
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

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    let targetSheet = 'Sheet1';
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    const leadIdIndex = 1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowLeadId = row[leadIdIndex];
      
      if (rowLeadId === leadId) {
        return {
          timestamp: row[0] || '',
          leadId: row[1] || '',
          customerName: row[2] || '',
          customerEmail: row[3] || '',
          customerPhone: row[4] || '',
          selectedService: row[5] || '',
          projectDetails: row[6] || '',
          projectSize: row[7] || '',
          budget: row[8] || '',
          timeline: row[9] || '',
          location: row[10] || '',
          specificDetails: row[11] || '',
          status: row[14] || 'New'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching lead data:', error);
    return null;
  }
}

async function fetchQuoteData(quoteId) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
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

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    let targetSheet = 'Sheet1';
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === quoteId) {
          return {
            timestamp: row[0] || '',
            quoteId: cellValue,
            leadId: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            tradesmanName: '',
            tradesmanEmail: '',
            tradesmanPhone: '',
            serviceType: '',
            projectDetails: '',
            projectSize: '',
            location: '',
            budget: '',
            timeline: '',
            specificDetails: '',
            quoteAmount: '',
            labourRate: '',
            labourHours: '',
            labourSubtotal: '',
            materialRate: '',
            materialSQM: '',
            materialSubtotal: '',
            installationAmount: '',
            installationSubtotal: '',
            breakdown: '',
            notes: '',
            validUntil: '',
            status: 'Pending',
            onlineQuoteUrl: '',
            acceptUrl: '',
            declineUrl: ''
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching quote data:', error);
    return null;
  }
}

// Function to check if a counter quote already exists for an original quote
async function checkExistingCounterQuote(originalQuoteId) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return false;
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

    // Get available sheets
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Use 'Counter Quotes' sheet if it exists
    if (!availableSheets.includes('Counter Quotes')) {
      return false; // No counter quotes sheet exists yet
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Counter Quotes!A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return false;
    }

    // Check if any counter quote exists for this original quote ID
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[2] === originalQuoteId) { // Original Quote ID is in column C (index 2)
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking existing counter quote:', error);
    return false;
  }
}

// Function to generate counter quote PDF buffer
async function generateCounterQuotePdfBuffer({ leadId, token, counterQuoteId, counterQuoteData }) {
  try {
    // Get lead data
    const leadData = await fetchLeadData(leadId);
    if (!leadData) {
      throw new Error('Lead not found');
    }

    // Generate HTML content for counter quote using the same template as regular quotes
    const htmlContent = generateCounterQuotePdfContent(leadData, counterQuoteData);
    
    // Return HTML content as buffer for email attachments
    const buffer = Buffer.from(htmlContent, 'utf8');
    return buffer;
  } catch (error) {
    console.error('Error generating counter quote document buffer:', error);
    throw error;
  }
}

// Function to generate counter quote PDF content (HTML)
function generateCounterQuotePdfContent(leadData, counterQuoteData) {
  // Generate professional counter quote HTML matching the regular quote format
  const quoteNumber = counterQuoteData?.counterQuoteId || `COUNTER-${Date.now()}`;
  const currentDate = new Date().toLocaleDateString('en-GB');
  
  // Use custom valid until date if provided, otherwise default to 30 days
  let validUntil;
  if (counterQuoteData?.validUntil) {
    validUntil = new Date(counterQuoteData.validUntil).toLocaleDateString('en-GB');
  } else {
    validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
  }
  
  // Use counter quote data for amounts
  const materials = coerceNumeric(counterQuoteData.materialSubtotal);
  const labor = coerceNumeric(counterQuoteData.labourSubtotal);
  const installation = coerceNumeric(counterQuoteData.installationSubtotal);
  const total = coerceNumeric(counterQuoteData.counterQuoteAmount);
  
  const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Counter Quote - ${leadData.customerName}</title>
         <style>
         body { 
             font-family: Arial, sans-serif; 
             margin: 15px; 
             line-height: 1.4;
             color: #333;
             font-size: 12px;
         }
         .header { 
             text-align: center; 
             border-bottom: 2px solid #2c3e50; 
             padding-bottom: 10px; 
             margin-bottom: 15px; 
         }
         .company-name {
             font-size: 20px;
             font-weight: bold;
             color: #2c3e50;
             margin-bottom: 3px;
         }
         .quote-title {
             font-size: 18px;
             font-weight: bold;
             color: #34495e;
             margin-bottom: 8px;
         }
         .quote-info {
             display: flex;
             justify-content: space-between;
             margin-bottom: 15px;
             flex-wrap: wrap;
             gap: 10px;
         }
         .customer-details, .tradesman-details {
             flex: 1;
             min-width: 250px;
             margin-bottom: 10px;
         }
         .details-title {
             font-size: 14px;
             font-weight: bold;
             color: #2c3e50;
             border-bottom: 1px solid #3498db;
             padding-bottom: 3px;
             margin-bottom: 8px;
         }
         .detail-row {
             margin: 4px 0;
             display: flex;
             font-size: 11px;
         }
         .detail-label {
             font-weight: bold;
             width: 80px;
             flex-shrink: 0;
         }
         .detail-value {
             flex: 1;
         }
         .breakdown-section {
             margin: 15px 0;
         }
         .breakdown-title {
             font-size: 16px;
             font-weight: bold;
             color: #2c3e50;
             margin-bottom: 8px;
         }
         .breakdown-table {
             width: 100%;
             border-collapse: collapse;
             margin-bottom: 10px;
             font-size: 11px;
         }
         .breakdown-table th {
             background-color: #34495e;
             color: white;
             padding: 6px;
             text-align: left;
             font-weight: bold;
             font-size: 11px;
         }
         .breakdown-table td {
             padding: 6px;
             border-bottom: 1px solid #ddd;
             font-size: 11px;
         }
         .breakdown-table tr:nth-child(even) {
             background-color: #f8f9fa;
         }
         .total-section {
             text-align: right;
             margin: 10px 0;
         }
         .total-amount {
             font-size: 18px;
             font-weight: bold;
             color: #27ae60;
         }
         .notes-section {
             margin: 15px 0;
         }
         .notes-title {
             font-size: 14px;
             font-weight: bold;
             color: #2c3e50;
             margin-bottom: 5px;
         }
         .footer {
             margin-top: 20px;
             text-align: center;
             padding: 10px;
             background-color: #f8f9fa;
             border-radius: 4px;
             font-size: 10px;
         }
         .footer-text {
             font-size: 10px;
             color: #666;
             margin: 2px 0;
         }
         .counter-reason {
             background-color: #fef3c7;
             border: 1px solid #f59e0b;
             padding: 10px;
             border-radius: 4px;
             margin: 15px 0;
         }
         .counter-reason h4 {
             margin: 0 0 5px 0;
             color: #92400e;
             font-size: 12px;
         }
         @media print {
             body { 
                 margin: 10px; 
                 font-size: 11px;
             }
             .header { 
                 margin-bottom: 10px; 
                 padding-bottom: 8px;
             }
             .company-name { font-size: 18px; }
             .quote-title { font-size: 16px; }
             .quote-info { margin-bottom: 10px; }
             .details-title { font-size: 12px; margin-bottom: 5px; }
             .detail-row { margin: 2px 0; font-size: 10px; }
             .breakdown-section { margin: 10px 0; }
             .breakdown-title { font-size: 14px; margin-bottom: 5px; }
             .breakdown-table { margin-bottom: 8px; }
             .breakdown-table th, .breakdown-table td { 
                 padding: 4px; 
                 font-size: 10px; 
             }
             .total-amount { font-size: 16px; }
             .notes-section { margin: 10px 0; }
             .notes-title { font-size: 12px; margin-bottom: 3px; }
             .footer { 
                 margin-top: 15px; 
                 padding: 8px; 
                 font-size: 9px; 
             }
             .footer-text { font-size: 9px; margin: 1px 0; }
         }
     </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Kiwi Trade</div>
        <div class="quote-title">COUNTER QUOTE</div>
        <div style="display: flex; justify-content: space-between; max-width: 600px; margin: 0 auto;">
            <div><strong>Counter Quote Number:</strong> ${quoteNumber}</div>
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
                <span class="detail-value">${counterQuoteData?.tradesmanName || 'Kiwi Underfloor Heating'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${counterQuoteData?.tradesmanEmail || 'info@kiwitrade.co.nz'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${counterQuoteData?.tradesmanPhone || '021 123 456'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${leadData.selectedService || 'Underfloor Heating'}</span>
            </div>
        </div>
    </div>
    
    ${counterQuoteData?.reasonForCounter ? `
    <div class="counter-reason">
        <h4>Reason for Counter Quote</h4>
        <p>${counterQuoteData.reasonForCounter}</p>
    </div>
    ` : ''}
    
    <div class="breakdown-section">
        <div class="breakdown-title">Counter Quote Breakdown</div>
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
                    <td>$${coerceNumeric(counterQuoteData.materialRate).toFixed(2)} per SQM</td>
                    <td>${coerceNumeric(counterQuoteData.materialSQM).toFixed(1)} SQM</td>
                    <td>$${materials.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${labor > 0 ? `
                <tr>
                    <td>Labor</td>
                    <td>Professional installation services</td>
                    <td>$${coerceNumeric(counterQuoteData.labourRate).toFixed(2)} per hour</td>
                    <td>${coerceNumeric(counterQuoteData.labourHours).toFixed(1)} hours</td>
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
    
    ${counterQuoteData?.notes ? `
    <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <p>${counterQuoteData.notes}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <div class="footer-text">Kiwi Trade</div>
        <div class="footer-text">Professional underfloor heating solutions for your home</div>
        <div class="footer-text">This counter quote was generated using our automated system</div>
        <div class="footer-text">Thank you for choosing Kiwi Trade!</div>
        <div class="footer-text" style="margin-top: 15px; font-size: 12px;">Lead ID: ${leadData.leadId}</div>
        <div class="footer-text" style="font-size: 12px;">Original Quote ID: ${counterQuoteData.originalQuoteId}</div>
    </div>
</body>
</html>
  `;
  
  return content;
}
