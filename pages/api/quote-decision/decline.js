import { google } from "googleapis";
import nodemailer from "nodemailer";

const sheets = google.sheets({ version: "v4" });

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const {
    quoteId,
    customerName,
    customerEmail,
    tradespersonName,
    tradespersonEmail,
    decisionTimestamp,
  } = req.body;

  if (!quoteId || !customerEmail) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const auth = await getAuthClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = "QUOTE";

    // Read all rows from QUOTE tab
    const getResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: `${sheetName}!A2:AD`, // Columns A to AD (30 columns)
    });

    const rows = getResponse.data.values || [];

    // Find row with matching quoteId (assuming quoteId in column A, index 0)
    const rowIndex = rows.findIndex(row => row[0] === quoteId);

    if (rowIndex === -1) {
      return res.status(404).json({ success: false, error: "Quote ID not found" });
    }

    // Check if decision already exists in column AC (index 28)
    const existingDecision = rows[rowIndex][28];

    if (existingDecision && existingDecision.trim() !== "") {
      return res.status(400).json({ success: false, error: "Decision already made for this quote" });
    }

    const decision = "Declined";
    const decisionTime = decisionTimestamp || new Date().toISOString();

    // Write decision to column AC (29th column)
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `${sheetName}!AC${rowIndex + 2}`, // +2 for header offset
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[decision]],
      },
    });

    // Write decision timestamp to column AD (30th column)
    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `${sheetName}!AD${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[decisionTime]],
      },
    });

    // Send emails with gamification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const gamifyStatusCustomer = `
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>✅ Quote Sent</li>
        <li>❌ Declined</li>
      </ul>
    `;

    const gamifyStatusTradesperson = `
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>✅ Quote Sent</li>
        <li>❌ Declined</li>
      </ul>
    `;

    const customerMailOptions = {
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: "Your Quote Has Been Declined",
      html: `
        <p>Hi ${customerName},</p>
        <p>Your quote has been <strong>declined</strong> on ${decisionTime}.</p>
        ${gamifyStatusCustomer}
      `,
    };

    const tradespersonMailOptions = {
      from: process.env.GMAIL_USER,
      to: tradespersonEmail,
      subject: `Quote for ${customerName} Has Been Declined`,
      html: `
        <p>Hi ${tradespersonName},</p>
        <p>Your quote has been <strong>declined</strong> by the customer on ${decisionTime}.</p>
        ${gamifyStatusTradesperson}
      `,
    };

    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(tradespersonMailOptions);

    return res.status(200).json({ success: true, message: "Decline recorded and emails sent" });
  } catch (error) {
    console.error("Decline API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}