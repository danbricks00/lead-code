// api/quote-decision.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { quoteId, action } = req.body;

        if (!quoteId || !action) {
            return res.status(400).json({ 
                error: 'Missing required fields: quoteId and action' 
            });
        }

        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ 
                error: 'Invalid action. Must be "accept" or "decline"' 
            });
        }

        // Check for required environment variables
        if (!process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(500).json({ 
                error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
            });
        }

        // Import required modules
        const { appendRow, getRange, ensureSheetAndHeader } = await import('./_googleSheetsClient.js');
        const nodemailer = await import('nodemailer');
        const { fetchQuoteData, fetchLeadData } = await import('./quote-utils.js');

        // Helper function to format timestamp in NZT
        function formatNZTTime(timestamp) {
            try {
                const date = new Date(timestamp);
                return date.toLocaleString('en-NZ', {
                    timeZone: 'Pacific/Auckland',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } catch (error) {
                console.error('Error formatting timestamp:', error);
                return 'Unknown time';
            }
        }

        const DECISIONS_TAB = process.env.SHEETS_DECISIONS_TAB || 'QuoteDecisions';
        const DEBUG = process.env.EMAIL_DEBUG === '1';

        // Scope control: 'lead' = any decision for the lead locks all counter quotes; 'quote' = only this quoteId
        const SCOPE = (process.env.SHEETS_DECISION_SCOPE || 'lead').toLowerCase(); // 'lead' or 'quote'

        // Header we expect in the decisions sheet
        const HEADER = ['timestamp', 'quoteId', 'leadId', 'status', 'decidedBy'];

        // Cold-start: best-effort ensure the sheet + header exists
        let ensured = false;
        async function ensureOnce() {
            if (ensured) return;
            try {
                await ensureSheetAndHeader({ sheetTitle: DECISIONS_TAB, headerValues: HEADER });
                ensured = true;
            } catch (e) {
                console.warn('quote-decision: ensureSheet failed (continuing):', e?.message || e);
            }
        }

        function htmlPage(title, body) {
            return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
            <body style="font-family:Arial,sans-serif;padding:20px;line-height:1.5;color:#111827">
                <h2 style="margin:0 0 12px;">${title}</h2>
                <p>${body}</p>
            </body></html>`;
        }

        async function findExistingDecision({ quoteId, leadId }) {
            try {
                const rows = await getRange({ range: `${DECISIONS_TAB}!A:E` });
                for (let i = 0; i < rows.length; i++) {
                    const [ts, qid, lid, status] = rows[i];
                    if (status !== 'ACCEPTED' && status !== 'DECLINED') continue;

                    // Scope=lead: any prior decision for this lead locks all counter quotes
                    if (SCOPE === 'lead' && lid === leadId) {
                        return { decided: true, status, timestamp: ts, scope: 'lead' };
                    }

                    // Scope=quote: decision applies only to this quoteId+leadId pair
                    if (SCOPE !== 'lead' && qid === quoteId && lid === leadId) {
                        return { decided: true, status, timestamp: ts, scope: 'quote' };
                    }
                }
            } catch (e) {
                console.warn('Decision lookup failed (continuing):', e?.message || e);
            }
            return { decided: false };
        }

        async function recordDecision({ quoteId, leadId, status, decidedBy }) {
            const values = [new Date().toISOString(), quoteId, leadId, status, decidedBy || ''];
            await appendRow({ range: `${DECISIONS_TAB}!A1`, values });
        }

        // Send email notifications
        async function sendNotifications({ quoteId, leadId, action, quoteData, leadData }) {
            try {
                const transporter = nodemailer.default.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'danbricks18@gmail.com',
                        pass: 'ptmcojqgthvjbqom'
                    }
                });

                const status = action === 'accept' ? 'Accepted' : 'Declined';

                // 1. Send customer confirmation email
                if (leadData && leadData.customerEmail) {
                    const customerSubject = action === 'accept' 
                        ? 'Quote Accepted - Thank You!' 
                        : 'Quote Decision - Thank You';

                    const customerBody = action === 'accept' 
                        ? `Your quote has been accepted! We'll be in touch soon to schedule your project.`
                        : `Thank you for your consideration. We hope to work with you in the future.`;

                    await transporter.sendMail({
                        from: 'danbricks18@gmail.com',
                        to: leadData.customerEmail,
                        subject: customerSubject,
                        html: htmlPage(customerSubject, customerBody)
                    });
                }

                // 2. Send admin notification
                await transporter.sendMail({
                    from: 'danbricks18@gmail.com',
                    to: 'danbricks18@gmail.com',
                    subject: `Quote ${status}: ${quoteId}`,
                    html: htmlPage(
                        `Quote ${status}`,
                        `Quote ${quoteId} for lead ${leadId} has been ${action === 'accept' ? 'accepted' : 'declined'}.`
                    )
                });

            } catch (error) {
                console.error('Email notification error:', error);
            }
        }

        // Main logic
        await ensureOnce();

        const quoteData = await fetchQuoteData(quoteId);
        if (!quoteData) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const leadId = quoteData.leadId;
        const leadData = await fetchLeadData(leadId);

        const existingDecision = await findExistingDecision({ quoteId, leadId });
        if (existingDecision.decided) {
            return res.status(409).json({ 
                error: `Quote already ${existingDecision.status.toLowerCase()}`,
                existingDecision 
            });
        }

        const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
        await recordDecision({ quoteId, leadId, status, decidedBy: 'customer' });

        await sendNotifications({ quoteId, leadId, action, quoteData, leadData });

        res.json({ 
            success: true, 
            message: `Quote ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
            status 
        });

    } catch (error) {
        console.error('Quote decision error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
