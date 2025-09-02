import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { generatePdf } from "../../../lib/pdfGenerator";

// --- Helper Functions (can be moved to a shared lib) ---
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

function generateCustomerDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
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

async function sendCustomerQuoteEmail(transporter, customerEmail, customerName, quoteDetails, leadDetails, parsedRooms) {
    try {
        const ts = Date.now().toString();
        const token = verifyToken(quoteDetails.quoteId, ts);
        
        const acceptLink = generateCustomerDecisionLink('accept', quoteDetails.quoteId);
        const declineLink = generateCustomerDecisionLink('decline', quoteDetails.quoteId);
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
        const viewLink = `https://${baseUrl}/quote/view/${quoteDetails.quoteId}?ts=${ts}&token=${token}`;
        
        // Generate PDF with HTML fallback
        const { pdfBuffer, htmlContent } = await generatePdf(quoteDetails, leadDetails, parsedRooms);
        
        const attachments = [];
        let attachmentNote = '';

        if (pdfBuffer) {
            attachments.push({
                filename: `Quote-${quoteDetails.quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
            attachmentNote = '<p>Your detailed quote is attached as a PDF.</p>';
        } else {
            console.warn(`[Admin Approve] PDF generation failed for quote ${quoteDetails.quoteId}. Attaching HTML fallback.`);
            attachments.push({
                filename: `Quote-${quoteDetails.quoteId}.html`,
                content: htmlContent,
                contentType: 'text/html'
            });
            attachmentNote = '<p style="color:orange;">We were unable to generate a PDF quote, so an HTML version is attached for your convenience.</p>';
        }

        const customerMail = {
            from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
            to: customerEmail,
            subject: `Your Quote for Underfloor Heating is Ready!`,
            html: `
                <p>Hi ${customerName},</p>
                <p>Good news! Your quote for ${leadDetails['Service Type']} is ready. You can view it online or in the attachment.</p>
                ${attachmentNote}
                <p><strong>Total Quote:</strong> $${quoteDetails['Total Quote']}</p>
                <p>
                    <a href="${viewLink}" style="padding:10px; background-color:#667eea; color:white; text-decoration:none; border-radius:5px;">View Quote Online</a>
                </p>
                <p>When you are ready, please make your decision below:</p>
                <a href="${acceptLink}" style="padding:10px; background-color:green; color:white; text-decoration:none; border-radius:5px;">Accept Quote</a>
                <a href="${declineLink}" style="padding:10px; background-color:red; color:white; text-decoration:none; border-radius:5px; margin-left:10px;">Decline Quote</a>
            `,
            attachments: attachments
        };

        await transporter.sendMail(customerMail);
        console.log(`✅ Customer quote email sent to ${customerEmail}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Error sending customer quote email for quote ${quoteDetails.quoteId}:`, error);
        return { success: false, error: error.message };
    }
}


// --- Main Handler ---
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token) {
        return res.redirect(`/quote-status?status=error&message=Missing approval parameters.`);
    }

    if (token !== verifyToken(quoteId, ts)) {
        return res.redirect(`/quote-status?status=error&message=Invalid approval link.`);
    }

    try {
        const sheets = await getSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // 1. Get Quote and Lead data
        const { rowData: quoteData, rowIndex } = await findRowByValue(sheets, spreadsheetId, 'Quotes', 0, quoteId);
        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);

        const leadId = quoteData['Lead ID'];
        const { rowData: leadData } = await findRowByValue(sheets, spreadsheetId, 'Leads', 0, leadId);
        if (!leadData) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);

        // 2. Check if already approved
        if (quoteData['Admin Status'] === 'Approved') {
            return res.redirect(`/quote-status?status=error&message=This quote has already been approved and sent.`);
        }

        // 3. Send Quote to Customer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });

        const parsedRooms = JSON.parse(leadData.Rooms || '[]');
        const sendResult = await sendCustomerQuoteEmail(transporter, leadData['Customer Email'], leadData['Customer Name'], quoteData, leadData, parsedRooms);

        if (!sendResult.success) {
            return res.redirect(`/quote-status?status=error&message=Failed to send quote email to customer: ${sendResult.error}.`);
        }

        // 4. Update Sheet Status
        const updateRange = `Quotes!A${rowIndex + 1}`;
        const sheetResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: updateRange });
        const targetRow = sheetResponse.data.values[0];

        const header = (await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:Z1' })).data.values[0];
        targetRow[header.indexOf('Admin Status')] = 'Approved';
        targetRow[header.indexOf('Customer Status')] = 'Quote Sent';

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: updateRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });
        
        return res.redirect(`/quote-status?status=success&message=Quote approved and sent to the customer!`);

    } catch (error) {
        console.error("Quote approval error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during approval.`);
    }
}
