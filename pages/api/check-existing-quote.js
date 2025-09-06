import { getGoogleSheetsClient, getSpreadsheetId } from "../../lib/googleSheets.js";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { leadId, tradesmanEmail } = req.query;

    if (!leadId || !tradesmanEmail) {
        return res.status(400).json({ 
            success: false, 
            error: 'Lead ID and tradesman email are required' 
        });
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // Check the Quotes sheet for existing quotes from this tradesman for this lead
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A:Z',
        });

        const rows = response.data.values || [];
        if (rows.length < 2) {
            return res.json({ 
                success: true, 
                quoteExists: false, 
                canResubmit: false 
            });
        }

        const header = rows[0];
        const existingQuote = rows.find(row => 
            row[1] === leadId && // leadId column (B)
            row[4] === tradesmanEmail // tradesmanEmail column (E)
        );

        if (!existingQuote) {
            return res.json({ 
                success: true, 
                quoteExists: false, 
                canResubmit: false 
            });
        }

        // Get quote status information
        const adminStatusIndex = header.indexOf('Admin Status');
        const resubmissionAllowedIndex = header.indexOf('Reesubmission Allowed');
        const quoteDateIndex = header.indexOf('Quote Date') || header.indexOf('Date') || header.indexOf('Timestamp');
        const declineReasonIndex = header.indexOf('Decline Reason') || header.indexOf('Admin Notes');
        const totalQuoteIndex = header.indexOf('TotalQuote') || header.indexOf('Total Quote') || header.indexOf('Total');

        const adminStatus = adminStatusIndex !== -1 ? existingQuote[adminStatusIndex] : '';
        const resubmissionAllowed = resubmissionAllowedIndex !== -1 ? existingQuote[resubmissionAllowedIndex] : '';
        const quoteDate = quoteDateIndex !== -1 ? existingQuote[quoteDateIndex] : '';
        const declineReason = declineReasonIndex !== -1 ? existingQuote[declineReasonIndex] : '';
        const totalQuote = totalQuoteIndex !== -1 ? existingQuote[totalQuoteIndex] : '';

        const formatNZDate = (dateString) => {
            if (!dateString) return 'an unknown date';
            try {
                const date = new Date(dateString);
                return date.toLocaleString('en-NZ', {
                    timeZone: 'Pacific/Auckland',
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) + ' NZT';
            } catch (e) {
                return dateString;
            }
        };

        // Determine if resubmission is allowed
        const canResubmit = adminStatus === 'Declined' && resubmissionAllowed === 'Yes';

        return res.json({
            success: true,
            quoteExists: true,
            canResubmit: canResubmit,
            existingQuoteData: {
                quoteId: existingQuote[0], // QuoteID column (A)
                quoteNumber: existingQuote[0],
                leadId: leadId,
                submissionDate: formatNZDate(quoteDate),
                adminStatus: adminStatus || 'Pending',
                totalAmount: totalQuote || 'N/A',
                declineReason: declineReason || '',
                status: adminStatus === 'Declined' ? 'declined' : (adminStatus === 'Approved' ? 'approved' : 'submitted'),
                timestamp: quoteDate,
                resubmissionUsed: false // We'll track this separately if needed
            }
        });

    } catch (error) {
        console.error('❌ Error checking existing quote:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to check existing quote',
            details: error.message
        });
    }
}
