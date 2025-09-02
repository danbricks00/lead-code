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


async function sendQuoteEmails(transporter, customerEmail, customerName, quoteDetails, leadDetails, parsedRooms) {
    // This function is now for sending the ADMIN/TRADESPERSON approval email

    const approveLink = generateAdminDecisionLink('approve', quoteDetails.quoteId);
    const declineLink = generateAdminDecisionLink('decline', quoteDetails.quoteId);
    
    // Generate the link for the web view for the admin/tradesperson to review
    const ts = Date.now().toString();
    const token = verifyToken(quoteDetails.quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    const viewLink = `https://${baseUrl}/quote/view/${quoteDetails.quoteId}?ts=${ts}&token=${token}`;

    // Generate the PDF for review
    const pdfBuffer = await generatePdf(leadDetails, quoteDetails, parsedRooms);

    const reviewEmail = {
        from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
        to: [process.env.ADMIN_EMAIL, quoteDetails.tradespersonEmail], // Send to both admin and tradesperson
        subject: `REVIEW REQUIRED: Quote for ${customerName} - $${quoteDetails.totalQuote.toFixed(2)}`,
        html: `
            <p>A new quote has been prepared for ${customerName} and requires approval before it is sent.</p>
            <p><strong>Total Quote:</strong> $${quoteDetails.totalQuote.toFixed(2)}</p>
            <p>Please review the quote details. You can see the customer-facing version via the link or the attached PDF.</p>
            <p><a href="${viewLink}" style="padding:10px; background-color:#667eea; color:white; text-decoration:none; border-radius:5px;">Review Quote</a></p>
            <p>Once you have reviewed the quote, please approve or reject it:</p>
            <a href="${approveLink}" style="padding:10px; background-color:green; color:white; text-decoration:none; border-radius:5px;">Approve & Send to Customer</a>
            <a href="${declineLink}" style="padding:10px; background-color:red; color:white; text-decoration:none; border-radius:5px; margin-left:10px;">Reject Quote</a>
        `,
        attachments: [{
            filename: `Quote-For-Review-${quoteDetails.quoteId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    };

    await transporter.sendMail(reviewEmail);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token, quoteDetails, leadDetails } = req.body;
    let parsedRooms = [];

    // --- Validation ---
    if (!quoteId || !ts || !token || !quoteDetails || !leadDetails) {
        return res.status(400).json({ success: false, error: 'Missing required fields for quote submission.' });
    }

    // Safely parse rooms data
    if (leadDetails.Rooms) {
        try {
            parsedRooms = JSON.parse(leadDetails.Rooms);
        } catch (e) {
            console.warn("Could not parse rooms data for PDF, it may be malformed.");
        }
    }

    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const range = 'Quotes!A:Z';

        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        if (!rows) return res.status(500).json({ success: false, error: 'Could not read Quotes sheet.' });
        
        const header = rows[0];
        const rowIndex = rows.findIndex(row => row[0] === quoteId);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Quote ID not found.' });
        }
        
        const targetRow = rows[rowIndex];

        // --- Update Sheet Data ---
        const updateData = {
            'Tradesperson Name': quoteDetails.tradespersonName,
            'Tradesperson Email': quoteDetails.tradespersonEmail,
            'Tradesperson Phone': quoteDetails.tradespersonPhone,
            'Customer Status': 'Quote Pending Approval', // New status
            'Tradesperson Status': 'Quote Submitted',
            'Admin Status': 'Pending Approval', // New status
            'Labour Cost': quoteDetails.labourRate,
            'Labour Hours': quoteDetails.labourHours,
            'Materials Cost': quoteDetails.materialsCost,
            'Materials Quantity': quoteDetails.materialsQuantity,
            'Travel Cost': quoteDetails.travelCost,
            'Travel Distance': quoteDetails.travelDistance,
            'Installation Cost': quoteDetails.installationCost,
            'Total Quote': quoteDetails.totalQuote,
            'Notes': quoteDetails.notes,
            'Quote Valid Until': quoteDetails.validUntil,
        };

        header.forEach((headerName, index) => {
            if (updateData[headerName] !== undefined) {
                targetRow[index] = updateData[headerName];
            }
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });

        // --- Send Emails ---
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });

        await sendQuoteEmails(transporter, leadDetails['Customer Email'], leadDetails['Customer Name'], { ...quoteDetails, quoteId }, leadDetails, parsedRooms);
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Quote submission error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}