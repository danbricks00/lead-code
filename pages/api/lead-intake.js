import { getGoogleSheetsClient } from '../../lib/googleSheets.js';
import { assertLeadWriteOnly } from '../../utils/writeGuard.js';
import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * Clean Lead Intake API - Leads Tab Only
 * Writes ONLY to Leads tab, never touches Quotes tab
 */

async function appendRowToSheet(sheets, tab, values) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
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
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Write guard - ensure only Leads tab writes
    assertLeadWriteOnly({ req, caller: 'lead-intake' });

    const {
      customerName, customerEmail, customerPhone, serviceType, rooms, 
      area, suburb, timeline, budget, specificDetails, projectDetails,
      isUnlistedSuburb, suburbAdditionalInfo
    } = req.body;

    console.log('[LEAD-INTAKE] Received rooms data:', rooms);
    console.log('[LEAD-INTAKE] Rooms type:', typeof rooms);

    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const leadId = crypto.randomBytes(6).toString("hex");
    const sheets = getGoogleSheetsClient();
    
    // Exact Leads schema mapping - single append operation
    const leadRow = [
      leadId,                                    // Lead
      customerName,                              // CustomerName
      customerEmail,                             // CustomerEmail
      customerPhone || "",                       // CustomerPhone
      serviceType || "Underfloor Heating",       // ServiceType
      JSON.stringify(rooms || []),               // Rooms
      area || "",                                // Area
      suburb || "",                              // Suburb
      budget || "",                              // Budget
      timeline || "",                            // Timelline (note exact spelling)
      specificDetails || projectDetails || "",   // Specfic Details (note exact spelling)
      new Date().toLocaleString('en-NZ', {
        timeZone: 'Pacific/Auckland',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),                                        // Time
      "",                                        // (Column M - empty)
      "New Lead",                                // status
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

    // Format rooms for email display
    const roomsHtml = (rooms && rooms.length > 0)
      ? `<li><b>Room Details:</b><ul>${rooms.map(room => `<li>${room.name || 'Unnamed'}: ${room.dimensions || 'N/A'}</li>`).join('')}</ul></li>`
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
        <li><b>Email:</b> ${customerEmail}</li>
        <li><b>Phone:</b> ${customerPhone || "Not provided"}</li>
        <li><b>Service:</b> ${serviceType || "Underfloor Heating"}</li>
        <li><b>Location:</b> ${suburb || ""}${suburb && area ? ", " : ""}${area || ""}</li>
        <li><b>Budget:</b> ${budget || "Not specified"}</li>
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
    
    // Customer confirmation email
    await transporter.sendMail({
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: "✅ We've Received Your Underfloor Heating Quote Request!",
      html: `<p>Hi ${customerName},</p><p>Thanks for your request. We've received your project details and a tradesperson will be in touch with a quote shortly.</p><p>For your records, here are the details you provided:</p>${leadDetailsHtml}`,
    });

    // Tradesperson notification email
    await transporter.sendMail({
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "quangbui0600@gmail.com",
      subject: `${unlistedPrefix}🔔 New Underfloor Heating Lead: ${suburb || area}`,
      html: `<h1>New Lead Received</h1>${leadDetailsHtml}<p>Please prepare a quote for this customer by clicking the link below:</p><h2><a href="${quoteLink}">Submit Your Quote Now</a></h2>`,
    });

    // Admin notification email
    await transporter.sendMail({
      from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
      to: "danbricks18@gmail.com",
      subject: `${unlistedPrefix}New Lead Logged: ${customerName} in ${suburb || area}`,
      html: `<h1>New Lead Logged (#${leadId})</h1>${leadDetailsHtml}<p>A quote link has been sent to the tradesperson.</p><p>Quote Link: ${quoteLink}</p>`,
    });

    return res.status(200).json({ 
      success: true, 
      leadId: leadId,
      message: 'Lead submitted successfully' 
    });

  } catch (error) {
    console.error("Lead intake error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}