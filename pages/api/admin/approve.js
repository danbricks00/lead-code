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

function generateQuoteViewLink(quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/quote-view?quoteId=${quoteId}&ts=${ts}&token=${token}`;
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

        // 4. Generate customer decision links
        const acceptLink = generateCustomerDecisionLink('accept', quoteId);
        const declineLink = generateCustomerDecisionLink('decline', quoteId);
        const viewQuoteLink = generateQuoteViewLink(quoteId);

        // 5. Send the quote email to the customer with Xero PDF
        const customerEmailOptions = {
          to: leadData['CustomerEmail'],
          subject: `🎯 Your Quote for ${leadData['ServiceType']} is Ready!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">📋 Your Quote is Ready!</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Professional quote for ${leadData['ServiceType']}</p>
                </div>

                <!-- Customer Details -->
                <div style="background-color: #ecf0f1; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #34495e; margin: 0 0 15px 0; font-size: 18px;">📋 Quote Details</h3>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Customer:</strong> ${leadData['CustomerName']}</p>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Service:</strong> ${leadData['ServiceType']}</p>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Location:</strong> ${leadData['Area'] || 'N/A'}, ${leadData['Suburb'] || 'N/A'}</p>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Quote ID:</strong> ${quoteId}</p>
                </div>

                <!-- Online Quote Viewer -->
                <div style="background-color: #3498db; border-radius: 6px; padding: 20px; margin-bottom: 25px; text-align: center;">
                  <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">🌐 View Your Quote Online</h3>
                  <p style="color: #ecf0f1; margin: 0 0 15px 0;">Click below to view your detailed quote in your browser:</p>
                  <a href="${viewQuoteLink}" style="display: inline-block; background-color: white; color: #3498db; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">📖 View Quote Online</a>
                </div>

                <!-- Quick Decision Buttons -->
                <div style="background-color: #f8f9fa; border-radius: 6px; padding: 25px; text-align: center;">
                  <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px;">🎯 Quick Decision</h3>
                  <p style="color: #5a6c7d; margin: 0 0 20px 0;">Make your decision directly from this email:</p>
                  
                  <div style="margin: 20px 0;">
                    <a href="${acceptLink}" style="display: inline-block; background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">✅ ACCEPT QUOTE</a>
                    <a href="${declineLink}" style="display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">❌ DECLINE QUOTE</a>
                  </div>
                  
                  <p style="color: #7f8c8d; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">Each button can only be used once for security</p>
                </div>

                <!-- PDF Attachment Notice -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
                  <p style="color: #856404; margin: 0; font-weight: bold;">📎 Professional PDF quote attached to this email</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    Questions? Reply to this email or contact us directly.<br>
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>

              </div>
            </div>
          `,
          attachments: [{ filename: `Quote_${quoteId}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        };
        
        await sendEmail(customerEmailOptions);
        console.log(`✅ Customer quote email sent to ${leadData['CustomerEmail']} with PDF attachment`);

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
