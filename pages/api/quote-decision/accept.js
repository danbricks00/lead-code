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
    console.log('📧 Preparing notification emails for quote acceptance');
    console.log('📋 Quote data keys:', Object.keys(quoteData));
    
    // Get customer email - try different possible column names
    const customerEmail = quoteData['CustomerEmail'] || quoteData['Customer Email'] || quoteData['customerEmail'];
    const customerName = quoteData['CustomerName'] || quoteData['Customer Name'] || quoteData['customerName'];
    
    // Get tradesperson email - try different possible column names  
    const tradespersonEmail = quoteData['TradespersonEmail'] || quoteData['Tradesperson Email'] || quoteData['tradespersonEmail'];
    const tradespersonName = quoteData['TradespersonName'] || quoteData['Tradesperson Name'] || quoteData['tradespersonName'];
    
    console.log('📧 Email recipients:');
    console.log('  - Customer:', customerEmail);
    console.log('  - Tradesperson:', tradespersonEmail);
    console.log('  - Admin:', process.env.ADMIN_EMAIL);

    const customerMail = {
        to: customerEmail,
        subject: `Confirmation: Your Quote has been Accepted`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #27ae60; margin: 0; font-size: 28px;">✅ Quote Accepted!</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Thank you for accepting our quote</p>
                </div>
                
                <p style="color: #2c3e50; font-size: 16px;">Hi ${customerName},</p>
                <p style="color: #2c3e50; font-size: 16px;">This is a confirmation that you have <strong>accepted</strong> the quote.</p>
                <p style="color: #2c3e50; font-size: 16px;">The tradesperson has been notified and will be in touch with you shortly to arrange the next steps.</p>
                
                <div style="background-color: #e8f5e8; border-radius: 6px; padding: 20px; margin: 25px 0;">
                  <h3 style="color: #27ae60; margin: 0 0 15px 0;">📋 Next Steps:</h3>
                  <ul style="color: #2c3e50; margin: 0; padding-left: 20px;">
                    <li>✅ Lead Received</li>
                    <li>✅ Quote Sent</li>
                    <li>✅ Decision Made: <strong>Accepted</strong></li>
                    <li>🔄 Tradesperson will contact you soon</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    Questions? Reply to this email or contact us directly.<br>
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>
              </div>
            </div>
        `,
    };

    const tradespersonMail = {
        to: tradespersonEmail,
        subject: `🎉 Quote Accepted by ${customerName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #f39c12; margin: 0; font-size: 28px;">🎉 Great News!</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Your quote has been accepted</p>
                </div>
                
                <div style="background-color: #fff3cd; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #856404; margin: 0 0 15px 0;">📋 Quote Details</h3>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Status:</strong> ✅ ACCEPTED</p>
                </div>
                
                <div style="background-color: #e8f5e8; border-radius: 6px; padding: 20px; margin: 25px 0; text-align: center;">
                  <h3 style="color: #27ae60; margin: 0 0 15px 0;">📞 Next Steps</h3>
                  <p style="color: #2c3e50; margin: 0 0 15px 0;">Please contact the customer to arrange the work details:</p>
                  <a href="mailto:${customerEmail}" style="display: inline-block; background-color: #27ae60; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">📧 Email Customer</a>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>
              </div>
            </div>
        `
    };
    
    const adminMail = {
        to: process.env.ADMIN_EMAIL,
        subject: `Quote Accepted: ${customerName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #3498db; margin: 0; font-size: 28px;">📊 Quote Accepted</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Administrative notification</p>
                </div>
                
                <div style="background-color: #ecf0f1; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #34495e; margin: 0 0 15px 0;">📋 Quote Details</h3>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Customer Email:</strong> ${customerEmail}</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Tradesperson:</strong> ${tradespersonName}</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Tradesperson Email:</strong> ${tradespersonEmail}</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Status:</strong> ✅ ACCEPTED</p>
                  <p style="color: #2c3e50; margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Admin System</strong>
                  </p>
                </div>
              </div>
            </div>
        `
    };

    try {
        console.log('📧 Sending customer confirmation email...');
        await sendEmail(customerMail);
        console.log('✅ Customer email sent successfully');
        
        console.log('📧 Sending tradesperson notification email...');
        await sendEmail(tradespersonMail);
        console.log('✅ Tradesperson email sent successfully');
        
        console.log('📧 Sending admin notification email...');
        await sendEmail(adminMail);
        console.log('✅ Admin email sent successfully');
        
        console.log('✅ All notification emails sent successfully');
    } catch (error) {
        console.error('❌ Error sending notification emails:', error);
        throw error;
    }
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
            'Decision': 'Accepted',
            'Decision Timestamp': new Date().toISOString(),
            'Customer Status': 'Quote Decision',
            'Tradesperson Status': 'Quote Decision',
            'Admin Status': 'Accepted',
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
        
        return res.redirect(`/quote-status?status=success&message=Your acceptance has been recorded!`);

    } catch (error) {
        console.error("Quote acceptance error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}