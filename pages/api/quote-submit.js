import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
    return `${process.env.NEXT_PUBLIC_BASE_URL}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

async function sendQuoteEmails(transporter, customerEmail, customerName, quoteDetails) {
    const acceptLink = generateDecisionLink('accept', quoteDetails.quoteId);
    const declineLink = generateDecisionLink('decline', quoteDetails.quoteId);

    const customerMail = {
        from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: `Your Quote for Underfloor Heating is Ready!`,
        html: `
            <p>Hi ${customerName},</p>
            <p>Your quote of <strong>$${quoteDetails.totalQuote.toFixed(2)}</strong> is ready.</p>
            <p><strong>Notes from the tradesperson:</strong> ${quoteDetails.notes || 'None'}</p>
            <p>Please review your quote and make a decision:</p>
            <a href="${acceptLink}" style="padding:10px; background-color:green; color:white; text-decoration:none; border-radius:5px;">Accept Quote</a>
            <a href="${declineLink}" style="padding:10px; background-color:red; color:white; text-decoration:none; border-radius:5px; margin-left:10px;">Decline Quote</a>
            <hr>
            <p><strong>Status:</strong></p>
            <ul>
                <li>✅ Lead Received</li>
                <li>✅ Quote Sent</li>
                <li>⚪ Decision Pending</li>
            </ul>
        `,
    };

    const adminMail = {
        from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Quote Submitted for ${customerName} - $${quoteDetails.totalQuote.toFixed(2)}`,
        text: `A quote was submitted for ${customerName} with a total of $${quoteDetails.totalQuote.toFixed(2)}. Tradesperson: ${quoteDetails.tradespersonName} (${quoteDetails.tradespersonEmail}).`
    };

    await transporter.sendMail(customerMail);
    await transporter.sendMail(adminMail);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token, quoteDetails, leadDetails } = req.body;

    // --- Validation ---
    if (!quoteId || !ts || !token || !quoteDetails || !leadDetails) {
        return res.status(400).json({ success: false, error: 'Missing required fields for quote submission.' });
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
            'Customer Status': 'Quote Received',
            'Tradesperson Status': 'Quote Sent',
            'Labour Cost': quoteDetails.labourRate,
            'Labour Hours': quoteDetails.labourHours,
            'Materials Cost': quoteDetails.materialsCost,
            'Materials Quantity': quoteDetails.materialsQuantity,
            'Travel Cost': quoteDetails.travelCost,
            'Travel Distance': quoteDetails.travelDistance,
            'Installation Cost': quoteDetails.installationCost,
            'Total Quote': quoteDetails.totalQuote,
            'Notes': quoteDetails.notes,
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

        await sendQuoteEmails(transporter, leadDetails['Customer Email'], leadDetails['Customer Name'], { ...quoteDetails, quoteId });
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Quote submission error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}