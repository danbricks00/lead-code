import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- HELPER: GOOGLE SHEETS ---
async function getSheetsClient() {
  console.log('[Sheets Helper] Authenticating with Google...');
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('[Sheets Helper] Google Sheets client created successfully.');
    return sheets;
  } catch (error) {
    console.error('[Sheets Helper] CRITICAL: Failed to create Google Sheets client:', error);
    throw new Error('Failed to authenticate with Google Sheets.');
  }
}

// --- HELPER: CRYPTO & LINKS ---
function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

function generateSignedQuoteLink(leadId, quoteId, customerEmail) {
  console.log(`[Link Helper] Generating signed link for quote #${quoteId}`);
  const secret = process.env.QUOTE_LINK_SECRET;
  if (!secret) {
    console.error('[Link Helper] CRITICAL: QUOTE_LINK_SECRET is not set.');
    throw new Error('QUOTE_LINK_SECRET environment variable is not set.');
  }
  const payload = JSON.stringify({ leadId, quoteId, customerEmail });
  const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/quote-form.html?payload=${encodeURIComponent(payload)}&token=${token}`;
}

// --- HELPER: NODEMAILER ---
async function sendInitialEmails(details) {
  console.log('[Email Helper] Creating Nodemailer transporter...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  console.log('[Email Helper] Transporter created. Sending emails...');
  
  const { customer, tradesperson, admin, quoteLink } = details;
  
  await transporter.sendMail({
    to: customer.email, subject: `✅ We've received your request`,
    html: `<p>Hi ${customer.name},</p><p>Thanks for your request. A quote will be prepared shortly.</p>`,
  });
  console.log(`[Email Helper] Sent email to customer at ${customer.email}`);

  await transporter.sendMail({
    to: tradesperson.email, subject: `🔔 New Lead: ${customer.service}`,
    html: `<p>New lead received. Please prepare a quote.</p><a href="${quoteLink}">Submit Quote</a>`,
  });
  console.log(`[Email Helper] Sent email to tradesperson at ${tradesperson.email}`);

  await transporter.sendMail({
    to: admin.email, subject: `[Review] New Lead: #${details.customer.leadId}`,
    text: `New lead received for ${customer.service}.`,
  });
  console.log(`[Email Helper] Sent email to admin at ${admin.email}`);
}

// --- API HANDLER ---
export default async function handler(req, res) {
  console.log(`\n--- [Lead Intake] Received request at ${new Date().toISOString()} ---`);
  if (req.method !== 'POST') {
    console.log(`[Lead Intake] Blocked non-POST request (method: ${req.method})`);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    console.log('[Lead Intake] 1. Validating request body...');
    const { name, email, phone, service, details, area, suburb } = req.body;
    if (!name || !email || !service) {
      console.error('[Lead Intake] Validation failed: Missing required fields.', { name, email, service });
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    console.log('[Lead Intake] Validation successful.');

    const leadId = generateId('lead');
    const quoteId = generateId('quote');
    console.log(`[Lead Intake] 2. Generated IDs: Lead=${leadId}, Quote=${quoteId}`);

    console.log('[Lead Intake] 3. Connecting to Google Sheets...');
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('[Lead Intake] 4. Appending to "Leads" tab...');
    await sheets.spreadsheets.values.append({
      spreadsheetId, range: 'Leads!A:Z', valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[new Date().toISOString(), leadId, name, email, phone, service, details, area, suburb]] },
    });
    console.log('[Lead Intake] Successfully appended to "Leads" tab.');
    
    console.log('[Lead Intake] 5. Appending to "Quotes" tab...');
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
    console.log('[Lead Intake] Successfully appended to "Quotes" tab.');

    console.log('[Lead Intake] 6. Sending initial emails...');
    await sendInitialEmails({
      customer: { name, email, service, leadId },
      tradesperson: tradesmanInfo,
      admin: { email: 'danbricks18@gmail.com' },
      quoteLink,
    });
    console.log('[Lead Intake] All emails sent successfully.');

    console.log(`--- [Lead Intake] Request completed successfully for lead #${leadId} ---`);
    return res.status(200).json({ success: true, leadId, quoteId });

  } catch (error) {
    console.error('[Lead Intake] CRITICAL ERROR in handler:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
}
