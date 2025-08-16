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

  try {
    const { quoteId, leadId, token, action } = req.query;
    if (!quoteId || !leadId || !['accept','decline'].includes(action)) {
      return res.status(400).send('Invalid request');
    }

    if (!token) {
      console.warn('quote-decision: missing token', { quoteId, leadId, action });
      // Optionally enforce token later when you're ready
    }

    console.log(`🔍 Quote decision received: ${action} for quote ${quoteId}, lead ${leadId}`);

    // Fetch quote data to get tradesman email and other details
    console.log('🔍 Fetching quote data for:', quoteId);
    const quoteData = await fetchQuoteData(quoteId);
    console.log('📋 Quote data result:', quoteData ? 'Found' : 'Not found');
    
    console.log('🔍 Fetching lead data for:', leadId);
    const leadData = await fetchLeadData(leadId);
    console.log('📋 Lead data result:', leadData ? 'Found' : 'Not found');
    
    if (!quoteData) {
      console.error('❌ Quote not found:', quoteId);
      return res.status(404).send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Quote Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .error { background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }
            .debug { background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px; font-family: monospace; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">KIWI UNDERFLOOR HEATING</div>
          </div>
          <div class="error">
            <h2>Quote Not Found</h2>
            <p>The quote you're trying to access could not be found in our system.</p>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Action:</strong> ${action}</p>
          </div>
          <div class="debug">
            <strong>Debug Information:</strong><br>
            Quote ID: ${quoteId}<br>
            Lead ID: ${leadId}<br>
            Action: ${action}<br>
            <br>
            <a href="/debug-quote-decision.html" target="_blank">Click here to debug this issue</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check if a decision has already been made
    const currentStatus = quoteData.status || 'Pending';
    if (currentStatus === 'Accepted' || currentStatus === 'Declined') {
      console.log(`⚠️ Quote ${quoteId} already has a decision: ${currentStatus}`);
      
      const originalDecision = currentStatus === 'Accepted' ? 'accept' : 'decline';
      const title = currentStatus === 'Accepted' ? 'Quote Already Accepted' : 'Quote Already Declined';
      const msg = currentStatus === 'Accepted' 
        ? 'This quote has already been accepted. No further action is needed.'
        : 'This quote has already been declined. No further action is needed.';

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #${originalDecision === 'accept' ? '#10b981' : '#ef4444'}; }
            .status { text-align: center; margin-top: 20px; padding: 15px; background: #${originalDecision === 'accept' ? 'd1fae5' : 'fee2e2'}; border-radius: 6px; color: #${originalDecision === 'accept' ? '065f46' : '991b1b'}; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">KIWI UNDERFLOOR HEATING</div>
          </div>
          <div class="warning">
            <strong>⚠️ Decision Already Made</strong><br>
            This quote has already been ${currentStatus.toLowerCase()}. Decisions are final and cannot be changed.
          </div>
          <div class="message">
            <h2>${title}</h2>
            <p>${msg}</p>
          </div>
          <div class="status">
            <strong>Status:</strong> ${currentStatus === 'Accepted' ? '✅ Already Accepted' : '❌ Already Declined'}
          </div>
          <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            Thank you for using Kiwi Trade services.
          </p>
        </body>
        </html>
      `);
      return;
    }

    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let adminEmailSent = false;
    let statusUpdated = false;

    // Update quote status in Google Sheets
    try {
      await updateQuoteStatus(quoteId, action === 'accept' ? 'Accepted' : 'Declined');
      statusUpdated = true;
      console.log('✅ Quote status updated in Google Sheets');
    } catch (updateError) {
      console.error('❌ Failed to update quote status:', updateError.message);
    }

    // Send emails based on the decision
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // 1. Send customer confirmation email
      if (leadData && leadData.customerEmail) {
        const customerSubject = action === 'accept' 
          ? 'Quote Accepted - Thank You!' 
          : 'Quote Decision Recorded';
        
        const customerMessage = action === 'accept'
          ? `Thank you for accepting our quote! Your decision has been recorded and the tradesman has been notified that you want to continue with the job. We will be in touch shortly to discuss next steps and scheduling.`
          : `Thank you for letting us know about your decision. Your quote decline has been recorded. We appreciate you considering our services and hope to work with you in the future.`;

        const customerHtml = `
          <div style="font-family: Arial, sans-serif; color:#1f2937;">
            <h2>${customerSubject}</h2>
            <p>Hi ${leadData.customerName || 'there'},</p>
            <p>${customerMessage}</p>
            
            <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
              <h3 style="margin-top:0;">Quote Details</h3>
              <p><strong>Quote ID:</strong> ${quoteId}</p>
              <p><strong>Service:</strong> ${quoteData.serviceType || leadData.selectedService || 'Underfloor Heating'}</p>
              <p><strong>Location:</strong> ${quoteData.location || leadData.location || 'Not specified'}</p>
              <p><strong>Quote Amount:</strong> $${Number(quoteData.quoteAmount || 0).toFixed(2)}</p>
              <p><strong>Decision:</strong> ${action === 'accept' ? 'Accepted' : 'Declined'}</p>
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
        
        console.log('✅ Customer decision email sent successfully');
        customerEmailSent = true;
      }

      // 2. Send tradesman notification email
      const tradesmanEmail = quoteData.tradesmanEmail || 'quangbui0600@gmail.com';
      const tradesmanSubject = action === 'accept' 
        ? 'Great News! Customer Accepted Your Quote' 
        : 'Customer Decision: Quote Declined';
      
      const tradesmanMessage = action === 'accept'
        ? `Excellent news! The customer has accepted your quote and wants to proceed with the job. Please contact them as soon as possible to discuss scheduling and next steps.`
        : `The customer has declined the quote. While this is disappointing, it's part of the business. Keep up the great work and focus on your next opportunities.`;

      const tradesmanHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>${tradesmanSubject}</h2>
          <p>Hi ${quoteData.tradesmanName || 'there'},</p>
          <p>${tradesmanMessage}</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Project Details</h3>
            <p><strong>Customer:</strong> ${quoteData.customerName || leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${quoteData.customerEmail || leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>Customer Phone:</strong> ${quoteData.customerPhone || leadData?.customerPhone || 'Not provided'}</p>
            <p><strong>Service:</strong> ${quoteData.serviceType || leadData?.selectedService || 'Underfloor Heating'}</p>
            <p><strong>Location:</strong> ${quoteData.location || leadData?.location || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${Number(quoteData.quoteAmount || 0).toFixed(2)}</p>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Customer Decision:</strong> ${action === 'accept' ? 'Accepted' : 'Declined'}</p>
          </div>
          
          ${action === 'accept' ? `
          <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
            <h3 style="margin-top:0;color:#065f46;">Next Steps</h3>
            <p style="color:#065f46;">Please contact the customer within 24 hours to:</p>
            <ul style="color:#065f46;">
              <li>Confirm the acceptance</li>
              <li>Discuss scheduling and timeline</li>
              <li>Arrange site visit if needed</li>
              <li>Discuss payment terms</li>
            </ul>
          </div>
          ` : ''}
          
          <p style="margin-top:20px;color:#6b7280;">
            If you need any assistance, please contact the admin team.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: tradesmanEmail,
        subject: tradesmanSubject,
        html: tradesmanHtml
      });
      
      console.log('✅ Tradesman notification email sent successfully');
      tradesmanEmailSent = true;

      // 3. Send admin notification email
      const adminSubject = `Quote ${action === 'accept' ? 'Accepted' : 'Declined'} - ${quoteData.customerName || leadData?.customerName || 'Unknown Customer'}`;
      
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Quote Decision Notification</h2>
          <p>A customer has made a decision on their quote.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Decision Summary</h3>
            <p><strong>Customer:</strong> ${quoteData.customerName || leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${quoteData.customerEmail || leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>Customer Phone:</strong> ${quoteData.customerPhone || leadData?.customerPhone || 'Not provided'}</p>
            <p><strong>Tradesman:</strong> ${quoteData.tradesmanName || 'Not provided'}</p>
            <p><strong>Tradesman Email:</strong> ${quoteData.tradesmanEmail || 'Not provided'}</p>
            <p><strong>Service:</strong> ${quoteData.serviceType || leadData?.selectedService || 'Underfloor Heating'}</p>
            <p><strong>Location:</strong> ${quoteData.location || leadData?.location || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${Number(quoteData.quoteAmount || 0).toFixed(2)}</p>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Decision:</strong> <span style="color:${action === 'accept' ? '#10b981' : '#ef4444'};font-weight:bold;">${action === 'accept' ? 'ACCEPTED' : 'DECLINED'}</span></p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
          </div>
          
          <div style="background:#${action === 'accept' ? 'd1fae5' : 'fee2e2'};padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #${action === 'accept' ? '10b981' : 'ef4444'};">
            <h3 style="margin-top:0;color:#${action === 'accept' ? '065f46' : '991b1b'};">Status</h3>
            <p style="color:#${action === 'accept' ? '065f46' : '991b1b'};">
              ${action === 'accept' 
                ? '✅ Customer accepted the quote. Tradesman has been notified to follow up.' 
                : '❌ Customer declined the quote. No further action required.'}
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
        html: adminHtml
      });
      
      console.log('✅ Admin notification email sent successfully');
      adminEmailSent = true;

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
    }

    const title = action === 'accept' ? 'Quote Accepted' : 'Quote Declined';
    const msg = action === 'accept'
      ? 'Thanks! We have recorded your acceptance. We will be in touch shortly.'
      : 'Thanks for letting us know. We have recorded your decision.';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
          .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #${action === 'accept' ? '10b981' : 'ef4444'}; }
          .status { text-align: center; margin-top: 20px; padding: 15px; background: #${action === 'accept' ? 'd1fae5' : 'fee2e2'}; border-radius: 6px; color: #${action === 'accept' ? '065f46' : '991b1b'}; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">KIWI UNDERFLOOR HEATING</div>
        </div>
        <div class="message">
          <h2>${title}</h2>
          <p>${msg}</p>
        </div>
        <div class="status">
          <strong>Status:</strong> ${action === 'accept' ? '✅ Accepted' : '❌ Declined'}
        </div>
        <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          Thank you for using Kiwi Trade services.
        </p>
      </body>
      </html>
    `);

  } catch (e) {
    console.error('❌ Quote decision error:', e);
    res.status(500).send('Server error');
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
      
      console.log(`🔍 Checking row ${i + 1}: quoteId = "${rowQuoteId}" vs "${quoteId}"`);
      
      if (rowQuoteId === quoteId) {
        console.log(`✅ Found quote in row ${i + 1}`);
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
    
    console.log(`❌ Quote ID "${quoteId}" not found in any row`);
    console.log('🔍 Available quote IDs in sheet:', rows.slice(1, 6).map(row => row[quoteIdIndex]).filter(id => id));

    return null;
  } catch (error) {
    console.error('Error fetching quote data:', error);
    return null;
  }
}

async function updateQuoteStatus(quoteId, status) {
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return;
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

    // Read all data to find the row with the matching quoteId
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet');
      return;
    }

    // Find the row with the matching quoteId (second column)
    const quoteIdIndex = 1; // Quote ID is the second column (B)
    let targetRow = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowQuoteId = row[quoteIdIndex];
      
      if (rowQuoteId === quoteId) {
        targetRow = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (targetRow === -1) {
      console.log(`Quote ID ${quoteId} not found in sheet`);
      return;
    }

    // Status is in column 29 (AC) - 0-indexed is 28
    const statusColumn = 29; // Column AC

    // Update the status in the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!${String.fromCharCode(64 + statusColumn)}${targetRow}`, // Convert to column letter
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[status]]
      }
    });

    console.log(`✅ Updated quote status to "${status}" for quote ${quoteId} at row ${targetRow}`);

  } catch (error) {
    console.error('Error updating quote status:', error);
    throw error; // Re-throw to be caught by the caller
  }
}
