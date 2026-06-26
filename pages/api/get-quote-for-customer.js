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
    // Log the search attempt
    console.log(`[QUOTE-VIEW] Searching for ${valueToFind} in ${tabName} tab, column ${columnIndex}`);
    
    const range = `${tabName}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows) return null;

    const header = rows[0];
    
    // Normalize the value we're looking for (trim and lowercase)
    const normalizedValueToFind = valueToFind.trim().toLowerCase();
    
    // Find the row with case-insensitive matching
    const dataRow = rows.find(row => {
        if (!row[columnIndex]) return false;
        return row[columnIndex].trim().toLowerCase() === normalizedValueToFind;
    });

    if (!dataRow) {
        console.log(`[QUOTE-VIEW] No match found for ${valueToFind} in ${tabName}`);
        return null;
    }
    
    console.log(`[QUOTE-VIEW] Found match for ${valueToFind} in ${tabName}`);

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
    
    // Log the incoming request
    console.log(`[QUOTE-VIEW] Fetching quote for ID: ${quoteId}`);

    // --- Security Check ---
    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        console.log(`[QUOTE-VIEW] Invalid token for quote ID: ${quoteId}`);
        return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // 1. Get Quote Details from "Quotes" tab
        const quoteData = await findRowByValue(sheets, spreadsheetId, 'Quotes', 0, quoteId);
        if (!quoteData) {
            console.log(`[QUOTE-VIEW] No quote found for ID: ${quoteId}`);
            return res.status(404).json({ 
                success: false, 
                error: 'Sorry, this quote link is invalid or expired. Please request a new quote.' 
            });
        }

        // 2. Get Lead Details from "Leads" tab using the Lead ID from the quote
        const leadId = quoteData['Lead ID'];
        if (!leadId) {
            console.log(`[QUOTE-VIEW] Lead ID missing from quote data for quote ID: ${quoteId}`);
            return res.status(404).json({ 
                success: false, 
                error: 'Quote information is incomplete. Please contact customer support.' 
            });
        }
        const leadData = await findRowByValue(sheets, spreadsheetId, 'Leads', 0, leadId);
        if (!leadData) {
            console.log(`[QUOTE-VIEW] Corresponding lead details not found for lead ID: ${leadId} (quote ID: ${quoteId})`);
            return res.status(404).json({ 
                success: false, 
                error: 'Customer information not found. Please contact customer support.' 
            });
        }
        
        // 3. Combine and return data
        console.log(`[QUOTE-VIEW] Successfully retrieved quote and lead data for quote ID: ${quoteId}`);
        res.status(200).json({
            success: true,
            data: {
                quoteData,
                leadData,
            },
        });

    } catch (error) {
        console.error('[QUOTE-VIEW] Error fetching quote for customer:', error);
        res.status(500).json({ 
            success: false, 
            error: 'We encountered a problem retrieving your quote. Please try again later or contact customer support.' 
        });
    }
}
