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
        row[4] === tradesmanEmail // tradesmanEmail column (E)
      );

      if (existingQuotes.length > 0) {
        // Check if any existing quote allows resubmission
        const declinedQuote = existingQuotes.find(row => row[10] === 'declined'); // status column (K)
        
        if (declinedQuote) {
          const declineReason = declinedQuote[11]; // decline reason column (L)
          const resubmissionUsed = declinedQuote[14]; // resubmission_used column (O)
          
          // Check if resubmission is allowed
          if ((declineReason === 'pricing_error' || declineReason === 'missing_details') && resubmissionUsed !== 'TRUE') {
            console.log('✅ Resubmission allowed for declined quote:', { leadId, tradesmanEmail, declineReason });
            // Continue with submission - this is a valid resubmission
          } else {
            console.log('❌ Resubmission not allowed:', { leadId, tradesmanEmail, declineReason, resubmissionUsed });
            return res.status(400).json({
              error: 'You have already submitted a quote for this lead and resubmission is not allowed.'
            });
          }
        } else {
          console.log('❌ Quote already exists and is not declined:', { leadId, tradesmanEmail });
          return res.status(400).json({
            error: 'You have already submitted a quote for this lead.'
          });
        }
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

      console.log(`✅ Quote saved for lead ${leadId}`);

      // Get the saved quote data for confirmation
      const quoteResponse = await fetch(`${SITE_URL}/api/get-quote?leadId=${leadId}`);
      const quoteData = await quoteResponse.json();
      
      if (!quoteData.ok) {
        console.warn(`⚠️ Could not fetch saved quote data for lead ${leadId}`);
      }

      // Send Stage 2 emails with unified quote data
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
      const customerSubject = `📋 Your Quote for ${serviceType} - ${leadId}`;
      const quoteViewUrl = `${SITE_URL}/quote-view?leadId=${leadId}`;
      const acceptUrl = `${SITE_URL}/api/quote-decision?leadId=${leadId}&action=accept`;
      const declineUrl = `${SITE_URL}/api/quote-decision?leadId=${leadId}&action=decline`;

      const customerHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("quote")}
          <h2 style="color: #333; margin: 20px 0;">Your Quote is Ready!</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p>Hi ${customerName},</p>
            <p>Your quote for ${serviceType} is ready for review.</p>
            <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
            <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
            <p><strong>Project Details:</strong> ${projectDetails}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">View Quote</a>
            <a href="${acceptUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Accept Quote</a>
            <a href="${declineUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Decline Quote</a>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
        attachments: [{
          filename: `quote-${leadId}.pdf`,
          content: pdfBuffer
        }]
      });

      // Admin/Tradesperson confirmation email
      const teamSubject = `📋 Quote Submitted - ${serviceType} - ${leadId}`;
      const teamHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("quote")}
          <h2 style="color: #333; margin: 20px 0;">Quote Submitted Successfully</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
            <p><strong>Tradesman:</strong> ${tradesmanName}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
          </div>
        </div>
      `;

      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: teamSubject,
          html: teamHtml
        });
      }

      console.log(`📧 Stage 2 quote emails sent with PDF + web link for lead ${leadId}`);

      res.json({ 
        success: true, 
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
