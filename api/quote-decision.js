import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  try {
    const { quoteId, leadId, token, action } = req.query;
    if (!quoteId || !leadId || !token || !['accept','decline'].includes(action)) {
      return res.status(400).send('Invalid request');
    }

    console.log(`🔍 Quote decision received: ${action} for quote ${quoteId}, lead ${leadId}`);

    // TODO: verify token (HMAC) for leadId/quoteId here
    // await verifyToken({ leadId, token });

    // TODO: Update status in your storage (Sheet/DB)
    // await setQuoteStatus({ quoteId, leadId, status: action === 'accept' ? 'ACCEPTED' : 'DECLINED' });

    // Fetch lead data to get customer and project details
    const leadData = await fetchLeadData(leadId);
    
    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let adminEmailSent = false;

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
              <p><strong>Service:</strong> ${leadData.selectedService || 'Underfloor Heating'}</p>
              <p><strong>Location:</strong> ${leadData.location || 'Not specified'}</p>
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
      const tradesmanSubject = action === 'accept' 
        ? 'Great News! Customer Accepted Your Quote' 
        : 'Customer Decision: Quote Declined';
      
      const tradesmanMessage = action === 'accept'
        ? `Excellent news! The customer has accepted your quote and wants to proceed with the job. Please contact them as soon as possible to discuss scheduling and next steps.`
        : `The customer has declined the quote. While this is disappointing, it's part of the business. Keep up the great work and focus on your next opportunities.`;

      const tradesmanHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>${tradesmanSubject}</h2>
          <p>Hi there,</p>
          <p>${tradesmanMessage}</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Project Details</h3>
            <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>Customer Phone:</strong> ${leadData?.customerPhone || 'Not provided'}</p>
            <p><strong>Service:</strong> ${leadData?.selectedService || 'Underfloor Heating'}</p>
            <p><strong>Location:</strong> ${leadData?.location || 'Not specified'}</p>
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
        to: 'quangbui0600@gmail.com', // Tradesman email
        subject: tradesmanSubject,
        html: tradesmanHtml
      });
      
      console.log('✅ Tradesman notification email sent successfully');
      tradesmanEmailSent = true;

      // 3. Send admin notification email
      const adminSubject = `Quote ${action === 'accept' ? 'Accepted' : 'Declined'} - ${leadData?.customerName || 'Unknown Customer'}`;
      
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Quote Decision Notification</h2>
          <p>A customer has made a decision on their quote.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Decision Summary</h3>
            <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>Customer Phone:</strong> ${leadData?.customerPhone || 'Not provided'}</p>
            <p><strong>Service:</strong> ${leadData?.selectedService || 'Underfloor Heating'}</p>
            <p><strong>Location:</strong> ${leadData?.location || 'Not specified'}</p>
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

    const { google } = await import('googleapis');
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
