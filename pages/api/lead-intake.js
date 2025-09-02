import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

const sheetsId = process.env.GOOGLE_SHEET_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const QUOTE_LINK_SECRET = process.env.QUOTE_LINK_SECRET;

const auth = new google.auth.JWT(clientEmail, null, privateKey, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

const sheets = google.sheets({ version: "v4", auth });

function generateId() {
  return crypto.randomBytes(6).toString("hex");
}

function signToken(id, ts) {
  const hmac = crypto.createHmac("sha256", QUOTE_LINK_SECRET);
  hmac.update(`${id}.${ts}`);
  return hmac.digest("hex");
}

async function appendRowToSheet(tab, values) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsId,
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
}

async function sendEmail(transporter, mailOptions) {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}: ${info.response}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${mailOptions.to}:`, error);
    return { success: false, error };
  }
}

export default async function handler(req, res) {
  console.log("[Lead Intake] Request body:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceType,
    rooms,
    area,
    suburb,
    budget,
    timeline,
    specificDetails,
  } = req.body;

  if (!customerName || !customerEmail || !serviceType) {
    console.log("[Lead Intake] Validation failed: Missing required fields.", {
      customerName,
      customerEmail,
      serviceType,
    });
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const leadId = generateId();
  const quoteId = generateId();
  const issuedAt = Date.now().toString();
  const token = signToken(quoteId, issuedAt);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("❌ CRITICAL: NEXT_PUBLIC_BASE_URL is not defined in environment variables.");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error: The base URL is not set, cannot generate links." 
    });
  }

  const queryParams = new URLSearchParams({
    customerName,
    customerEmail,
    customerPhone: customerPhone || "",
    serviceType,
    rooms: JSON.stringify(rooms || []),
    area: area || "",
    suburb: suburb || "",
    budget: budget || "",
    timeline: timeline || "",
    specificDetails: specificDetails || "",
    token,
    ts: issuedAt,
  }).toString();
  
  const quoteLink = `https://${baseUrl}/quote-submit/${quoteId}?${queryParams}`;
  console.log("✅ [Lead Intake] Constructed quote submission link:", quoteLink);

  try {
    await appendRowToSheet("Leads", [
      leadId,
      customerName,
      customerEmail,
      customerPhone || "",
      serviceType,
      JSON.stringify(rooms || []),
      area || "",
      suburb || "",
      budget || "",
      timeline || "",
      specificDetails || "",
      new Date().toISOString(),
    ]);

    await appendRowToSheet("Quotes", [
      quoteId,
      leadId,
      customerName,
      customerEmail,
      "Tradeperson Name",
      "quangbui0600@gmail.com",
      quoteLink,
      "Confirmation Request",
      "Lead Request",
      "Pending Review",
      "No",
    ]);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const leadDetailsHtml = `
      <ul>
        <li><b>Name:</b> ${customerName}</li>
        <li><b>Email:</b> ${customerEmail}</li>
        <li><b>Phone:</b> ${customerPhone || "Not provided"}</li>
        <li><b>Service:</b> ${serviceType}</li>
        <li><b>Area/Suburb:</b> ${suburb || area || "Not specified"}</li>
        <li><b>Budget:</b> ${budget || "Not specified"}</li>
        <li><b>Timeline:</b> ${timeline || "Not specified"}</li>
        <li><b>Rooms:</b> ${rooms ? JSON.stringify(rooms) : "Not specified"}</li>
        <li><b>Details:</b> ${specificDetails || "No extra details"}</li>
      </ul>
    `;

    const customerMail = {
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: "✅ We received your request",
      html: `
        <p>Hi ${customerName},</p>
        <p>Thanks for reaching out about <b>${serviceType}</b>. A trade professional will prepare a quote and send it to you shortly.</p>
        <p><small>Request ID: ${leadId}</small></p>
        <hr>
        <p><b>Here is a summary of your request:</b></p>
        ${leadDetailsHtml}
        <hr>
        <p><b>Status:</b></p>
        <p>
          <span style="color:green;">✅ Confirmation Request</span> &nbsp;&nbsp;
          <span>⚪ Quote Received</span> &nbsp;&nbsp;
          <span>⚪ Decision</span>
        </p>
      `,
    };

    const tradepersonMail = {
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "quangbui0600@gmail.com",
      subject: `🔔 New Lead: ${serviceType} (${suburb || area || "Unknown location"})`,
      html: `
        <p>You have a new lead for a ${serviceType} job.</p>
        <p><b>Customer Details:</b></p>
        ${leadDetailsHtml}
        <p><b>Please prepare a quote here:</b> <a href="${quoteLink}" style="font-weight:bold;color:#007bff;">Submit Quote Now</a></p>
        <p><small>This link is unique and signed; no login is required.</small></p>
        <hr>
        <p><b>Status:</b></p>
        <p>
          <span style="color:green;">✅ Lead Received</span> &nbsp;&nbsp;
          <span>⚪ Quote Sent</span> &nbsp;&nbsp;
          <span>⚪ Quote Decision</span>
        </p>
      `,
    };

    const adminMail = {
      from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
      to: "danbricks18@gmail.com",
      subject: `Lead recorded on site: #${leadId}`,
      text: `A new lead has been recorded:\n\n${leadDetailsHtml.replace(/<li><b>/g, '').replace(/<\/b>:/g, ':').replace(/<\/li>/g, '\n').replace(/<ul>/g, '').replace(/<\/ul>/g, '')}\nQuote Link: ${quoteLink}`,
    };

    const customerResult = await sendEmail(transporter, customerMail);
    const tradepersonResult = await sendEmail(transporter, tradepersonMail);
    const adminResult = await sendEmail(transporter, adminMail);

    if (customerResult.success && tradepersonResult.success && adminResult.success) {
      return res.status(200).json({ success: true, leadId, quoteId, quoteLink });
    } else {
      return res.status(500).json({
        success: false,
        error: "Failed to send one or more emails.",
        details: { customerResult, tradepersonResult, adminResult },
      });
    }
  } catch (error) {
    console.error("[Lead Intake] Error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
