import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { xero, initializeXero } from "../../../lib/xero";
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

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
        
        // --- Temporarily disable PDF generation ---
        // let pdfBuffer;
        // try {
        //   // We pass the full leadDetails object now
        //   const { pdfBuffer: generatedPdf } = await generatePdf(quoteDetails, leadDetails);
        //   pdfBuffer = generatedPdf;
        //   console.log('PDF for customer generated successfully.');
        // } catch (pdfError) {
        //   console.error('CRITICAL: Failed to generate customer PDF after approval:', pdfError);
        //   // If PDF fails here, we should still try to send the email without it.
        // }

        // 4. Send the quote email to the customer
        const customerEmailOptions = {
          to: leadDetails.customerEmail,
          subject: `Your Quote for ${leadDetails.projectName} is Ready!`,
          html: `
            <h1>Your Quote is Ready</h1>
            <p>Hello ${leadDetails.customerName},</p>
            <p>Please find your quote from ${quoteDetails.tradespersonName} for the project "${leadDetails.projectName}" attached.</p>
            <p><strong>Total Quote:</strong> $${quoteDetails.totalQuote}</p>
            <p><i>PDF generation is temporarily disabled while we integrate with Xero. You can view the full quote details online.</i></p>
            <p>To accept or decline this quote, please use the buttons below. This action is final.</p>
            <a href="${acceptLink}" style="padding: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Accept Quote</a>
            <a href="${declineLink}" style="padding: 10px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Decline Quote</a>
            <br/><br/>
            <p>You can also view the quote online here: <a href="${viewLink}">${viewLink}</a></p>
            <p>This quote is valid until: <strong>${new Date(quoteDetails.quoteValidUntil).toLocaleDateString()}</strong></p>
          `
          // attachments: pdfBuffer ? [{
          //   filename: `Quote_${leadId}.pdf`,
          //   content: pdfBuffer,
          //   contentType: 'application/pdf'
          // }] : []
        };

        await transporter.sendMail(customerEmailOptions);
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

    if (!quoteId || !ts || !token || token !== verifyToken(quoteId, ts)) {
        return res.redirect(`/quote-status?status=error&message=Invalid approval link.`);
    }

    try {
        const tenantId = await initializeXero();
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Get Quote and Lead data from Sheets
        const quoteResult = await findRowByValue(sheets, spreadsheetId, 'Quotes', 0, quoteId);
        if (!quoteResult) return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        
        const { rowData: quoteData, rowIndex } = quoteResult;

        if (quoteData['Admin Status'] === 'Approved') {
            return res.redirect(`/quote-status?status=error&message=This quote has already been approved.`);
        }

        const xeroQuoteId = quoteData['Xero Quote ID'];
        if (!xeroQuoteId) {
            return res.redirect(`/quote-status?status=error&message=Error: Xero Quote ID not found for this quote.`);
        }
        
        const leadResult = await findRowByValue(sheets, spreadsheetId, 'Leads', 0, quoteData['Lead ID']);
        if (!leadResult) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);
        const { rowData: leadData } = leadResult;

        // 2. Update Xero Quote status from DRAFT to SENT
        const quoteToSend = { quotes: [{ status: 'SENT' }] };
        await xero.accountingApi.updateQuote(tenantId, xeroQuoteId, quoteToSend);
        console.log(`Updated Xero Quote ${xeroQuoteId} to SENT status.`);

        // 3. Get the final PDF from Xero
        const quotePdf = await xero.accountingApi.getQuoteAsPdf(tenantId, xeroQuoteId, { headers: { 'Accept': 'application/pdf' } });
        const pdfBuffer = Buffer.from(quotePdf.body);
        console.log(`Downloaded final PDF for Xero Quote ${xeroQuoteId}`);

        // 4. Send the quote email to the customer with Xero PDF
        const acceptLink = generateCustomerDecisionLink('accept', quoteId);
        const declineLink = generateCustomerDecisionLink('decline', quoteId);
        
        const customerEmailOptions = {
          to: leadData['Customer Email'],
          subject: `Your Quote for ${leadData['Project Name']} is Ready!`,
          html: `
            <h1>Your Quote is Ready</h1>
            <p>Hello ${leadData['Customer Name']},</p>
            <p>Please find your official quote attached.</p>
            <p>To accept or decline, please use the buttons below.</p>
            <a href="${acceptLink}">Accept Quote</a> | <a href="${declineLink}">Decline Quote</a>
          `,
          attachments: [{
            filename: `Quote_${quoteId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }]
        };

        await sendEmail(customerEmailOptions);

        // 5. Update Sheet Status to final
        const header = (await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:Z1' })).data.values[0];
        const updates = { 'Admin Status': 'Approved', 'Customer Status': 'Quote Sent' };
        let targetRow = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `Quotes!A${rowIndex}:Z${rowIndex}` })).data.values[0];
        
        header.forEach((colName, index) => {
            if(updates[colName]) targetRow[index] = updates[colName];
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });
        
        return res.redirect(`/quote-status?status=success&message=Quote approved and sent to the customer!`);

    } catch (error) {
        console.error("Xero Quote Approval Error:", error.response ? JSON.stringify(error.response.body, null, 2) : error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during Xero approval.`);
    }
}
