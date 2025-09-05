import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { initializeXeroDirectApi, makeXeroApiCall, getXeroQuoteAsPdf } from "../../../lib/xeroDirectApi.js";
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";
import { google } from "googleapis"; // This might be removable if not used directly

// --- Helper Functions ---
function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateCustomerDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

async function findRowAndGetData(options) {
    const { sheets, spreadsheetId, tab, searchColumn, searchValue, columnsToFetch } = options;
    const range = `${tab}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows || rows.length < 2) return null;
    const header = rows[0];
    const searchColumnIndex = header.indexOf(searchColumn);
    if (searchColumnIndex === -1) throw new Error(`Column "${searchColumn}" not found in tab "${tab}".`);
    const dataRow = rows.find(row => row[searchColumnIndex] === searchValue);
    if (!dataRow) return null;
    const result = {
        rowIndex: rows.indexOf(dataRow) + 1 // 1-based index
    };
    columnsToFetch.forEach(columnName => {
        const index = header.indexOf(columnName);
        result[columnName] = index !== -1 ? dataRow[index] || '' : 'N/A (Column not found)';
    });
    return result;
}


// --- Main Handler ---
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token || token !== verifyToken(quoteId, ts)) {
        return res.redirect(`/quote-status?status=error&message=Invalid approval link.`);
    }

    try {
        const xeroConfig = await initializeXeroDirectApi();
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Get Quote and Lead data from Sheets using robust function
        const quoteData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Quotes',
            searchColumn: 'QuoteID', searchValue: quoteId,
            columnsToFetch: ['Admin Status', 'Xero Quote iD', 'LeadiD']
        });

        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        if (quoteData['Admin Status'] === 'Approved') return res.redirect(`/quote-status?status=error&message=This quote has already been approved.`);
        if (!quoteData['Xero Quote iD']) return res.redirect(`/quote-status?status=error&message=Error: Xero Quote ID not found.`);

        const leadData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Leads',
            searchColumn: 'Lead', searchValue: quoteData['LeadiD'],
            columnsToFetch: ['CustomerName', 'CustomerEmail', 'ServiceType']
        });
        
        if (!leadData) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);

        // 2. Update Xero Quote status from DRAFT to SENT
        await makeXeroApiCall(`Quotes/${quoteData['Xero Quote iD']}`, 'POST', { Quotes: [{ Status: 'SENT' }] }, xeroConfig);
        
        // 3. Get the final PDF from Xero
        const pdfBuffer = await getXeroQuoteAsPdf(quoteData['Xero Quote iD'], xeroConfig);

        // 4. Send the quote email to the customer with Xero PDF
        const customerEmailOptions = {
          to: leadData['CustomerEmail'],
          subject: `Your Quote for ${leadData['ServiceType']} is Ready!`,
          html: `...`, // Your email content here
          attachments: [{ filename: `Quote_${quoteId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        };
        await sendEmail(customerEmailOptions);

        // 5. Update Sheet Status to final
        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:Z1' });
        const header = headerResponse.data.values[0];
        const updates = { 'Admin Status': 'Approved', 'Customer Status': 'Quote Sent' };
        let targetRow = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `Quotes!A${quoteData.rowIndex}:Z${quoteData.rowIndex}` })).data.values[0];
        
        header.forEach((colName, index) => {
            if(updates[colName]) targetRow[index] = updates[colName];
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId, range: `Quotes!A${quoteData.rowIndex}`,
            valueInputOption: 'USER_ENTERED', requestBody: { values: [targetRow] },
        });
        
        return res.redirect(`/quote-status?status=success&message=Quote approved and sent to the customer!`);

    } catch (error) {
        console.error("Xero Quote Approval Error:", error.response ? JSON.stringify(error.response.body, null, 2) : error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during Xero approval.`);
    }
}
