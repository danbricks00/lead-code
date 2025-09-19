// pages/api/quote-enquiry.js - Quote Enquiry API for Contact Page
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { validateAndCorrectEmail } from '../../utils/emailValidator';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.BASE_URL || 'http://localhost:3000';

// Google Sheets client setup
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Helper function to append row to sheet
async function appendRowToSheet(sheets, tab, row) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: { values: [row] }
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      projectType,
      roomCount,
      location,
      timeline,
      message
    } = req.body;

    // Validation
    if (!name || !email || !projectType || !roomCount || !location || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, projectType, roomCount, location, message"
      });
    }

    // Smart email validation with autocorrect
    const emailValidation = await validateAndCorrectEmail(email, true);
    
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: emailValidation.error
      });
    }
    
    const finalEmail = emailValidation.correctedEmail || email;
    
    // Log if email was corrected
    if (emailValidation.needsCorrection) {
      console.log(`📧 Email autocorrected: ${email} → ${finalEmail}`);
    }

    // Generate unique lead ID and quote ID with INQ prefix
    const leadId = crypto.randomBytes(6).toString("hex");
    const quoteId = `INQ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    
    console.log(`📋 Processing quote enquiry: Lead ${leadId}, Quote ${quoteId}`);

    const sheets = getGoogleSheetsClient();
    
    // Create rooms data structure (simplified for large projects)
    const rooms = [{
      name: `${roomCount} Rooms Project`,
      dimensions: 'Large Project',
      sqm: parseInt(roomCount) * 10, // Estimate 10 sqm per room
      parsedDimensions: null,
      format: 'large_project'
    }];

    // Construct address from location
    const fullAddress = location;

    // Create lead row for Leads tab (same structure as chatbot leads)
    const leadRow = [
      leadId,                                    // A: Lead ID
      name,                                      // B: CustomerName
      finalEmail,                                // C: CustomerEmail
      phone || "",                               // D: CustomerPhone
      projectType,                               // E: ServiceType
      JSON.stringify(rooms),                     // F: Rooms
      "Contact Page",                            // G: Area (Zone) - indicates source
      location,                                  // H: Suburb
      "0",                                       // I: Budget (removed from chatbot, always 0)
      timeline || "",                            // J: Timeline
      message,                                   // K: Specific Details
      new Date().toLocaleString('en-NZ', {       // L: Time
        timeZone: 'Pacific/Auckland',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      "",                                        // M: (Empty)
      "New Lead",                                // N: Status
      "",                                        // O: Street Address (removed from chatbot)
      fullAddress,                               // P: Address
    ];

    // Write to Leads tab
    await appendRowToSheet(sheets, "Leads", leadRow);
    console.log(`[LEADS] Quote enquiry ${leadId} written to Leads tab`);

    // Create quote row for Quotes tab (same structure as chatbot quotes)
    const quoteRow = [
      quoteId,                                   // A: QuoteID
      leadId,                                    // B: LeadID
      name,                                      // C: CustomerName
      finalEmail,                                // D: CustomerEmail
      phone || "",                               // E: CustomerPhone
      projectType,                               // F: ServiceType
      JSON.stringify(rooms),                     // G: Rooms
      "Contact Page",                            // H: Area
      location,                                  // I: Suburb
      "0",                                       // J: Budget
      timeline || "",                            // K: Timeline
      message,                                   // L: Specific Details
      new Date().toLocaleString('en-NZ', {       // M: Time
        timeZone: 'Pacific/Auckland',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      "",                                        // N: (Empty)
      "New Lead",                                // O: Status
      "",                                        // P: Street Address
      fullAddress,                               // Q: Address
      "0.00",                                    // R: TotalSQM
      "0.00",                                    // S: LabourTotal
      "0.00",                                    // T: MaterialsTotal
      "0.00",                                    // U: TravelTotal
      "0.00",                                    // V: InstallationCost
      "0.00",                                    // W: Subtotal
      "0.00",                                    // X: GST
      "0.00",                                    // Y: TotalQuote
      "",                                        // Z: TradePersonName
      "",                                        // AA: TradePersonEmail
      "",                                        // AB: TradePersonPhone
      "",                                        // AC: ValidUntil
      "",                                        // AD: AdminDecision
      "",                                        // AE: AdminDecisionTimeStamp
      "",                                        // AF: CustomerDecision
      "",                                        // AG: CustomerDecisionTimeStamp
      "",                                        // AH: AdminPersonStatus
      "",                                        // AI: Decision
      "",                                        // AJ: DecisionTimestamp
    ];

    // Write to Quotes tab
    await appendRowToSheet(sheets, "Quotes", quoteRow);
    console.log(`[QUOTES] Quote enquiry ${quoteId} written to Quotes tab`);

    // Generate quote link for tradesman
    const ts = Date.now();
    const token = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET).update(`${leadId}|${ts}`).digest("hex");
    const quoteLink = `https://${baseUrl}/quote-submit/${leadId}?ts=${ts}&token=${token}`;
    
    console.log(`🔗 Generated quote link: ${quoteLink}`);

    // Email setup
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    // Format rooms for email display
    const roomsHtml = `<li><b>Project Type:</b> ${projectType}</li><li><b>Number of Rooms:</b> ${roomCount}</li><li><b>Estimated Area:</b> ${parseInt(roomCount) * 10} square meters</li>`;

    // Create email content
    const leadDetailsHtml = `
      <p>A new quote enquiry has been received with the following details:</p>
      <ul>
        <li><b>Lead ID:</b> ${leadId}</li>
        <li><b>Quote ID:</b> ${quoteId}</li>
        <li><b>Customer Name:</b> ${name}</li>
        <li><b>Email:</b> ${finalEmail}</li>
        <li><b>Phone:</b> ${phone || "Not provided"}</li>
        <li><b>Service:</b> ${projectType}</li>
        <li><b>Location:</b> ${location}</li>
        <li><b>Timeline:</b> ${timeline || "Not specified"}</li>
        ${roomsHtml}
        <li><b>Source:</b> Contact Page Quote Enquiry</li>
      </ul>
    `;

    // Send emails
    try {
      // Customer confirmation email
      await transporter.sendMail({
        from: `"Heat.nz" <${process.env.GMAIL_USER}>`,
        to: finalEmail,
        subject: "✅ We've Received Your Quote Enquiry!",
        html: `
          <p>Hi ${name},</p>
          <p>Thanks for your quote enquiry for your ${projectType} project. We've received your project details and a tradesperson will be in touch with a detailed quote shortly.</p>
          <p><strong>Quote Reference:</strong> ${quoteId}</p>
          <p>For your records, here are the details you provided:</p>
          ${leadDetailsHtml}
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Heat.nz Team</p>
        `,
      });

      // Tradesman notification email
      await transporter.sendMail({
        from: `"Heat.nz Leads" <${process.env.GMAIL_USER}>`,
        to: process.env.TRADESPERSON_EMAIL,
        subject: `🏠 New Quote Enquiry (${roomCount} Rooms): ${location}`,
        html: `
          <h1>New Quote Enquiry Received (#${leadId})</h1>
          ${leadDetailsHtml}
          <p><strong>Quote Submission Link:</strong> <a href="${quoteLink}">Submit Your Quote Now</a></p>
          <p><strong>Manual Quote Link:</strong> <a href="${baseUrl}/contact?access=tradesman">Access Manual Quote Form</a></p>
          <p>This is a large project with ${roomCount} rooms. Please prepare a detailed quote for this customer.</p>
        `,
      });

      // Admin notification email
      await transporter.sendMail({
        from: `"Heat.nz Alerts" <${process.env.GMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `New Quote Enquiry: ${name} in ${location}`,
        html: `
          <h1>New Quote Enquiry Logged (#${leadId})</h1>
          ${leadDetailsHtml}
          <p>A quote link has been sent to the tradesperson.</p>
          <p><strong>Quote Link:</strong> <a href="${quoteLink}">View Quote Submission</a></p>
        `,
      });

      console.log('✅ Quote enquiry emails sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending quote enquiry emails:', emailError);
      // Don't fail the request if emails fail
    }

    return res.status(200).json({
      success: true,
      message: "Quote enquiry submitted successfully! We'll get back to you soon.",
      leadId,
      quoteId
    });

  } catch (error) {
    console.error('❌ Quote enquiry error:', error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit quote enquiry. Please try again later."
    });
  }
}
