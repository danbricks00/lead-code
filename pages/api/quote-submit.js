import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- Standardized Crypto Helpers ---
function createToken(payload) {
  const secret = process.env.QUOTE_LINK_SECRET;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyToken(payload, token) {
  const expectedToken = createToken(payload);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

function generateDecisionLink(quoteId, decision) {
    const ts = Date.now().toString();
    const payload = `${quoteId}|${ts}`;
    const token = createToken(payload);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    return `https://${baseUrl}/api/quote-decision/${decision}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

// --- Google Sheets Helper ---
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

// --- Nodemailer Helper ---
async function sendQuoteEmails(details) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const { customer, admin, acceptLink, declineLink, quoteId } = details;

  await transporter.sendMail({
    from: `"Your Quote from Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: customer.email,
    subject: `Your Quote is Ready (#${quoteId})`,
    html: `<p>Hi ${customer.name}, your quote is ready for review.</p>
           <p>Please click a button below to make your decision.</p>
           <a href="${acceptLink}" style="padding:10px 15px; background-color:#28a745; color:white; text-decoration:none; border-radius:5px; margin-right:10px;">Accept Quote</a>
           <a href="${declineLink}" style="padding:10px 15px; background-color:#dc3545; color:white; text-decoration:none; border-radius:5px;">Decline Quote</a>`,
  });

  await transporter.sendMail({
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: admin.email,
    subject: `[Review] Quote Submitted: #${quoteId}`,
    text: `A quote for ID #${quoteId} has been sent to the customer and is awaiting your review.`,
  });
}

// --- API Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { quoteId, ts, token, quoteDetails } = req.body;
    
    if (!verifyToken(`${quoteId}|${ts}`, token)) {
      return res.status(403).json({ success: false, error: 'Invalid or tampered token.' });
    }

    console.log(`[Quote Submit] Processing submission for quote #${quoteId}`);
    
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];
    const header = rows[0] || [];

    const col = Object.fromEntries(header.map((h, i) => [h.replace(/\s+/g, ''), i]));

    const quoteRowIndex = rows.findIndex(row => row[col.QuoteID] === quoteId);
    if (quoteRowIndex === -1) {
      return res.status(404).json({ success: false, error: `Quote ID #${quoteId} not found.` });
    }

    const quoteRow = rows[quoteRowIndex];
    if (quoteRow[col.CustomerStatus] === "Quote Received" && quoteRow[col.ResubmissionAllowed] !== "Yes") {
        return res.status(409).json({ success: false, error: 'Quote already submitted and resubmission is not allowed.' });
    }
    
    // Update the specific columns in the fetched row data
    quoteRow[col.CustomerStatus] = "Quote Received";
    quoteRow[col.TradespersonStatus] = "Quote Sent";
    quoteRow[col.AdminStatus] = "Pending Review";
    quoteRow[col.LabourCost] = quoteDetails.labourCost;
    quoteRow[col.LabourHours] = quoteDetails.labourHours;
    // ... update other quote detail columns as they exist
    
    // Write the entire updated row back to the sheet
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Quotes!A${quoteRowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [quoteRow] },
    });
    console.log(`[Quote Submit] Updated sheet for quote #${quoteId}`);

    const acceptLink = generateDecisionLink(quoteId, 'accept');
    const declineLink = generateDecisionLink(quoteId, 'decline');

    await sendQuoteEmails({
      quoteId,
      customer: { name: quoteRow[col.CustomerName], email: quoteRow[col.CustomerEmail] },
      admin: { email: 'danbricks18@gmail.com' },
      acceptLink,
      declineLink,
    });
    console.log(`[Quote Submit] Dispatched emails for quote #${quoteId}`);

    return res.status(200).json({ success: true, quoteId });

  } catch (error) {
    console.error('[Quote Submit] CRITICAL ERROR:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error', details: error.message });
  }
}
