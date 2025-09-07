import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { generateQuotePDF, generateQuoteHTML } from '../../lib/pdfGenerator.js';
import { sendEmail } from '../../lib/emailHelper';
import crypto from "crypto";

// Create HTML backup quote when PDF generation fails
function createHTMLQuote(quoteData) {
    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const roomRows = quoteData.rooms.map(room => `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${room.name || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${room.dimensions || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${room.sqm ? formatCurrency(room.sqm) + 'm²' : 'N/A'}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quote ${quoteData.quoteId}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .total-row { background: #667eea; color: white; font-weight: bold; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 KIWI TRADE - QUOTE</h1>
        <p>Quote ID: ${quoteData.quoteId}</p>
        <p>Date: ${formatDate(quoteData.quoteDate)}</p>
        <p>Valid Until: ${formatDate(quoteData.validUntil)}</p>
    </div>

    <div class="section">
        <h2>Customer Details</h2>
        <p><strong>Name:</strong> ${quoteData.customerName}</p>
        <p><strong>Email:</strong> ${quoteData.customerEmail}</p>
        <p><strong>Phone:</strong> ${quoteData.customerPhone || 'N/A'}</p>
        <p><strong>Address:</strong> ${quoteData.customerAddress || 'N/A'}</p>
        <p><strong>Service:</strong> ${quoteData.serviceType}</p>
    </div>

    <div class="section">
        <h2>Tradesperson Details</h2>
        <p><strong>Name:</strong> ${quoteData.tradespersonName}</p>
        <p><strong>Email:</strong> ${quoteData.tradespersonEmail}</p>
        <p><strong>Phone:</strong> ${quoteData.tradespersonPhone}</p>
        <p><strong>License:</strong> ${quoteData.tradespersonLicense}</p>
    </div>

    <div class="section">
        <h2>Project Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Room Name</th>
                    <th>Dimensions</th>
                    <th>Square Meters</th>
                </tr>
            </thead>
            <tbody>
                ${roomRows}
            </tbody>
        </table>
    </div>

    <div class="summary">
        <h2>Quote Summary</h2>
        <table>
            <tr><td><strong>Labour:</strong></td><td style="text-align: right;">$${formatCurrency(quoteData.totals.labour)}</td></tr>
            <tr><td><strong>Materials:</strong></td><td style="text-align: right;">$${formatCurrency(quoteData.totals.materials)}</td></tr>
            <tr><td><strong>Travel:</strong></td><td style="text-align: right;">$${formatCurrency(quoteData.totals.travel)}</td></tr>
            <tr><td><strong>Installation:</strong></td><td style="text-align: right;">$${formatCurrency(quoteData.totals.installation)}</td></tr>
            <tr style="border-top: 2px solid #333;"><td><strong>Subtotal (excl. GST):</strong></td><td style="text-align: right;"><strong>$${formatCurrency(quoteData.totals.subtotal)}</strong></td></tr>
            <tr><td><strong>GST (15%):</strong></td><td style="text-align: right;">$${formatCurrency(quoteData.totals.gst)}</td></tr>
            <tr class="total-row"><td><strong>TOTAL (incl. GST):</strong></td><td style="text-align: right;"><strong>$${formatCurrency(quoteData.totals.final)}</strong></td></tr>
        </table>
    </div>

    <div class="section">
        <h3>Terms & Conditions</h3>
        <p>• This quote is valid for 14 days from the date of issue.</p>
        <p>• Payment terms: 50% deposit required to commence work, balance due upon completion.</p>
        <p>• All work is covered by our comprehensive warranty.</p>
        <p>• We are fully licensed and insured for your peace of mind.</p>
    </div>

    <p style="text-align: center; color: #666; margin-top: 30px;">
        Thank you for choosing Kiwi Trade for your underfloor heating needs.
    </p>
</body>
</html>`;
}

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

    // Debug quote details
    console.log('📋 Quote details received:', JSON.stringify(quoteDetails, null, 2));
    console.log('📋 Lead details received:', JSON.stringify(leadDetails, null, 2));
    
    // Calculate totals with safe parsing - moved outside try block for email access
    const labourRate = parseFloat(quoteDetails.labourRate) || 0;
    const labourHours = parseFloat(quoteDetails.labourHours) || 0;
    const materialsCost = parseFloat(quoteDetails.materialsCost) || 0;
    const materialsQuantity = parseFloat(quoteDetails.materialsQuantity) || 0;
    const travelCost = parseFloat(quoteDetails.travelCost) || 0;
    const travelDistance = parseFloat(quoteDetails.travelDistance) || 0;
    const installationCost = parseFloat(quoteDetails.installationCost) || 0;
    const subtotal = parseFloat(quoteDetails.subtotal) || 0;
    const gst = parseFloat(quoteDetails.gst) || 0;
    const totalQuote = parseFloat(quoteDetails.totalQuote) || 0;

    // Generate PDF using our mobile-optimized system with HTML backup
    let pdfBuffer = null;
    let htmlQuote = null;
    try {
        
        console.log('💰 Calculated values:', {
            labourRate, labourHours, materialsCost, materialsQuantity,
            travelCost, travelDistance, installationCost, subtotal, gst, totalQuote
        });
        
        // Prepare enhanced quote data with detailed breakdown for PDF generation
        const rooms = leadDetails.Rooms ? JSON.parse(leadDetails.Rooms) : [];
        const totalSqm = rooms.reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0);
        
        // Calculate per-room breakdown if we have room data
        const roomsWithDetails = rooms.map(room => {
            const roomSqm = parseFloat(room.sqm) || 0;
            const roomRatio = totalSqm > 0 ? roomSqm / totalSqm : 0;
            
            return {
                name: room.name,
                dimensions: room.dimensions || room.originalInput,
                sqm: roomSqm,
                labourHours: roomRatio * labourHours,
                labourCost: roomRatio * (labourRate * labourHours),
                materialsCost: roomRatio * (materialsCost * materialsQuantity)
            };
        });

        const quoteData = {
            quoteId,
            quoteDate: new Date().toLocaleString('en-NZ', {
              timeZone: 'Pacific/Auckland',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
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
            rooms: roomsWithDetails,
            // Add detailed breakdown for quote summary
            breakdown: {
                labourRate: labourRate,
                labourHours: labourHours,
                labourTotal: labourRate * labourHours,
                materialsCost: materialsCost,
                materialsQuantity: materialsQuantity,
                materialsTotal: materialsCost * materialsQuantity,
                travelCost: travelCost,
                travelDistance: travelDistance,
                travelTotal: travelCost * travelDistance,
                installationCost: installationCost,
                totalSqm: totalSqm
            },
            totals: {
                labour: labourRate * labourHours,
                materials: materialsCost * materialsQuantity,
                travel: travelCost * travelDistance,
                installation: installationCost,
                subtotal: subtotal,
                gst: gst,
                final: totalQuote
            }
        };
        
        // Normalize totals and add robust placeholder mappings
        const labourTotal = labourRate * labourHours;
        const materialsTotal = materialsCost * materialsQuantity;
        const travelTotal = travelCost * travelDistance;
        
        // Ensure totals are present and computed correctly
        if (!quoteData.totals.subtotal || quoteData.totals.subtotal === 0) {
            quoteData.totals.subtotal = labourTotal + materialsTotal + travelTotal + installationCost;
        }
        if (!quoteData.totals.gst || quoteData.totals.gst === 0) {
            quoteData.totals.gst = quoteData.totals.subtotal * 0.15;
        }
        if (!quoteData.totals.final || quoteData.totals.final === 0) {
            quoteData.totals.final = quoteData.totals.subtotal + quoteData.totals.gst;
        }
        
        // Create NZD-formatted strings for display
        const formatNZD = (amount) => `$${parseFloat(amount).toFixed(2)}`;
        const subtotalFormatted = formatNZD(quoteData.totals.subtotal);
        const gstFormatted = formatNZD(quoteData.totals.gst);
        const totalFormatted = formatNZD(quoteData.totals.final);
        
        // Add robust aliases for template compatibility
        quoteData.subtotal = quoteData.totals.subtotal;
        quoteData.gst = quoteData.totals.gst;
        quoteData.total = quoteData.totals.final;
        quoteData.grand_total = quoteData.totals.final;
        quoteData.totalQuote = quoteData.totals.final;
        
        // Add formatted versions
        quoteData.subtotalFormatted = subtotalFormatted;
        quoteData.gstFormatted = gstFormatted;
        quoteData.totalFormatted = totalFormatted;
        
        console.log('💰 Injected totals:', {
            numeric: {
                subtotal: quoteData.totals.subtotal,
                gst: quoteData.totals.gst,
                final: quoteData.totals.final
            },
            formatted: {
                subtotal: subtotalFormatted,
                gst: gstFormatted,
                total: totalFormatted
            }
        });
        
        console.log('📊 Final quote data for PDF:', JSON.stringify(quoteData, null, 2));

        try {
            pdfBuffer = await generateQuotePDF(quoteData);
            console.log(`✅ PDF generated successfully for Quote ${quoteId}`);
        } catch (pdfError) {
            console.error("❌ PDF Generation failed, trying HTML backup:", pdfError);
            
            try {
                // Try formatted HTML backup (maintains all styling and mobile-friendly)
                htmlQuote = generateQuoteHTML(quoteData);
                console.log(`✅ Professional HTML quote created for Quote ${quoteId}`);
            } catch (htmlError) {
                console.error("❌ HTML Generation also failed, using basic HTML backup:", htmlError);
                // Create basic HTML as final fallback
                htmlQuote = createHTMLQuote(quoteData);
                console.log(`⚠️ Basic HTML backup created for Quote ${quoteId}`);
            }
        }
    } catch (generalError) {
        console.error("General Quote Generation Error:", generalError);
        return res.status(500).json({ success: false, error: "Failed to generate quote." });
    }

    // Append quote data to Google Sheets "Quotes" tab
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    
    try {
        // Get NZ local time for QuoteDate
        const nzTimestamp = new Date().toLocaleString('en-NZ', {
            timeZone: 'Pacific/Auckland',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Recreate roomsWithDetails for Google Sheets (same logic as above)
        const rooms = leadDetails.Rooms ? JSON.parse(leadDetails.Rooms) : [];
        const totalSqm = rooms.reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0);
        const roomsWithDetails = rooms.map(room => {
            const roomSqm = parseFloat(room.sqm) || 0;
            const roomRatio = totalSqm > 0 ? roomSqm / totalSqm : 0;
            
            return {
                name: room.name,
                dimensions: room.dimensions || room.originalInput,
                sqm: roomSqm,
                labourHours: roomRatio * labourHours,
                labourCost: roomRatio * (labourRate * labourHours),
                materialsCost: roomRatio * (materialsCost * materialsQuantity)
            };
        });
        
        // Append new row to "Quotes" tab with 36 columns (A:AJ) - fill remaining columns with empty values
        // Schema: QuoteID, LeadID, TradesmanName, QuoteAmount, Notes, CustomerEmail, TradesmanEmail, Decision, DecisionTimestamp, ValidUntil, QuoteDate, LabourRate, LabourHours, LabourTotal, MaterialsCost, MaterialsQuantity, MaterialsTotal, TravelCost, TravelDistance, TravelTotal, InstallationCost, Subtotal, GST, FinalTotal, [12 more empty columns to reach AJ]
        const newQuoteRow = [
            quoteId,                            // A: QuoteID
            leadDetails.Lead || leadDetails.LeadId, // B: LeadID
            tradespersonName || '',             // C: TradesmanName
            parseFloat(quoteDetails.totalQuote) || 0, // D: QuoteAmount
            quoteDetails.notes || '',           // E: Notes
            customerEmail || '',                // F: CustomerEmail
            tradespersonEmail || '',            // G: TradesmanEmail
            '',                                 // H: Decision (empty at creation)
            '',                                 // I: DecisionTimestamp (empty at creation)
            quoteDetails.validUntil || '',      // J: ValidUntil
            nzTimestamp,                        // K: QuoteDate (NZ local time DD/MM/YYYY HH:mm)
            parseFloat(quoteDetails.labourRate) || 0,            // L: LabourRate
            parseFloat(quoteDetails.labourHours) || 0,           // M: LabourHours
            (parseFloat(quoteDetails.labourRate) || 0) * (parseFloat(quoteDetails.labourHours) || 0), // N: LabourTotal
            parseFloat(quoteDetails.materialsCost) || 0,         // O: MaterialsCost
            parseFloat(quoteDetails.materialsQuantity) || 0,     // P: MaterialsQuantity
            (parseFloat(quoteDetails.materialsCost) || 0) * (parseFloat(quoteDetails.materialsQuantity) || 0), // Q: MaterialsTotal
            parseFloat(quoteDetails.travelCost) || 0,            // R: TravelCost
            parseFloat(quoteDetails.travelDistance) || 0,        // S: TravelDistance
            (parseFloat(quoteDetails.travelCost) || 0) * (parseFloat(quoteDetails.travelDistance) || 0), // T: TravelTotal
            parseFloat(quoteDetails.installationCost) || 0,      // U: InstallationCost
            parseFloat(quoteDetails.subtotal) || 0,              // V: Subtotal
            parseFloat(quoteDetails.gst) || 0,                   // W: GST
            parseFloat(quoteDetails.totalQuote) || 0,            // X: FinalTotal
            '', '', '', '', '', '', '', '', '', '', '', ''       // Y:AJ: Empty columns to reach 36 total
        ];
        
        console.log('📊 Google Sheets Append - Tradesperson Data:', {
            tradespersonName: tradespersonName,
            tradespersonEmail: tradespersonEmail,
            tradespersonPhone: tradespersonPhone
        });
        
        console.log('📊 Google Sheets Append - Financial Data:', {
            labourRate: quoteDetails.labourRate,
            labourHours: quoteDetails.labourHours,
            materialsCost: quoteDetails.materialsCost,
            materialsQuantity: quoteDetails.materialsQuantity,
            travelCost: quoteDetails.travelCost,
            travelDistance: quoteDetails.travelDistance,
            installationCost: quoteDetails.installationCost,
            subtotal: quoteDetails.subtotal,
            gst: quoteDetails.gst,
            totalQuote: quoteDetails.totalQuote
        });
        
        console.log('📊 Google Sheets Append - Full Row Data:', newQuoteRow);
        
        // Append the new row to "Quotes" tab (36 columns: A to AJ)
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Quotes!A:AJ',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [newQuoteRow] }
        });

        console.log(`[SHEETS] Quote ${quoteId} written to Quotes tab (Lead ${leadDetails.Lead || leadDetails.LeadId})`);
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
                    <p><strong>Budget:</strong> ${leadDetails.Budget || leadDetails.budget || 'Not specified'}</p>
                    <p><strong>Timeline:</strong> ${leadDetails.Timelline || leadDetails.Timeline || leadDetails.timeline || 'Not specified'}</p>
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
        // Create attachment - PDF preferred, HTML backup (maintains formatting), DOCX final fallback
        let attachment;
        if (pdfBuffer) {
            attachment = {
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            };
        } else if (htmlQuote) {
            attachment = {
                filename: `Quote_${quoteId}.html`,
                content: Buffer.from(htmlQuote, 'utf8'),
                contentType: 'text/html'
            };
        } else {
            attachment = {
                filename: `Quote_${quoteId}.txt`,
                content: Buffer.from(`Quote ${quoteId} - Error generating attachments`, 'utf8'),
                contentType: 'text/plain'
            };
        }

        const emailOptions = {
            to: recipients,
            subject: `ACTION REQUIRED: Review Quote for ${customerName} - $${parseFloat(totalQuote || 0).toFixed(2)}`,
            html: emailHtml,
            attachments: [attachment]
        };

        try {
            await sendEmail(emailOptions);
            console.log(`✅ Admin/Tradesperson review email sent successfully to: ${recipients.join(', ')}`);
        } catch (emailError) {
            console.error('❌ Failed to send review email:', emailError);
        }
    }

    // ⚠️ IMPORTANT: Customer emails are NOT sent automatically!
    // Customers only receive emails after admin approval via /api/admin/approve
    console.log(`📋 Quote ${quoteId} created and sent to admin for approval. Customer will be notified after approval.`);
    
    // REMOVED: Automatic customer email - this was sending quotes before admin approval!
    /*
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

        // Create attachment - PDF preferred, DOCX backup, HTML final fallback
        let customerAttachment;
        if (pdfBuffer) {
            customerAttachment = {
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            };
        } else if (htmlQuote) {
            customerAttachment = {
                filename: `Quote_${quoteId}.html`,
                content: Buffer.from(htmlQuote, 'utf8'),
                contentType: 'text/html'
            };
        // DOCX removed for better mobile experience
        } else {
            customerAttachment = {
                filename: `Quote_${quoteId}.txt`,
                content: Buffer.from(`Quote ${quoteId} - Error generating attachments`, 'utf8'),
                contentType: 'text/plain'
            };
        }

        const customerEmailOptions = {
            to: customerEmail.trim(),
            subject: `📋 Your Quote for ${serviceType} - $${parseFloat(totalQuote || 0).toFixed(2)} - ${quoteId}`,
            html: customerEmailHtml,
            attachments: [customerAttachment]
        };

        try {
            await sendEmail(customerEmailOptions);
            console.log(`✅ Customer quote email sent successfully to: ${customerEmail}`);
        } catch (emailError) {
            console.error('❌ Failed to send customer email:', emailError);
        }
    }
    */ // End of commented-out automatic customer email section

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
                        <p><strong>Valid Until:</strong> ${new Date(quoteDetails.validUntil).toLocaleDateString('en-NZ')}</p>
                        
                        <h4 style="margin: 15px 0 10px 0; color: #333;">Cost Breakdown:</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Labour (${quoteDetails.labourHours}h @ $${quoteDetails.labourRate}/h):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.labourRate) * parseFloat(quoteDetails.labourHours) || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Materials (${quoteDetails.materialsQuantity}m² @ $${quoteDetails.materialsCost}/m²):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.materialsCost) * parseFloat(quoteDetails.materialsQuantity) || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Travel (${quoteDetails.travelDistance}km @ $${quoteDetails.travelCost}/km):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(quoteDetails.travelCost) * parseFloat(quoteDetails.travelDistance) || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Installation:</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${parseFloat(quoteDetails.installationCost || 0).toFixed(2)}</td></tr>
                            <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0 5px 0; font-weight: bold;">Subtotal (excl. GST):</td><td style="text-align: right; padding: 8px 0 5px 0; font-weight: bold;">$${parseFloat(quoteDetails.subtotal || 0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0;">GST (15%):</td><td style="text-align: right; padding: 5px 0;">$${parseFloat(quoteDetails.gst || 0).toFixed(2)}</td></tr>
                            <tr style="background: #28a745; color: white;"><td style="padding: 10px 5px; font-weight: bold; font-size: 16px;">TOTAL (incl. GST):</td><td style="text-align: right; padding: 10px 5px; font-weight: bold; font-size: 16px;">$${parseFloat(quoteDetails.totalQuote || 0).toFixed(2)}</td></tr>
                        </table>
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

        // Create attachment - PDF preferred, DOCX backup, HTML final fallback
        let tradespersonAttachment;
        if (pdfBuffer) {
            tradespersonAttachment = {
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            };
        } else if (htmlQuote) {
            tradespersonAttachment = {
                filename: `Quote_${quoteId}.html`,
                content: Buffer.from(htmlQuote, 'utf8'),
                contentType: 'text/html'
            };
        // DOCX removed for better mobile experience
        } else {
            tradespersonAttachment = {
                filename: `Quote_${quoteId}.txt`,
                content: Buffer.from(`Quote ${quoteId} - Error generating attachments`, 'utf8'),
                contentType: 'text/plain'
            };
        }

        const tradespersonEmailOptions = {
            to: tradespersonEmail.trim(),
            subject: `📋 Quote Sent to Customer - ${serviceType} - $${parseFloat(totalQuote || 0).toFixed(2)} - ${quoteId}`,
            html: tradespersonEmailHtml,
            attachments: [tradespersonAttachment]
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
