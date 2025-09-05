import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

// --- Helper Functions ---
function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateQuoteSubmissionLink(quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/quote-submit/${quoteId}?ts=${ts}&token=${token}`;
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

    const { quoteId, ts, token, reason } = req.query;

    if (!quoteId || !ts || !token || token !== verifyToken(quoteId, ts)) {
        return res.redirect(`/quote-status?status=error&message=Invalid decline link.`);
    }

    try {
        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Get Quote and Lead data from Sheets
        const quoteData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Quotes',
            searchColumn: 'QuoteID', searchValue: quoteId,
            columnsToFetch: ['Admin Status', 'TradePerson Email', 'TradesPerson Name', 'LeadiD', 'Reesubmission Allowed']
        });

        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        if (quoteData['Admin Status'] === 'Declined') return res.redirect(`/quote-status?status=error&message=This quote has already been declined.`);
        if (quoteData['Admin Status'] === 'Approved') return res.redirect(`/quote-status?status=error&message=This quote has already been approved and cannot be declined.`);

        const leadData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Leads',
            searchColumn: 'Lead', searchValue: quoteData['LeadiD'],
            columnsToFetch: ['CustomerName', 'CustomerEmail', 'ServiceType']
        });
        
        if (!leadData) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);

        // 2. Update Sheet Status to declined but allow resubmission
        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:Z1' });
        const header = headerResponse.data.values[0];
        const updates = { 
            'Admin Status': 'Declined', 
            'TradePerson Status': 'Needs Revision',
            'Reesubmission Allowed': 'Yes'
        };
        let targetRow = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `Quotes!A${quoteData.rowIndex}:Z${quoteData.rowIndex}` })).data.values[0];
        
        header.forEach((colName, index) => {
            if(updates[colName]) targetRow[index] = updates[colName];
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId, range: `Quotes!A${quoteData.rowIndex}`,
            valueInputOption: 'USER_ENTERED', requestBody: { values: [targetRow] },
        });

        // 3. Generate resubmission link
        const resubmissionLink = generateQuoteSubmissionLink(quoteId);

        // 4. Send notification email to tradesperson
        const tradespersonEmailOptions = {
          to: quoteData['TradePerson Email'],
          subject: `⚠️ Quote Revision Required - ${leadData['ServiceType']} for ${leadData['CustomerName']}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">⚠️ Quote Needs Revision</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin review required changes</p>
                </div>

                <!-- Quote Details -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📋 Quote Details</h3>
                  <p style="margin: 5px 0; color: #856404;"><strong>Customer:</strong> ${leadData['CustomerName']}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Service:</strong> ${leadData['ServiceType']}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Quote ID:</strong> ${quoteId}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Status:</strong> Declined - Revision Required</p>
                </div>

                <!-- Reason for Decline -->
                ${reason ? `
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 18px;">📝 Reason for Decline</h3>
                  <p style="color: #721c24; margin: 0;">${decodeURIComponent(reason)}</p>
                </div>
                ` : ''}

                <!-- Next Steps -->
                <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">🔄 Next Steps</h3>
                  <p style="color: #0c5460; margin: 0 0 15px 0;">
                    Your quote has been declined by the admin and needs revision. You can:
                  </p>
                  <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                    <li>Review and edit the quote details</li>
                    <li>Update pricing, timeline, or other information</li>
                    <li>Resubmit for admin approval</li>
                  </ul>
                </div>

                <!-- Resubmission Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resubmissionLink}" style="display: inline-block; background-color: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">🔄 Revise & Resubmit Quote</a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    Questions about the required changes? Reply to this email.<br>
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>

              </div>
            </div>
          `
        };

        await sendEmail(tradespersonEmailOptions);
        console.log(`✅ Quote decline notification sent to ${quoteData['TradePerson Email']}`);

        // 5. Send notification to admin
        const adminEmailOptions = {
          to: process.env.ADMIN_EMAIL,
          subject: `Quote Declined - ${leadData['ServiceType']} for ${leadData['CustomerName']}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">Quote Declined Successfully</h2>
              <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                <p><strong>Quote ID:</strong> ${quoteId}</p>
                <p><strong>Customer:</strong> ${leadData['CustomerName']}</p>
                <p><strong>Service:</strong> ${leadData['ServiceType']}</p>
                <p><strong>Tradesperson:</strong> ${quoteData['TradesPerson Name']}</p>
                <p><strong>Status:</strong> Declined - Tradesperson notified for revision</p>
                ${reason ? `<p><strong>Decline Reason:</strong> ${decodeURIComponent(reason)}</p>` : ''}
                <p>The tradesperson has been notified and can resubmit the quote after making revisions.</p>
              </div>
            </div>
          `
        };

        await sendEmail(adminEmailOptions);
        
        return res.redirect(`/quote-status?status=success&message=Quote declined successfully. Tradesperson has been notified and can resubmit.`);

    } catch (error) {
        console.error("Quote Decline Error:", error);
        return res.redirect(`/quote-status?status=error&message=An error occurred while declining the quote.`);
    }
}