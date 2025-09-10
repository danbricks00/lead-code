import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
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
const transporter = nodemailer.createTransporter({
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
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[DECISION-API] Admin Accept - Incoming request`, {
        file: 'admin-accept.js',
        url: req.url,
        method: req.method,
        query: req.query,
        time: new Date().toISOString()
    });

    try {
        const { quoteId, leadId } = req.query;

        if (!quoteId || !leadId) {
            console.log(`[DECISION-API] Missing parameters:`, { quoteId, leadId });
            return res.redirect('/quote-status?status=error&message=Missing quote or lead ID.');
        }

        quoteLogger.info('Admin approval request received', {
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
            spreadsheetId: SPREADSHEET_ID,
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
        const adminDecisionCol = headers.indexOf('AdminDecision');
        const adminDecisionTimeCol = headers.indexOf('AdminDecisionTimeStamp');
        const adminStatusCol = headers.indexOf('AdminPersonStatus');

        // Check if admin has already made a decision
        const currentDecision = quoteRow[adminDecisionCol];
        if (currentDecision && currentDecision !== 'none' && currentDecision.trim() !== '') {
            const decisionTime = quoteRow[adminDecisionTimeCol];
            console.log(`[DECISION-API] Admin decision already exists:`, { 
                currentDecision, 
                decisionTime,
                quoteId 
            });
            
            return res.status(409).json({
                tag: 'ADMIN_ALREADY_DECIDED',
                decision: currentDecision,
                decisionTime: decisionTime,
                message: 'Admin has already made a decision on this quote'
            });
        }

        // Record the approval decision
        const nzTimestamp = new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' });
        const rowIndex = rows.indexOf(quoteRow) + 1; // +1 because Sheets is 1-indexed

        // Update the quote with approval decision
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Quotes!${String.fromCharCode(65 + adminDecisionCol)}${rowIndex}:${String.fromCharCode(65 + adminStatusCol)}${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [['Approved', nzTimestamp, 'Admin Approved']]
            }
        });

        console.log(`[DECISION-API] Admin approval recorded successfully:`, {
            quoteId,
            leadId,
            decision: 'Approved',
            timestamp: nzTimestamp,
            rowIndex
        });

        quoteLogger.info('Quote approved successfully', {
            quoteId,
            leadId,
            decision: 'Approved',
            timestamp: nzTimestamp
        }, requestId);

        // Send success response
        return res.status(200).json({ 
            tag: 'ADMIN_DECISION_RECORDED',
            ok: true, 
            quoteId, 
            leadId,
            decision: 'Approved',
            timestamp: nzTimestamp
        });

    } catch (error) {
        console.error(`[DECISION-API] Admin Accept - Uncaught error:`, {
            file: 'admin-accept.js',
            message: error.message,
            stack: error.stack,
            quoteId: req.query?.quoteId,
            leadId: req.query?.leadId
        });
        
        quoteLogger.error('Quote approval error', error, requestId);
        quoteLogger.response('Redirecting to error page', { 
            error: error.message,
            processingTime: Date.now() - startTime
        }, requestId);
        
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during quote approval.`);
    }
}