import nodemailer from 'nodemailer';
import { google } from 'googleapis';

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

    // Generate counter quote ID
    const counterQuoteId = `COUNTER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save counter quote to Google Sheets
    try {
      await saveCounterQuote({
        counterQuoteId,
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
      });
      console.log('✅ Counter quote saved to Google Sheets');
    } catch (saveError) {
      console.error('❌ Failed to save counter quote:', saveError.message);
      return res.status(500).json({ error: 'Failed to save counter quote' });
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

      // 1. Send customer notification email
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
                <li>Accept the new offer</li>
                <li>Request further adjustments</li>
                <li>Decline and look for other options</li>
              </ul>
            </div>
            
            <p style="margin-top:20px;color:#6b7280;">
              If you have any questions, please don't hesitate to contact us at info@kiwitrade.co.nz
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
          html: customerHtml
        });
        
        console.log('✅ Customer counter quote notification sent');
      }

      // 2. Send tradesman confirmation email
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
        html: tradesmanHtml
      });
      
      console.log('✅ Tradesman counter quote confirmation sent');

      // 3. Send admin notification email
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
          
          <p style="margin-top:20px;color:#6b7280;">
            This is an automated notification from the Kiwi Trade system.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com', // Admin email
        subject: adminSubject,
        html: adminHtml
      });
      
      console.log('✅ Admin counter quote notification sent');

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
      new Date().toISOString(), // Timestamp
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
      'Pending' // Status
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
