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

async function sendNotificationEmails(quoteData, leadData = {}) {
    console.log('📧 Preparing notification emails for quote decline');
    console.log('📋 Quote data keys:', Object.keys(quoteData));
    console.log('📋 Lead data keys:', Object.keys(leadData));
    
    // Get customer email - try quote data first, then lead data
    const customerEmail = quoteData['CustomerEmail'] || quoteData['Customer Email'] || quoteData['customerEmail'] || 
                         leadData['CustomerEmail'] || leadData['Customer Email'] || leadData['customerEmail'];
    const customerName = quoteData['CustomerName'] || quoteData['Customer Name'] || quoteData['customerName'] || 
                        leadData['CustomerName'] || leadData['Customer Name'] || leadData['customerName'];
    
    // Get tradesperson email - try different possible column names  
    const tradespersonEmail = quoteData['TradespersonEmail'] || quoteData['Tradesperson Email'] || quoteData['tradespersonEmail'] || 
                             quoteData['TradePerson Email'] || quoteData['TradesPerson Email'];
    const tradespersonName = quoteData['TradespersonName'] || quoteData['Tradesperson Name'] || quoteData['tradespersonName'] || 
                            quoteData['TradePerson Name'] || quoteData['TradesPerson Name'];
    
    console.log('📧 Email recipients:');
    console.log('  - Customer:', customerEmail);
    console.log('  - Tradesperson:', tradespersonEmail);
    console.log('  - Admin:', process.env.ADMIN_EMAIL);

    // Validate email addresses
    if (!customerEmail) {
        console.error('❌ Customer email not found in quote or lead data');
        throw new Error('Customer email not found');
    }
    if (!tradespersonEmail) {
        console.error('❌ Tradesperson email not found in quote data');
        throw new Error('Tradesperson email not found');
    }

    const customerMail = {
        to: customerEmail,
        subject: `Thank You for Your Consideration - Future Opportunities Await`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Respectful Design -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
                    <div style="font-size: 48px; color: white;">🤝</div>
                  </div>
                  <h1 style="color: #6c757d; margin: 0; font-size: 32px; font-weight: bold;">Thank You</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">We appreciate you considering our services, ${customerName}</p>
                </div>

                <!-- Journey Completion -->
                <div style="margin: 30px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #495057;">Your Journey With Us</span>
                    <span style="font-weight: bold; color: #6c757d; font-size: 18px;">Decision Complete</span>
                  </div>
                  <div style="background: #e9ecef; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
                    <div style="background: linear-gradient(90deg, #6c757d 0%, #495057 100%); height: 100%; width: 100%; border-radius: 6px;"></div>
                  </div>
                </div>

                <!-- Understanding Message -->
                <div style="background: #e2e3e5; color: #495057; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center;">
                  <h3 style="margin: 0 0 15px 0; font-size: 22px;">We Completely Understand</h3>
                  <p style="margin: 0; font-size: 16px;">Choosing the right tradesperson is an important decision. We respect your choice and thank you for the opportunity to quote on your project.</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    🙏 Thank you for considering Kiwi Trade
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong> - Here when you need us
                  </p>
                </div>

              </div>
            </div>
        `,
    };

    const tradespersonMail = {
        to: tradespersonEmail,
        subject: `Quote Decision: ${customerName} Declined Your Quote`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
                    <div style="font-size: 48px; color: white;">💼</div>
                  </div>
                  <h1 style="color: #6c757d; margin: 0; font-size: 32px; font-weight: bold;">Quote Update</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Customer has made their decision</p>
                </div>

                <!-- Decision Summary -->
                <div style="background: #f8d7da; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #f5c6cb; text-align: center;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 20px;">📝 Decision</h3>
                  <p style="color: #721c24; margin: 0; font-size: 24px; font-weight: bold;">Quote Declined</p>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">The customer has chosen not to proceed at this time</p>
                </div>

                <!-- Customer Details -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">👤 Customer Details</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p style="margin: 5px 0; color: #495057;"><strong>Customer:</strong> ${customerName}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${customerEmail}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Decision Date:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT</p>
                  </div>
                </div>

                <!-- Encouragement -->
                <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #ffeaa7; text-align: center;">
                  <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">💪 Keep Going!</h3>
                  <p style="color: #856404; margin: 0; font-size: 16px;">Every "no" brings you closer to a "yes". Stay positive and keep providing excellent quotes!</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    🔄 Ready for the next opportunity!
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong> - Supporting your success
                  </p>
                </div>

              </div>
            </div>
        `
    };

    const adminMail = {
        to: process.env.ADMIN_EMAIL,
        subject: `📉 Quote Analytics: ${customerName} Declined`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
                    <div style="font-size: 48px; color: white;">📉</div>
                  </div>
                  <h1 style="color: #6c757d; margin: 0; font-size: 32px; font-weight: bold;">Quote Analytics</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Customer decision analysis and insights</p>
                </div>

                <!-- Decision Summary -->
                <div style="background: #f8d7da; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #f5c6cb; text-align: center;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 20px;">📊 Decision Result</h3>
                  <p style="color: #721c24; margin: 0; font-size: 24px; font-weight: bold;">Quote Declined</p>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">Lead conversion was not successful</p>
                </div>

                <!-- Transaction Details -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">📋 Transaction Details</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p style="margin: 5px 0; color: #495057;"><strong>Customer:</strong> ${customerName}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${customerEmail}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Tradesperson:</strong> ${tradespersonName}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">❌ NOT CONVERTED</span></p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Timestamp:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT</p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    📊 Analytics Complete - Learning Opportunity Identified
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Admin System</strong> - Continuous Improvement
                  </p>
                </div>

              </div>
            </div>
        `
    };

    try {
        console.log('📧 Sending customer acknowledgment email...');
        await sendEmail(customerMail);
        console.log('✅ Customer email sent successfully');
        
        console.log('📧 Sending tradesperson notification email...');
        await sendEmail(tradespersonMail);
        console.log('✅ Tradesperson email sent successfully');
        
        console.log('📧 Sending admin analytics email...');
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
        
        // Get lead ID to fetch customer information
        const leadIdIndex = header.findIndex(col => col && (col.toLowerCase().includes('lead') || col.toLowerCase().includes('leadi')));
        const leadId = leadIdIndex !== -1 ? targetRow[leadIdIndex] : null;
        
        // Fetch lead data to get customer information
        let leadData = {};
        if (leadId) {
            try {
                const leadResponse = await sheets.spreadsheets.values.get({ 
                    spreadsheetId, 
                    range: 'Leads!A:Z' 
                });
                const leadRows = leadResponse.data.values;
                if (leadRows) {
                    const leadHeader = leadRows[0];
                    const leadRowIndex = leadRows.findIndex(row => row[0] === leadId);
                    if (leadRowIndex !== -1) {
                        const leadRow = leadRows[leadRowIndex];
                        leadHeader.forEach((headerName, index) => {
                            leadData[headerName] = leadRow[index] || '';
                        });
                    }
                }
            } catch (leadError) {
                console.log('⚠️ Could not fetch lead data:', leadError.message);
            }
        }
        
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

        // ROBUST ONE-TIME DECISION CHECK
        if (decisionIndex !== -1 && targetRow[decisionIndex] && targetRow[decisionIndex].trim() !== '') {
            const decision = targetRow[decisionIndex];
            const timestamp = (decisionTimestampIndex !== -1) ? targetRow[decisionTimestampIndex] : '';
            const formattedTime = formatTimestamp(timestamp);
            
            console.log(`🚫 DECISION ALREADY MADE: ${decision} on ${formattedTime}`);
            
            // Create a detailed error page showing the decision status
            const errorMessage = `This quote was already ${decision.toLowerCase()} on ${formattedTime}.`;
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Decision Already Made</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .decision-info { background: #f8d7da; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0; }
                        .decision-status { color: #721c24; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">⚠️</div>
                        <h1 class="error-title">Decision Already Made</h1>
                        <p class="error-message">This quote decision has already been processed and cannot be changed.</p>
                        <div class="decision-info">
                            <div class="decision-status">Decision: ${decision}</div>
                            <div class="timestamp">Made on: ${formattedTime}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
            `;
            
            return res.status(400).send(statusPage);
        }
        
        // --- Update Sheet Data ---
        console.log('📝 Updating quote decision in Google Sheets...');
        
        // Find the correct column indices for updating
        const decisionIndex = header.indexOf('Decision');
        const decisionTimestampIndex = header.indexOf('Decision Timestamp');
        const customerStatusIndex = header.indexOf('Customer Status');
        const tradespersonStatusIndex = header.indexOf('Tradesperson Status');
        const adminStatusIndex = header.indexOf('Admin Status');

        // Update the target row with decision data
        if (decisionIndex !== -1) targetRow[decisionIndex] = 'Declined';
        if (decisionTimestampIndex !== -1) targetRow[decisionTimestampIndex] = new Date().toISOString();
        if (customerStatusIndex !== -1) targetRow[customerStatusIndex] = 'Quote Decision';
        if (tradespersonStatusIndex !== -1) targetRow[tradespersonStatusIndex] = 'Quote Decision';
        if (adminStatusIndex !== -1) targetRow[adminStatusIndex] = 'Declined';

        // Prepare data for email notifications
        const quoteDataForEmail = {};
        header.forEach((headerName, index) => {
            quoteDataForEmail[headerName] = targetRow[index] || '';
        });

        // Update the Google Sheet
        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Quotes!A${rowIndex + 1}:Z${rowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [targetRow] },
            });
            console.log('✅ Quote decision updated in Google Sheets');
        } catch (updateError) {
            console.error('❌ Error updating Google Sheets:', updateError);
            throw new Error('Failed to update quote decision: ' + updateError.message);
        }

        // --- Send Emails ---
        await sendNotificationEmails(quoteDataForEmail, leadData);
        
        return res.redirect(`/quote-status?status=success&message=Your decision to decline has been recorded.`);

    } catch (error) {
        console.error("Quote decline error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}