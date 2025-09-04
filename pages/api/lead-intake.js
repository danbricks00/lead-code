import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

// --- Helper Functions with Enhanced Logging ---

async function getSheetsClient() {
  console.log("Initializing Google Sheets client...");
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.error("❌Sheets Auth Error: GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set.");
    throw new Error("Google Sheets authentication credentials are missing.");
  }
  
  const auth = new google.auth.JWT(clientEmail, null, privateKey, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);

  console.log("Google Sheets client initialized successfully.");
  return google.sheets({ version: "v4", auth });
}

async function appendRowToSheet(sheets, tab, values) {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    console.error("❌Sheets Config Error: GOOGLE_SHEET_ID is not set.");
    throw new Error("Google Sheet ID is not configured.");
  }
  
  try {
    console.log(`Attempting to append row to tab: ${tab}`);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
    console.log(`✅ Successfully appended row to tab: ${tab}`);
  } catch (error) {
    console.error(`❌ Google Sheets API Error while appending to ${tab}:`, error.message);
    if (error.response && error.response.data) {
        console.error("Full Sheets API response:", error.response.data);
    }
    throw new Error("Failed to write data to Google Sheet.");
  }
}

// --- API Handler ---
export default async function handler(req, res) {
  console.log("\n--- New Lead Intake Request ---");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request Body:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const {
    customerName, customerEmail, customerPhone, serviceType, rooms, 
    area, suburb, timeline,
  } = req.body;

  if (!customerName || !customerEmail) {
    console.error("Validation Error: Missing customerName or customerEmail.");
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const leadId = crypto.randomBytes(6).toString("hex");
    const quoteId = crypto.randomBytes(6).toString("hex");

    // 1. Log to Google Sheets
    const sheets = await getSheetsClient();
    
    // Log to "Leads" tab, matching the required header order
    console.log("Appending data to 'Leads' tab...");
    await appendRowToSheet(sheets, "Leads", [
      leadId,
      customerName,
      customerEmail,
      customerPhone || "",
      serviceType || "Underfloor Heating",
      JSON.stringify(rooms) || "[]",
      area || "",
      suburb || "",
      "", // Budget
      timeline || "",
      "", // Specific Details
      new Date().toISOString(), // Timestamp
    ]);

    // Log to "Quotes" tab, matching the required header order
    console.log("Appending data to 'Quotes' tab...");
    await appendRowToSheet(sheets, "Quotes", [
        quoteId,
        leadId,
        "", // Tradesperson Name
        "", // Tradesperson Email
        "", // Tradesperson Phone
        "Quote Pending", // Customer Status
        "Not Submitted", // Tradesperson Status
        "Not Required", // Admin Status
        "", // Xero Quote ID
        "", // Labour Cost
        "", // Labour Hours
        "", // Materials Cost
        "", // Materials Quantity
        "", // Travel Cost
        "", // Travel Distance
        "", // Installation Cost
        "", // Total Quote
        "", // Notes
        "", // Quote Valid Until
        "", // Resubmission Allowed
    ]);


    // 2. Prepare Email Content
    console.log("Step 3: Preparing email content...");
    const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!rawBaseUrl) {
      console.error("❌ CRITICAL: NEXT_PUBLIC_BASE_URL is not defined.");
      throw new Error("Server configuration error: base URL not set.");
    }
    const baseUrl = rawBaseUrl.replace(/^(https?:\/\/)/, '');
    
    const ts = Date.now();
    const token = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET).update(`${quoteId}|${ts}`).digest("hex");
    const quoteLink = `https://${baseUrl}/quote-submit/${quoteId}?ts=${ts}&token=${token}`;
    console.log("Constructed quote link:", quoteLink);

    // Format rooms for email display
    const roomsHtml = (rooms && rooms.length > 0)
      ? `<li><b>Room Details:</b><ul>${rooms.map(room => `<li>${room.name || 'Unnamed'}: ${room.dimensions || 'N/A'}</li>`).join('')}</ul></li>`
      : '';

    const leadDetailsHtml = `
      <p>A new lead has been received with the following details:</p>
      <ul>
        <li><b>Lead ID:</b> ${leadId}</li>
        <li><b>Customer Name:</b> ${customerName}</li>
        <li><b>Email:</b> ${customerEmail}</li>
        <li><b>Phone:</b> ${customerPhone || "Not provided"}</li>
        <li><b>Service:</b> ${serviceType || "Underfloor Heating"}</li>
        <li><b>Location:</b> ${suburb || ""}${suburb && area ? ", " : ""}${area || ""}</li>
        <li><b>Timeline:</b> ${timeline || "Not specified"}</li>
        ${roomsHtml}
      </ul>
    `;

    const gamifyStatus = `
      <hr>
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>⚪ Quote Pending</li>
        <li>⚪ Decision Pending</li>
      </ul>
    `;
    
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // CORRECTED from GMAIL_PASS
      },
    });

    const customerMail = {
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      subject: "✅ We've Received Your Underfloor Heating Quote Request!",
      html: `<p>Hi ${customerName},</p><p>Thanks for your request. We've received your project details and a tradesperson will be in touch with a quote shortly.</p><p>For your records, here are the details you provided:</p>${leadDetailsHtml}${gamifyStatus}`,
    };

    const tradespersonMail = {
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "quangbui0600@gmail.com", // This should be a dynamic tradesperson email
      subject: `🔔 New Underfloor Heating Lead: ${suburb || area}`,
      html: `<h1>New Lead Received</h1>${leadDetailsHtml}<p>Please prepare a quote for this customer by clicking the link below:</p><h2><a href="${quoteLink}">Submit Your Quote Now</a></h2>`,
    };

    const adminMail = {
      from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
      to: "danbricks18@gmail.com",
      subject: `New Lead Logged: ${customerName} in ${suburb || area}`,
      html: `<h1>New Lead Logged (#${leadId})</h1>${leadDetailsHtml}<p>A quote link has been sent to the tradesperson.</p><p>Quote Link: ${quoteLink}</p>`,
    };

    // 3. Send Emails
    console.log("Step 4: Dispatching emails...");
    await transporter.sendMail(customerMail);
    console.log(`- Customer email sent to ${customerEmail}`);
    await transporter.sendMail(tradespersonMail);
    console.log("- Tradesperson email sent.");
    await transporter.sendMail(adminMail);
    console.log("- Admin email sent.");

    console.log("--- Lead Intake Request Succeeded ---");
    return res.status(200).json({ success: true, quoteId, leadId });

  } catch (error) {
    console.error("--- Lead Intake Request Failed ---");
    console.error("Error Timestamp:", new Date().toISOString());
    console.error("Caught Error:", error.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
