import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

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
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS
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
    
    console.log(`[DECISION-API] Customer Accept - Incoming request`, {
        file: 'customer-accept.js',
        url: req.url,
        method: req.method,
        query: req.query,
        time: new Date().toISOString()
    });

    try {
        const { quoteId, leadId } = req.query;
    
        // Enhanced logging
        console.log(`[DECISION-API] Processing parameters:`, { 
            quoteId, 
            leadId,
            fullUrl: req.url,
            headers: req.headers
        });
    
        if (!quoteId || !leadId) {
            console.log(`[DECISION-API] Missing parameters:`, { quoteId, leadId });
            return res.redirect('/quote-status?status=error&message=Missing quote or lead ID.');
        }

        quoteLogger.info('Customer acceptance request received', {
            method: req.method,
            url: req.url,
            query: req.query,
            headers: {
                'user-agent': req.headers['user-agent'],
                'x-forwarded-for': req.headers['x-forwarded-for']
            }
        }, requestId);
        
        // Fetch quote data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:AZ'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log(`[DECISION-API] No quote data found in sheets`);
            return res.redirect('/quote-status?status=error&message=No quote data found.');
        }

        const headers = rows[0];
        const quoteRow = rows.find(row => row[1] === quoteId); // QuoteID is in column B (index 1)

        if (!quoteRow) {
            console.log(`[DECISION-API] Quote not found:`, { quoteId, totalRows: rows.length });
            return res.redirect('/quote-status?status=error&message=Quote not found.');
        }

        // Get column indices
        const customerDecisionCol = headers.indexOf('CustomerDecision');
        const customerDecisionTimeCol = headers.indexOf('CustomerDecisionTimeStamp');
        const validUntilCol = headers.indexOf('ValidUntil');
        const customerStatusCol = headers.indexOf('CustomerStatus');

        // Check if quote is still valid
        const validUntil = quoteRow[validUntilCol];
        const now = new Date();
        const expiryDate = new Date(validUntil);

        if (now > expiryDate) {
            console.log(`[DECISION-API] Quote expired:`, { 
                quoteId, 
                validUntil, 
                now: now.toISOString(),
                expired: true 
            });
            
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
                        <div class="error-icon">⏰</div>
                        <h1 class="error-title">Quote Has Expired</h1>
                        <p class="error-message">This quote expired on ${expiryDate.toLocaleDateString('en-NZ')} and can no longer be accepted.</p>
                        <div class="expiry-info">
                            <div class="expiry-status">Quote Expired</div>
                            <div class="timestamp">Expired: ${expiryDate.toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT</div>
                        </div>
                        <p>Please contact us if you need a new quote.</p>
                    </div>
                </body>
                </html>
            `;
            return res.status(410).send(expiredPage);
        }

        // Check if customer has already made a decision
        const currentDecision = quoteRow[customerDecisionCol];
        if (currentDecision && currentDecision !== 'none' && currentDecision.trim() !== '') {
            const decisionTime = quoteRow[customerDecisionTimeCol];
            console.log(`[DECISION-API] Customer decision already exists:`, { 
                currentDecision, 
                decisionTime,
                quoteId
            });
            
            const alreadyDecidedPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Decision Already Made</title>
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
                        <h1 class="error-title">Decision Already Made</h1>
                        <p class="error-message">You have already made a decision on this quote.</p>
                        <div class="decision-info">
                            <div class="decision-status">Previous Decision: ${currentDecision}</div>
                            <div class="timestamp">Made on: ${decisionTime}</div>
                        </div>
                        <p>If you need to make changes, please contact us directly.</p>
                    </div>
                </body>
                </html>
            `;
            return res.status(409).send(alreadyDecidedPage);
        }

        // Record the acceptance decision
        const nzTimestamp = new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });
        const rowIndex = rows.indexOf(quoteRow) + 1; // +1 because Sheets is 1-indexed

        // Update the quote with acceptance decision
        await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SPREADSHEET_ID,
            range: `Quotes!${String.fromCharCode(65 + customerDecisionCol)}${rowIndex}:${String.fromCharCode(65 + customerStatusCol)}${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [['Accepted', nzTimestamp, 'Customer Accepted']]
            }
        });

        console.log(`[DECISION-API] Customer acceptance recorded successfully:`, {
            quoteId,
            leadId,
            decision: 'Accepted',
            timestamp: nzTimestamp,
            rowIndex
        });

        quoteLogger.info('Quote accepted successfully', {
            quoteId,
            leadId,
            decision: 'Accepted',
            timestamp: nzTimestamp
        }, requestId);
        
        // Send confirmation page
        const confirmationPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quote Accepted</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                    .success-icon { font-size: 48px; margin-bottom: 20px; }
                    .success-title { color: #28a745; font-size: 24px; margin-bottom: 15px; }
                    .success-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                    .timestamp { color: #6c757d; font-size: 14px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">✅</div>
                    <h1 class="success-title">Quote Accepted</h1>
                    <p class="success-message">Thank you for accepting our quote! We will be in touch soon to arrange the next steps.</p>
                    <p class="timestamp">Decision recorded: ${nzTimestamp} NZT</p>
                </div>
            </body>
            </html>
        `;
        
        return res.status(200).send(confirmationPage);

    } catch (error) {
        console.error(`[DECISION-API] Customer Accept - Uncaught error:`, {
            file: 'customer-accept.js',
            message: error.message,
            stack: error.stack,
            quoteId: req.query?.quoteId,
            leadId: req.query?.leadId
        });
        
        quoteLogger.error('Quote acceptance error', error, requestId);
        quoteLogger.response('Redirecting to error page', { 
            error: error.message,
            processingTime: Date.now() - startTime
        }, requestId);
        
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}