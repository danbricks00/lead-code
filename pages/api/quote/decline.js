import { upsertQuoteRow, getQuoteRowByQuoteId, generateMutationId } from '../../../utils/sheets.js';
import { sendEmail } from '../../../lib/emailHelper';
import quoteLogger from '../../../lib/quoteLogger.js';

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
    const requestId = quoteLogger.generateRequestId();
    const startTime = Date.now();
    
    quoteLogger.adminDecline('Request received', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: { 'user-agent': req.headers['user-agent'] }
    }, requestId);

    if (req.method !== 'GET') {
        quoteLogger.adminDecline('Method not allowed', { method: req.method }, requestId);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { quoteId, ts, token } = req.query;

        if (!quoteId || !ts || !token) {
            quoteLogger.adminDecline('Missing required parameters', { quoteId: !!quoteId, ts: !!ts, token: !!token }, requestId);
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        // Generate mutation ID for idempotency
        const mutationId = generateMutationId(quoteId, 'admin-decline', { ts, token });
        quoteLogger.adminDecline('Generated mutationId', { mutationId }, requestId);

        // Get existing quote data
        const existingQuote = await getQuoteRowByQuoteId(quoteId);
        if (!existingQuote) {
            quoteLogger.adminDecline('Quote not found', { quoteId }, requestId);
            return res.status(404).json({ success: false, error: 'Quote not found' });
        }

        const quoteData = existingQuote.data;
        quoteLogger.adminDecline('Found existing quote data', { 
            quoteId, 
            customerName: quoteData.CustomerName,
            totalQuote: quoteData.TotalQuote,
            status: quoteData.Status
        }, requestId);

        // Check if already declined
        if (quoteData.AdminPersonStatus === 'Declined') {
            quoteLogger.adminDecline('Quote already declined - preventing duplicate', { quoteId, adminStatus: quoteData.AdminPersonStatus }, requestId);
            
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Already Declined - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Already Declined</h1>
                    <div class="info">
                        <h2>This quote has already been declined.</h2>
                        <p>Quote ID: <strong>${quoteId}</strong></p>
                        <p>Customer: <strong>${quoteData.CustomerName}</strong></p>
                        <p>Declined on: <strong>${quoteData.AdminPersonTimestamp}</strong></p>
                    </div>
                </body>
                </html>
            `;
            
            quoteLogger.response('Sending already declined page', { quoteId, processingTime: Date.now() - startTime }, requestId);
            return res.status(400).send(statusPage);
        }

        // Check if quote has been rejected
        if (quoteData.Status === 'Rejected') {
            quoteLogger.adminDecline('Quote rejected - cannot decline', { quoteId, status: quoteData.Status }, requestId);
            
            const rejectionPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Rejected - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Cannot Be Declined</h1>
                    <div class="error">
                        <h2>This quote has been rejected and cannot be declined.</h2>
                        <p>Quote ID: <strong>${quoteId}</strong></p>
                        <p>Status: <strong>Rejected</strong></p>
                    </div>
                </body>
                </html>
            `;
            
            quoteLogger.response('Sending rejection page', { quoteId, processingTime: Date.now() - startTime }, requestId);
            return res.status(400).send(rejectionPage);
        }

        // Check idempotency
        if (quoteData.LastMutationId === mutationId) {
            quoteLogger.adminDecline('Idempotency hit - quote already processed', { quoteId, mutationId }, requestId);
            
            const idempotentPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Already Processed - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Already Processed</h1>
                    <div class="info">
                        <h2>This quote has already been processed.</h2>
                        <p>Quote ID: <strong>${quoteId}</strong></p>
                        <p>No action needed.</p>
                    </div>
                </body>
                </html>
            `;
            
            quoteLogger.response('Sending idempotent page', { quoteId, processingTime: Date.now() - startTime }, requestId);
            return res.status(200).send(idempotentPage);
        }

        // Send customer notification email
        try {
            quoteLogger.email('Sending customer decline notification', { 
                to: quoteData.CustomerEmail,
                quoteId 
            }, requestId);

            const customerEmailOptions = {
                to: quoteData.CustomerEmail,
                subject: `Quote Update - ${quoteId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1976d2;">Quote Update</h2>
                        <p>Dear ${quoteData.CustomerName},</p>
                        <p>Thank you for your interest in our ${quoteData.ServiceType} services.</p>
                        
                        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #856404; margin-top: 0;">Quote Status Update</h3>
                            <p>Unfortunately, we are unable to proceed with your quote request at this time.</p>
                            <p><strong>Quote ID:</strong> ${quoteId}</p>
                            <p><strong>Service:</strong> ${quoteData.ServiceType}</p>
                            <p><strong>Location:</strong> ${quoteData.Location}</p>
                        </div>

                        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #0066cc; margin-top: 0;">What's Next?</h3>
                            <p>We appreciate your interest in our services. If you have any questions or would like to discuss alternative options, please don't hesitate to contact us.</p>
                            <p>You can reach us at:</p>
                            <ul>
                                <li>Email: info@kiwitrade.co.nz</li>
                                <li>Phone: 0800 KIWI TRADE</li>
                            </ul>
                        </div>

                        <p>Thank you for considering Kiwi Trade for your needs.</p>
                        <p>Best regards,<br><strong>Kiwi Trade Team</strong></p>
                    </div>
                `
            };

            await sendEmail(customerEmailOptions);
            quoteLogger.email('Customer decline notification sent successfully', { 
                to: quoteData.CustomerEmail,
                quoteId
            }, requestId);

        } catch (emailError) {
            quoteLogger.error('Failed to send customer decline notification', { 
                quoteId, 
                error: emailError.message,
                stack: emailError.stack 
            }, requestId);
        }

        // Update quote status in Google Sheets using upsert
        const updateData = {
            AdminPersonStatus: 'Declined',
            AdminPersonTimestamp: getNZTimestamp(),
            AdminPersonNotes: 'Quote declined by admin',
            Status: 'Declined',
            LastMutationId: mutationId
        };

        quoteLogger.sheets('Updating Google Sheets with decline status', { quoteId, updateData }, requestId);
        
        const upsertResult = await upsertQuoteRow(quoteId, updateData);
        
        quoteLogger.sheets('Google Sheets updated successfully', { 
            quoteId, 
            action: upsertResult.action,
            rowIndex: upsertResult.rowIndex 
        }, requestId);

        quoteLogger.response('Redirecting to success page', { 
            quoteId, 
            processingTime: Date.now() - startTime 
        }, requestId);

        return res.redirect(`/quote-status?status=success&message=Quote declined and customer notified.`);

    } catch (error) {
        quoteLogger.error('Admin decline error', { 
            error: error.message,
            stack: error.stack 
        }, requestId);
        
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
}
