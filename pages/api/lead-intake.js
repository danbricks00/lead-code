import { getGoogleSheetsClient } from '../../lib/googleSheets.js';
import { assertLeadWriteOnly } from '../../utils/writeGuard.js';
import { validateAndCorrectEmail, logEmailValidation } from '../../utils/emailValidator.js';
import { validateFreestyleSuburb } from '../../utils/freestyleSuburbValidation.js';
import nodemailer from "nodemailer";
import crypto from "crypto";

const leadIntakeRateLimitStore = new Map();
const LEAD_INTAKE_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

/**
 * Clean Lead Intake API - Leads Tab Only
 * Writes ONLY to Leads tab, never touches Quotes tab
 */

async function appendRowToSheet(sheets, tab, values) {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("Google Sheet ID is not configured.");
  }
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

export default async function handler(req, res) {
  const requestId = `lead-intake-${Date.now()}`;
  
  console.log(JSON.stringify({ 
    tag: 'ROUTE_REQ_START', 
    route: 'lead-intake', 
    method: req.method,
    requestId,
    timestamp: new Date().toISOString()
  }));
  
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Write guard - ensure only Leads tab writes
    assertLeadWriteOnly({ req, caller: 'lead-intake' });

    const clientIp = getClientIp(req);
    const now = Date.now();
    const lastRequestAt = leadIntakeRateLimitStore.get(clientIp) || 0;
    if (now - lastRequestAt < LEAD_INTAKE_RATE_LIMIT_WINDOW_MS) {
      return res.status(429).json({
        error: "Too many requests, please try again in a minute.",
      });
    }
    leadIntakeRateLimitStore.set(clientIp, now);

    for (const [ip, timestamp] of leadIntakeRateLimitStore.entries()) {
      if (now - timestamp >= LEAD_INTAKE_RATE_LIMIT_WINDOW_MS) {
        leadIntakeRateLimitStore.delete(ip);
      }
    }

    const {
      customerName, customerEmail, customerPhone, serviceType, rooms, 
      area, suburb, timeline, budget, specificDetails, projectDetails,
      isUnlistedSuburb, suburbAdditionalInfo, website
    } = req.body;

    // Honeypot trap: real users never fill this hidden field
    if (typeof website === "string" && website.trim() !== "") {
      console.warn(`[LEAD-INTAKE] Honeypot triggered for request ${requestId}`);
      return res.status(400).json({ error: "Invalid submission." });
    }

    console.log('[LEAD-INTAKE] Received rooms data:', rooms);
    console.log('[LEAD-INTAKE] Rooms type:', typeof rooms);

    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (isUnlistedSuburb && suburb) {
      const suburbCheck = validateFreestyleSuburb(suburb);
      if (!suburbCheck.valid) {
        return res.status(400).json({ error: suburbCheck.error });
      }
    }

    // Smart email validation with autocorrect and MX checking
    const emailValidation = await validateAndCorrectEmail(customerEmail, true);
    logEmailValidation('EMAIL_VALIDATION', emailValidation, 'lead-intake');
    
    if (!emailValidation.isValid) {
      console.log("❌ Lead intake validation failed - invalid email format");
      return res.status(400).json({
        error: emailValidation.error
      });
    }
    
    // Use corrected email if available
    const finalCustomerEmail = emailValidation.correctedEmail || customerEmail;
    
    // Log if email was corrected
    if (emailValidation.needsCorrection) {
      console.log(`📧 Email autocorrected: ${customerEmail} → ${finalCustomerEmail}`);
    }

    const leadId = crypto.randomBytes(6).toString("hex");
    const sheets = getGoogleSheetsClient();
    
    // Construct the full address from suburb and area (zone) - no street address
    const fullAddress = [suburb, area].filter(Boolean).join(', ');

    // Exact Leads schema mapping - single append operation
    const leadRow = [
      leadId,                                    // A: Lead ID
      customerName,                              // B: CustomerName
      finalCustomerEmail,                        // C: CustomerEmail (corrected)
      customerPhone || "",                       // D: CustomerPhone
      serviceType || "Underfloor Heating",       // E: ServiceType
      JSON.stringify(rooms || []),               // F: Rooms
      area || "",                                // G: Area (Zone)
      suburb || "",                              // H: Suburb
      "0",                                       // I: Budget (removed from chatbot, always 0)
      timeline || "",                            // J: Timeline
      specificDetails || projectDetails || "",   // K: Specific Details
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

    // Single write operation - Leads tab only
    await appendRowToSheet(sheets, "Leads", leadRow);
    console.log(`[LEADS] Lead ${leadId} written to Leads tab only`);

    // Email handling (keep existing logic)
    const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!rawBaseUrl) {
      throw new Error("Server configuration error: base URL not set.");
    }
    const baseUrl = rawBaseUrl.replace(/^(https?:\/\/)/, '');
    
    const ts = Date.now();
    const token = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET).update(`${leadId}|${ts}`).digest("hex");
    const quoteLink = `https://${baseUrl}/quote-submit/${leadId}?ts=${ts}&token=${token}`;
    
    // Debug: Log the quote link
    console.log('🔗 Generated quote link:', quoteLink);
    console.log('🔗 Quote link length:', quoteLink.length);
    console.log('🔗 Quote link is undefined?', quoteLink === undefined);
    console.log('🔗 Quote link is empty?', quoteLink === '');

    // Format rooms for email display
    const roomsHtml = (rooms && rooms.length > 0)
      ? `<li><b>Room Details:</b><ul>${rooms.map(room => {
          const dimensions = room.dimensions || 'N/A';
          const sqm = room.sqm || 'N/A';
          if (dimensions === 'N/A' || sqm === 'N/A') {
            return `<li>${room.name || 'Unnamed'}: ${dimensions}</li>`;
          }
          return `<li>${room.name || 'Unnamed'}: ${dimensions} (${sqm} square meters)</li>`;
        }).join('')}</ul></li>`
      : '';

    // Unlisted suburb warning
    const unlistedSuburbWarning = isUnlistedSuburb ? `
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="color: #856404; margin-top: 0;">🚨 UNLISTED SUBURB ALERT</h3>
        <p><strong>Suburb:</strong> ${suburb}</p>
        <p><strong>Status:</strong> This suburb is not in our current service list</p>
        <p><strong>Action Required:</strong> Please review if we can service this area or reject the lead</p>
        
        <div style="margin-top: 15px; text-align: center;">
          <a href="https://${baseUrl}/admin-unlisted-suburbs.html" 
             style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">
            📋 Manage Unlisted Suburbs
          </a>
        </div>
      </div>
    ` : '';

    const leadDetailsHtml = `
      <p>A new lead has been received with the following details:</p>
      ${unlistedSuburbWarning}
      <ul>
        <li><b>Lead ID:</b> ${leadId}</li>
        <li><b>Customer Name:</b> ${customerName}</li>
        <li><b>Email:</b> ${finalCustomerEmail}</li>
        <li><b>Phone:</b> ${customerPhone || "Not provided"}</li>
        <li><b>Service:</b> ${serviceType || "Underfloor Heating"}</li>
        <li><b>Location:</b> ${suburb}, ${area}</li>
        <li><b>Timeline:</b> ${timeline || "Not specified"}</li>
        ${roomsHtml}
        ${isUnlistedSuburb ? `<li><b>⚠️ Unlisted Suburb:</b> ${suburb} (not in service list)</li>` : ''}
      </ul>
    `;

    // Send emails
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const unlistedPrefix = isUnlistedSuburb ? "🚨 UNLISTED SUBURB - " : "";
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim();
    const ccEmail = (process.env.TRADESPERSON_EMAIL || process.env.ADMIN_EMAIL || "").trim();
    const tradesLeadBcc = (process.env.TRADES_LEAD_BCC || process.env.ADMIN_EMAIL || "").trim();
    const tradesLeadTo = ccEmail;

    console.log("📬 Resolved mail routing:", {
      toTradesperson: tradesLeadTo || "NOT SET",
      cc: ccEmail || "NOT SET",
      bcc: tradesLeadBcc || "NOT SET",
      source: {
        TRADESPERSON_EMAIL: process.env.TRADESPERSON_EMAIL ? "SET" : "MISSING",
        TRADES_LEAD_BCC: process.env.TRADES_LEAD_BCC ? "SET" : "MISSING",
        ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "SET" : "MISSING",
      },
    });
    
    // Customer confirmation email
    const customerEmailOptions = {
      from: `"Heat.nz" <${process.env.GMAIL_USER}>`,
      to: finalCustomerEmail,
      subject: "✅ We've Received Your Underfloor Heating Quote Request!",
      html: `<p>Hi ${customerName},</p><p>Thanks for your request. We've received your project details and a tradesperson will be in touch with a quote shortly.</p><p>For your records, here are the details you provided:</p>${leadDetailsHtml}`,
    };
    if (ccEmail) customerEmailOptions.cc = ccEmail;
    if (tradesLeadBcc) customerEmailOptions.bcc = tradesLeadBcc;
    await transporter.sendMail(customerEmailOptions);
    console.log(
      `✅ Customer confirmation sent | to=${finalCustomerEmail} cc=${customerEmailOptions.cc || "none"} bcc=${customerEmailOptions.bcc || "none"}`
    );

    // Tradesperson notification email
    console.log('🔗 About to create tradesmanEmailHtml with quoteLink:', quoteLink);
    console.log('🔗 quoteLink type:', typeof quoteLink);
    console.log('🔗 quoteLink is undefined?', quoteLink === undefined);
    console.log('🔗 quoteLink is null?', quoteLink === null);
    console.log('🔗 quoteLink is empty string?', quoteLink === '');
    
    const tradesmanEmailHtml = `<h1>New Lead Received</h1>${leadDetailsHtml}<p>Please prepare a quote for this customer by clicking the link below:</p><h2><a href="${quoteLink}">Submit Your Quote Now</a></h2>`;
    
    console.log('📧 Tradesman email HTML length:', tradesmanEmailHtml.length);
    console.log('📧 Tradesman email HTML preview (last 200 chars):', tradesmanEmailHtml.slice(-200));
    console.log('📧 Quote link in HTML:', tradesmanEmailHtml.includes(quoteLink));
    
    try {
      if (!tradesLeadTo) {
        console.warn('⚠️ TRADESPERSON_EMAIL and ADMIN_EMAIL unset — skipping tradesperson notification');
      } else {
        const tradesEmailOptions = {
          from: `"Heat.nz Leads" <${process.env.GMAIL_USER}>`,
          to: tradesLeadTo,
          subject: `${unlistedPrefix}🔔 New Underfloor Heating Lead: ${suburb || area}`,
          html: `<h1>New Lead Logged (#${leadId})</h1>${leadDetailsHtml}<p>A quote link has been sent to the waiting for your submission.</p><p>Quote Link: ${quoteLink}</p>`,
        };
        if (ccEmail) tradesEmailOptions.cc = ccEmail;
        if (tradesLeadBcc) tradesEmailOptions.bcc = tradesLeadBcc;
        await transporter.sendMail(tradesEmailOptions);
        console.log(
          `✅ Tradesperson lead sent | to=${tradesLeadTo} cc=${tradesEmailOptions.cc || "none"} bcc=${tradesEmailOptions.bcc || "none"}`
        );
      }
    } catch (tradesmanEmailError) {
      console.error('❌ Tradesman email failed:', tradesmanEmailError.message);
      console.error('❌ Tradesman email error details:', tradesmanEmailError);
    }

    // Admin notification email
    try {
      if (!adminEmail) {
        console.warn("⚠️ ADMIN_EMAIL unset — skipping admin notification");
      } else {
        const adminEmailOptions = {
        from: `"Heat.nz Alerts" <${process.env.GMAIL_USER}>`,
        to: adminEmail,
        subject: `${unlistedPrefix}New Lead Logged: ${customerName} in ${suburb || area}`,
        html: `<h1>New Lead Logged (#${leadId})</h1>${leadDetailsHtml}<p>A quote link has been sent to the tradesperson.</p><p>Quote Link: ${quoteLink}</p>`,
        };
        if (ccEmail) adminEmailOptions.cc = ccEmail;
        if (tradesLeadBcc) adminEmailOptions.bcc = tradesLeadBcc;
        await transporter.sendMail(adminEmailOptions);
        console.log(
          `✅ Admin notification sent | to=${adminEmail} cc=${adminEmailOptions.cc || "none"} bcc=${adminEmailOptions.bcc || "none"}`
        );
      }
    } catch (adminEmailError) {
      console.error('❌ Admin email failed:', adminEmailError.message);
      console.error('❌ Admin email error details:', adminEmailError);
    }

    console.log(JSON.stringify({ 
      tag: 'ROUTE_REQ_OK', 
      route: 'lead-intake', 
      leadId,
      requestId,
      timestamp: new Date().toISOString()
    }));
    
    return res.status(200).json({ 
      success: true, 
      leadId: leadId,
      message: 'Lead submitted successfully' 
    });

  } catch (error) {
    console.error(JSON.stringify({ 
      tag: 'ROUTE_REQ_FAIL', 
      route: 'lead-intake', 
      error: error.message,
      requestId,
      timestamp: new Date().toISOString()
    }));
    return res.status(500).json({ error: "Internal server error" });
  }
}