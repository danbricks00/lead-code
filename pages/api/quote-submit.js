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
function verifyToken(payload, token) {
  const secret = process.env.QUOTE_LINK_SECRET;
  const expectedToken = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

function generateDecisionLink(quoteId, decision) {
    const secret = process.env.QUOTE_LINK_SECRET;
    const ts = Date.now();
    const payload = `${quoteId}|${ts}`;
    const token = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return `${baseUrl}/api/quote-decision/${decision}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

// --- HELPER: NODEMAILER ---
async function sendQuoteEmails(details) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const { customer, tradesperson, admin, acceptLink, declineLink, quoteId } = details;

  // Email to Customer
  await transporter.sendMail({
    from: `"Your Quote from Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: customer.email,
    subject: `Your Quote is Ready (#${quoteId})`,
    html: `<p>Hi ${customer.name}, your quote is ready for review.</p>
           <p>Please click a button below to make your decision.</p>
           <a href="${acceptLink}" style="padding:10px 15px; background-color:#28a745; color:white; text-decoration:none; border-radius:5px; margin-right:10px;">Accept Quote</a>
           <a href="${declineLink}" style="padding:10px 15px; background-color:#dc3545; color:white; text-decoration:none; border-radius:5px;">Decline Quote</a>`,
  });

  // Email to Admin for review
  await transporter.sendMail({
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: admin.email,
    subject: `[Review] Quote Submitted: #${quoteId}`,
    text: `A quote has been submitted by ${tradesperson.name} for quote ID #${quoteId} and has been sent to the customer. It is now awaiting your review.`,
  });
}

// --- API HANDLER ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { payload, token, quoteDetails } = req.body;
    
    if (!verifyToken(payload, token)) {
      return res.status(403).json({ success: false, error: 'Invalid or tampered token.' });
    }

    const { quoteId, customerEmail } = JSON.parse(payload);
    console.log(`[Quote Submit] Processing submission for quote #${quoteId}`);
    
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values || [];
    const header = rows.shift() || [];

    const col = {
      quoteId: header.indexOf('Quote ID'),
      resubmission: header.indexOf('Resubmission Allowed'),
      customerStatus: header.indexOf('Customer Status'),
      tradespersonStatus: header.indexOf('Tradesperson Status'),
      customerName: header.indexOf('Customer Name'),
      tradespersonName: header.indexOf('Tradesperson Name')
    };
    if (Object.values(col).some(i => i === -1)) throw new Error("A required column is missing in the 'Quotes' sheet.");

    const quoteRowIndex = rows.findIndex(row => row[col.quoteId] === quoteId);
    if (quoteRowIndex === -1) {
      return res.status(404).json({ success: false, error: `Quote ID #${quoteId} not found.` });
    }

    const quoteRow = rows[quoteRowIndex];
    // Check if quote was already submitted (check by status) AND resubmission is not allowed
    if (quoteRow[col.customerStatus] === "Quote Received" && quoteRow[col.resubmission] !== "Yes") {
        return res.status(409).json({ success: false, error: 'Quote already submitted. Resubmission is not currently allowed.' });
    }

    // Update the entire row with new details and statuses
    const updatedRowData = [
      ...quoteRow.slice(0, 11), // Keep first 11 columns (up to Resubmission Allowed)
      quoteDetails.labourCost, quoteDetails.labourHours, quoteDetails.labourRate,
      quoteDetails.materialsCost, quoteDetails.materialsQuantity,
      quoteDetails.travelCost, quoteDetails.travelDistance, quoteDetails.installationCost,
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Quotes!L${quoteRowIndex + 2}`, // Start updating from Labour Cost column
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [updatedRowData.slice(11, 19)] },
    });
    
    // Update statuses separately
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Quotes!H${quoteRowIndex + 2}:J${quoteRowIndex + 2}`, // H, I, J for statuses
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [["Quote Received", "Quote Sent", "Pending Review"]] },
    });
    console.log(`[Quote Submit] Updated sheet for quote #${quoteId}`);

    const acceptLink = generateDecisionLink(quoteId, 'accept');
    const declineLink = generateDecisionLink(quoteId, 'decline');

    await sendQuoteEmails({
      quoteId,
      customer: { name: quoteRow[col.customerName], email: customerEmail },
      tradesperson: { name: quoteRow[col.tradespersonName] },
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
