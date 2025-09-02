import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- Standardized Crypto Helper ---
function verifyToken(payload, token) {
  const secret = process.env.QUOTE_LINK_SECRET;
  const expectedToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
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
async function sendNotificationEmails(details) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const { customer, tradesperson, admin, quoteId } = details;

  // Emails for acceptance
  await transporter.sendMail({
    to: customer.email,
    subject: `✅ Quote Accepted (#${quoteId})`,
    html: `<p>Hi ${customer.name},</p><p>Thank you for accepting the quote. ${tradesperson.name} will be in touch shortly to arrange the work.</p>`,
  });
  await transporter.sendMail({
    to: tradesperson.email,
    subject: `🎉 Quote ACCEPTED by Customer (#${quoteId})`,
    html: `<p>Great news! The customer, ${customer.name}, has ACCEPTED your quote. Please contact them at ${customer.email} to proceed.</p>`,
  });
  await transporter.sendMail({
    to: admin.email,
    subject: `[Decision] Quote ACCEPTED (#${quoteId})`,
    text: `The quote #${quoteId} has been accepted by ${customer.name}.`,
  });
}

// --- API Handler ---
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).redirect('/quote-status?error=Method Not Allowed');
  }

  try {
    const { quoteId, ts, token } = req.query;

    if (!verifyToken(`${quoteId}|${ts}`, token)) {
      return res.status(403).redirect('/quote-status?error=Invalid Link');
    }
    if (Date.now() - parseInt(ts, 10) > 7 * 24 * 60 * 60 * 1000) { // 7-day expiry
      return res.status(410).redirect('/quote-status?error=Link Expired');
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];
    const header = rows[0] || [];
    
    const col = Object.fromEntries(header.map((h, i) => [h.replace(/\s+/g, ''), i]));
    
    const quoteRowIndex = rows.findIndex(row => row[col.QuoteID] === quoteId);
    if (quoteRowIndex === -1) {
      return res.status(404).redirect('/quote-status?error=Quote Not Found');
    }

    const quoteRow = rows[quoteRowIndex];
    if (quoteRow[col.Decision] && quoteRow[col.Decision] !== "") {
      return res.status(409).redirect('/quote-status?error=Link Already Used');
    }

    // Update the specific columns in the fetched row data
    quoteRow[col.CustomerStatus] = "Quote Decision";
    quoteRow[col.TradespersonStatus] = "Quote Decision";
    quoteRow[col.AdminStatus] = "Accepted";
    quoteRow[col.Decision] = "Accepted";
    quoteRow[col.DecisionTimestamp] = new Date().toISOString();
    
    // Write the entire updated row back to the sheet
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Quotes!A${quoteRowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [quoteRow] },
    });
    console.log(`[Accept] Updated sheet for quote #${quoteId}`);

    await sendNotificationEmails({
      quoteId,
      customer: { name: quoteRow[col.CustomerName], email: quoteRow[col.CustomerEmail] },
      tradesperson: { name: quoteRow[col.TradespersonName], email: quoteRow[col.TradespersonEmail] },
      admin: { email: 'danbricks18@gmail.com' },
    });
    console.log(`[Accept] Dispatched emails for quote #${quoteId}`);

    return res.redirect('/quote-status?result=accepted');

  } catch (error) {
    console.error('[Accept] CRITICAL ERROR:', error);
    return res.status(500).redirect(`/quote-status?error=${encodeURIComponent(error.message)}`);
  }
}
