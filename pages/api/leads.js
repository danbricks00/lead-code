// pages/api/leads.js - Consolidated Lead/Quote Lifecycle API
import { google } from 'googleapis';
import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { sendEmail, createLeadIntakeEmails, createQuoteSubmissionEmails, createQuoteDecisionEmails } from '../../lib/emailHelper.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API leads.js");
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    // Parse action from query params or body
    const action = req.query.action || req.body.action;
    
    // Master switch for action validation
    if (!action || !['create', 'submit-quote', 'decision'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid action. Must be one of: create, submit-quote, decision'
      });
    }

    console.log(`🔄 Processing ${action} action for leads API`);

    // Route to appropriate handler
    switch (action) {
      case 'create':
        return await handleLeadCreate(req, res);
      case 'submit-quote':
        return await handleSubmitQuote(req, res);
      case 'decision':
        return await handleDecision(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid action: ${action}. Must be one of: create, submit-quote, decision`
        });
    }

  } catch (error) {
    console.error('❌ Leads API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Stage 1: Lead Creation Handler
async function handleLeadCreate(req, res) {
  console.log("📥 Stage 1: Lead creation request received");
  
  const { 
    name, customerName, customerEmail, customerPhone, serviceType, 
    rooms, budget, timeline, area, suburb, specificDetails 
  } = req.body;

  // Validation
  if (!customerName || !customerEmail || !serviceType || !rooms || !Array.isArray(rooms)) {
    console.log("❌ Validation failed - missing required fields");
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: customerName, customerEmail, serviceType, rooms (must be array)" 
    });
  }

  // Generate unique lead ID
  const leadId = `LEAD-${Date.now()}-${Math.floor(Math.random()*10000)}`;

  // Format data
  const roomsString = rooms.map(room => 
    `${room.roomName} (${room.dimensions})`
  ).join(", ");

  const totalRooms = rooms.length;
  const areaValue = area || "";
  const suburbValue = suburb || "";
  const quoteFormUrl = `${process.env.SITE_URL || "https://lead-code.vercel.app"}/quote-form.html?leadId=${leadId}`;
  const roomsEmailList = rooms.map(room => 
    `<li><strong>${room.roomName}:</strong> ${room.dimensions}</li>`
  ).join("");

  let sheetsSuccess = false;
  let emailSuccess = false;

  // Step 1: Try to log to Google Sheets
  console.log("🔄 Attempting Google Sheets logging...");
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSpreadsheetId();
    
    if (sheetId) {
      console.log("✅ Google Sheets client ready, proceeding with logging");
      
      const leadRow = [
        new Date().toISOString(), // Timestamp
        leadId, // Lead ID
        customerName, // Customer Name
        customerEmail, // Email
        customerPhone || "", // Phone
        serviceType, // ServiceType
        areaValue, // Area
        suburbValue, // Suburb
        budget || "", // Budget
        timeline || "", // Timeline
        specificDetails || "", // SpecificDetails
        "New" // Status
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Leads!A:Z",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [leadRow]
        }
      });
      
      console.log(`✅ Lead ${leadId} saved to Sheets successfully`);
      sheetsSuccess = true;
    } else {
      console.error("❌ Google Sheets ID not configured");
    }
  } catch (sheetsError) {
    console.error(`❌ Sheets logging failed for lead ${leadId}:`, sheetsError.message);
  }

  // Step 2: Send emails
  console.log("📧 STAGE 1: Starting lead intake email notifications...");
  
  // Environment checks
  console.log("🔧 Environment variables check:", {
    GMAIL_USER: process.env.GMAIL_USER || "MISSING",
    GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
    TEAM_EMAIL: process.env.TEAM_EMAIL || "MISSING"
  });

  try {
    // Create Nodemailer transporter
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    let emailsSent = 0;

    // Send admin notification email
    if (process.env.ADMIN_EMAIL) {
      try {
        const adminSubject = `🆕 New Lead Submitted - ${serviceType}`;
        const adminHtml = `
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin: 20px 0;">New Lead Received</h2>
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
              <p><strong>Lead ID:</strong> ${leadId}</p>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
              <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p><strong>Location:</strong> ${suburbValue}, ${areaValue}</p>
              <p><strong>Rooms:</strong> ${roomsString}</p>
              <p><strong>Details:</strong> ${specificDetails || 'Not provided'}</p>
            </div>
          </div>
        `;

        console.log(`📤 Sending admin notification email to: ${process.env.ADMIN_EMAIL}`);
        const adminResult = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: adminSubject,
          html: adminHtml
        });
        console.log(`✅ Admin email sent successfully, msgId: ${adminResult.messageId}`);
        emailsSent++;
      } catch (error) {
        console.error(`❌ Admin email failed: ${error.message}`);
      }
    } else {
      console.log("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
    }

    // Send tradesperson notification email
    if (process.env.TEAM_EMAIL) {
      try {
        const tradespersonSubject = `🆕 New Lead Available - ${serviceType} in ${suburbValue}`;
        const tradespersonHtml = `
          <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin: 20px 0;">New Lead Available</h2>
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
              <p><strong>Lead ID:</strong> ${leadId}</p>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
              <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p><strong>Location:</strong> ${suburbValue}, ${areaValue}</p>
              <p><strong>Rooms:</strong> ${roomsString}</p>
              <p><strong>Details:</strong> ${specificDetails || 'Not provided'}</p>
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${quoteFormUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Submit Quote</a>
            </div>
          </div>
        `;

        console.log(`📤 Sending tradesperson notification email to: ${process.env.TEAM_EMAIL}`);
        const tradespersonResult = await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: process.env.TEAM_EMAIL,
          subject: tradespersonSubject,
          html: tradespersonHtml
        });
        console.log(`✅ Tradesperson email sent successfully, msgId: ${tradespersonResult.messageId}`);
        emailsSent++;
      } catch (error) {
        console.error(`❌ Tradesperson email failed: ${error.message}`);
      }
    } else {
      console.log("⚠️ TEAM_EMAIL not configured, skipping tradesperson notification");
    }

    console.log(`📧 Stage 1 Lead intake emails sent for leadId ${leadId} (${emailsSent} emails sent)`);
    emailSuccess = emailsSent > 0;

  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  // Step 3: Determine response
  if (sheetsSuccess || emailSuccess) {
    console.log(`✅ Lead intake complete for ${leadId} - Sheets: ${sheetsSuccess}, Emails: ${emailSuccess}`);
    return res.status(200).json({ 
      success: true, 
      leadId,
      message: sheetsSuccess && emailSuccess 
        ? "Lead saved to database and emails sent" 
        : sheetsSuccess 
        ? "Lead saved to database (email notifications failed)" 
        : "Emails sent (database logging failed)"
    });
  } else {
    console.log(`❌ Lead intake failed for ${leadId} - both Sheets and emails failed`);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to process lead. Please try again or contact us directly." 
    });
  }
}

// Stage 2: Quote Submission Handler
async function handleSubmitQuote(req, res) {
  console.log("📥 Stage 2: Quote submission request received");
  
  const {
    leadId, customerName, customerEmail, serviceType, quoteAmount,
    timeline, projectDetails, budget, tradesmanName, tradesmanEmail,
    tradesmanPhone, projectSize, breakdown, notes, companyName
  } = req.body;

  // Validation
  if (!leadId || !customerEmail || !serviceType || !quoteAmount || !tradesmanEmail) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: leadId, customerEmail, serviceType, quoteAmount, tradesmanEmail"
    });
  }

  // Check for duplicate quotes
  console.log("🔍 Checking for duplicate quotes...");
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSpreadsheetId();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Quotes!A:T',
    });

    const rows = response.data.values || [];
    const existingQuotes = rows.filter(row => 
      row[1] === leadId && row[13] === tradesmanEmail
    );

    if (existingQuotes.length > 0) {
      const existingQuote = existingQuotes[0];
      const quoteStatus = existingQuote[6] || 'Pending';
      
      if (quoteStatus !== 'Rejected') {
        console.log('❌ Quote already exists and is not rejected:', { leadId, tradesmanEmail, quoteStatus });
        return res.status(409).json({
          success: false,
          error: `You have already submitted a quote for this lead (Status: ${quoteStatus}). Only one quote per tradesperson is allowed unless the previous quote was rejected.`
        });
      }

      // Handle resubmission after rejection
      console.log(`🔄 Tradesperson ${tradesmanEmail} resubmitting quote for lead ${leadId} after rejection`);
      
      const quoteRowIndex = rows.findIndex(row => 
        row[1] === leadId && row[13] === tradesmanEmail
      );

      const updatedRow = [
        new Date().toISOString(),
        leadId, customerName, serviceType, quoteAmount, projectDetails,
        'Pending', timeline, '', '', budget, '', tradesmanName,
        tradesmanEmail, tradesmanPhone, projectSize, breakdown, notes, companyName
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Quotes!A${quoteRowIndex + 1}:T${quoteRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow]
        }
      });

      console.log(`✅ Quote resubmitted for lead ${leadId} - Awaiting admin review`);
      return res.json({ 
        success: true, 
        message: 'Quote resubmitted successfully and sent for admin review',
        leadId,
        isResubmission: true
      });
    }
  } catch (error) {
    console.error('❌ Error checking for duplicate quotes:', error.message);
  }

  // Save new quote to Google Sheets
  console.log("💾 Saving new quote to Google Sheets...");
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSpreadsheetId();
    
    const quoteRow = [
      new Date().toISOString(), // Timestamp
      leadId, // LeadId
      customerName, // CustomerName
      serviceType, // Service
      quoteAmount, // QuoteAmount
      projectDetails, // Details
      'Pending', // Status
      timeline, // Timeline
      '', // Area
      '', // Suburb
      budget, // Budget
      '', // SpecificDetails
      tradesmanName, // TradesmanName
      tradesmanEmail, // TradesmanEmail
      tradesmanPhone || '', // TradesmanPhone
      projectSize, // ProjectSize
      breakdown, // Breakdown
      notes || '', // Notes
      companyName || '' // CompanyName
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Quotes!A:Z',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [quoteRow]
      }
    });

    console.log(`✅ Quote saved for lead ${leadId} - Awaiting admin review`);
  } catch (error) {
    console.error('❌ Error saving quote to Sheets:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to save quote to database'
    });
  }

  // Send Stage 2 emails
  console.log("📧 STAGE 2: Starting quote submission email notifications...");
  
  // Environment checks
  console.log("🔧 Environment variables check:", {
    GMAIL_USER: process.env.GMAIL_USER || "MISSING",
    GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
    CUSTOMER_EMAIL: customerEmail || "MISSING",
    TRADESPERSON_EMAIL: tradesmanEmail || "MISSING"
  });

  try {
    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';
    const quoteViewUrl = `${SITE_URL}/quote-view?leadId=${leadId}`;
    const acceptUrl = `${SITE_URL}/api/leads?action=decision&leadId=${leadId}&action=accept`;
    const declineUrl = `${SITE_URL}/api/leads?action=decision&leadId=${leadId}&action=decline`;

    const quoteData = {
      leadId, customerName, customerEmail, serviceType, quoteAmount,
      timeline, projectDetails, budget, tradesmanName, tradesmanEmail,
      quoteViewUrl, acceptUrl, declineUrl
    };

    const emails = createQuoteSubmissionEmails(quoteData);
    console.log("📧 Built Stage 2 email templates");

    let emailsSent = 0;
    const totalEmails = 3;

    // Send customer email
    try {
      console.log(`📤 Sending customer quote email to: ${customerEmail}`);
      const customerResult = await sendEmail(customerEmail, emails.customer.subject, emails.customer.html);
      if (customerResult.success) emailsSent++;
    } catch (error) {
      console.error(`❌ Email failed to customer: ${error.message}`);
    }

    // Send admin email
    if (process.env.ADMIN_EMAIL) {
      try {
        console.log(`📤 Sending admin notification email to: ${process.env.ADMIN_EMAIL}`);
        const adminResult = await sendEmail(process.env.ADMIN_EMAIL, emails.admin.subject, emails.admin.html);
        if (adminResult.success) emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to admin: ${error.message}`);
      }
    } else {
      console.log("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
    }

    // Send tradesperson email
    try {
      console.log(`📤 Sending tradesperson confirmation email to: ${tradesmanEmail}`);
      const tradespersonResult = await sendEmail(tradesmanEmail, emails.tradesperson.subject, emails.tradesperson.html);
      if (tradespersonResult.success) emailsSent++;
    } catch (error) {
      console.error(`❌ Email failed to tradesperson: ${error.message}`);
    }

    console.log(`📧 Stage 2 Quote sent emails sent for leadId ${leadId}`);

  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  return res.json({ 
    success: true, 
    message: 'Quote submitted successfully and sent for admin review',
    leadId
  });
}

// Stage 3: Quote Decision Handler
async function handleDecision(req, res) {
  console.log("📥 Stage 3: Quote decision request received");
  
  const { quoteId, leadId, action, decisionType } = req.body;

  if (!quoteId || !action) {
    return res.status(400).json({ 
      success: false,
      error: 'Missing required fields: quoteId and action' 
    });
  }

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid action. Must be "accept" or "decline"' 
    });
  }

  // Use decisionType if provided, otherwise default to action
  const finalAction = decisionType || action;

  // Check for required environment variables
  if (!getSpreadsheetId()) {
    return res.status(500).json({ 
      success: false,
      error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
    });
  }

  const DECISIONS_TAB = process.env.SHEETS_DECISIONS_TAB || 'QuoteDecisions';
  const SCOPE = (process.env.SHEETS_DECISION_SCOPE || 'lead').toLowerCase();

  // Check for existing decisions
  console.log("🔍 Checking for existing decisions...");
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSpreadsheetId();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${DECISIONS_TAB}!A:E`
    });
    
    const rows = response.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      const [ts, qid, lid, status] = rows[i];
      if (status !== 'ACCEPTED' && status !== 'DECLINED') continue;

      // Scope=lead: any prior decision for this lead locks all counter quotes
      if (SCOPE === 'lead' && lid === leadId) {
        return res.status(409).json({ 
          success: false,
          error: `Quote already ${status.toLowerCase()}`,
          existingDecision: { decided: true, status, timestamp: ts, scope: 'lead' }
        });
      }

      // Scope=quote: decision applies only to this quoteId+leadId pair
      if (SCOPE !== 'lead' && qid === quoteId && lid === leadId) {
        return res.status(409).json({ 
          success: false,
          error: `Quote already ${status.toLowerCase()}`,
          existingDecision: { decided: true, status, timestamp: ts, scope: 'quote' }
        });
      }
    }
  } catch (error) {
    console.warn('Decision lookup failed (continuing):', error.message);
  }

  // Record the decision
  console.log("💾 Recording decision...");
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSpreadsheetId();
    const status = finalAction === 'accept' ? 'ACCEPTED' : 'DECLINED';
    const values = [new Date().toISOString(), quoteId, leadId, status, 'customer'];
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${DECISIONS_TAB}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values]
      }
    });
  } catch (error) {
    console.error('❌ Error recording decision:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to record decision'
    });
  }

  // Fetch quote and lead data for emails
  let quoteData, leadData, fullQuoteData;
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSpreadsheetId();
    
    // Fetch quote data
    const quoteResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Quotes!A:Z"
    });
    
    const quoteRows = quoteResponse.data.values || [];
    const quoteRow = quoteRows.find(row => row[1] === leadId);
    
    if (quoteRow) {
      quoteData = {
        service: quoteRow[3],
        quoteAmount: quoteRow[4],
        details: quoteRow[5],
        timeline: quoteRow[7]
      };
      
      fullQuoteData = {
        ...quoteData,
        tradesmanName: quoteRow[12] || '',
        tradesmanEmail: quoteRow[13] || '',
        tradesmanPhone: quoteRow[14] || '',
        companyName: quoteRow[19] || ''
      };
    }

    // Fetch lead data
    const leadResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Leads!A:Z"
    });
    
    const leadRows = leadResponse.data.values || [];
    const leadRow = leadRows.find(row => row[1] === leadId);
    
    if (leadRow) {
      leadData = {
        customerName: leadRow[2],
        customerEmail: leadRow[3],
        customerPhone: leadRow[4]
      };
    }
  } catch (error) {
    console.warn('Could not fetch quote/lead data from Sheets:', error.message);
  }

  // Send Stage 3 emails
  console.log("📧 STAGE 3: Starting quote decision email notifications...");
  
  // Environment checks
  console.log("🔧 Environment variables check:", {
    GMAIL_USER: process.env.GMAIL_USER || "MISSING",
    GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
    CUSTOMER_EMAIL: leadData?.customerEmail || "MISSING",
    TRADESPERSON_EMAIL: fullQuoteData?.tradesmanEmail || "MISSING"
  });

  try {
    const decisionData = {
      action: finalAction, leadId, quoteId, 
      customerName: leadData?.customerName,
      customerEmail: leadData?.customerEmail,
      serviceType: quoteData?.service,
      quoteAmount: quoteData?.quoteAmount,
      timeline: quoteData?.timeline,
      fullQuoteData, leadData, quoteData
    };

    const emails = createQuoteDecisionEmails(decisionData);
    console.log("📧 Built Stage 3 email templates");

    let emailsSent = 0;

    // Send customer email
    if (leadData?.customerEmail) {
      try {
        console.log(`📤 Sending customer ${finalAction} email to: ${leadData.customerEmail}`);
        const customerResult = await sendEmail(leadData.customerEmail, emails.customer.subject, emails.customer.html);
        if (customerResult.success) emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to customer: ${error.message}`);
      }
    }

    // Send admin email
    if (process.env.ADMIN_EMAIL) {
      try {
        console.log(`📤 Sending admin notification email to: ${process.env.ADMIN_EMAIL}`);
        const adminResult = await sendEmail(process.env.ADMIN_EMAIL, emails.admin.subject, emails.admin.html);
        if (adminResult.success) emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to admin: ${error.message}`);
      }
    } else {
      console.log("⚠️ ADMIN_EMAIL not configured, skipping admin notification");
    }

    // Send tradesperson email
    if (emails.tradesperson && fullQuoteData?.tradesmanEmail) {
      try {
        console.log(`📤 Sending tradesperson ${finalAction} email to: ${fullQuoteData.tradesmanEmail}`);
        const tradespersonResult = await sendEmail(fullQuoteData.tradesmanEmail, emails.tradesperson.subject, emails.tradesperson.html);
        if (tradespersonResult.success) emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to tradesperson: ${error.message}`);
      }
    }

    console.log(`📧 Stage 3 Decision=${finalAction} emails sent for leadId ${leadId}`);

  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  const status = finalAction === 'accept' ? 'ACCEPTED' : 'DECLINED';
  return res.json({ 
    success: true, 
    stage: "quote-decision",
    message: `Quote ${finalAction === 'accept' ? 'accepted' : 'declined'} successfully`,
    leadId,
    status 
  });
}
