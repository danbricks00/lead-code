export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      leadId,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      projectDetails,
      projectSize,
      location,
      budget,
      timeline,
      specificDetails,
      quoteAmount,
      breakdown,
      notes
    } = req.body;

    console.log('📋 Quote submission received:', {
      leadId,
      tradesmanName,
      customerName,
      serviceType,
      quoteAmount
    });

    // Validate required fields
    if (!leadId || !tradesmanName || !tradesmanEmail || !customerName || !customerEmail || !quoteAmount) {
      return res.status(400).json({
        error: 'Missing required fields: leadId, tradesmanName, tradesmanEmail, customerName, customerEmail, quoteAmount'
      });
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      return res.status(500).json({ 
        error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
      });
    }

    // Import required modules
    const { google } = await import('googleapis');
    const nodemailer = await import('nodemailer');
    const { generateQuotePdfBuffer, coerceNumeric } = await import('./quote-utils.js');

    // Gamified status renderer function
    function renderStatus(stage) {
      const baseStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;";
      const checkStyle = "color: #28a745; font-weight: bold;";
      const pendingStyle = "color: #ffc107; font-weight: bold;";
      const crossStyle = "color: #dc3545; font-weight: bold;";
      
      let statusHtml = `<div style="${baseStyle}">`;
      statusHtml += `<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>`;
      
      switch(stage) {
        case "lead":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Quote</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
          break;
        case "quote":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
          break;
        case "accepted":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Accepted</p>`;
          break;
        case "declined":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${crossStyle}">✘</span> Quote Declined</p>`;
          break;
      }
      
      statusHtml += `</div>`;
      return statusHtml;
    }

    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';

    // STRICT: Check if this tradesman has already submitted a quote for this lead
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.error('❌ Missing Google Sheets configuration - cannot validate duplicate quotes');
      return res.status(500).json({
        error: 'System configuration error. Please contact support.'
      });
    }

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
        range: 'Quotes!A:T',
      });

      const rows = response.data.values || [];
      console.log('🔍 Checking for duplicate quotes. Total rows:', rows.length);
      console.log('🔍 Looking for:', { leadId, tradesmanEmail });
      
      const existingQuotes = rows.filter(row => 
        row[1] === leadId && // leadId column (B)
        row[13] === tradesmanEmail // tradesmanEmail column (M)
      );

      if (existingQuotes.length > 0) {
        const existingQuote = existingQuotes[0];
        const quoteStatus = existingQuote[6] || 'Pending'; // status column (G)
        
        // Allow resubmission only if previous quote was rejected
        if (quoteStatus !== 'Rejected') {
          console.log('❌ Quote already exists and is not rejected:', { leadId, tradesmanEmail, quoteStatus });
          return res.status(409).json({
            success: false,
            error: `You have already submitted a quote for this lead (Status: ${quoteStatus}). Only one quote per tradesperson is allowed unless the previous quote was rejected.`
          });
        }

        // If this is a resubmission after rejection, update the existing row instead of creating new one
        console.log(`🔄 Tradesperson ${tradesmanEmail} resubmitting quote for lead ${leadId} after rejection`);
        
        const quoteRowIndex = rows.findIndex(row => 
          row[1] === leadId && row[13] === tradesmanEmail
        );

        const updatedRow = [
          new Date().toISOString(), // Timestamp
          leadId, // LeadId
          customerName, // CustomerName
          serviceType, // Service
          quoteAmount, // QuoteAmount
          projectDetails, // Details
          'Pending', // Status (reset to pending for admin review)
          timeline, // Timeline
          location?.area || '', // Area
          location?.suburb || '', // Suburb
          budget, // Budget
          specificDetails, // SpecificDetails
          tradesmanName, // TradesmanName
          tradesmanEmail, // TradesmanEmail
          tradesmanPhone || '', // TradesmanPhone
          projectSize, // ProjectSize
          breakdown, // Breakdown
          notes || '', // Notes
          req.body.companyName || '', // CompanyName
          '', // Admin approval timestamp (clear)
          '', // Admin who approved (clear)
          '' // Rejection reason (clear)
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: `Quotes!A${quoteRowIndex + 1}:Z${quoteRowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [updatedRow]
          }
        });

        console.log(`✅ Quote resubmitted for lead ${leadId} - Awaiting admin review`);

        // Send notification to admin about resubmitted quote
        const adminResubmitSubject = `🔄 Quote Resubmitted for Review - ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
        const adminResubmitHtml = `
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin: 20px 0;">Quote Resubmitted After Rejection</h2>
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
              <p><strong>Quote ID:</strong> ${leadId || 'N/A'}</p>
              <p><strong>Customer:</strong> ${customerName || 'Customer'}</p>
              <p><strong>Service:</strong> ${serviceType || 'Not specified'}</p>
              <p><strong>Quote Amount:</strong> $${quoteAmount || '0'}</p>
              <p><strong>Tradesperson:</strong> ${tradesmanName || 'Tradesperson'}</p>
              <p><strong>Status:</strong> Pending Review (Resubmitted)</p>
              <p><strong>Previous Status:</strong> Rejected</p>
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${SITE_URL}/admin-quote-review.html" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Resubmitted Quote</a>
            </div>
          </div>
        `;

        console.log("📧 Built resubmission email template: admin");

        if (process.env.ADMIN_EMAIL) {
          try {
            console.log(`📤 Sending admin resubmission notification email to: ${process.env.ADMIN_EMAIL}`);
            const adminResult = await transporter.sendMail({
              from: process.env.GMAIL_USER,
              to: process.env.ADMIN_EMAIL,
              subject: adminResubmitSubject,
              html: adminResubmitHtml
            });
            console.log(`✅ Email sent to admin, msgId: ${adminResult.messageId}`);
          } catch (error) {
            console.error(`❌ Email failed to admin: ${error.message}`);
          }
        } else {
          console.log("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
        }

        // Send confirmation to tradesperson that resubmitted quote is under review
        const tradespersonResubmitSubject = `🔄 Quote Resubmitted for Review - ${leadId || 'N/A'}`;
        const tradespersonResubmitHtml = `
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin: 20px 0;">Quote Resubmitted Successfully</h2>
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
              <p>Hi ${tradesmanName || 'there'},</p>
              <p>Your revised quote for ${customerName || 'the customer'} has been resubmitted and is now awaiting admin review.</p>
              <p><strong>Quote Details:</strong></p>
              <ul>
                <li><strong>Quote ID:</strong> ${leadId || 'N/A'}</li>
                <li><strong>Customer:</strong> ${customerName || 'Customer'}</li>
                <li><strong>Service:</strong> ${serviceType || 'Not specified'}</li>
                <li><strong>Amount:</strong> $${quoteAmount || '0'}</li>
              </ul>
              <p>You will be notified once the quote has been reviewed and approved.</p>
            </div>
          </div>
        `;

        console.log("📧 Built resubmission email template: tradesperson");

        try {
          console.log(`📤 Sending tradesperson resubmission email to: ${tradesmanEmail}`);
          const tradespersonResult = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: tradesmanEmail,
            subject: tradespersonResubmitSubject,
            html: tradespersonResubmitHtml
          });
          console.log(`✅ Email sent to tradesperson, msgId: ${tradespersonResult.messageId}`);
        } catch (error) {
          console.error(`❌ Email failed to tradesperson: ${error.message}`);
        }

        console.log(`📧 Quote resubmission notifications sent for lead ${leadId}`);

        return res.json({ 
          success: true, 
          message: 'Quote resubmitted successfully and sent for admin review',
          leadId,
          isResubmission: true
        });
      }
      
      // Save quote to Google Sheets
      const quoteRow = [
        new Date().toISOString(), // Timestamp
        leadId, // LeadId
        customerName, // CustomerName
        serviceType, // Service
        quoteAmount, // QuoteAmount
        projectDetails, // Details
        'Pending', // Status
        timeline, // Timeline
        location?.area || '', // Area
        location?.suburb || '', // Suburb
        budget, // Budget
        specificDetails, // SpecificDetails
        tradesmanName, // TradesmanName
        tradesmanEmail, // TradesmanEmail
        tradesmanPhone || '', // TradesmanPhone
        projectSize, // ProjectSize
        breakdown, // Breakdown
        notes || '', // Notes
        req.body.companyName || '' // CompanyName
      ];

      // Append to Quotes sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'Quotes!A:Z',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [quoteRow]
        }
      });

      console.log(`✅ Quote saved for lead ${leadId} - Awaiting admin review`);

      // Send notification to admin about new quote for review
      const adminNewQuoteSubject = `📋 New Quote for Review - ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
      const adminNewQuoteHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; margin: 20px 0;">New Quote Requires Review</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Quote ID:</strong> ${leadId || 'N/A'}</p>
            <p><strong>Customer:</strong> ${customerName || 'Customer'}</p>
            <p><strong>Service:</strong> ${serviceType || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${quoteAmount || '0'}</p>
            <p><strong>Tradesperson:</strong> ${tradesmanName || 'Tradesperson'}</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${SITE_URL}/admin-quote-review.html" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Quote</a>
          </div>
        </div>
      `;

      console.log("📧 Built new quote email template: admin");

      if (process.env.ADMIN_EMAIL) {
        try {
          console.log(`📤 Sending admin new quote notification email to: ${process.env.ADMIN_EMAIL}`);
          const adminResult = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: adminNewQuoteSubject,
            html: adminNewQuoteHtml
          });
          console.log(`✅ Email sent to admin, msgId: ${adminResult.messageId}`);
        } catch (error) {
          console.error(`❌ Email failed to admin: ${error.message}`);
        }
      } else {
        console.log("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
      }

      // Send confirmation to tradesperson that quote is submitted for review
      const tradespersonNewQuoteSubject = `📋 Quote Submitted for Review - ${leadId || 'N/A'}`;
      const tradespersonNewQuoteHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; margin: 20px 0;">Quote Submitted Successfully</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p>Hi ${tradesmanName || 'there'},</p>
            <p>Your quote for ${customerName || 'the customer'} has been submitted and is now awaiting admin review.</p>
            <p><strong>Quote Details:</strong></p>
            <ul>
              <li><strong>Quote ID:</strong> ${leadId || 'N/A'}</li>
              <li><strong>Customer:</strong> ${customerName || 'Customer'}</li>
              <li><strong>Service:</strong> ${serviceType || 'Not specified'}</li>
              <li><strong>Amount:</strong> $${quoteAmount || '0'}</li>
            </ul>
            <p>You will be notified once the quote has been reviewed and approved.</p>
          </div>
        </div>
      `;

      console.log("📧 Built new quote email template: tradesperson");

      try {
        console.log(`📤 Sending tradesperson new quote email to: ${tradesmanEmail}`);
        const tradespersonResult = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: tradesmanEmail,
          subject: tradespersonNewQuoteSubject,
          html: tradespersonNewQuoteHtml
        });
        console.log(`✅ Email sent to tradesperson, msgId: ${tradespersonResult.messageId}`);
      } catch (error) {
        console.error(`❌ Email failed to tradesperson: ${error.message}`);
      }

      console.log(`📧 Quote submission notifications sent for lead ${leadId}`);

      res.json({ 
        success: true, 
        message: 'Quote submitted successfully and sent for admin review',
        leadId
      });

      // Append to Quotes sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'Quotes!A:Z',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [quoteRow]
        }
      });

      console.log(`✅ Quote saved for lead ${leadId}`);

      // Get the saved quote data for confirmation
      const quoteResponse = await fetch(`${SITE_URL}/api/get-quote?leadId=${leadId}`);
      const quoteData = await quoteResponse.json();
      
      if (!quoteData.ok) {
        console.warn(`⚠️ Could not fetch saved quote data for lead ${leadId}`);
      }

      // Send Stage 2 emails with unified quote data
      console.log("📧 STAGE 2: Starting quote submission email notifications...");
      
      // Environment checks
      console.log("🔧 Environment variables check:", {
        GMAIL_USER: process.env.GMAIL_USER || "MISSING",
        GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
        CUSTOMER_EMAIL: customerEmail || "MISSING",
        TRADESPERSON_EMAIL: tradesmanEmail || "MISSING"
      });
      
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      // Generate PDF using the same quote data
      const pdfBuffer = await generateQuotePdfBuffer(quoteData.quote || {
        leadId,
        customerName,
        service: serviceType,
        quoteAmount,
        details: projectDetails,
        status: 'Pending',
        timeline,
        area: location?.area || '',
        suburb: location?.suburb || '',
        budget,
        specificDetails,
        tradesmanName,
        tradesmanEmail,
        quoteDate: new Date().toISOString()
      });

      // Customer email with web link and PDF
      const customerSubject = `📋 Your Quote for ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
      const quoteViewUrl = `${SITE_URL}/quote-view?leadId=${leadId || 'N/A'}`;
      const acceptUrl = `${SITE_URL}/api/quote-decision?leadId=${leadId || 'N/A'}&action=accept`;
      const declineUrl = `${SITE_URL}/api/quote-decision?leadId=${leadId || 'N/A'}&action=decline`;

      const customerHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("quote")}
          <h2 style="color: #333; margin: 20px 0;">Your Quote is Ready!</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p>Hi ${customerName || 'there'},</p>
            <p>Your quote for ${serviceType || 'your project'} is ready for review.</p>
            <p><strong>Quote Amount:</strong> $${quoteAmount || '0'}</p>
            <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
            <p><strong>Project Details:</strong> ${projectDetails || 'Not provided'}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">View Quote</a>
            <a href="${acceptUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Accept Quote</a>
            <a href="${declineUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Decline Quote</a>
          </div>
        </div>
      `;

      console.log("📧 Built Stage 2 email template: customer");

      // Send all three emails
      let emailsSent = 0;
      const totalEmails = 3;

      // 1. Send customer email with quote details and decision links
      try {
        console.log(`📤 Sending customer quote email to: ${customerEmail}`);
        const customerResult = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: customerEmail,
          subject: customerSubject,
          html: customerHtml,
          attachments: [{
            filename: `quote-${leadId}.pdf`,
            content: pdfBuffer
          }]
        });
        console.log(`✅ Email sent to customer, msgId: ${customerResult.messageId}`);
        emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to customer, err: ${error.message}`);
      }

      // 2. Send admin notification email
      const adminStage2Subject = `📋 Quote Submitted - ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
      const adminStage2Html = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("quote")}
          <h2 style="color: #333; margin: 20px 0;">Quote Submitted Successfully</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
            <p><strong>Customer:</strong> ${customerName || 'Customer'}</p>
            <p><strong>Service:</strong> ${serviceType || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${quoteAmount || '0'}</p>
            <p><strong>Tradesman:</strong> ${tradesmanName || 'Tradesperson'}</p>
            <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
            <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
          </div>
        </div>
      `;

      console.log("📧 Built Stage 2 email template: admin");

      if (process.env.ADMIN_EMAIL) {
        try {
          console.log(`📤 Sending admin notification email to: ${process.env.ADMIN_EMAIL}`);
          const adminResult = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: adminStage2Subject,
            html: adminStage2Html
          });
          console.log(`✅ Email sent to admin, msgId: ${adminResult.messageId}`);
          emailsSent++;
        } catch (error) {
          console.error(`❌ Email failed to admin, err: ${error.message}`);
        }
      } else {
        console.log("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
      }

      // 3. Send tradesperson confirmation email
      const tradespersonStage2Subject = `📋 Quote Sent Successfully - ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
      const tradespersonStage2Html = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("quote")}
          <h2 style="color: #333; margin: 20px 0;">Your Quote Has Been Sent</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p>Hi ${tradesmanName || 'there'},</p>
            <p>Your quote for ${customerName || 'the customer'}'s ${serviceType || 'project'} has been sent successfully.</p>
            <p><strong>Quote Details:</strong></p>
            <ul>
              <li><strong>Lead ID:</strong> ${leadId || 'N/A'}</li>
              <li><strong>Customer:</strong> ${customerName || 'Customer'}</li>
              <li><strong>Service:</strong> ${serviceType || 'Not specified'}</li>
              <li><strong>Quote Amount:</strong> $${quoteAmount || '0'}</li>
              <li><strong>Timeline:</strong> ${timeline || 'Not specified'}</li>
            </ul>
            <p>The customer will receive an email with your quote and can accept or decline it.</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
          </div>
        </div>
      `;

      console.log("📧 Built Stage 2 email template: tradesperson");

      try {
        console.log(`📤 Sending tradesperson confirmation email to: ${tradesmanEmail}`);
        const tradespersonResult = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: tradesmanEmail,
          subject: tradespersonStage2Subject,
          html: tradespersonStage2Html
        });
        console.log(`✅ Email sent to tradesperson, msgId: ${tradespersonResult.messageId}`);
        emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to tradesperson, err: ${error.message}`);
      }

      console.log(`📧 Stage 2: Quote sent emails delivered (customer, admin, tradesperson). (${emailsSent}/${totalEmails} emails sent)`);

      res.json({ 
        success: true, 
        stage: "quote-sent",
        message: 'Quote submitted successfully',
        leadId,
        quoteViewUrl
      });

    } catch (error) {
      console.error('Quote submission error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }

  } catch (error) {
    console.error('Quote submission error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message 
    });
  }
}
