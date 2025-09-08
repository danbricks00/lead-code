import { upsertQuoteRow, createQuoteRowData, generateMutationId } from '../../../utils/sheets.js';
import { generateQuotePDF, generateHTMLQuote } from '../../../utils/pdf.js';
import { normalizeQuoteDataAddresses, normalizeLeadDataAddresses } from '../../../utils/normalize.js';
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

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

// Token verification
function verifyToken(quoteId, ts) {
    const secret = process.env.QUOTE_SECRET || 'default-secret';
    const expected = crypto.createHash('sha256').update(`${quoteId}:${ts}:${secret}`).digest('hex');
    return expected;
}

// Create quote view URL
function createQuoteViewUrl(quoteId) {
    const baseUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://lead-code.vercel.app';
    return `https://${baseUrl}/quote-view/${quoteId}`;
}

// Main handler
export default async function handler(req, res) {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[QUOTE-SUBMIT] Request received`, {
        requestId,
        method: req.method,
        url: req.url,
        query: req.query,
        bodyKeys: Object.keys(req.body || {}),
        timestamp: new Date().toISOString()
    });

    if (req.method !== 'POST') {
        console.log(`[QUOTE-SUBMIT] Method not allowed: ${req.method}`);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }
    
    try {
        const { quoteId, ts, token, quoteDetails, leadDetails } = req.body;

        if (!quoteId || !ts || !token || !quoteDetails || !leadDetails) {
            console.log(`[QUOTE-SUBMIT] Missing required fields`, {
                quoteId: !!quoteId,
                ts: !!ts,
                token: !!token,
                quoteDetails: !!quoteDetails,
                leadDetails: !!leadDetails
            });
            return res.status(400).json({ success: false, error: 'Missing required fields for quote submission.' });
        }

        if (token !== verifyToken(quoteId, ts)) {
            console.log(`[QUOTE-SUBMIT] Invalid token for quoteId: ${quoteId}`);
            return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
        }
        
        // Generate mutation ID for idempotency
        const mutationId = generateMutationId(quoteId, 'quote-submit', { quoteDetails, leadDetails });
        console.log(`[QUOTE-SUBMIT] Generated mutationId: ${mutationId}`);
        
        // Check if the lead has been rejected before allowing quote submission
        const leadId = leadDetails.Lead || leadDetails.LeadId;
        if (leadId) {
            try {
                const { getGoogleSheetsClient, getSpreadsheetId } = await import('../../../lib/googleSheets.js');
                const sheets = getGoogleSheetsClient();
                const spreadsheetId = getSpreadsheetId();
                
                if (spreadsheetId) {
                    console.log(`[QUOTE-SUBMIT] Checking lead status for ${leadId}...`);
                    
                    // Check the Leads sheet for rejection status
                    const leadsResponse = await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range: 'Leads!A:Z',
                    });

                    const leadRows = leadsResponse.data.values || [];
                    const leadHeaderRow = leadRows[0] || [];
                    const leadIdIndex = leadHeaderRow.findIndex(h => h.toLowerCase().includes('leadid'));
                    const statusIndex = leadHeaderRow.findIndex(h => h.toLowerCase().includes('status'));
                    
                    if (leadIdIndex !== -1 && statusIndex !== -1) {
                        // Find the row with matching leadId
                        for (let i = 1; i < leadRows.length; i++) {
                            if (leadRows[i][leadIdIndex] === leadId) {
                                const leadStatus = leadRows[i][statusIndex];
                                console.log(`[QUOTE-SUBMIT] Lead ${leadId} status: ${leadStatus}`);
                                
                                if (leadStatus === 'Rejected') {
                                    console.log(`[QUOTE-SUBMIT] Lead ${leadId} has been rejected - blocking quote submission`);
                                    return res.status(400).json({ 
                                        success: false, 
                                        error: 'This lead has been rejected and quote submission is not allowed.',
                                        leadStatus: 'Rejected'
                                    });
                                }
                                break;
                            }
                        }
                    }
                    
                    console.log(`[QUOTE-SUBMIT] Lead ${leadId} status check passed - allowing quote submission`);
                }
            } catch (statusCheckError) {
                console.error('[QUOTE-SUBMIT] Error checking lead status:', statusCheckError.message);
                // Continue with quote submission if status check fails (don't block on error)
            }
        }
        
        // Normalize addresses
        const normalizedLeadDetails = normalizeLeadDataAddresses(leadDetails);
        const normalizedQuoteDetails = { ...quoteDetails };
        
        // Extract customer details with fallbacks and proper field names
        const customerName = normalizedLeadDetails.CustomerName || normalizedLeadDetails.customerName || 'Unknown Customer';
        const customerEmail = normalizedLeadDetails.CustomerEmail || normalizedLeadDetails.customerEmail || '';
        const customerPhone = normalizedLeadDetails.CustomerPhone || normalizedLeadDetails.customerPhone || '';
        const customerAddress = normalizedLeadDetails.Location || normalizedLeadDetails.location || normalizedLeadDetails.CustomerAddress || normalizedLeadDetails.customerAddress || '';
        const serviceType = normalizedLeadDetails.ServiceType || normalizedLeadDetails.serviceType || 'Underfloor Heating';
        const tradespersonEmail = normalizedQuoteDetails.tradespersonEmail || '';
        const tradespersonName = normalizedQuoteDetails.tradespersonName || '';
        const tradespersonPhone = normalizedQuoteDetails.tradespersonPhone || '';
        const notes = normalizedQuoteDetails.notes || '';
        const validUntil = normalizedQuoteDetails.validUntil || '';
        const location = customerAddress;
        const timeline = normalizedLeadDetails.Timelline || normalizedLeadDetails.Timeline || normalizedLeadDetails.timeline || '';
        const budget = normalizedLeadDetails.Budget || normalizedLeadDetails.budget || '';
        
        console.log(`[QUOTE-SUBMIT] Quote submission data:`, {
            quoteId,
            customerName,
            customerEmail,
            serviceType,
            tradespersonName,
            mutationId
        });

        // Calculate totals with safe parsing
        const labourRate = parseFloat(normalizedQuoteDetails.labourRate) || 0;
        const labourHours = parseFloat(normalizedQuoteDetails.labourHours) || 0;
        const materialsCost = parseFloat(normalizedQuoteDetails.materialsCost) || 0;
        const materialsQuantity = parseFloat(normalizedQuoteDetails.materialsQuantity) || 0;
        const travelCost = parseFloat(normalizedQuoteDetails.travelCost) || 0;
        const travelDistance = parseFloat(normalizedQuoteDetails.travelDistance) || 0;
        const installationCost = parseFloat(normalizedQuoteDetails.installationCost) || 0;
        const subtotal = parseFloat(normalizedQuoteDetails.subtotal) || 0;
        const gst = parseFloat(normalizedQuoteDetails.gst) || 0;
        const totalQuote = parseFloat(normalizedQuoteDetails.totalQuote) || 0;

        // Create breakdown and totals objects for schema
        const breakdown = {
            labourRate: labourRate,
            labourHours: labourHours,
            labourTotal: labourRate * labourHours,
            materialsCost: materialsCost,
            materialsQuantity: materialsQuantity,
            materialsTotal: materialsCost * materialsQuantity,
            travelCost: travelCost,
            travelDistance: travelDistance,
            travelTotal: travelCost * travelDistance,
            installationCost: installationCost
        };
        
        const totals = {
            subtotal: subtotal,
            gst: gst,
            final: totalQuote
        };

        // Prepare enhanced quote data with detailed breakdown for PDF generation
        const rooms = normalizedLeadDetails.Rooms ? JSON.parse(normalizedLeadDetails.Rooms) : [];
        const totalSqm = rooms.reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0);
        
        // Calculate per-room breakdown if we have room data
        const roomsWithDetails = rooms.map(room => {
            const roomSqm = parseFloat(room.sqm) || 0;
            const roomRatio = totalSqm > 0 ? roomSqm / totalSqm : 0;
            
            return {
                name: room.name,
                dimensions: room.dimensions,
                sqm: roomSqm,
                ratio: roomRatio,
                labourCost: (labourRate * labourHours * roomRatio).toFixed(2),
                materialsCost: (materialsCost * materialsQuantity * roomRatio).toFixed(2),
                travelCost: (travelCost * travelDistance * roomRatio).toFixed(2),
                installationCost: (installationCost * roomRatio).toFixed(2),
                subtotal: ((labourRate * labourHours + materialsCost * materialsQuantity + travelCost * travelDistance + installationCost) * roomRatio).toFixed(2)
            };
        });

        // Build final quote data for PDF generation
        const finalQuoteData = {
            quoteId: quoteId,
            quoteDate: getNZTimestamp(),
            validUntil: validUntil,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            serviceType: serviceType,
            tradespersonName: tradespersonName || 'Professional Tradesperson',
            tradespersonEmail: tradespersonEmail || 'contact@kiwitrade.co.nz',
            tradespersonPhone: tradespersonPhone || 'Contact via Kiwi Trade',
            tradespersonLicense: 'Licensed Tradesperson',
            rooms: roomsWithDetails,
            breakdown: breakdown,
            totals: {
                labour: breakdown.labourTotal,
                materials: breakdown.materialsTotal,
                travel: breakdown.travelTotal,
                installation: breakdown.installationCost,
                subtotal: subtotal,
                gst: gst,
                final: totalQuote
            }
        };

        // Normalize quote data addresses
        const normalizedFinalQuoteData = normalizeQuoteDataAddresses(finalQuoteData);

        // Generate PDF using our enhanced system
        let pdfBuffer = null;
        let htmlQuote = null;
        try {
            console.log(`[QUOTE-SUBMIT] Generating PDF for quoteId: ${quoteId}`);
            
            const pdfResult = await generateQuotePDF(normalizedFinalQuoteData);
            
            if (pdfResult.success) {
                pdfBuffer = pdfResult.buffer;
                console.log(`[QUOTE-SUBMIT] PDF generated successfully with ${pdfResult.provider} in ${pdfResult.processingTime}ms`);
            } else {
                console.warn(`[QUOTE-SUBMIT] PDF generation failed: ${pdfResult.error}`);
                // Generate HTML backup
                htmlQuote = generateHTMLQuote(normalizedFinalQuoteData);
                console.log(`[QUOTE-SUBMIT] Generated HTML backup quote`);
            }
        } catch (pdfError) {
            console.error(`[QUOTE-SUBMIT] PDF generation error:`, pdfError.message);
            // Generate HTML backup
            htmlQuote = generateHTMLQuote(normalizedFinalQuoteData);
            console.log(`[QUOTE-SUBMIT] Generated HTML backup quote after error`);
        }

        // Create quote row data for upsert
        const quoteRowData = createQuoteRowData(quoteId, normalizedLeadDetails, normalizedQuoteDetails, {
            LastMutationId: mutationId,
            Status: 'Submitted'
        });

        // Upsert to Google Sheets (NO MORE APPENDS)
        console.log(`[QUOTE-SUBMIT] Upserting quote data to Google Sheets`);
        const upsertResult = await upsertQuoteRow(quoteId, quoteRowData);
        
        if (upsertResult.action === 'IDEMPOTENT') {
            console.log(`[QUOTE-SUBMIT] Idempotency hit for quoteId=${quoteId} mutationId=${mutationId} - returning success`);
            return res.status(200).json({
                success: true,
                message: 'Quote already submitted (idempotent)',
                quoteId: quoteId,
                action: 'idempotent',
                processingTime: Date.now() - startTime
            });
        }

        console.log(`[QUOTE-SUBMIT] Google Sheets upsert result:`, upsertResult);

        // Send emails
        const quoteViewUrl = createQuoteViewUrl(quoteId);
        const currentTime = getNZTimestamp();

        // Tradesman confirmation email
        const tradesmanHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">✅ Quote Submitted Successfully!</h2>
                <p>Your quote has been submitted and is now being processed.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                    <p><strong>Quote ID:</strong> ${quoteId}</p>
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Service:</strong> ${serviceType}</p>
                    <p><strong>Total Quote:</strong> $${totalQuote.toFixed(2)}</p>
                    <p><strong>Submitted:</strong> ${currentTime}</p>
                    <p><strong>Status:</strong> Submitted and being processed</p>
                </div>

                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>📄 Professional quote document being generated</li>
                        <li>📧 Customer will receive quote email with attachment</li>
                        <li>📧 Customer can accept or decline the quote</li>
                        <li>📊 Quote status will be updated in system</li>
                    </ul>
                </div>

                <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
            </div>
        `;

        // Admin notification email
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">📋 New Quote Submitted</h2>
                <p>A new quote has been submitted and requires your review.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #34495e; margin-top: 0;">Quote Information:</h3>
                    <p><strong>Quote ID:</strong> ${quoteId}</p>
                    <p><strong>Customer:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
                    <p><strong>Service:</strong> ${serviceType}</p>
                    <p><strong>Location:</strong> ${location}</p>
                    <p><strong>Total Quote:</strong> $${totalQuote.toFixed(2)}</p>
                    <p><strong>Valid Until:</strong> ${validUntil}</p>
                    <p><strong>Item Breakdown:</strong></p>
                    <pre style="background: #f1f1f1; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${normalizedQuoteDetails.itemBreakdown || 'No breakdown provided'}</pre>
                    ${notes ? `<p><strong>Additional Notes:</strong> ${notes}</p>` : ''}
                </div>
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1976d2; margin-top: 0;">Customer Details:</h3>
                    <p><strong>Name:</strong> ${customerName || 'Not specified'}</p>
                    <p><strong>Email:</strong> ${customerEmail || 'Not specified'}</p>
                    <p><strong>Phone:</strong> ${customerPhone || 'Not specified'}</p>
                    <p><strong>Service:</strong> ${serviceType || 'Underfloor Heating'}</p>
                    <p><strong>Location:</strong> ${location || 'Auckland'}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #856404; margin-top: 0;">Status:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>✅ Quote submitted successfully</li>
                        <li>📧 Customer will receive quote with attachment</li>
                        <li>📊 Quote status updated in system</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
            </div>
        `;

        // Send emails
        try {
            console.log(`[QUOTE-SUBMIT] Sending confirmation emails`);
            
            // Send tradesman confirmation
            if (tradespersonEmail) {
                await sendEmail({
                    to: tradespersonEmail,
                    subject: `✅ Quote Submitted Successfully - ${quoteId}`,
                    html: tradesmanHtml
                });
                console.log(`[QUOTE-SUBMIT] Tradesman confirmation email sent to: ${tradespersonEmail}`);
            }

            // Send admin notification
            const adminEmail = process.env.ADMIN_EMAIL || 'danbricks18@gmail.com';
            await sendEmail({
                to: adminEmail,
                subject: `📋 New Quote Submitted - ${customerName} (${quoteId})`,
                html: adminHtml
            });
            console.log(`[QUOTE-SUBMIT] Admin notification email sent to: ${adminEmail}`);

        } catch (emailError) {
            console.error(`[QUOTE-SUBMIT] Email sending error:`, emailError.message);
            // Don't fail the whole process for email errors
        }

        const processingTime = Date.now() - startTime;
        console.log(`[QUOTE-SUBMIT] Quote submission completed successfully`, {
            quoteId,
            action: upsertResult.action,
            processingTime,
            mutationId
        });

        return res.status(200).json({
            success: true,
            message: 'Quote submitted successfully',
            quoteId: quoteId,
            action: upsertResult.action,
            processingTime: processingTime
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error(`[QUOTE-SUBMIT] Error:`, {
            error: error.message,
            stack: error.stack,
            processingTime
        });
        
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            processingTime: processingTime
        });
    }
}
