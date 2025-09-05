import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { generateQuotePDF } from '../../lib/pdfGenerator.js';
import { sendEmail } from '../../lib/emailHelper';
import crypto from "crypto";

function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateAdminDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts); 
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/admin/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

function generateCustomerDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

function generateQuoteViewLink(quoteId) {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/quote-view/${quoteId}`;
}

// Main handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  
  try {
    const { quoteId, ts, token, quoteDetails, leadDetails } = req.body;

    if (!quoteId || !ts || !token || !quoteDetails || !leadDetails) {
        return res.status(400).json({ success: false, error: 'Missing required fields for quote submission.' });
    }

    if (token !== verifyToken(quoteId, ts)) {
        return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
    }
    
    // Extract customer details with fallbacks and proper field names
    const customerName = leadDetails.CustomerName || leadDetails.customerName || 'Unknown Customer';
    const customerEmail = leadDetails.CustomerEmail || leadDetails.customerEmail || '';
    const customerPhone = leadDetails.CustomerPhone || leadDetails.customerPhone || '';
    const customerAddress = leadDetails.Location || leadDetails.location || leadDetails.CustomerAddress || leadDetails.customerAddress || '';
    const serviceType = leadDetails.ServiceType || leadDetails.serviceType || 'Underfloor Heating';
    const tradespersonEmail = quoteDetails.tradespersonEmail || '';
    const tradespersonName = quoteDetails.tradespersonName || '';
    const tradespersonPhone = quoteDetails.tradespersonPhone || '';
    
    console.log('📊 Quote submission data:', {
      quoteId,
      customerName,
      customerEmail,
      serviceType,
      tradespersonName
    });

    // Generate PDF using our new system
    let pdfBuffer;
    try {
        // Prepare quote data for PDF generation
        const quoteData = {
            quoteId,
            quoteDate: new Date().toISOString(),
            validUntil: quoteDetails.validUntil,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            customerAddress: customerAddress,
            serviceType: serviceType,
            tradespersonName: tradespersonName,
            tradespersonEmail: tradespersonEmail,
            tradespersonPhone: tradespersonPhone,
            tradespersonLicense: 'Licensed Tradesperson',
            rooms: leadDetails.Rooms ? JSON.parse(leadDetails.Rooms) : [],
            totals: {
                labour: (parseFloat(quoteDetails.labourRate) || 0) * (parseFloat(quoteDetails.labourHours) || 0),
                materials: (parseFloat(quoteDetails.materialsCost) || 0) * (parseFloat(quoteDetails.materialsQuantity) || 0),
                travel: (parseFloat(quoteDetails.travelCost) || 0) * (parseFloat(quoteDetails.travelDistance) || 0),
                installation: parseFloat(quoteDetails.installationCost) || 0,
                subtotal: parseFloat(quoteDetails.subtotal) || 0,
                gst: parseFloat(quoteDetails.gst) || 0,
                final: parseFloat(quoteDetails.totalQuote) || 0
            }
        };

        pdfBuffer = await generateQuotePDF(quoteData);
        console.log(`✅ PDF generated successfully for Quote ${quoteId}`);
    } catch (pdfError) {
        console.error("PDF Generation Error:", pdfError);
        return res.status(500).json({ success: false, error: "Failed to generate PDF quote." });
    }

    // Update Google Sheet with quote data
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    try {
        // Add quote to Quotes sheet
        const quotesRange = 'Quotes!A:Z';
        const quoteRow = [
            quoteId,
            new Date().toISOString(),
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            serviceType,
            tradespersonName,
            tradespersonEmail,
            tradespersonPhone,
            quoteDetails.labourRate,
            quoteDetails.labourHours,
            quoteDetails.materialsCost,
            quoteDetails.materialsQuantity,
            quoteDetails.travelCost,
            quoteDetails.travelDistance,
            quoteDetails.installationCost,
            quoteDetails.notes || '',
            quoteDetails.validUntil,
            quoteDetails.subtotal,
            quoteDetails.gst,
            quoteDetails.totalQuote,
            'pending', // status
            leadDetails.LeadId || '', // link to lead
            JSON.stringify(leadDetails.Rooms || []), // room data
            new Date().toISOString() // created timestamp
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: quotesRange,
            valueInputOption: 'RAW',
            resource: {
                values: [quoteRow]
            }
        });

        console.log(`✅ Quote data saved to Google Sheets: ${quoteId}`);
    } catch (sheetsError) {
        console.error("Google Sheets Error:", sheetsError);
        // Don't fail the whole process, just log the error
    }

    // Generate decision links
    const approveLink = generateCustomerDecisionLink('accept', quoteId);
    const declineLink = generateCustomerDecisionLink('decline', quoteId);
    const quoteViewLink = generateQuoteViewLink(quoteId);
    const adminApproveLink = generateAdminDecisionLink('approve', quoteId);
    const declineFormLink = generateAdminDecisionLink('decline-form', quoteId);

    // Send admin/tradesperson review email
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const emailHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">📋 Quote Ready for Review</h1>
            </div>
            <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin: 0 0 20px 0;">Quote Details</h2>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Customer Information:</h3>
                    <p><strong>Name:</strong> ${customerName}</p>
                    <p><strong>Email:</strong> ${customerEmail}</p>
                    <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
                    <p><strong>Address:</strong> ${customerAddress || 'Not provided'}</p>
                    <p><strong>Service:</strong> ${serviceType}</p>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Tradesperson Information:</h3>
                    <p><strong>Name:</strong> ${tradespersonName}</p>
                    <p><strong>Email:</strong> ${tradespersonEmail}</p>
                    <p><strong>Phone:</strong> ${tradespersonPhone || 'Not provided'}</p>
                </div>

                <h3>Quote Summary:</h3>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Labour (${quoteDetails.labourHours}h @ $${quoteDetails.labourRate}/h):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.labourRate) * parseFloat(quoteDetails.labourHours) || 0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Materials (${quoteDetails.materialsQuantity}m² @ $${quoteDetails.materialsCost}/m²):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.materialsCost) * parseFloat(quoteDetails.materialsQuantity) || 0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Travel (${quoteDetails.travelDistance}km @ $${quoteDetails.travelCost}/km):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.travelCost) * parseFloat(quoteDetails.travelDistance) || 0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Installation:</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${parseFloat(quoteDetails.installationCost || 0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px 0; font-weight: bold;">Subtotal (excl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold;">$${parseFloat(quoteDetails.subtotal || 0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0;">GST (15%):</td><td style="text-align: right; padding: 5px 0;">$${parseFloat(quoteDetails.gst || 0).toFixed(2)}</td></tr>
                        <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0; font-weight: bold; font-size: 1.1em;">Total (incl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold; font-size: 1.1em;">$${parseFloat(quoteDetails.totalQuote || 0).toFixed(2)}</td></tr>
                    </table>
                </div>
                <p><strong>Valid Until:</strong> ${new Date(quoteDetails.validUntil).toLocaleDateString('en-NZ')}</p>
                ${quoteDetails.notes ? `<p><strong>Notes:</strong> ${quoteDetails.notes}</p>` : ''}
                
                <div style="margin: 20px 0; text-align: center;">
                    <a href="${adminApproveLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">✅ Approve & Send to Customer</a>
                    <a href="${declineFormLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">❌ Decline Quote</a>
                </div>
                
                <p><em>Quote ID: ${quoteId}</em></p>
            </div>
        </div>
    `;

    // Build recipient list with validation
    const recipients = [];
    if (ADMIN_EMAIL && ADMIN_EMAIL.trim()) {
        recipients.push(ADMIN_EMAIL.trim());
    }
    if (tradespersonEmail && tradespersonEmail.trim()) {
        recipients.push(tradespersonEmail.trim());
    }

    console.log('📧 Email recipients:', recipients);

    if (recipients.length === 0) {
        console.error('❌ No valid email recipients found. ADMIN_EMAIL:', ADMIN_EMAIL, 'tradespersonEmail:', tradespersonEmail);
    } else {
        const emailOptions = {
            to: recipients,
            subject: `ACTION REQUIRED: Review Quote for ${customerName}`,
            html: emailHtml,
            attachments: [{
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        try {
            await sendEmail(emailOptions);
            console.log(`✅ Admin/Tradesperson review email sent successfully to: ${recipients.join(', ')}`);
        } catch (emailError) {
            console.error('❌ Failed to send review email:', emailError);
        }
    }

    // Send customer email with PDF attachment and web version link
    if (customerEmail && customerEmail.trim()) {
        const customerEmailHtml = `
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">📋 Your Quote is Ready!</h1>
                </div>
                <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p>Hi ${customerName},</p>
                    <p>Your quote for <strong>${serviceType}</strong> is ready for review.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Quote Summary:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Labour (${quoteDetails.labourHours}h @ $${quoteDetails.labourRate}/h):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.labourRate) * parseFloat(quoteDetails.labourHours) || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Materials (${quoteDetails.materialsQuantity}m² @ $${quoteDetails.materialsCost}/m²):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.materialsCost) * parseFloat(quoteDetails.materialsQuantity) || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Travel (${quoteDetails.travelDistance}km @ $${quoteDetails.travelCost}/km):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.travelCost) * parseFloat(quoteDetails.travelDistance) || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Installation:</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${parseFloat(quoteDetails.installationCost || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 8px 0; font-weight: bold;">Subtotal (excl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold;">$${parseFloat(quoteDetails.subtotal || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0;">GST (15%):</td><td style="text-align: right; padding: 5px 0;">$${parseFloat(quoteDetails.gst || 0).toFixed(2)}</td></tr>
                            <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0; font-weight: bold; font-size: 1.1em;">Total (incl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold; font-size: 1.1em;">$${parseFloat(quoteDetails.totalQuote || 0).toFixed(2)}</td></tr>
                        </table>
                    </div>
                    
                    <p><strong>Valid Until:</strong> ${new Date(quoteDetails.validUntil).toLocaleDateString('en-NZ')}</p>
                    ${quoteDetails.notes ? `<p><strong>Notes:</strong> ${quoteDetails.notes}</p>` : ''}
                    
                    <div style="margin: 20px 0; text-align: center;">
                        <a href="${approveLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">✅ Accept Quote</a>
                        <a href="${declineLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">❌ Decline Quote</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        <strong>Web Version:</strong> <a href="${quoteViewLink}">View Quote Online</a><br>
                        <strong>PDF Attachment:</strong> Your detailed quote is attached to this email.
                    </p>
                    
                    <p><em>Quote ID: ${quoteId}</em></p>
                </div>
            </div>
        `;

        const customerEmailOptions = {
            to: customerEmail.trim(),
            subject: `📋 Your Quote for ${serviceType} - ${quoteId}`,
            html: customerEmailHtml,
            attachments: [{
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        try {
            await sendEmail(customerEmailOptions);
            console.log(`✅ Customer quote email sent successfully to: ${customerEmail}`);
        } catch (emailError) {
            console.error('❌ Failed to send customer email:', emailError);
        }
    }

    // Send tradesperson confirmation email with PDF attachment
    if (tradespersonEmail && tradespersonEmail.trim()) {
        const tradespersonEmailHtml = `
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">📋 Quote Sent Successfully!</h1>
                </div>
                <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p>Hi ${tradespersonName},</p>
                    <p>Your quote for <strong>${customerName}</strong>'s <strong>${serviceType}</strong> has been sent successfully.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Quote Details:</h3>
                        <p><strong>Customer:</strong> ${customerName}</p>
                        <p><strong>Service:</strong> ${serviceType}</p>
                        <p><strong>Total Quote:</strong> $${parseFloat(quoteDetails.totalQuote || 0).toFixed(2)}</p>
                        <p><strong>Valid Until:</strong> ${new Date(quoteDetails.validUntil).toLocaleDateString('en-NZ')}</p>
                    </div>
                    
                    <p>The customer will receive an email with your quote and can accept or decline it.</p>
                    <p>You will be notified immediately when they make their decision.</p>
                    
                    <div style="margin: 20px 0; text-align: center;">
                        <a href="${quoteViewLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Quote Online</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        <strong>PDF Copy:</strong> A copy of the quote is attached to this email for your records.
                    </p>
                    
                    <p><em>Quote ID: ${quoteId}</em></p>
                </div>
            </div>
        `;

        const tradespersonEmailOptions = {
            to: tradespersonEmail.trim(),
            subject: `📋 Quote Sent to Customer - ${serviceType} - ${quoteId}`,
            html: tradespersonEmailHtml,
            attachments: [{
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        try {
            await sendEmail(tradespersonEmailOptions);
            console.log(`✅ Tradesperson confirmation email sent successfully to: ${tradespersonEmail}`);
        } catch (emailError) {
            console.error('❌ Failed to send tradesperson email:', emailError);
        }
    }
    
    res.status(200).json({ success: true, message: 'Quote submitted successfully with PDF generation.' });

  } catch (error) {
    console.error("A top-level error occurred in quote-submit:", error);
    res.status(500).json({ success: false, error: 'A fatal error occurred during quote submission.' });
  }
}
