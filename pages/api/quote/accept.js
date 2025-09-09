import { upsertQuoteRow, getQuoteRowByQuoteId, generateMutationId } from '../../../utils/sheets.js';
import { generateQuotePDF } from '../../../utils/pdf.js';
import { normalizeQuoteDataAddresses } from '../../../utils/normalize.js';
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
    
    quoteLogger.adminAccept('Request received', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: { 'user-agent': req.headers['user-agent'] }
    }, requestId);

    if (req.method !== 'GET') {
        quoteLogger.adminAccept('Method not allowed', { method: req.method }, requestId);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { quoteId, ts, token } = req.query;

        if (!quoteId || !ts || !token) {
            quoteLogger.adminAccept('Missing required parameters', { quoteId: !!quoteId, ts: !!ts, token: !!token }, requestId);
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        // Generate mutation ID for idempotency
        const mutationId = generateMutationId(quoteId, 'admin-accept', { ts, token });
        quoteLogger.adminAccept('Generated mutationId', { mutationId }, requestId);

        // Get existing quote data
        const existingQuote = await getQuoteRowByQuoteId(quoteId);
        if (!existingQuote) {
            quoteLogger.adminAccept('Quote not found', { quoteId }, requestId);
            return res.status(404).json({ success: false, error: 'Quote not found' });
        }

        const quoteData = existingQuote.data;
        quoteLogger.adminAccept('Found existing quote data', { 
            quoteId, 
            customerName: quoteData.CustomerName,
            totalQuote: quoteData.TotalQuote,
            status: quoteData.Status
        }, requestId);

        // Check if already approved
        if (quoteData.AdminPersonStatus === 'Approved') {
            quoteLogger.adminAccept('Quote already approved - preventing duplicate', { quoteId, adminStatus: quoteData.AdminPersonStatus }, requestId);
            
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Already Approved - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Already Approved</h1>
                    <div class="success">
                        <h2>This quote has already been approved.</h2>
                        <p>Quote ID: <strong>${quoteId}</strong></p>
                        <p>Customer: <strong>${quoteData.CustomerName}</strong></p>
                        <p>Approved on: <strong>${quoteData.AdminPersonTimestamp}</strong></p>
                    </div>
                    <div class="info">
                        <p>The customer has been notified and can now accept or decline the quote.</p>
                    </div>
                </body>
                </html>
            `;
            
            quoteLogger.response('Sending already approved page', { quoteId, processingTime: Date.now() - startTime }, requestId);
            return res.status(400).send(statusPage);
        }

        // Check if quote has been rejected
        if (quoteData.Status === 'Rejected') {
            quoteLogger.adminAccept('Quote rejected - cannot approve', { quoteId, status: quoteData.Status }, requestId);
            
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
                    <h1>Quote Cannot Be Approved</h1>
                    <div class="error">
                        <h2>This quote has been rejected and cannot be approved.</h2>
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
            quoteLogger.adminAccept('Idempotency hit - quote already processed', { quoteId, mutationId }, requestId);
            
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

        // Build customer quote data from ACTUAL quote data (not blank template)
        const customerQuoteData = {
            quoteId: quoteData.QuoteID,
            quoteDate: quoteData.QuoteDate || getNZTimestamp(),
            validUntil: quoteData.ValidUntil,
            customerName: quoteData.CustomerName,
            customerEmail: quoteData.CustomerEmail,
            customerPhone: quoteData.CustomerPhone,
            customerAddress: quoteData.Location,
            serviceType: quoteData.ServiceType,
            tradespersonName: quoteData.TradePersonName || 'Professional Tradesperson',
            tradespersonEmail: quoteData.TradePersonEmail || 'contact@kiwitrade.co.nz',
            tradespersonPhone: quoteData.TradePersonPhone || 'Contact via Kiwi Trade',
            tradespersonLicense: 'Licensed Tradesperson',
            rooms: quoteData.Rooms ? JSON.parse(quoteData.Rooms) : [],
            breakdown: {
                labourRate: parseFloat(quoteData.LabourRate) || 0,
                labourHours: parseFloat(quoteData.LabourHours) || 0,
                labourTotal: parseFloat(quoteData.LabourTotal) || 0,
                materialsCost: parseFloat(quoteData.MaterialsCost) || 0,
                materialsQuantity: parseFloat(quoteData.MaterialsQuantity) || 0,
                materialsTotal: parseFloat(quoteData.MaterialsTotal) || 0,
                travelCost: parseFloat(quoteData.TravelCost) || 0,
                travelDistance: parseFloat(quoteData.TravelDistance) || 0,
                travelTotal: parseFloat(quoteData.TravelTotal) || 0,
                installationCost: parseFloat(quoteData.InstallationCost) || 0
            },
            totals: {
                labour: parseFloat(quoteData.LabourTotal) || 0,
                materials: parseFloat(quoteData.MaterialsTotal) || 0,
                travel: parseFloat(quoteData.TravelTotal) || 0,
                installation: parseFloat(quoteData.InstallationCost) || 0,
                subtotal: parseFloat(quoteData.Subtotal) || 0,
                gst: parseFloat(quoteData.GST) || 0,
                final: parseFloat(quoteData.TotalQuote) || 0
            }
        };

        // Normalize addresses
        const normalizedCustomerQuoteData = normalizeQuoteDataAddresses(customerQuoteData);

        quoteLogger.adminAccept('Built customer quote data from actual quote', {
            quoteId,
            customerName: normalizedCustomerQuoteData.customerName,
            totalQuote: normalizedCustomerQuoteData.totals.final,
            source: 'fetched-from-sheets'
        }, requestId);

        // Generate PDF for customer
        let pdfBuffer = null;
        try {
            quoteLogger.pdf('Generating PDF for approved quote', { quoteId }, requestId);
            
            const pdfResult = await generateQuotePDF(normalizedCustomerQuoteData);
            
            if (pdfResult.success) {
                pdfBuffer = pdfResult.buffer;
                quoteLogger.pdf('PDF generated successfully', { 
                    quoteId, 
                    provider: pdfResult.provider,
                    processingTime: pdfResult.processingTime 
                }, requestId);
            } else {
                quoteLogger.pdf('PDF generation failed', { 
                    quoteId, 
                    error: pdfResult.error 
                }, requestId);
            }
        } catch (pdfError) {
            quoteLogger.error('PDF generation error', { 
                quoteId, 
                error: pdfError.message,
                stack: pdfError.stack 
            }, requestId);
        }

        // Send customer email with actual quote data
        try {
            quoteLogger.email('Sending customer quote email', { 
                to: normalizedCustomerQuoteData.customerEmail,
                quoteId 
            }, requestId);

            const customerEmailOptions = {
                to: normalizedCustomerQuoteData.customerEmail,
                subject: `Your Quote is Ready - ${quoteId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1976d2;">Your Quote is Ready!</h2>
                        <p>Dear ${normalizedCustomerQuoteData.customerName},</p>
                        <p>Thank you for your interest in our ${normalizedCustomerQuoteData.serviceType} services. We're pleased to provide you with a detailed quote.</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #34495e; margin-top: 0;">Quote Summary</h3>
                            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                                <div>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Quote ID:</strong> ${quoteId}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Service:</strong> ${normalizedCustomerQuoteData.serviceType}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Location:</strong> ${normalizedCustomerQuoteData.customerAddress}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Valid Until:</strong> ${normalizedCustomerQuoteData.validUntil}</p>
                                </div>
                                <div>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Tradesperson:</strong> ${normalizedCustomerQuoteData.tradespersonName}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Valid Until:</strong> ${normalizedCustomerQuoteData.validUntil}</p>
                                    <p style="margin: 8px 0; color: #28a745; font-size: 18px; font-weight: bold;"><strong>Total Quote:</strong> $${normalizedCustomerQuoteData.totals.final.toFixed(2)}</p>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                                <p style="color: #6c757d; font-size: 14px; margin: 0;">📎 Your detailed quote PDF is attached to this email</p>
                            </div>
                        </div>

                        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #0066cc; margin-top: 0;">Next Steps</h3>
                            <p>Please review your quote and let us know your decision:</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lead-code.vercel.app'}/quote-decision/accept?quoteId=${quoteId}&ts=${Date.now()}&token=accept_token" 
                                   style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px;">
                                    ✅ Accept Quote
                                </a>
                                <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lead-code.vercel.app'}/quote-decision/decline?quoteId=${quoteId}&ts=${Date.now()}&token=decline_token" 
                                   style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px;">
                                    ❌ Decline Quote
                                </a>
                            </div>
                        </div>

                        <p>If you have any questions about this quote, please don't hesitate to contact us.</p>
                        <p>Best regards,<br><strong>Kiwi Trade Team</strong></p>
                    </div>
                `,
                attachments: pdfBuffer ? [{
                    filename: `quote-${quoteId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }] : []
            };

            await sendEmail(customerEmailOptions);
            quoteLogger.email('Customer quote email sent successfully', { 
                to: normalizedCustomerQuoteData.customerEmail,
                quoteId,
                hasAttachment: !!pdfBuffer
            }, requestId);

        } catch (emailError) {
            quoteLogger.error('Failed to send customer email', { 
                quoteId, 
                error: emailError.message,
                stack: emailError.stack 
            }, requestId);
        }

        // Update quote status in Google Sheets using upsert
        const updateData = {
            AdminPersonStatus: 'Approved',
            AdminPersonTimestamp: getNZTimestamp(),
            AdminPersonNotes: 'Quote approved by admin',
            Status: 'Approved',
            LastMutationId: mutationId
        };

        quoteLogger.sheets('Updating Google Sheets with approval status', { quoteId, updateData }, requestId);
        
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

        return res.redirect(`/quote-status?status=success&message=Quote approved and sent to the customer!`);

    } catch (error) {
        quoteLogger.error('Admin accept error', { 
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
