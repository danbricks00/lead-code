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

  // --- Properly construct and validate the base URL ---
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_BASE_URL is not defined");
    return res.status(500).json({ success: false, error: "Server configuration error: base URL not set" });
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

  const quoteLink = `${baseUrl}/quote-submit/${quoteId}?${queryParams}`;
  console.log("[Lead Intake] Constructed quote link:", quoteLink); // Log for debugging

  try {
    // Append lead info to "Leads" tab
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

    // Append initial quote info to "Quotes" tab
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
      "", "", "", "", "", "", "", "",
      "", "",
    ]);

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Emails
    const customerMail = {
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: "✅ We received your request",
      html: `<p>Hi ${customerName},</p><p>Thanks for reaching out about <b>${serviceType}</b>. A trade professional will prepare a quote.</p>`,
    };

    const tradepersonMail = {
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "quangbui0600@gmail.com",
      subject: `🔔 New Lead: ${serviceType}`,
      html: `<p>You have a new lead for ${customerName}.</p><p><b>Prepare a quote here:</b> <a href="${quoteLink}">${quoteLink}</a></p>`,
    };

    const adminMail = {
      from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
      to: "danbricks18@gmail.com",
      subject: `Lead recorded: #${leadId}`,
      text: `New lead recorded for ${customerName}. Quote Link: ${quoteLink}`,
    };

    // Send emails
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
