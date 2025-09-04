import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { generatePdf } from "../../lib/pdfGenerator"; // Import the PDF generator

async function getSheetsClient() {
    const { privateKey } = JSON.parse(process.env.GOOGLE_PRIVATE_KEY || '{}');
    if (!privateKey) throw new Error("GOOGLE_PRIVATE_KEY is not set correctly.");
    
    const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
}

function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts); // Re-using the same function for consistency
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

// Generates links for the ADMIN to approve or decline the quote
function generateAdminDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    // A separate secret or a different context could be used here, but for simplicity, we reuse.
    const token = verifyToken(quoteId, ts); 
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/admin/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  
  try {
    const { quoteId, ts, token, quoteDetails, leadDetails } = req.body;

    // Basic validation
    if (!quoteId || !ts || !token || !quoteDetails || !leadDetails) {
        return res.status(400).json({ success: false, error: 'Missing required fields for quote submission.' });
    }

    // Verify the token to ensure the request is legitimate
    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
    }
    
    // Note: The Google Sheets update logic was here. It will be reimplemented as part of the Xero integration.

    // Destructure details needed for emails
    const { tradespersonName, tradespersonEmail, totalQuote } = quoteDetails;
    const { customerName, projectName } = leadDetails;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    // Generate necessary links for the emails
    const approveLink = generateAdminDecisionLink('approve', quoteId);
    const declineLink = generateAdminDecisionLink('decline', quoteId);
    
    const view_ts = Date.now().toString();
    const view_token = verifyToken(quoteId, view_ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    const viewLink = `https://${baseUrl}/quote/view/${quoteId}?ts=${view_ts}&token=${view_token}`;

    // --- CONSTRUCT AND SEND EMAILS (TEMP TEXT) ---
    const adminEmailOptions = {
        to: ADMIN_EMAIL,
        subject: `ACTION REQUIRED: Review Quote for ${customerName} (Lead ID: ${quoteId})`,
        html: `
            <p>A new quote has been submitted by ${tradespersonName} for the lead "${projectName}" and is ready for your review.</p>
            <p><strong>Total Quote:</strong> $${totalQuote.toFixed(2)}</p>
            <p><i>PDF generation is temporarily disabled while we integrate with Xero.</i></p>
            <a href="${approveLink}" style="padding: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Approve Quote</a>
            <a href="${declineLink}" style="padding: 10px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Decline Quote</a>
            <hr>
            <p>You can also view the quote online here: <a href="${viewLink}">${viewLink}</a></p>
        `,
    };

    const tradespersonEmailOptions = {
        to: tradespersonEmail,
        subject: `Quote Submitted for ${customerName} - Awaiting Admin Approval`,
        html: `
            <p>Thank you for submitting your quote for the lead "${projectName}".</p>
            <p>It has been sent to the admin for review. You will be notified once a decision has been made.</p>
            <p><i>PDF generation is temporarily disabled while we integrate with Xero.</i></p>
            <p>You can view the submitted quote here: <a href="${viewLink}">${viewLink}</a></p>
        `,
    };

    try {
       const transporter = nodemailer.createTransport({
           service: "gmail",
           auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
       });
       await transporter.sendMail(adminEmailOptions);
       console.log(`Admin review email sent successfully to ${ADMIN_EMAIL}.`);
       await transporter.sendMail(tradespersonEmailOptions);
       console.log(`Tradesperson confirmation email sent successfully to ${tradespersonEmail}.`);
    } catch (emailError) {
       console.error('Failed to send quote submission emails:', emailError);
    }

    res.status(200).json({ success: true, message: 'Quote submitted for admin approval.' });
  } catch (error) {
    console.error("Quote submission error:", error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}