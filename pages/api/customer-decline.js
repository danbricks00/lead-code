import { getGoogleSheetsClient, getSpreadsheetId } from "../../lib/googleSheets.js";
import { sendEmail } from '../../lib/emailHelper';
import quoteLogger from '../../lib/quoteLogger.js';
import { normalizeQueryParams, createIdMismatchError } from '../../utils/normalize.js';
import { getNZTTimestamp } from '../../utils/nztTimestamp.js';
import crypto from "crypto";

// NZ timestamp helper function
function getNZTimestamp(date = new Date()) {
    return date.toLocaleString("en-NZ", {
        timeZone: "Pacific/Auckland",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).replace(",", "");
}

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
        });
    } catch (e) {
        return isoString;
    }
}

async function sendNotificationEmails(quoteData, leadData = {}, requestId = null) {
    quoteLogger.email('Preparing notification emails for quote decline', {
        quoteDataKeys: Object.keys(quoteData),
        leadDataKeys: Object.keys(leadData)
    }, requestId);
    
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
    
    quoteLogger.email('Email recipients identified', {
        customerEmail,
        tradespersonEmail,
        adminEmail: process.env.ADMIN_EMAIL ? 'SET' : 'NOT_SET'
    }, requestId);

    // Validate email addresses
    if (!customerEmail || customerEmail === 'undefined' || customerEmail === 'N/A (Column not found)') {
        quoteLogger.error('Customer email not found in quote or lead data', { customerEmail }, requestId);
        throw new Error('Customer email not found');
    }
    if (!tradespersonEmail || tradespersonEmail === 'undefined' || tradespersonEmail === 'N/A (Column not found)') {
        quoteLogger.error('Tradesperson email not found in quote data', { tradespersonEmail }, requestId);
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
        quoteLogger.email('Sending customer acknowledgment email', { 
            to: customerMail.to,
            subject: customerMail.subject
        }, requestId);
        await sendEmail(customerMail);
        quoteLogger.email('Customer email sent successfully', null, requestId);
        
        quoteLogger.email('Sending tradesperson notification email', { 
            to: tradespersonMail.to,
            subject: tradespersonMail.subject
        }, requestId);
        await sendEmail(tradespersonMail);
        quoteLogger.email('Tradesperson email sent successfully', null, requestId);
        
        quoteLogger.email('Sending admin analytics email', { 
            to: adminMail.to,
            subject: adminMail.subject
        }, requestId);
        await sendEmail(adminMail);
        quoteLogger.email('Admin email sent successfully', null, requestId);
        
        quoteLogger.email('All notification emails sent successfully', null, requestId);
    } catch (error) {
        quoteLogger.error('Error sending notification emails', error, requestId);
        throw error;
    }
}

export default async function handler(req, res) {
    const requestId = quoteLogger.generateRequestId();
    const startTime = Date.now();
    
    // Clear prefixed logging for customer decline
    console.log(JSON.stringify({
        tag: 'CUSTOMER_DECLINE_REQ_START',
        requestId,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    }));
    
    // Log incoming request details
    quoteLogger.apiDecline('Request received', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
            'x-forwarded-for': req.headers['x-forwarded-for']
        },
        bodySize: req.body ? JSON.stringify(req.body).length : 0
    }, requestId);
    
    if (req.method !== 'GET') {
        quoteLogger.error('Invalid method', null, requestId);
        quoteLogger.response('Sending 405 Method Not Allowed', { method: req.method }, requestId);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, leadId, ts, token } = req.query;

    // Validate required parameters
    if (!quoteId || !leadId) {
        console.error(JSON.stringify({ tag: 'DECLINE_PARAM_FAIL', quoteId, leadId }));
        return res.status(400).json({ error: 'Missing or invalid quoteId/leadId' });
    }

    // Normalize parameters
    const params = normalizeQueryParams({ quoteId, leadId, ts, token });
    const { QuoteID, LeadID } = params;
    
    console.log('🔍 [CUSTOMER-DECLINE] Parameter mapping:', {
        quoteId, leadId, QuoteID, LeadID
    });

    // Enhanced token validation debugging (if token provided)
    let tokenValid = true;
    if (ts && token) {
        const expectedToken = verifyToken(quoteId, ts);
        tokenValid = token === expectedToken;
        
        if (!tokenValid) {
            console.error(JSON.stringify({ tag: 'DECLINE_TOKEN_FAIL', quoteId, leadId }));
            return res.status(400).json({ error: 'Invalid token' });
        }
    }
    
    quoteLogger.customerDecline('Token validated successfully', { quoteId }, requestId);

    try {
        quoteLogger.sheets('Initializing Google Sheets client', null, requestId);
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        const range = 'Quotes!A:AL';

        quoteLogger.sheets('Fetching quote data from Google Sheets', { 
            spreadsheetId: spreadsheetId.substring(0, 10) + '...', 
            range 
        }, requestId);

        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        if (!rows) {
            quoteLogger.error('Could not connect to Google Sheets', null, requestId);
            quoteLogger.response('Redirecting to error page - database connection failed', null, requestId);
            return res.redirect(`/quote-status?status=error&message=Could not connect to the database.`);
        }
        
        quoteLogger.sheets('Google Sheets data retrieved', { 
            totalRows: rows.length,
            hasHeader: rows.length > 0 
        }, requestId);
        
        const header = rows[0];
        const rowIndex = rows.findIndex(row => row[1] === QuoteID); // QuoteID is in column B (index 1)
        const rowFound = rowIndex !== -1;

        if (!rowFound) {
            console.error(JSON.stringify({
                tag: 'DECLINE_LOOKUP_FAIL',
                reason: 'QuoteID not found',
                quoteId,
                leadId,
                QuoteID,
                searchedRows: rows.length - 1,
                availableQuoteIds: rows.slice(1).map(row => row[1]).filter(id => id)
            }));
            return res.status(404).json({ 
                tag: "DECLINE_LOOKUP_FAIL",
                reason: "QuoteID not found",
                quoteId 
            });
        }
        
        quoteLogger.sheets('Quote found in Google Sheets', { 
            quoteId, 
            rowIndex: rowIndex + 1,
            totalColumns: header.length
        }, requestId);
        
        const targetRow = rows[rowIndex];
        
        // Get lead ID to fetch customer information (LeadID is in column C, index 2)
        const leadId = targetRow[2] || null;
        
        quoteLogger.dataFlow('Quote row data extracted', {
            quoteId,
            leadId,
            rowLength: targetRow.length,
            hasLeadId: !!leadId
        }, requestId);
        
        // Fetch lead data to get customer information
        let leadData = {};
        if (leadId) {
            try {
                quoteLogger.sheets('Fetching lead data', { leadId }, requestId);
                const leadResponse = await sheets.spreadsheets.values.get({ 
                    spreadsheetId, 
                    range: 'Leads!A:L' 
                });
                const leadRows = leadResponse.data.values;
                if (leadRows) {
                    const leadHeader = leadRows[0];
                    const leadRowIndex = leadRows.findIndex(row => row[0] === LeadID);
                    if (leadRowIndex !== -1) {
                        const leadRow = leadRows[leadRowIndex];
                        leadHeader.forEach((headerName, index) => {
                            leadData[headerName] = leadRow[index] || '';
                        });
                        quoteLogger.sheets('Lead data retrieved successfully', { 
                            leadId, 
                            leadRowIndex: leadRowIndex + 1,
                            leadDataKeys: Object.keys(leadData)
                        }, requestId);
                    } else {
                        console.error(JSON.stringify({
                            tag: 'DECLINE_LOOKUP_FAIL',
                            quoteId,
                            leadId,
                            LeadID,
                            error: 'Lead not found in Leads sheet'
                        }));
                        return res.status(404).json({ error: 'Lead not found' });
                    }
                }
            } catch (leadError) {
                console.error(JSON.stringify({
                    tag: 'DECLINE_LOOKUP_FAIL',
                    quoteId,
                    leadId,
                    error: 'Could not fetch lead data',
                    leadError: leadError.message
                }));
                return res.status(404).json({ error: 'Lead not found' });
            }
        } else {
            console.error(JSON.stringify({
                tag: 'DECLINE_LOOKUP_FAIL',
                quoteId,
                leadId,
                error: 'No lead ID found in quote data'
            }));
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Validate that the lead and quote match
        if (leadData.LeadID !== LeadID || leadData.QuoteID !== QuoteID) {
            console.error(JSON.stringify({
                tag: 'DECLINE_LOOKUP_FAIL',
                quoteId,
                leadId,
                leadDataLeadID: leadData.LeadID,
                leadDataQuoteID: leadData.QuoteID,
                expectedLeadID: LeadID,
                expectedQuoteID: QuoteID
            }));
            return res.status(404).json({ error: 'Lead or Quote not found' });
        }
        
        console.log('✅ [CUSTOMER-DECLINE] Lookup successful:', {
            tag: 'DECLINE_LOOKUP_OK',
            quoteId,
            leadId,
            foundQuote: !!targetRow,
            foundLead: !!leadData
        });
        
        // Build header column mapping for decision columns
        const col = {
            CustomerDecision: header.indexOf('CustomerDecision'),
            CustomerDecisionTimeStamp: header.indexOf('CustomerDecisionTimeStamp'),
            AdminDecisionTimeStamp: header.indexOf('AdminDecisionTimeStamp'),
            AdminDecision: header.indexOf('AdminDecision'),
            AdminPersonStatus: header.indexOf('AdminPersonStatus'),
            ValidUntil: header.indexOf('ValidUntil')
        };
        
        // Log missing headers as warnings but don't fail
        Object.entries(col).forEach(([key, index]) => {
            if (index === -1) {
                console.warn(`[CUSTOMER-DECLINE] Warning: Column '${key}' not found in header`);
            }
        });
        
        const currentDecision = col.CustomerDecision !== -1 ? targetRow[col.CustomerDecision] : '';
        const currentDecisionTimestamp = col.CustomerDecisionTimeStamp !== -1 ? targetRow[col.CustomerDecisionTimeStamp] : '';
        const validUntil = col.ValidUntil !== -1 ? targetRow[col.ValidUntil] : '';
        
        quoteLogger.dataFlow('Decision and expiry data extracted', {
            currentDecision,
            currentDecisionTimestamp,
            validUntil,
            customerDecisionIndex: col.CustomerDecision,
            customerDecisionTimestampIndex: col.CustomerDecisionTimeStamp,
            validUntilIndex: col.ValidUntil
        }, requestId);
        
        // --- DECISION GUARDS ---
        
        // Helper function for consistent NZT timestamp formatting
        function formatDateTimeNZT(date) {
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'Pacific/Auckland'
            };
            return new Intl.DateTimeFormat('en-NZ', options).format(new Date(date));
        }
        
        // Enhanced logging for decision flow
        console.log(`[${new Date().toISOString()}] [${requestId}] [CUSTOMER-DECLINE] Start decision flow`, {
            quoteId,
            leadId,
            headers: Object.keys(col),
            rowFound,
            currentDecision: targetRow[col.CustomerDecision] || 'none',
            currentStatus: targetRow[col.AdminPersonStatus] || 'none'
        });

        // ✅ Only fail if headers missing or row not found
        if (col.CustomerDecision === -1 || col.CustomerDecisionTimeStamp === -1) {
            return res.json({ tag: "DECLINE_LOOKUP_FAIL", reason: "Missing header", quoteId });
        }
        if (!rowFound) {
            return res.json({ tag: "DECLINE_LOOKUP_FAIL", reason: "QuoteID not found", quoteId });
        }

        // ✅ Guard for expired
        if (new Date(targetRow[col.ValidUntil]) < new Date()) {
            return res.json({
                tag: "QUOTE_EXPIRED",
                validUntil: formatDateTimeNZT(targetRow[col.ValidUntil])
            });
        }

        // ✅ Duplicate guard: only if a real decision already exists
        const currentDecisionValue = targetRow[col.CustomerDecision];
        if (currentDecisionValue && currentDecisionValue !== "none" && currentDecisionValue.trim() !== "") {
            return res.json({
                tag: "CUSTOMER_ALREADY_DECIDED",
                decision: currentDecisionValue,
                decisionTime: formatDateTimeNZT(targetRow[col.CustomerDecisionTimeStamp])
            });
        }

        // ✅ First-time update: allow when "none" or ""
        targetRow[col.CustomerDecision] = "Declined";
        targetRow[col.CustomerDecisionTimeStamp] = formatDateTimeNZT(new Date());
        targetRow[col.AdminPersonStatus] = "Customer Declined";

        // Update the Google Sheets row
        const updateResult = await upsertQuoteRow(sheets, spreadsheetId, targetRow);
        
        console.log(`[${requestId}] [CUSTOMER-DECLINE] Decision update success`, {
            quoteId,
            adminOrCustomer: "Customer",
            action: "Declined",
            updatedRow: {
                decision: targetRow[col.CustomerDecision],
                decisionTime: targetRow[col.CustomerDecisionTimeStamp],
                status: targetRow[col.AdminPersonStatus]
            }
        });

        return res.json({ tag: "CUSTOMER_DECISION_RECORDED", decision: targetRow[col.CustomerDecision] });
        
        // Check if quote has been rejected
        const statusIndex = header.indexOf('Status');
        const quoteStatus = statusIndex !== -1 ? targetRow[statusIndex] : '';
        
        if (quoteStatus === 'Rejected') {
            quoteLogger.customerDecline('Quote rejected - preventing decline', { 
                quoteId, 
                status: quoteStatus 
            }, requestId);
            
            const rejectionPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Not Available - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Not Available</h1>
                    <div class="error">
                        <h2>Sorry, this quote is no longer available.</h2>
                        <p>This quote has been rejected and is no longer valid.</p>
                        <p>If you have any questions, please contact us directly.</p>
                    </div>
                    <div class="info">
                        <p>Contact us for assistance:</p>
                        <p>Email: info@kiwitrade.co.nz<br>Phone: 0800 KIWI TRADE</p>
                    </div>
                </body>
                </html>
            `;
            
            quoteLogger.response('Sending rejection page', { 
                quoteId, 
                processingTime: Date.now() - startTime 
            }, requestId);
            return res.status(400).send(rejectionPage);
        }

        // Check if quote has expired
        let isExpired = false;
        if (validUntil) {
            try {
                const validUntilDate = new Date(validUntil);
                const now = new Date();
                isExpired = validUntilDate < now;
                quoteLogger.dataFlow('Expiry check completed', {
                    validUntil,
                    validUntilDate: validUntilDate.toISOString(),
                    now: now.toISOString(),
                    isExpired
                }, requestId);
            } catch (error) {
                quoteLogger.error('Could not parse ValidUntil date', error, requestId);
            }
        } else {
            quoteLogger.info('No ValidUntil date found', null, requestId);
        }
        
        // EXPIRY LOCK LOGIC
        if (isExpired) {
            quoteLogger.customerDecline('Quote expired - processing expiry logic', { 
                validUntil, 
                currentDecision 
            }, requestId);
            
            // If quote expired and no decision made yet, lock it as "Expired"
            if (!currentDecision || currentDecision.trim() === '') {
                quoteLogger.sheets('Locking expired quote as "Expired"', { quoteId }, requestId);
                
                // Update the sheet to mark as expired
                const updateData = {
                    'CustomerDecision': 'Expired',
                    'CustomerDecisionTimeStamp': getNZTTimestamp(),
                };
                
                const quoteDataForUpdate = {};
                header.forEach((headerName, index) => {
                    quoteDataForUpdate[headerName] = targetRow[index] || '';
                    if (updateData[headerName] !== undefined) {
                        targetRow[index] = updateData[headerName];
                        quoteDataForUpdate[headerName] = updateData[headerName];
                    }
                });
                
                quoteLogger.sheets('Updating Google Sheets with expired status', { 
                    updateData,
                    rowIndex: rowIndex + 1
                }, requestId);
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `Quotes!A${rowIndex + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [targetRow] },
                });
                
                quoteLogger.sheets('Google Sheets updated with expired status', null, requestId);
            }
            
            // Always return expired page (whether just locked or already expired)
            quoteLogger.response('Sending expired quote page', { 
                validUntil, 
                currentDecision,
                processingTime: Date.now() - startTime
            }, requestId);
            
            const expiredPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Expired</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .expiry-info { background: #f8d7da; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0; }
                        .expiry-status { color: #721c24; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">❌</div>
                        <h1>Quote Expired</h1>
                        <p>This quote expired on ${validUntil}.</p>
                        <div class="expiry-info">
                            <div class="expiry-status">Quote Status: Expired</div>
                            <div class="timestamp">Expired on: ${validUntil}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            Please contact us again via the website to request a new quote.
                        </p>
                    </div>
                </body>
                </html>
            `;
            
            return res.status(200).send(expiredPage);
        }
        
        // DECISION LOCK LOGIC (for valid quotes)
        // Allow customer to decline even if admin pre-approved, but prevent if already accepted/declined by customer
        if (currentDecision && currentDecision.trim() !== '' && currentDecision !== 'Admin Approved') {
            const formattedTime = formatTimestamp(currentDecisionTimestamp);
            quoteLogger.customerDecline('Decision already made - preventing duplicate', { 
                currentDecision, 
                formattedTime,
                quoteId
            }, requestId);
            
            // Return user-friendly HTML page for already-made decision
            quoteLogger.response('Sending already-made decision page', { 
                currentDecision,
                formattedTime,
                processingTime: Date.now() - startTime
            }, requestId);
            
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Decision Already Made</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #ffc107; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .decision-info { background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0; }
                        .decision-status { color: #856404; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">⚠️</div>
                        <h1>Quote Decision Already Made</h1>
                        <p>You already chose ${currentDecision} on ${formattedTime}.</p>
                        <div class="decision-info">
                            <div class="decision-status">Decision: ${currentDecision}</div>
                            <div class="timestamp">Made on: ${formattedTime}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
            `;
            
            return res.status(200).send(statusPage);
        }
        
        // --- Update Sheet Data using correct schema column names ---
        quoteLogger.customerDecline('Processing quote decline', { quoteId }, requestId);
        
        const nzTimestamp = getNZTTimestamp();
        
        // ✅ First‑time decline
        targetRow[col.CustomerDecision] = "Declined";
        targetRow[col.CustomerDecisionTimeStamp] = formatDateTimeNZT(new Date());
        targetRow[col.AdminPersonStatus] = "Customer Declined";

        // Log successful decision update
        console.log(`[${requestId}] [CUSTOMER-DECLINE] Decision update success`, {
            quoteId,
            adminOrCustomer: "Customer",
            action: "Declined",
            updatedRow: {
                decision: targetRow[col.CustomerDecision],
                decisionTime: targetRow[col.CustomerDecisionTimeStamp],
                status: targetRow[col.AdminPersonStatus]
            }
        });

        const updateData = {
            'CustomerDecision': 'Declined',
            'CustomerDecisionTimeStamp': nzTimestamp,
            'AdminPersonStatus': 'Customer Declined',
        };

        quoteLogger.dataFlow('Preparing Google Sheets update', { 
            updateData,
            rowIndex: rowIndex + 1,
            columnMapping: col
        }, requestId);

        const quoteDataForEmail = {};
        header.forEach((headerName, index) => {
            quoteDataForEmail[headerName] = targetRow[index] || '';
        });

        quoteLogger.sheets('Updating Google Sheets with decline', { 
            updateData,
            rowIndex: rowIndex + 1,
            quoteDataKeys: Object.keys(quoteDataForEmail)
        }, requestId);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });

        quoteLogger.sheets('Google Sheets updated successfully', null, requestId);

        // --- Send Emails ---
        try {
            quoteLogger.email('Starting notification email process', { 
                customerEmail: quoteDataForEmail['CustomerEmail'],
                tradespersonEmail: quoteDataForEmail['TradePersonEmail']
            }, requestId);
            
            await sendNotificationEmails(quoteDataForEmail, leadData, requestId);
            quoteLogger.email('All notification emails sent successfully', null, requestId);
        } catch (emailError) {
            quoteLogger.error('Error sending notification emails', emailError, requestId);
            // Still return success page even if emails fail
        }
        
        // Return confirmation HTML page
        quoteLogger.response('Sending success confirmation page', { 
            quoteId,
            processingTime: Date.now() - startTime
        }, requestId);
        
        const confirmationPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quote Declined</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                    .success-icon { font-size: 48px; margin-bottom: 20px; }
                    .success-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                    .success-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                    .timestamp { color: #6c757d; font-size: 14px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">❌</div>
                    <h1>❌ Quote Declined</h1>
                    <p>Your decline has been recorded.</p>
                    <div class="timestamp">Declined on: ${nzTimestamp}</div>
                </div>
            </body>
            </html>
        `;
        
        console.log(JSON.stringify({
            tag: 'CUSTOMER_DECLINE_OK',
            quoteId,
            leadId,
            decision: 'Declined',
            timestamp: nzTimestamp
        }));
        
        return res.status(200).send(confirmationPage);

    } catch (error) {
        quoteLogger.error('Quote decline error', error, requestId);
        quoteLogger.response('Redirecting to error page', { 
            error: error.message,
            processingTime: Date.now() - startTime
        }, requestId);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}