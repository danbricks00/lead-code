import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

// --- Helper Functions ---
async function getSheetsClient() {
    const { privateKey } = JSON.parse(process.env.GOOGLE_PRIVATE_KEY || '{}');
    if (!privateKey) throw new Error("GOOGLE_PRIVATE_KEY is not set correctly.");
    const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL, null, privateKey,
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

async function findRowByValue(sheets, spreadsheetId, tabName, columnIndex, valueToFind) {
    const range = `${tabName}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows) return null;
    const header = rows[0];
    const dataRow = rows.find(row => row[columnIndex] === valueToFind);
    if (!dataRow) return null;
    return { 
        rowData: header.reduce((obj, key, index) => {
            obj[key] = dataRow[index] || '';
            return obj;
        }, {}),
        rowIndex: rows.indexOf(dataRow)
    };
}

// --- Main Handler ---
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token) {
        return res.redirect(`/quote-status?status=error&message=Missing rejection parameters.`);
    }

    if (token !== verifyToken(quoteId, ts)) {
        return res.redirect(`/quote-status?status=error&message=Invalid rejection link.`);
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const { rowData: quoteData, rowIndex } = await findRowByValue(sheets, spreadsheetId, 'Quotes', 0, quoteId);
        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);

        if (quoteData['Admin Status'] === 'Approved' || quoteData['Admin Status'] === 'Rejected') {
            return res.redirect(`/quote-status?status=error&message=A decision has already been made on this quote.`);
        }

        // 1. Update Sheet Status
        const updateRange = `Quotes!A${rowIndex + 1}`;
        const sheetResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: updateRange });
        const targetRow = sheetResponse.data.values[0];

        const header = (await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:Z1' })).data.values[0];
        targetRow[header.indexOf('Admin Status')] = 'Rejected';
        targetRow[header.indexOf('Resubmission Allowed')] = 'Yes'; 

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });

        // 2. Send Rejection Email to Tradesperson
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });

        const tradespersonMail = {
            from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
            to: quoteData['Tradesperson Email'],
            subject: `Action Required: Quote for ${quoteData['Customer Name']} was Rejected`,
            html: `
                <p>Hi ${quoteData['Tradesperson Name']},</p>
                <p>The quote you submitted for ${quoteData['Customer Name']} has been reviewed and rejected by the admin.</p>
                <p>You are now able to submit a revised quote. Please use your original quote submission link to provide an updated quote.</p>
                <p>If you have any questions, please contact the admin.</p>
            `,
        };
        await transporter.sendMail(tradespersonMail);
        
        return res.redirect(`/quote-status?status=success&message=Quote has been rejected. The tradesperson has been notified.`);

    } catch (error) {
        console.error("Quote rejection error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during rejection.`);
    }
}
