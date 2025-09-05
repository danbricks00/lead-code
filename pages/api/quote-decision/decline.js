import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function formatTimestamp(isoString) {
    if (!isoString) return 'an unknown time';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-NZ', {
            timeZone: 'Pacific/Auckland',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) + ' NZT';
    } catch (e) {
        return isoString; // Fallback to original string if parsing fails
    }
}

async function sendNotificationEmails(quoteData) {
    const customerMail = {
        to: quoteData['Customer Email'],
        subject: `Confirmation: Your Quote has been Declined`,
        html: `
            <p>Hi ${quoteData['Customer Name']},</p>
            <p>This is a confirmation that you have <strong>declined</strong> the quote.</p>
            <p>Thank you for considering our services.</p>
            <hr>
            <p><strong>Status:</strong></p>
            <ul>
                <li>✅ Lead Received</li>
                <li>✅ Quote Sent</li>
                <li>❌ Decision Made: Declined</li>
            </ul>
        `,
    };

    const adminMail = {
        to: process.env.ADMIN_EMAIL,
        subject: `Quote Declined: ${quoteData['Customer Name']}`,
        text: `The quote for ${quoteData['Customer Name']} was declined by the customer.`
    };

    await sendEmail(customerMail);
    await sendEmail(adminMail);
}


export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token) {
        return res.redirect(`/quote-status?status=error&message=Missing required parameters.`);
    }

    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        return res.redirect(`/quote-status?status=error&message=Invalid or expired link.`);
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        const range = 'Quotes!A:Z';

        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        if (!rows) {
            return res.redirect(`/quote-status?status=error&message=Could not connect to the database.`);
        }
        
        const header = rows[0];
        const rowIndex = rows.findIndex(row => row[0] === quoteId);

        if (rowIndex === -1) {
            return res.redirect(`/quote-status?status=error&message=Quote ID not found.`);
        }
        
        const targetRow = rows[rowIndex];
        
        // Check if quote has expired (Valid Until date)
        const validUntilIndex = header.findIndex(col => 
            col && (col.toLowerCase().includes('valid until') || 
                   col.toLowerCase().includes('expiry') || 
                   col.toLowerCase().includes('expires'))
        );
        
        if (validUntilIndex !== -1 && targetRow[validUntilIndex]) {
            const validUntilDate = new Date(targetRow[validUntilIndex]);
            const now = new Date();
            
            if (validUntilDate < now) {
                const expiredMessage = encodeURIComponent(
                    "This quote has expired and is no longer valid. Please contact us to request a new quote."
                );
                return res.redirect(`/quote-status?status=error&message=${expiredMessage}`);
            }
        }
        
        const decisionIndex = header.indexOf('Decision');
        const decisionTimestampIndex = header.indexOf('Decision Timestamp');

        if (decisionIndex !== -1 && targetRow[decisionIndex] && targetRow[decisionIndex].trim() !== '') {
            const decision = targetRow[decisionIndex];
            const timestamp = (decisionTimestampIndex !== -1) ? targetRow[decisionTimestampIndex] : '';
            const formattedTime = formatTimestamp(timestamp);
            const message = `This quote was already ${decision.toLowerCase()} on ${formattedTime}.`;
            return res.redirect(`/quote-status?status=error&message=${encodeURIComponent(message)}`);
        }
        
        // --- Update Sheet Data ---
        const updateData = {
            'Decision': 'Declined',
            'Decision Timestamp': new Date().toISOString(),
            'Customer Status': 'Quote Decision',
            'Tradesperson Status': 'Quote Decision',
            'Admin Status': 'Declined',
        };

        const quoteDataForEmail = {};
        header.forEach((headerName, index) => {
            quoteDataForEmail[headerName] = targetRow[index] || '';
            if (updateData[headerName] !== undefined) {
                targetRow[index] = updateData[headerName];
                quoteDataForEmail[headerName] = updateData[headerName];
            }
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });

        // --- Send Emails ---
        await sendNotificationEmails(quoteDataForEmail);
        
        return res.redirect(`/quote-status?status=success&message=Your decision to decline has been recorded.`);

    } catch (error) {
        console.error("Quote decline error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}