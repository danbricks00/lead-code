import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

const sheetsId = process.env.GOOGLE_SHEET_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

const auth = new google.auth.JWT(clientEmail, null, privateKey, [
  "https://www.googleapis.com/auth/spreadsheets",
]);

const sheets = google.sheets({ version: "v4", auth });

async function appendRowToSheet(tab, values) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetsId,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
    console.log(`✅ Lead logged to Google Sheets tab: ${tab}`);
  } catch (error) {
    console.error(`❌ Failed to log lead to Google Sheets tab: ${tab}`, error);
    // We can decide if we want to throw the error or just log it
    // For now, let's just log it and continue to send emails
  }
}

export default async function handler(req, res) {
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

  if (!customerName || !customerEmail) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const leadId = crypto.randomBytes(6).toString("hex");
    const quoteId = crypto.randomBytes(6).toString("hex");

    // --- Google Sheets Logging ---
    await appendRowToSheet("Leads", [
      leadId,
      customerName,
      customerEmail,
      customerPhone || "",
      serviceType || "",
      rooms || "",
      area || "",
      suburb || "",
      budget || "",
      timeline || "",
      specificDetails || "",
      new Date().toISOString(),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL is not defined");
      return res.status(500).json({ success: false, error: "Server configuration error: base URL not set" });
    }

    const queryParams = new URLSearchParams({
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
    }).toString();

    const quoteLink = `https://${baseUrl}/quote-submit/${quoteId}?${queryParams}`;

    console.log("Tradesperson quote submission link:", quoteLink);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Gamification status HTML for step 1
    const gamifyStatusCustomer = `
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>⚪ Quote Sent</li>
        <li>⚪ Decision Pending</li>
      </ul>
    `;

    const gamifyStatusTradesperson = `
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>⚪ Quote Sent</li>
        <li>⚪ Decision Pending</li>
      </ul>
    `;

    // Customer email
    const customerMailOptions = {
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: "Your Lead Has Been Received",
      html: `
        <p>Hi ${customerName},</p>
        <p>Thank you for your interest. A qualified tradesperson will contact you soon.</p>
        ${gamifyStatusCustomer}
      `,
    };

    // Tradesperson email
    const tradespersonMailOptions = {
      from: process.env.GMAIL_USER,
      to: "quangbui0600@gmail.com",
      subject: `New Lead: ${customerName}`,
      html: `
        <p>You have a new lead:</p>
        <ul>
          <li><strong>Name:</strong> ${customerName}</li>
          <li><strong>Email:</strong> ${customerEmail}</li>
          <li><strong>Phone:</strong> ${customerPhone}</li>
          <li><strong>Service Type:</strong> ${serviceType}</li>
          <li><strong>Rooms:</strong> ${rooms}</li>
          <li><strong>Area:</strong> ${area}</li>
          <li><strong>Suburb:</strong> ${suburb}</li>
          <li><strong>Budget:</strong> ${budget}</li>
          <li><strong>Timeline:</strong> ${timeline}</li>
          <li><strong>Details:</strong> ${specificDetails}</li>
        </ul>
        <p><a href="${quoteLink}">Click here to submit your quote</a></p>
        ${gamifyStatusTradesperson}
      `,
    };

    // Admin email (optional)
    const adminMailOptions = {
      from: process.env.GMAIL_USER,
      to: "danbricks18@gmail.com",
      subject: `Lead Submitted: ${customerName}`,
      html: `
        <p>A new lead has been submitted:</p>
        <ul>
          <li><strong>Name:</strong> ${customerName}</li>
          <li><strong>Email:</strong> ${customerEmail}</li>
          <li><strong>Phone:</strong> ${customerPhone}</li>
          <li><strong>Service Type:</strong> ${serviceType}</li>
          <li><strong>Rooms:</strong> ${rooms}</li>
          <li><strong>Area:</strong> ${area}</li>
          <li><strong>Suburb:</strong> ${suburb}</li>
          <li><strong>Budget:</strong> ${budget}</li>
          <li><strong>Timeline:</strong> ${timeline}</li>
          <li><strong>Details:</strong> ${specificDetails}</li>
        </ul>
        <p>Quote submission link: <a href="${quoteLink}">${quoteLink}</a></p>
      `,
    };

    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(tradespersonMailOptions);
    await transporter.sendMail(adminMailOptions);

    return res.status(200).json({ success: true, quoteId, leadId });
  } catch (error) {
    console.error("Lead intake error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
