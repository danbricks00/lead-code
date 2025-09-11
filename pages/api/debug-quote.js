import { google } from 'googleapis';

// Initialize Google Sheets
const auth = new google.auth.GoogleAuth({
    credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        // Get QuoteID Parameter and normalize it
        let { quoteId } = req.query;
        
        // Normalize quoteId with trim and toLowerCase
        const normalizedQuoteId = (quoteId || "").trim().toLowerCase();
        
        // Log the request
        console.log(`[DEBUG-QUOTE] Processing request for quoteId: ${normalizedQuoteId}`, {
            requestId,
            originalQuoteId: quoteId,
            normalizedQuoteId,
            url: req.url
        });
        
        if (!normalizedQuoteId) {
            console.log(`[DEBUG-QUOTE] Missing quoteId parameter`);
            return res.status(400).json({ 
                error: "Missing quoteId parameter", 
                requestedId: quoteId 
            });
        }
        
        // Fetch quote data from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Quotes!A:AL'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log(`[DEBUG-QUOTE] No quote data found in sheets`);
            return res.status(404).json({ 
                error: "No quote data found", 
                requestedId: normalizedQuoteId 
            });
        }

        // Find QuoteID column index (should be column B / index 1)
        const headers = rows[0];
        const quoteIdColIndex = headers.indexOf('QuoteID');
        const quoteIdCol = quoteIdColIndex !== -1 ? quoteIdColIndex : 1; // Default to column B (index 1) if not found
        
        console.log(`[DEBUG-QUOTE] Looking for QuoteID in column: ${quoteIdCol} (${String.fromCharCode(65 + quoteIdCol)})`);
        
        // Find quote row with case-insensitive comparison
        let quoteRow = null;
        let rowIndex = -1;
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row && row[quoteIdCol]) {
                const rowQuoteId = row[quoteIdCol].trim().toLowerCase();
                
                if (rowQuoteId === normalizedQuoteId) {
                    quoteRow = row;
                    rowIndex = i;
                    console.log(`[DEBUG-QUOTE] Match found at row ${i+1}`);
                    break;
                }
            }
        }

        if (!quoteRow) {
            console.log(`[DEBUG-QUOTE] QuoteID not found: ${normalizedQuoteId}`, { totalRows: rows.length });
            return res.status(404).json({ 
                error: "QuoteID not found", 
                requestedId: normalizedQuoteId 
            });
        }
        
        // Log the raw row for verification
        console.log(`[DEBUG-QUOTE] Raw row data for QuoteID ${normalizedQuoteId}:`, quoteRow);
        
        // Return the requested fields
        const result = {
            quoteId: quoteRow[1],           // Column B - QuoteID
            leadId: quoteRow[2],           // Column C - Lead ID
            customerDecision: quoteRow[25], // Column Z - Customer Decision
            decisionTimestamp: quoteRow[26], // Column AA - Decision Timestamp
            customerName: quoteRow[27],    // Column AB - Customer Name
            customerEmail: quoteRow[28]    // Column AC - Customer Email
        };
        
        console.log(`[DEBUG-QUOTE] Returning data for QuoteID ${normalizedQuoteId}:`, result);
        return res.status(200).json(result);
        
    } catch (error) {
        console.error(`[DEBUG-QUOTE] Error processing request:`, error);
        return res.status(500).json({ 
            error: "Internal server error", 
            message: error.message,
            requestedId: req.query.quoteId 
        });
    }
}