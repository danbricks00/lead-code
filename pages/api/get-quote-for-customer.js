import { google } from "googleapis";
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

async function findRowByValue(sheets, spreadsheetId, tabName, columnIndex, valueToFind) {
    const range = `${tabName}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows) return null;

    const header = rows[0];
    const dataRow = rows.find(row => row[columnIndex] === valueToFind);

    if (!dataRow) return null;

    return header.reduce((obj, key, index) => {
        obj[key] = dataRow[index] || '';
        return obj;
    }, {});
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token) {
        return res.status(400).json({ success: false, error: 'Missing required parameters.' });
    }

    // --- Security Check ---
    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // 1. Get Quote Details from "Quotes" tab
        const quoteData = await findRowByValue(sheets, spreadsheetId, 'Quotes', 0, quoteId);
        if (!quoteData) {
            return res.status(404).json({ success: false, error: 'Quote not found.' });
        }

        // 2. Get Lead Details from "Leads" tab using the Lead ID from the quote
        const leadId = quoteData['Lead ID'];
        if (!leadId) {
            return res.status(404).json({ success: false, error: 'Lead ID missing from quote data.' });
        }
        const leadData = await findRowByValue(sheets, spreadsheetId, 'Leads', 0, leadId);
        if (!leadData) {
            return res.status(404).json({ success: false, error: 'Corresponding lead details not found.' });
        }
        
        // 3. Combine and return data
        res.status(200).json({
            success: true,
            data: {
                quoteData,
                leadData,
            },
        });

    } catch (error) {
        console.error('Error fetching quote for customer:', error);
        res.status(500).json({ success: false, error: 'Failed to retrieve quote details.' });
    }
}
