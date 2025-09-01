import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- HELPER: GOOGLE SHEETS ---
async function getSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('[Lead Intake] ERROR: Failed to create Google Sheets client:', error);
    throw new Error('Failed to authenticate with Google Sheets.');
  }
}

// --- HELPER: CRYPTO & LINKS ---
function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

function generateSignedQuoteLink(leadId, quoteId, customerEmail) {
  const secret = process.env.QUOTE_LINK_SECRET;
  if (!secret) {
    throw new Error('QUOTE_LINK_SECRET environment variable is not set.');
  }
  const payload = JSON.stringify({ leadId, quoteId, customerEmail });
  const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/quote-form.html?payload=${encodeURIComponent(payload)}&token=${token}`;
}

// --- HELPER: NODEMAILER ---
async function sendInitialEmails(details) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const { customer, tradesperson, admin, quoteLink } = details;
  
  await Promise.all([
    transporter.sendMail({
      to: customer.email,
      subject: `✅ We've received your request for ${customer.service}`,
      html: `<p>Hi ${customer.name},</p><p>Thanks for your request. A tradesperson will prepare a quote for you shortly.</p>`,
    }),
    transporter.sendMail({
      to: tradesperson.email,
      subject: `🔔 New Lead: ${customer.service}`,
      html: `<p>New lead received. Please prepare a quote.</p><a href="${quoteLink}">Submit Quote Now</a>`,
    }),
    transporter.sendMail({
      to: admin.email,
      subject: `[Review] New Lead: #${details.customer.leadId}`,
      text: `New lead received for ${customer.service}.`,
    })
  ]);
}

// --- API HANDLER ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // Log the entire request body at the start for debugging
    console.log("[Lead Intake] Request body:", req.body);

    const { name, email, phone, service, details, area, suburb } = req.body;
    
    // Validate that name, email, and service are present and not undefined
    if (!name || !email || !service) {
      console.log("[Lead Intake] Validation failed: Missing required fields.", { name, email, service });
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // If validation passes, proceed with the existing lead intake logic
    const leadId = generateId('lead');
    const quoteId = generateId('quote');
    
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Write to "Leads" Tab
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: 'Leads!A:Z', valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[new Date().toISOString(), leadId, name, email, phone, service, details, area, suburb]] },
    });
    
    // Write to "Quotes" Tab
    const quoteLink = generateSignedQuoteLink(leadId, quoteId, email);
    const tradesmanInfo = { name: 'Quang Bui', email: 'quangbui0600@gmail.com' };
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: 'Quotes!A:Z', valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[
        quoteId, leadId, name, email, tradesmanInfo.name, tradesmanInfo.email, quoteLink,
        "Confirmation Request", "Lead Request", "Pending Review", "No",
        '', '', '', '', '', '', '', '', '', ''
      ]] },
    });

    // Send Emails
    await sendInitialEmails({
      customer: { name, email, service, leadId },
      tradesperson: tradesmanInfo,
      admin: { email: 'danbricks18@gmail.com' },
      quoteLink,
    });

    return res.status(200).json({ success: true, leadId, quoteId });

  } catch (error) {
    // Catch and log any unexpected errors
    console.error('[Lead Intake] CRITICAL ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
}
