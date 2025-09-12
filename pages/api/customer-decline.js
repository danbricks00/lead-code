import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { sendEmail} from '../../lib/emailHelper.js';

// Environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Initialize Google Sheets
const auth = new google.auth.GoogleAuth({
    credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/auth/spreadsheets'
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    }
});

// Logger utility
const quoteLogger = {
    info: (message, data, requestId) => {
        console.log(`[${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}] [${requestId}] ${message}`, JSON.stringify(data));
    },
    error: (message, error, requestId) => {
        console.error(`[${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}] [${requestId}] [ERROR] ${message}`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    },
    response: (message, data, requestId) => {
        console.log(`[${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}] [${requestId}] [RESPONSE] ${message}`, JSON.stringify(data));
    }
};

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log the full request query as required
    console.log(`[DECISION-API] Customer Decline - Incoming request`, {
        file: 'customer-decline.js',
        url: req.url,
        method: req.method,
        query: req.query,
        time: new Date().toISOString()
    });

    try {
        // Get QuoteID Parameter and normalize it
        let { quoteId } = req.query;
        
        // Normalize quoteId with trim and toLowerCase
        const normalizedQuoteId = (quoteId || "").trim().toLowerCase();
        
        // Enhanced logging
        console.log(`[DECISION-API] Processing parameters:`, { 
            originalQuoteId: quoteId,
            normalizedQuoteId,
            fullUrl: req.url,
            headers: req.headers
        });

        if (!normalizedQuoteId) {
            console.log(`[DECISION-API] Missing parameters:`, { normalizedQuoteId });
            return res.redirect('/quote-status?status=error&message=Missing quote or lead ID');
        }

        quoteLogger.info('Customer decline request received', {
            method: req.method,
            url: req.url,
            query: req.query,
            normalizedQuoteId,
            headers: {
                'user-agent': req.headers['user-agent'],
                'x-forwarded-for': req.headers['x-forwarded-for']
            }
        }, requestId);

        // Fetch quote data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Quotes!A:AZ'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log(`[DECISION-API] No quote data found in sheets`);
            quoteLogger.info('No quote data found', {}, requestId);
            return res.redirect('/quote-status?status=error&message=No quote data found.');
        }

        const headers = rows[0];
        // Find QuoteID column index
        const quoteIdColIndex = headers.indexOf('QuoteID');
        const quoteIdCol = quoteIdColIndex !== -1 ? quoteIdColIndex : 1; // Default to column B (index 1) if not found
        
        console.log(`[DECISION-API] Looking for QuoteID in column: ${quoteIdCol} (${String.fromCharCode(65 + quoteIdCol)})`);
        
        // Find quote row with case-insensitive comparison using a loop for better logging
        let quoteRow = null;
        let rowIndex = -1;
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[quoteIdCol]) {
                const rowQuoteId = row[quoteIdCol].trim().toLowerCase();
                console.log(`[DECISION-API] Comparing: '${rowQuoteId}' with '${normalizedQuoteId}'`);
                
                if (rowQuoteId === normalizedQuoteId) {
                    quoteRow = row;
                    rowIndex = i + 1; // +1 because Sheets is 1-indexed
                    console.log(`[DECISION-API] Match found at row ${rowIndex}`);
                    break;
                }
            }
        }

        if (!quoteRow) {
            console.log(`[DECISION-API] QuoteID not found: ${normalizedQuoteId}`, { totalRows: rows.length });
            quoteLogger.info('Quote not found', { normalizedQuoteId }, requestId);
            return res.redirect('/quote-status?status=error&message=Invalid Quote ID');
        }

        // Get column indices - use specific columns Z and AA as required
        const customerDecisionCol = 25; // Column Z (0-indexed)
        const customerDecisionTimeCol = 26; // Column AA (0-indexed)
        const validUntilCol = headers.indexOf('ValidUntil');
        const customerStatusCol = headers.indexOf('CustomerStatus');
        
        console.log(`[DECISION-API] Using columns: Decision=${String.fromCharCode(65 + customerDecisionCol)}, Timestamp=${String.fromCharCode(65 + customerDecisionTimeCol)}`);
        
        // Check if customer has already made a decision
        const existingDecision = (quoteRow[customerDecisionCol] || "").trim().toLowerCase();
        const existingTimestamp = quoteRow[customerDecisionTimeCol] || "";
        
        if (existingDecision === "accepted" || existingDecision === "declined") {
            console.log(`[SERVER] Quote ${normalizedQuoteId} already decided: ${existingDecision} at ${existingTimestamp}`);
            
            quoteLogger.info('Decision already made', { 
                existingDecision, 
                existingTimestamp,
                normalizedQuoteId
            }, requestId);
            
            // Redirect to locked status page with decision and timestamp
            return res.redirect(`/quote-status?status=locked&decision=${existingDecision}&timestamp=${existingTimestamp}`);
        }

        // Check if quote is still valid
        const validUntil = quoteRow[validUntilCol];
        const now = new Date();
        let expiryDate;
        
        try {
            // Try to parse the date in various formats
            expiryDate = new Date(validUntil);
            if (isNaN(expiryDate.getTime())) {
                // If direct parsing fails, try DD/MM/YYYY format
                const parts = validUntil.split('/');
                if (parts.length === 3) {
                    expiryDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            
            // If still invalid, set a default future date
            if (isNaN(expiryDate.getTime())) {
                console.error('Invalid expiry date format:', validUntil);
                // Set to 7 days from now as a fallback
                expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
        } catch (error) {
            console.error(`[DECISION-API] Invalid expiry date format:`, { 
                normalizedQuoteId, 
                validUntil,
                error: error.message 
            });
            // Set to 7 days from now as a fallback
            expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        if (now > expiryDate) {
            console.log(`[DECISION-API] Quote expired:`, { 
                normalizedQuoteId, 
                validUntil, 
                now: now.toISOString(),
                expired: true 
            });
            
            quoteLogger.info('Quote expired', { 
                normalizedQuoteId, 
                validUntil,
                expiryDate: expiryDate.toISOString() 
            }, requestId);
            
            // Format timestamp for NZ timezone
            const nzTimestamp = new Date().toLocaleString('en-NZ', {
                timeZone: 'Pacific/Auckland',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) + " NZT";
            
            // Update the quote with expired status
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `Quotes!${String.fromCharCode(65 + customerDecisionCol)}${rowIndex}:${String.fromCharCode(65 + customerStatusCol)}${rowIndex}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Expired', nzTimestamp, 'Quote Expired']]
                }
            });
            
            // Redirect to expired status page
            return res.redirect('/quote-status?status=expired');
        }

        // Record the decline decision - format timestamp as DD-MM-YYYY HH:mm
        const nzTimestamp = new Date().toLocaleString('en-NZ', { 
            timeZone: 'Pacific/Auckland',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\//g, '-');
        
        // Update the quote with decline decision - ONLY update Z and AA columns
        try {
            // Calculate the row index (1-indexed for Google Sheets)
            const range = `Quotes!Z${rowIndex}:AA${rowIndex}`;
            
            // Log the range being updated
            console.log(`[DECISION-API] Writing to range:`, range);
            
            // Check if customer has already made a decision (double-check)
            const existingDecision = (rows[rowIndex - 1][25] || "").trim().toLowerCase();
            const existingTimestamp = rows[rowIndex - 1][26] || "";
            
            if (existingDecision === "accepted" || existingDecision === "declined") {
                console.log(`[DECISION-API] Guard - Quote already decided: ${existingDecision} at ${existingTimestamp}`);
                return res.redirect(`/quote-status?status=locked&decision=${existingDecision}&timestamp=${existingTimestamp}`);
                // stop execution
            }
            
            await sheets.spreadsheets.values.update({
                auth,
                spreadsheetId: SPREADSHEET_ID,
                range: range,
                valueInputOption: 'RAW',
                resource: {
                    values: [['Declined', nzTimestamp]]
                }
            });
            
            console.log(`[DECISION-API] Quote ${normalizedQuoteId} updated -> Declined at ${nzTimestamp}`);
        
            quoteLogger.info('Quote declined successfully', {
                normalizedQuoteId,
                decision: 'Declined',
                timestamp: nzTimestamp
            }, requestId);
        
            // Send email notifications
            try {
                // Get customer email (Column 29, index 28)
                const customerEmail = quoteRow[28]; // Column AC (0-indexed)
                // Get tradesperson email (Column 5, index 4)
                const tradesmanEmail = quoteRow[4]; // Column E (0-indexed)
                // Get admin email from env var
                const adminEmail = process.env.ADMIN_EMAIL;
                
                const quoteId = quoteRow[quoteIdCol];
                const customerName = quoteRow[27] || 'Customer'; // Column AB (0-indexed)
                const emailSubject = `Quote Decision Recorded – Declined`;
                const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Quote Decision Notification</h2>
                        <p>A decision has been made on quote ${quoteId}.</p>
                        <p><strong>Customer:</strong> ${customerName}</p>
                        <p><strong>Decision:</strong> DECLINED</p>
                        <p><strong>Timestamp:</strong> ${nzTimestamp} (New Zealand Time)</p>
                    </div>
                `;
                
                // Send emails to all parties
                if (customerEmail) {
                    await sendEmail({
                        to: customerEmail,
                        subject: emailSubject,
                        html: emailBody
                    });
                }
                
                if (tradesmanEmail) {
                    await sendEmail({
                        to: tradesmanEmail,
                        subject: emailSubject,
                        html: emailBody
                    });
                }
                
                if (adminEmail) {
                    await sendEmail({
                        to: adminEmail,
                        subject: emailSubject,
                        html: emailBody
                    });
                }
                
                console.log(`[DECISION-API] Notification emails sent successfully`);
            } catch (emailError) {
                console.error(`[DECISION-API] Error sending notification emails:`, emailError);
                // Continue with redirect even if emails fail
            }
        
            // Redirect to declined status page
            return res.redirect('/quote-status?status=declined');
        } catch (updateError) {
            console.error(`[DECISION-API] Error updating sheet:`, {
                error: updateError.message,
                normalizedQuoteId,
                rowIndex,
                range: range,  // Use the defined range variable
                columns: `Z-AA`  // Simplified column reference for clarity
            });
            
            quoteLogger.error('Error updating sheet', updateError, requestId);
            return res.redirect(`/quote-status?status=error&message=Failed to update quote status.`);
        }

    } catch (error) {
        console.error(`[DECISION-API] Customer Decline - Uncaught error:`, {
            file: 'customer-decline.js',
            message: error.message,
            stack: error.stack,
            quoteId: req.query?.quoteId
        });
        
        quoteLogger.error('Quote decline error', error, requestId);
        quoteLogger.response('Redirecting to error page', { 
            error: error.message,
            processingTime: Date.now() - startTime
        }, requestId);
        
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}