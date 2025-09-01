// pages/api/leads.js - Consolidated Lead/Quote Lifecycle API
import { google } from 'googleapis';
import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { sendEmail, createLeadIntakeEmails, createQuoteSubmissionEmails, createQuoteDecisionEmails } from '../../lib/emailHelper.js';

export default async function handler(req, res) {
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
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: action. Must be one of: create, submit-quote, decision'
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
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = getSpreadsheetId();
    
    if (privateKey && sheetId) {
      console.log("✅ Google Sheets credentials found, proceeding with logging");
      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        privateKey.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const leadRow = [
        new Date().toISOString(), // Timestamp
        leadId, // Lead ID
        name || "", // Name
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
      
      console.log(`✅ Lead ${leadId} saved to Sheets`);
      sheetsSuccess = true;
    }
  } catch (sheetsError) {
    console.warn(`⚠️ Sheets logging failed for lead ${leadId}:`, sheetsError.message);
  }

  // Step 2: Send emails
  console.log("📧 STAGE 1: Starting lead intake email notifications...");
  
  // Environment checks
  console.log("🔧 Environment variables check:", {
    GMAIL_USER: process.env.GMAIL_USER || "MISSING",
    GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
    TEAM_EMAIL: process.env.TEAM_EMAIL || "MISSING",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
    CUSTOMER_EMAIL: customerEmail || "MISSING"
  });

  try {
    const leadData = {
      leadId, customerName, customerEmail, customerPhone, serviceType,
      timeline, budget, suburbValue, roomsString, totalRooms, roomsEmailList,
      specificDetails, quoteFormUrl
    };

    const emails = createLeadIntakeEmails(leadData);
    console.log("📧 Built Stage 1 email templates");

    let emailsSent = 0;
    const totalEmails = 3;

    // Send customer confirmation email
    try {
      console.log(`📤 Sending customer confirmation email to: ${customerEmail}`);
      const customerResult = await sendEmail(customerEmail, emails.customer.subject, emails.customer.html);
      if (customerResult.success) emailsSent++;
    } catch (error) {
      console.error(`❌ Email failed to customer: ${error.message}`);
    }

    // Send admin notification email
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

    // Send tradesperson notification email
    if (process.env.TEAM_EMAIL) {
      try {
        console.log(`📤 Sending tradesperson notification email to: ${process.env.TEAM_EMAIL}`);
        const tradespersonResult = await sendEmail(process.env.TEAM_EMAIL, emails.tradesperson.subject, emails.tradesperson.html);
        if (tradespersonResult.success) emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to tradesperson: ${error.message}`);
      }
    } else {
      console.log("⚠️ TEAM_EMAIL not configured, skipping tradesperson notification");
    }

    console.log(`📧 Stage 1: Lead intake emails sent. (${emailsSent}/${totalEmails} emails sent)`);
    emailSuccess = emailsSent > 0;

  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  // Step 3: Determine response
  if (emailSuccess) {
    console.log(`✅ Lead ${leadId} processed successfully - emails sent`);
    return res.status(200).json({ 
      success: true, 
      stage: "lead-create",
      leadId,
      message: sheetsSuccess ? "Lead saved to database and emails sent" : "Emails sent (database logging failed)"
    });
  } else {
    console.log(`❌ Lead submission failed - no emails sent for ${leadId}`);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to send email notifications. Please try again or contact us directly." 
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

    console.log(`📧 Stage 2: Quote submission emails sent. (${emailsSent}/${totalEmails} emails sent)`);

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
  
  const { quoteId, leadId, action } = req.body;

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
    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
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
      action, leadId, quoteId, 
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
        console.log(`📤 Sending customer ${action} email to: ${leadData.customerEmail}`);
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
        console.log(`📤 Sending tradesperson ${action} email to: ${fullQuoteData.tradesmanEmail}`);
        const tradespersonResult = await sendEmail(fullQuoteData.tradesmanEmail, emails.tradesperson.subject, emails.tradesperson.html);
        if (tradespersonResult.success) emailsSent++;
      } catch (error) {
        console.error(`❌ Email failed to tradesperson: ${error.message}`);
      }
    }

    console.log(`📧 Stage 3: Quote ${leadId} ${action === 'accept' ? 'ACCEPTED' : 'DECLINED'} emails sent. (${emailsSent} emails sent)`);

  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
  return res.json({ 
    success: true, 
    stage: "quote-decision",
    message: `Quote ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
    leadId,
    status 
  });
}
