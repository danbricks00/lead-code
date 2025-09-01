import nodemailer from "nodemailer";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Google Sheets integration
async function getLeadFromSheets(leadId) {
  try {
    console.log("📊 Fetching lead data from Google Sheets for ID:", leadId);

    // Import Google Sheets client
    const { google } = await import('googleapis');
    const { getGoogleSheetsClient, getSpreadsheetId } = await import('../../lib/googleSheets.js');

    const sheets = getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    if (!spreadsheetId) {
      console.log("⚠️ Google Sheets not configured, using fallback data");
      return null;
    }

    // Fetch lead data from Leads sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Leads!A:Z',
    });

    const rows = response.data.values || [];
    console.log(`📊 Found ${rows.length} rows in Leads sheet`);

    // Find lead by ID (assuming Lead ID is in column B)
    const leadRow = rows.find((row, index) => index > 0 && row[1] === leadId); // Skip header row

    if (!leadRow) {
      console.log("⚠️ Lead not found in Google Sheets");
      return null;
    }

    // Parse lead data from sheet
    const leadData = {
      timestamp: leadRow[0] || '',
      leadId: leadRow[1] || '',
      customerName: leadRow[2] || '',
      customerEmail: leadRow[3] || '',
      customerPhone: leadRow[4] || '',
      serviceType: leadRow[5] || '',
      area: leadRow[6] || '',
      suburb: leadRow[7] || '',
      budget: leadRow[8] || '',
      timeline: leadRow[9] || '',
      specificDetails: leadRow[10] || '',
      status: leadRow[11] || ''
    };

    console.log("✅ Lead data retrieved from Google Sheets:", leadData.customerName);
    return leadData;

  } catch (error) {
    console.error("❌ Failed to fetch lead from Google Sheets:", error.message);
    return null;
  }
}

// HMAC SHA256 link signing
function generateSignedQuoteLink(leadId, tradespersonEmail) {
  // Use Vercel's dynamic URL detection for multiple domains
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-domain.com');
  const secret = process.env.QUOTE_LINK_SECRET || 'default-secret-key';

  // Create payload
  const payload = `${leadId}:${tradespersonEmail}:${Date.now()}`;

  // Generate HMAC signature
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Create signed URL
  const signedUrl = `${baseUrl}/quote-form?leadId=${leadId}&tradesperson=${encodeURIComponent(tradespersonEmail)}&sig=${signature}&payload=${encodeURIComponent(payload)}`;

  return signedUrl;
}

function verifySignedQuoteLink(leadId, tradespersonEmail, signature, payload) {
  const secret = process.env.QUOTE_LINK_SECRET || 'default-secret-key';
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}

// Email transporter setup
async function createEmailTransporter() {
  const nodemailer = await import('nodemailer');

  return nodemailer.default.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// Email sending helper
async function sendEmail(transporter, to, subject, html, text) {
  try {
    const result = await transporter.sendMail({
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });

    console.log(`✅ Email sent to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// STEP 2: Quote Submission - Send 3 emails
async function handleQuoteSubmission(req, res) {
  console.log("📝 STEP 2: Processing quote submission");

  try {
    const {
      leadId,
      tradespersonName,
      tradespersonEmail,
      quoteAmount,
      quoteDetails,
      availability,
      materials
    } = req.body;

    console.log("📋 Quote data:", { leadId, tradespersonName, quoteAmount });

    // Get lead data from Google Sheets or fallback
    let leadData = await getLeadFromSheets(leadId);

    // Fallback to request body if Sheets fails
    if (!leadData) {
      console.log("⚠️ Using fallback lead data from request");
      leadData = req.body.leadData || {};
    }

    // Create email transporter
    const transporter = await createEmailTransporter();

    // Generate accept/decline links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
    const acceptUrl = `${baseUrl}/api/quote-decision?action=accept&leadId=${leadId}&tradesperson=${encodeURIComponent(tradespersonEmail)}`;
    const declineUrl = `${baseUrl}/api/quote-decision?action=decline&leadId=${leadId}&tradesperson=${encodeURIComponent(tradespersonEmail)}`;

    // 1. Customer Quote Email with Accept/Decline Buttons
    const customerSubject = `📋 Your Quote for ${leadData.serviceType || 'Project'}`;
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Quote is Ready!</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Project: ${leadData.serviceType || 'N/A'}</h3>
          <p><strong>From:</strong> ${tradespersonName}</p>
          <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
          <p><strong>Availability:</strong> ${availability || 'TBD'}</p>
          <p><strong>Materials Included:</strong> ${materials || 'To be discussed'}</p>

          <div style="background: #fff; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <p><strong>Quote Details:</strong></p>
            <p>${quoteDetails || 'No additional details provided'}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}"
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">
              ✅ Accept Quote
            </a>
            <a href="${declineUrl}"
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">
              ❌ Decline Quote
            </a>
          </div>
        </div>
      </div>
    `;

    // 2. Tradesperson Confirmation Email
    const tradespersonSubject = `✅ Quote Submitted Successfully - ${leadId}`;
    const tradespersonHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Quote Submitted Successfully!</h2>
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi ${tradespersonName},</p>
          <p>Your quote has been successfully sent to the customer.</p>

          <h3>Quote Summary:</h3>
          <ul>
            <li><strong>Lead ID:</strong> ${leadId}</li>
            <li><strong>Customer:</strong> ${leadData.customerName || 'N/A'}</li>
            <li><strong>Service:</strong> ${leadData.serviceType || 'N/A'}</li>
            <li><strong>Your Quote:</strong> $${quoteAmount}</li>
            <li><strong>Details:</strong> ${quoteDetails || 'N/A'}</li>
          </ul>

          <p>The customer will receive an email with your quote and can accept or decline it.</p>
          <p>You'll be notified of their decision.</p>
        </div>
      </div>
    `;

    // 3. Admin Notification Email
    const adminSubject = `📋 Quote Submitted - ${leadId}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Quote Submitted</h2>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer:</strong> ${leadData.customerName || 'N/A'}</p>
          <p><strong>Tradeperson:</strong> ${tradespersonName} (${tradespersonEmail})</p>
          <p><strong>Service:</strong> ${leadData.serviceType || 'N/A'}</p>
          <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
          <p><strong>Quote Details:</strong> ${quoteDetails || 'N/A'}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>
    `;

    // Send all 3 emails
    console.log("📧 STEP 2: Sending 3 emails...");

    const results = await Promise.allSettled([
      sendEmail(transporter, leadData.customerEmail || req.body.customerEmail, customerSubject, customerHtml, customerHtml.replace(/<[^>]*>/g, '')),
      sendEmail(transporter, tradespersonEmail, tradespersonSubject, tradespersonHtml, tradespersonHtml.replace(/<[^>]*>/g, '')),
      sendEmail(transporter, 'office@kiwitrade.co.nz', adminSubject, adminHtml, adminHtml.replace(/<[^>]*>/g, ''))
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`📧 STEP 2 Complete: ${successCount}/3 emails sent successfully`);

    return res.status(200).json({
      success: successCount > 0,
      leadId,
      quoteAmount,
      emailsSent: successCount,
      results: results.map((r, i) => ({
        email: i === 0 ? 'customer' : i === 1 ? 'tradesperson' : 'admin',
        success: r.status === 'fulfilled' && r.value.success,
        error: r.status === 'rejected' ? r.reason : r.value.error
      }))
    });

  } catch (error) {
    console.error("❌ STEP 2 Failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      step: 2
    });
  }
}

// STEP 3: Quote Acceptance/Decline - Send 3 emails
async function handleQuoteDecision(req, res) {
  console.log("✅ STEP 3: Processing quote decision");

  try {
    const { action, leadId, tradespersonEmail, reason } = req.query;

    console.log("📋 Decision data:", { action, leadId, tradespersonEmail });

    if (!action || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Must be 'accept' or 'decline'"
      });
    }

    // Get lead data from Google Sheets or fallback
    let leadData = await getLeadFromSheets(leadId);

    // Fallback to basic data if Sheets fails
    if (!leadData) {
      console.log("⚠️ Using fallback lead data");
      leadData = {
        customerName: 'Valued Customer',
        customerEmail: 'customer@example.com',
        serviceType: 'Project',
        leadId: leadId
      };
    }

    // Create email transporter
    const transporter = await createEmailTransporter();

    const isAccepted = action === 'accept';
    const statusEmoji = isAccepted ? '🎉' : '📝';
    const statusText = isAccepted ? 'Accepted' : 'Declined';

    // 1. Customer Confirmation Email
    const customerSubject = `${statusEmoji} Quote ${statusText} - Next Steps`;
    const customerHtml = isAccepted ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Congratulations! Your Quote Was Accepted</h2>
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p>Hi ${leadData.customerName},</p>
          <p>Great news! Your tradesperson has confirmed acceptance of your quote.</p>
          <p>They will contact you within 24 hours to schedule your project.</p>

          <h3>Project Summary:</h3>
          <ul>
            <li><strong>Service:</strong> ${leadData.serviceType}</li>
            <li><strong>Lead ID:</strong> ${leadId}</li>
          </ul>

          <p>Please keep an eye on your email for scheduling details.</p>
        </div>
        <p>Best regards,<br>The Kiwi Trade Team</p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6c757d;">Quote Declined - Thank You</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi ${leadData.customerName},</p>
          <p>Thank you for considering our quote for your ${leadData.serviceType} project.</p>
          <p>We hope to work with you in the future.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        <p>Best regards,<br>The Kiwi Trade Team</p>
      </div>
    `;

    // 2. Tradesperson Notification Email
    const tradespersonSubject = `${statusEmoji} Customer ${statusText} Your Quote - ${leadId}`;
    const tradespersonHtml = isAccepted ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Customer Accepted Your Quote!</h2>
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p>🎉 <strong>CUSTOMER ACCEPTED YOUR QUOTE!</strong></p>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer:</strong> ${leadData.customerName}</p>
          <p><strong>Service:</strong> ${leadData.serviceType}</p>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0; font-weight: bold; color: #856404;">
              ⚠️ ACTION REQUIRED: Contact customer within 24 hours to schedule project
            </p>
          </div>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6c757d;">Quote Declined</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi there,</p>
          <p>Your quote for lead ${leadId} was declined by the customer.</p>
          <p><strong>Customer:</strong> ${leadData.customerName}</p>
          <p><strong>Service:</strong> ${leadData.serviceType}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>Consider following up politely if appropriate.</p>
        </div>
      </div>
    `;

    // 3. Admin Alert Email
    const adminSubject = `🚨 Quote ${statusText}: ${leadId}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="${isAccepted ? 'color: #28a745;' : 'color: #6c757d;'}">Quote ${statusText}</h2>
        <div style="background: ${isAccepted ? '#d4edda' : '#f8f9fa'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> ${statusText}</p>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer:</strong> ${leadData.customerName}</p>
          <p><strong>Tradesperson:</strong> ${tradespersonEmail}</p>
          <p><strong>Service:</strong> ${leadData.serviceType}</p>
          <p><strong>Decision Time:</strong> ${new Date().toISOString()}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
      </div>
    `;

    // Send all 3 emails
    console.log("📧 STEP 3: Sending 3 emails...");

    const results = await Promise.allSettled([
      sendEmail(transporter, leadData.customerEmail, customerSubject, customerHtml, customerHtml.replace(/<[^>]*>/g, '')),
      sendEmail(transporter, tradespersonEmail, tradespersonSubject, tradespersonHtml, tradespersonHtml.replace(/<[^>]*>/g, '')),
      sendEmail(transporter, 'office@kiwitrade.co.nz', adminSubject, adminHtml, adminHtml.replace(/<[^>]*>/g, ''))
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`📧 STEP 3 Complete: ${successCount}/3 emails sent successfully`);

    return res.status(200).json({
      success: successCount > 0,
      action,
      leadId,
      emailsSent: successCount,
      results: results.map((r, i) => ({
        email: i === 0 ? 'customer' : i === 1 ? 'tradesperson' : 'admin',
        success: r.status === 'fulfilled' && r.value.success,
        error: r.status === 'rejected' ? r.reason : r.value.error
      }))
    });

  } catch (error) {
    console.error("❌ STEP 3 Failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      step: 3
    });
  }
}

// STEP 1: Lead Intake - Send 3 emails
async function handleLeadIntake(req, res) {
  console.log("📥 STEP 1: Processing lead intake");

  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      area,
      suburb,
      budget,
      timeline,
      specificDetails,
      tradespersonEmail
    } = req.body;

    console.log("📋 Lead data:", {
      customerName,
      customerEmail,
      serviceType,
      area,
      suburb,
      tradespersonEmail
    });

    // Validate required fields
    if (!customerName || !customerEmail || !serviceType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: customerName, customerEmail, serviceType"
      });
    }

    // Generate lead ID
    const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create email transporter
    const transporter = await createEmailTransporter();

    // Generate signed quote link for tradesperson
    const signedQuoteLink = generateSignedQuoteLink(leadId, tradespersonEmail || 'default@tradesperson.com');

    console.log("🔗 Generated signed quote link for tradesperson");

    // 1. Customer Confirmation Email
    const customerSubject = `✅ We've Received Your ${serviceType} Inquiry`;
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Your Inquiry!</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>Hi ${customerName},</p>
          <p>We've received your ${serviceType} inquiry and will connect you with qualified tradesperson within 24 hours.</p>

          <h3>Your Project Details:</h3>
          <ul>
            <li><strong>Service:</strong> ${serviceType}</li>
            <li><strong>Location:</strong> ${suburb || 'N/A'}, ${area || 'N/A'}</li>
            <li><strong>Timeline:</strong> ${timeline || 'Flexible'}</li>
            <li><strong>Budget:</strong> ${budget || 'To be discussed'}</li>
          </ul>

          <p>We'll be in touch soon with quotes from our trusted professionals.</p>
        </div>
        <p>Best regards,<br>The Kiwi Trade Team</p>
      </div>
    `;

    // 2. Tradesperson Lead Notification Email
    const tradespersonSubject = `🆕 New Lead: ${serviceType} in ${suburb || area || 'Your Area'}`;
    const tradespersonHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Lead Available!</h2>
        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Customer Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${customerName}</li>
            <li><strong>Email:</strong> ${customerEmail}</li>
            <li><strong>Phone:</strong> ${customerPhone || 'Not provided'}</li>
            <li><strong>Service:</strong> ${serviceType}</li>
            <li><strong>Location:</strong> ${suburb || 'N/A'}, ${area || 'N/A'}</li>
            <li><strong>Timeline:</strong> ${timeline || 'Flexible'}</li>
            <li><strong>Budget:</strong> ${budget || 'To be discussed'}</li>
          </ul>

          <p><strong>Project Details:</strong> ${specificDetails || 'No additional details provided'}</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signedQuoteLink}"
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Create Quote Now
            </a>
          </div>
        </div>
      </div>
    `;

    // 3. Admin Notification Email
    const adminSubject = `🔔 New Lead Submitted: ${serviceType}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Lead Submitted</h2>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
          <p><strong>Service:</strong> ${serviceType}</p>
          <p><strong>Location:</strong> ${suburb || 'N/A'}, ${area || 'N/A'}</p>
          <p><strong>Timeline:</strong> ${timeline || 'N/A'}</p>
          <p><strong>Budget:</strong> ${budget || 'N/A'}</p>
          <p><strong>Details:</strong> ${specificDetails || 'None'}</p>
          <p><strong>Tradeperson Email:</strong> ${tradespersonEmail || 'Not assigned'}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>
    `;

    // Send all 3 emails
    console.log("📧 STEP 1: Sending 3 emails...");

    const results = await Promise.allSettled([
      sendEmail(transporter, customerEmail, customerSubject, customerHtml, customerHtml.replace(/<[^>]*>/g, '')),
      sendEmail(transporter, tradespersonEmail || 'tradesperson@default.com', tradespersonSubject, tradespersonHtml, tradespersonHtml.replace(/<[^>]*>/g, '')),
      sendEmail(transporter, 'office@kiwitrade.co.nz', adminSubject, adminHtml, adminHtml.replace(/<[^>]*>/g, ''))
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log(`📧 STEP 1 Complete: ${successCount}/3 emails sent successfully`);

    return res.status(200).json({
      success: successCount > 0,
      leadId,
      emailsSent: successCount,
      signedQuoteLink,
      results: results.map((r, i) => ({
        email: i === 0 ? 'customer' : i === 1 ? 'tradesperson' : 'admin',
        success: r.status === 'fulfilled' && r.value.success,
        error: r.status === 'rejected' ? r.reason : r.value.error
      }))
    });

  } catch (error) {
    console.error("❌ STEP 1 Failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      step: 1
    });
  }
}

// Main handler
export default async function handler(req, res) {
  console.log("🚀 Lead Intake API called - Method:", req.method);

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed. Use POST or GET" });
  }

  try {
    // Handle GET requests for quote decisions (accept/decline links)
    if (req.method === "GET") {
      return await handleQuoteDecision(req, res);
    }

    // Handle POST requests
    const { step } = req.body;

    switch (step) {
      case 1:
        return await handleLeadIntake(req, res);
      case 2:
        return await handleQuoteSubmission(req, res);
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid step. Must be 1 (lead intake), 2 (quote submission), or GET for quote decisions"
        });
    }

  } catch (error) {
    console.error("❌ Lead Intake API error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
