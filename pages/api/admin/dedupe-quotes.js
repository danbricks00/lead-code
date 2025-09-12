import { getGoogleSheetsClient, getSpreadsheetId } from '../../../lib/googleSheets.js';

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

// Main handler
export default async function handler(req, res) {
    console.log(`[DEDUPE] Request received`, {
        method: req.method,
        url: req.url,
        query: req.query,
        timestamp: new Date().toISOString()
    });

    if (req.method !== 'POST') {
        console.log(`[DEDUPE] Method not allowed: ${req.method}`);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        // Check admin token
        const { adminToken } = req.body;
        const expectedToken = process.env.ADMIN_TOKEN;
        
        if (!expectedToken) {
            console.error(`[DEDUPE] ADMIN_TOKEN not configured`);
            return res.status(500).json({ success: false, error: 'Admin token not configured' });
        }

        if (!adminToken || adminToken !== expectedToken) {
            console.log(`[DEDUPE] Invalid admin token`);
            return res.status(403).json({ success: false, error: 'Invalid admin token' });
        }

        console.log(`[DEDUPE] Starting deduplication process`);

        const sheets = getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        if (!spreadsheetId) {
            throw new Error('Google Sheets not configured');
        }

        // Get all quotes data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A:AZ',
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) {
            console.log(`[DEDUPE] No quotes found`);
            return res.status(200).json({
                success: true,
                duplicatesFound: 0,
                rowsVoided: 0,
                keptRows: 0,
                message: 'No quotes found'
            });
        }

        const header = rows[0];
        const quoteIdIndex = header.findIndex(h => h.toLowerCase().includes('quoteid'));
        const statusIndex = header.findIndex(h => h.toLowerCase().includes('status'));
        const totalQuoteIndex = header.findIndex(h => h.toLowerCase().includes('totalquote'));
        const subtotalIndex = header.findIndex(h => h.toLowerCase().includes('subtotal'));
        const gstIndex = header.findIndex(h => h.toLowerCase().includes('gst'));
        const timestampIndex = header.findIndex(h => h.toLowerCase().includes('timestamp'));

        if (quoteIdIndex === -1) {
            throw new Error('QuoteID column not found in Quotes sheet');
        }

        // Group quotes by QuoteID
        const quoteGroups = {};
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const quoteId = row[quoteIdIndex];
            
            if (!quoteId) continue;
            
            if (!quoteGroups[quoteId]) {
                quoteGroups[quoteId] = [];
            }
            
            quoteGroups[quoteId].push({
                rowIndex: i + 1, // +1 because Sheets is 1-indexed
                data: row,
                quoteId: quoteId,
                status: row[statusIndex] || '',
                totalQuote: parseFloat(row[totalQuoteIndex]) || 0,
                subtotal: parseFloat(row[subtotalIndex]) || 0,
                gst: parseFloat(row[gstIndex]) || 0,
                timestamp: row[timestampIndex] || ''
            });
        }

        console.log(`[DEDUPE] Found ${Object.keys(quoteGroups).length} unique quote IDs`);

        let duplicatesFound = 0;
        let rowsVoided = 0;
        let keptRows = 0;
        const voidedRows = [];
        const keptRowsList = [];

        // Process each quote group
        for (const [quoteId, quoteRows] of Object.entries(quoteGroups)) {
            if (quoteRows.length <= 1) {
                keptRows++;
                keptRowsList.push({
                    quoteId,
                    rowIndex: quoteRows[0].rowIndex,
                    reason: 'Single row'
                });
                continue;
            }

            duplicatesFound++;
            console.log(`[DEDUPE] Processing duplicate group for quoteId: ${quoteId}, count: ${quoteRows.length}`);

            // Sort rows by priority:
            // 1. Non-empty financials (TotalQuote/Subtotal/GST > 0)
            // 2. Latest timestamp
            const sortedRows = quoteRows.sort((a, b) => {
                const aHasFinancials = (a.totalQuote > 0) || (a.subtotal > 0) || (a.gst > 0);
                const bHasFinancials = (b.totalQuote > 0) || (b.subtotal > 0) || (b.gst > 0);
                
                if (aHasFinancials && !bHasFinancials) return -1;
                if (!aHasFinancials && bHasFinancials) return 1;
                
                // If both have or don't have financials, sort by timestamp (newest first)
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

            // Keep the first (best) row, void the rest
            const keepRow = sortedRows[0];
            const voidRows = sortedRows.slice(1);

            keptRows++;
            keptRowsList.push({
                quoteId,
                rowIndex: keepRow.rowIndex,
                reason: keepRow.totalQuote > 0 ? 'Has financial data' : 'Latest timestamp'
            });

            // Void the duplicate rows
            for (const voidRow of voidRows) {
                try {
                    await sheets.spreadsheets.values.update({
                        spreadsheetId,
                        range: `Quotes!${String.fromCharCode(65 + statusIndex)}${voidRow.rowIndex}`,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: [['VOID']] }
                    });

                    rowsVoided++;
                    voidedRows.push({
                        quoteId,
                        rowIndex: voidRow.rowIndex,
                        reason: voidRow.totalQuote > 0 ? 'Duplicate with financial data' : 'Duplicate with later timestamp',
                        voidedAt: getNZTimestamp()
                    });

                    console.log(`[DEDUPE] Voided row ${voidRow.rowIndex} for quoteId: ${quoteId}`);
                } catch (error) {
                    console.error(`[DEDUPE] Error voiding row ${voidRow.rowIndex} for quoteId: ${quoteId}:`, error.message);
                }
            }
        }

        const summary = {
            success: true,
            duplicatesFound,
            rowsVoided,
            keptRows,
            totalQuotes: Object.keys(quoteGroups).length,
            voidedRows,
            keptRowsList,
            processedAt: getNZTimestamp()
        };

        console.log(`[DEDUPE] Deduplication completed:`, summary);

        return res.status(200).json(summary);

    } catch (error) {
        console.error(`[DEDUPE] Error:`, {
            error: error.message,
            stack: error.stack
        });
        
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}
