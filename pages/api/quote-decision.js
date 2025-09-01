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
        const { getGoogleSheetsClient } = await import('../../lib/_googleSheetsClient.js');
        const nodemailer = await import('nodemailer');
        const { fetchQuoteData, fetchLeadData } = await import('./quote-utils.js');
        const { google } = await import('googleapis');

        // Gamified status renderer function
        function renderStatus(stage) {
          const baseStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;";
          const checkStyle = "color: #28a745; font-weight: bold;";
          const pendingStyle = "color: #ffc107; font-weight: bold;";
          const crossStyle = "color: #dc3545; font-weight: bold;";
          
          let statusHtml = `<div style="${baseStyle}">`;
          statusHtml += `<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>`;
          
          switch(stage) {
            case "lead":
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Quote</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
              break;
            case "quote":
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
              break;
            case "accepted":
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Accepted 🎉</p>`;
              break;
            case "declined":
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
              statusHtml += `<p style="margin: 5px 0;"><span style="${crossStyle}">✘</span> Quote Declined</p>`;
              break;
          }
          
          statusHtml += `</div>`;
          return statusHtml;
        }

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
                const sheets = getGoogleSheetsClient();
                const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
                
                // Try to get the sheet to see if it exists
                await sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: `${DECISIONS_TAB}!A1:E1`
                });
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
                const sheets = getGoogleSheetsClient();
                const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
                
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: `${DECISIONS_TAB}!A:E`
                });
                
                const rows = response.data.values || [];
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
            const sheets = getGoogleSheetsClient();
            const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
            const values = [new Date().toISOString(), quoteId, leadId, status, decidedBy || ''];
            
            await sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: `${DECISIONS_TAB}!A1`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [values]
                }
            });
        }

        // Send email notifications
        async function sendNotifications({ quoteId, leadId, action, quoteData, leadData }) {
            try {
                const transporter = nodemailer.default.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                        pass: process.env.GMAIL_PASS || 'ptmcojqgthvjbqom'
                    }
                });

                const status = action === 'accept' ? 'Accepted' : 'Declined';

                // Get full quote data with tradesperson details from Google Sheets
                let fullQuoteData = quoteData;
                try {
                    const auth = new google.auth.JWT(
                        process.env.GOOGLE_CLIENT_EMAIL,
                        null,
                        process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
                        ["https://www.googleapis.com/auth/spreadsheets.readonly"]
                    );
                    
                    const sheets = google.sheets({ version: "v4", auth });
                    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
                    
                    if (sheetId) {
                        const response = await sheets.spreadsheets.values.get({
                            spreadsheetId: sheetId,
                            range: "Quotes!A:Z"
                        });
                        
                        const rows = response.data.values;
                        if (rows && rows.length > 0) {
                            const quoteRow = rows.find(row => row[1] === leadId);
                            if (quoteRow) {
                                fullQuoteData = {
                                    ...quoteData,
                                    tradesmanName: quoteRow[12] || '',
                                    tradesmanEmail: quoteRow[13] || '',
                                    tradesmanPhone: quoteRow[14] || '',
                                    companyName: quoteRow[19] || ''
                                };
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Could not fetch tradesperson details from Sheets:', error.message);
                }

                // 1. Send customer confirmation email
                if (leadData && leadData.customerEmail) {
                    const customerSubject = action === 'accept' 
                        ? '🎉 Quote Accepted - Project Confirmed!' 
                        : 'Quote Decision - Thank You';

                    let customerHtml;
                    if (action === 'accept') {
                        customerHtml = `
                            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                                ${renderStatus("accepted")}
                                <h2 style="color: #333; margin: 20px 0;">Congratulations! Your Quote Has Been Accepted</h2>
                                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                                    <p>Hi ${leadData.customerName || 'there'},</p>
                                    <p>Great news! Your quote for ${quoteData.service || 'your project'} has been accepted.</p>
                                    <p><strong>Project Details:</strong></p>
                                    <ul>
                                        <li><strong>Service:</strong> ${quoteData.service || 'N/A'}</li>
                                        <li><strong>Quote Amount:</strong> $${quoteData.quoteAmount || 'N/A'}</li>
                                        <li><strong>Timeline:</strong> ${quoteData.timeline || 'To be confirmed'}</li>
                                    </ul>
                                </div>`;

                        // Add tradesperson details if available
                        if (fullQuoteData.tradesmanName) {
                            customerHtml += `
                                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-top: 20px;">
                                    <h3 style="color: #333; margin: 0 0 15px 0;">Your Tradesperson Details</h3>
                                    <p><strong>Name:</strong> ${fullQuoteData.tradesmanName}</p>
                                    ${fullQuoteData.companyName ? `<p><strong>Company:</strong> ${fullQuoteData.companyName}</p>` : ''}
                                    ${fullQuoteData.tradesmanPhone ? `<p><strong>Phone:</strong> ${fullQuoteData.tradesmanPhone}</p>` : ''}
                                    <p><strong>Email:</strong> ${fullQuoteData.tradesmanEmail}</p>
                                </div>`;
                        }

                        customerHtml += `
                                <p style="margin-top: 20px;">Your tradesperson will be in touch within 24 hours to schedule your project.</p>
                                <p>Best regards,<br>The Kiwi Trade Team</p>
                            </div>`;
                    } else {
                        customerHtml = `
                            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                                ${renderStatus("declined")}
                                <h2 style="color: #333; margin: 20px 0;">Thank You for Your Consideration</h2>
                                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                                    <p>Hi ${leadData.customerName || 'there'},</p>
                                    <p>Thank you for considering our quote for ${quoteData.service || 'your project'}.</p>
                                    <p>We hope to work with you in the future.</p>
                                    <p>Best regards,<br>The Kiwi Trade Team</p>
                                </div>
                            </div>`;
                    }

                    await transporter.sendMail({
                        from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                        to: leadData.customerEmail,
                        subject: customerSubject,
                        html: customerHtml
                    });
                }

                // 2. Send admin notification
                const adminSubject = `Quote ${status}: ${quoteId} - ${leadId}`;
                let adminHtml = `
                    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                        ${renderStatus(action === 'accept' ? "accepted" : "declined")}
                        <h2 style="color: #333; margin: 20px 0;">Quote ${status}</h2>
                        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                            <p><strong>Quote ID:</strong> ${quoteId}</p>
                            <p><strong>Lead ID:</strong> ${leadId}</p>
                            <p><strong>Customer:</strong> ${leadData?.customerName || 'N/A'}</p>
                            <p><strong>Service:</strong> ${quoteData.service || 'N/A'}</p>
                            <p><strong>Amount:</strong> $${quoteData.quoteAmount || 'N/A'}</p>`;

                if (action === 'accept' && fullQuoteData.tradesmanName) {
                    adminHtml += `
                            <p><strong>Tradesperson Assigned:</strong> ${fullQuoteData.tradesmanName}</p>
                            ${fullQuoteData.companyName ? `<p><strong>Company:</strong> ${fullQuoteData.companyName}</p>` : ''}
                            ${fullQuoteData.tradesmanPhone ? `<p><strong>Phone:</strong> ${fullQuoteData.tradesmanPhone}</p>` : ''}`;
                }

                adminHtml += `
                        </div>
                    </div>`;

                await transporter.sendMail({
                    from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                    to: process.env.ADMIN_EMAIL || 'danbricks18@gmail.com',
                    subject: adminSubject,
                    html: adminHtml
                });

                // 3. Send tradesperson notification (if accepted and tradesperson email available)
                if (action === 'accept' && fullQuoteData.tradesmanEmail) {
                    const tradespersonSubject = `🎉 CUSTOMER ACCEPTED - FOLLOW UP REQUIRED - ${leadId}`;
                    const tradespersonHtml = `
                        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                            ${renderStatus("accepted")}
                            <h2 style="color: #333; margin: 20px 0;">Customer Accepted Your Quote!</h2>
                            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                                <p><strong>Customer Accepted – FOLLOW UP</strong></p>
                                <p><strong>Customer Name:</strong> ${leadData?.customerName || 'N/A'}</p>
                                <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'N/A'}</p>
                                <p><strong>Customer Phone:</strong> ${leadData?.customerPhone || 'N/A'}</p>
                                <p><strong>Service:</strong> ${quoteData.service || 'N/A'}</p>
                                <p><strong>Quote Amount:</strong> $${quoteData.quoteAmount || 'N/A'}</p>
                                <p><strong>Project Details:</strong> ${quoteData.details || 'N/A'}</p>
                                <p><strong>Timeline:</strong> ${quoteData.timeline || 'N/A'}</p>
                            </div>
                            <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
                                <p style="margin: 0; font-weight: bold;">⚠️ ACTION REQUIRED: Contact customer within 24 hours to schedule project!</p>
                            </div>
                        </div>`;

                    await transporter.sendMail({
                        from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                        to: fullQuoteData.tradesmanEmail,
                        subject: tradespersonSubject,
                        html: tradespersonHtml
                    });
                }

                console.log(`📧 Stage 3 ${action === 'accept' ? 'Accepted' : 'Declined'} email sent with ${action === 'accept' ? 'tradesperson details' : 'generic message'} for lead ${leadId}`);

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
