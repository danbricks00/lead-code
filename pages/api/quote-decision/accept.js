import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- HELPER FUNCTIONS ---

function verifyToken(quoteId, ts, token) {
  const secret = process.env.QUOTE_LINK_SECRET;
  const payload = `${quoteId}|${ts}`;
  const expectedToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

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

async function sendNotificationEmails(details) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const { customer, tradesperson, admin, quoteId } = details;

  // Email to Customer
  await transporter.sendMail({
    to: customer.email,
    subject: `✅ Quote Accepted (#${quoteId})`,
    html: `<p>Hi ${customer.name},</p><p>Thank you for accepting the quote. ${tradesperson.name} will be in touch shortly to arrange the work.</p>`,
  });

  // Email to Tradesperson
  await transporter.sendMail({
    to: tradesperson.email,
    subject: `🎉 Quote ACCEPTED by Customer (#${quoteId})`,
    html: `<p>Great news! The customer, ${customer.name}, has ACCEPTED your quote. Please contact them at ${customer.email} to proceed.</p>`,
  });

  // Email to Admin
  await transporter.sendMail({
    to: admin.email,
    subject: `[Decision] Quote ACCEPTED (#${quoteId})`,
    text: `The quote #${quoteId} has been accepted by ${customer.name}.`,
  });
}

// --- API HANDLER ---
export default async function handler(req, res) {
  const renderPage = (title, message) => res.status(200).send(`<html>...<h1>${title}</h1><p>${message}</p>...</html>`);

  if (req.method !== 'GET') {
    return res.status(405).send(renderPage('Method Not Allowed', ''));
  }

  try {
    const { quoteId, ts, token } = req.query;

    if (!verifyToken(quoteId, ts, token)) {
      return res.status(403).send(renderPage('Invalid Link', 'This link is invalid or has been tampered with.'));
    }
    if (Date.now() - parseInt(ts, 10) > 7 * 24 * 60 * 60 * 1000) {
      return res.status(410).send(renderPage('Link Expired', 'This decision link has expired.'));
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];
    const header = rows.shift() || [];
    
    const col = {
      quoteId: header.indexOf('Quote ID'),
      decision: header.indexOf('Decision'),
      customerStatus: header.indexOf('Customer Status'),
      tradespersonStatus: header.indexOf('Tradesperson Status'),
      adminStatus: header.indexOf('Admin Status'),
      customerName: header.indexOf('Customer Name'),
      customerEmail: header.indexOf('Customer Email'),
      tradespersonName: header.indexOf('Tradesperson Name'),
      tradespersonEmail: header.indexOf('Tradesperson Email'),
    };
    if (Object.values(col).some(i => i === -1)) throw new Error("A required column is missing in the 'Quotes' sheet.");

    const quoteRowIndex = rows.findIndex(row => row[col.quoteId] === quoteId);
    if (quoteRowIndex === -1) {
      return res.status(404).send(renderPage('Quote Not Found', ''));
    }

    const quoteRow = rows[quoteRowIndex];
    if (quoteRow[col.decision] && quoteRow[col.decision] !== "") {
      return res.status(409).send(renderPage('Link Already Used', 'A decision has already been recorded for this quote.'));
    }

    // Update statuses and decision
    const updateData = [
      "Quote Decision", // Customer Status
      "Quote Decision", // Tradesperson Status
      "Accepted",       // Admin Status
      ...new Array(8).fill(''), // Skip 8 cost columns + resubmission
      "Accepted",       // Decision
      new Date().toISOString() // Decision Timestamp
    ];
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Quotes!H${quoteRowIndex + 2}`, // Start update at Customer Status (H)
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updateData] },
    });
    console.log(`[Accept] Updated sheet for quote #${quoteId}`);

    await sendNotificationEmails({
      quoteId,
      customer: { name: quoteRow[col.customerName], email: quoteRow[col.customerEmail] },
      tradesperson: { name: quoteRow[col.tradespersonName], email: quoteRow[col.tradespersonEmail] },
      admin: { email: 'danbricks18@gmail.com' },
    });
    console.log(`[Accept] Dispatched emails for quote #${quoteId}`);

    return renderPage('Thank You!', 'Your acceptance has been recorded.');

  } catch (error) {
    console.error('[Accept] CRITICAL ERROR:', error);
    return res.status(500).send(renderPage('Error', 'An unexpected error occurred.'));
  }
}
