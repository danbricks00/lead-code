import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- HELPER: GOOGLE SHEETS ---
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// --- HELPER: CRYPTO & LINKS ---
function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

function generateSignedQuoteLink(leadId, quoteId, customerEmail) {
  const secret = process.env.QUOTE_LINK_SECRET;
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

  // Email to Customer
  await transporter.sendMail({
    from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: customer.email,
    subject: `✅ We've received your request for ${customer.service}`,
    html: `<p>Hi ${customer.name},</p><p>Thanks for your request. We have assigned a tradesperson who will prepare a quote for you shortly.</p><p>Your Lead ID is: ${customer.leadId}</p>`,
  });

  // Email to Tradesperson
  await transporter.sendMail({
    from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
    to: tradesperson.email,
    subject: `🔔 New Lead: ${customer.service} in ${customer.suburb || customer.area}`,
    html: `<p>You have a new lead. Please prepare a quote for the customer.</p>
           <ul><li><b>Lead ID:</b> ${customer.leadId}</li><li><b>Customer:</b> ${customer.name}</li></ul>
           <a href="${quoteLink}" style="padding:10px 15px; background-color:#007bff; color:white; text-decoration:none; border-radius:5px;">Submit Quote Now</a>`,
  });

  // Email to Admin
  await transporter.sendMail({
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: admin.email,
    subject: `[Review] New Lead: ${customer.service} (#${customer.leadId})`,
    text: `New lead received for ${customer.service}. Awaiting tradesperson quote submission.`,
  });
}

// --- API HANDLER ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, service, details, area, suburb } = req.body;
    if (!name || !email || !service) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log('[Lead Intake] Processing new lead...');
    const leadId = generateId('lead');
    const quoteId = generateId('quote');
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const tradesmanInfo = { name: 'Quang Bui', email: 'quangbui0600@gmail.com' }; // Hardcoded for this example

    // 1. Write to "Leads" Tab
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Leads!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[new Date().toISOString(), leadId, name, email, phone, service, details, area, suburb]] },
    });
    console.log(`[Lead Intake] Logged to "Leads" tab for lead #${leadId}`);

    // 2. Write initial data to "Quotes" Tab
    const quoteLink = generateSignedQuoteLink(leadId, quoteId, email);
    const quoteRow = [
      quoteId, leadId, name, email, tradesmanInfo.name, tradesmanInfo.email, quoteLink,
      "Confirmation Request", // Customer Status
      "Lead Request",         // Tradesperson Status
      "Pending Review",       // Admin Status
      "No",                   // Resubmission Allowed
      '', '', '', '', '', '', '', '', // Cost fields
      '', ''                    // Decision, Decision Timestamp
    ];
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Quotes!A:Z',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [quoteRow] },
    });
    console.log(`[Lead Intake] Created initial record in "Quotes" tab for quote #${quoteId}`);

    // 3. Send Emails
    await sendInitialEmails({
      customer: { name, email, phone, service, leadId, area, suburb },
      tradesperson: tradesmanInfo,
      admin: { email: 'danbricks18@gmail.com' },
      quoteLink,
    });
    console.log(`[Lead Intake] Dispatched initial emails for lead #${leadId}`);

    return res.status(200).json({ success: true, leadId, quoteId });

  } catch (error) {
    console.error('[Lead Intake] CRITICAL ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
}
