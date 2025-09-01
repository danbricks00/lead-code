import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// --- HELPER FUNCTIONS ---

// Verifies the token from the decision link
function verifyToken(quoteId, ts, token) {
  const secret = process.env.QUOTE_LINK_SECRET;
  if (!secret) {
    console.error('❌ QUOTE_LINK_SECRET is not set. Cannot verify token.');
    return false;
  }
  const payload = `${quoteId}|${ts}`;
  const expectedToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

// Gets an authenticated Google Sheets client
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

// Sends notification emails
async function sendNotificationEmails(quoteDetails) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const { quoteId, customerEmail, tradespersonEmail, customerName, tradespersonName } = quoteDetails;
  console.log(`📧 Sending "Declined" notifications for quote #${quoteId}`);

  // 1. To Customer
  await transporter.sendMail({
    from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `Quote Declined: #${quoteId}`,
    html: `<p>Hi ${customerName},</p><p>You have declined the quote. We have recorded your decision. We hope we can assist you in the future.</p>`,
  });

  // 2. To Tradesperson
  await transporter.sendMail({
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: tradespersonEmail,
    subject: `Customer DECLINED Quote #${quoteId}`,
    html: `<p>The customer, ${customerName}, has DECLINED your quote for lead #${quoteId}.</p><p>No further action is required.</p>`,
  });

  // 3. To Admin
  await transporter.sendMail({
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: 'danbricks18@gmail.com',
    subject: `[Decision] Quote DECLINED: #${quoteId}`,
    text: `Quote #${quoteId} has been declined by the customer. The assigned tradesperson was ${tradespersonName} (${tradespersonEmail}).`,
  });
}


// --- API HANDLER ---

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).send('<h1>Method Not Allowed</h1>');
  }

  try {
    const { quoteId, ts, token } = req.query;

    // 1. Security: Validate the token and timestamp
    if (!verifyToken(quoteId, ts, token)) {
      console.error(`❌ Invalid token for quoteId ${quoteId}`);
      return res.status(403).send('<h1>Invalid Link</h1><p>This link is either invalid or has been tampered with.</p>');
    }

    const LINK_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - parseInt(ts, 10) > LINK_EXPIRY_MS) {
      console.error(`❌ Expired link used for quoteId ${quoteId}`);
      return res.status(410).send('<h1>Link Expired</h1><p>This decision link has expired.</p>');
    }

    // 2. Google Sheets: Find the quote and check its status
    const sheets = await getSheetsClient();
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range,
    });

    const rows = response.data.values || [];
    const header = rows.shift() || []; // Assumes first row is the header

    // Dynamically find column indices
    const quoteIdIndex = header.indexOf('LeadId');
    const decisionIndex = header.indexOf('Decision');
    const decisionTsIndex = header.indexOf('Decision Timestamp');
    const customerEmailIndex = header.indexOf('CustomerEmail');
    const tradespersonEmailIndex = header.indexOf('TradesmanEmail');
    const customerNameIndex = header.indexOf('CustomerName');
    const tradespersonNameIndex = header.indexOf('TradesmanName');

    if ([quoteIdIndex, decisionIndex, decisionTsIndex, customerEmailIndex, tradespersonEmailIndex, customerNameIndex, tradespersonNameIndex].some(i => i === -1)) {
        console.error("❌ A required column is missing from the 'Quotes' sheet header.");
        throw new Error("Sheet is not configured correctly.");
    }

    const quoteRowIndex = rows.findIndex(row => row[quoteIdIndex] === quoteId);

    if (quoteRowIndex === -1) {
      return res.status(404).send('<h1>Quote Not Found</h1><p>The specified quote could not be found.</p>');
    }

    const quoteRow = rows[quoteRowIndex];
    if (quoteRow[decisionIndex] && quoteRow[decisionIndex].trim() !== '') {
      console.warn(`🔒 Attempted to re-use decision link for quote #${quoteId}`);
      return res.status(409).send('<h1>Link Already Used</h1><p>A decision has already been recorded for this quote.</p>');
    }

    // 3. Google Sheets: Update the decision
    const updateRange = `Quotes!${String.fromCharCode(65 + decisionIndex)}${quoteRowIndex + 2}:${String.fromCharCode(65 + decisionTsIndex)}${quoteRowIndex + 2}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['Declined', new Date().toISOString()]],
      },
    });
    console.log(`✅ "Declined" status written to sheet for quote #${quoteId}`);
    
    // 4. Send notification emails
    await sendNotificationEmails({
      quoteId,
      customerEmail: quoteRow[customerEmailIndex],
      tradespersonEmail: quoteRow[tradespersonEmailIndex],
      customerName: quoteRow[customerNameIndex],
      tradespersonName: quoteRow[tradespersonNameIndex],
    });

    // 5. Return success page to the user
    return res.send('<h1>Thank You!</h1><p>Your decision has been recorded and all parties have been notified.</p>');

  } catch (error) {
    console.error('❌ A critical error occurred in /quote-decision/decline:', error);
    return res.status(500).send('<h1>Error</h1><p>An unexpected error occurred. The administrator has been notified.</p>');
  }
}
