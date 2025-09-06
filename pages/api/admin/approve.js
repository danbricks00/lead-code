import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { generateQuotePDF, generateQuoteHTML } from "../../../lib/pdfGenerator.js";
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

// --- Helper Functions ---
function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateCustomerDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

function generateQuoteViewLink(quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/quote-view?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

async function findRowAndGetData(options) {
    const { sheets, spreadsheetId, tab, searchColumn, searchValue, columnsToFetch } = options;
    const range = `${tab}!A:Z`;
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    if (!rows || rows.length < 2) return null;
    const header = rows[0];
    const searchColumnIndex = header.indexOf(searchColumn);
    if (searchColumnIndex === -1) throw new Error(`Column "${searchColumn}" not found in tab "${tab}".`);
    const dataRow = rows.find(row => row[searchColumnIndex] === searchValue);
    if (!dataRow) return null;
    const result = {
        rowIndex: rows.indexOf(dataRow) + 1 // 1-based index
    };
    columnsToFetch.forEach(columnName => {
        const index = header.indexOf(columnName);
        result[columnName] = index !== -1 ? dataRow[index] || '' : 'N/A (Column not found)';
    });
    return result;
}


// --- Main Handler ---
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token || token !== verifyToken(quoteId, ts)) {
        return res.redirect(`/quote-status?status=error&message=Invalid approval link.`);
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Get Quote and Lead data from Sheets
        const quoteData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Quotes',
            searchColumn: 'QuoteID', searchValue: quoteId,
            columnsToFetch: [
                'Admin Status', 'LeadiD', 'TradespersonName', 'TradespersonEmail', 'TradespersonPhone',
                'LabourRate', 'LabourHours', 'MaterialsCost', 'MaterialsQuantity', 'TravelCost', 
                'TravelDistance', 'InstallationCost', 'Subtotal', 'GST', 'TotalQuote', 'ValidUntil', 'Notes'
            ]
        });

        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        if (quoteData['Admin Status'] === 'Approved') return res.redirect(`/quote-status?status=error&message=This quote has already been approved.`);

        const leadData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Leads',
            searchColumn: 'Lead', searchValue: quoteData['LeadiD'],
            columnsToFetch: ['CustomerName', 'CustomerEmail', 'CustomerPhone', 'ServiceType', 'Area', 'Suburb', 'Rooms']
        });
        
        if (!leadData) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);

        // 2. Generate PDF using our new system with enhanced data (NO XERO!)
        const rooms = leadData.Rooms ? JSON.parse(leadData.Rooms) : [];
        const totalSqm = rooms.reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0);
        
        // Parse quote values
        const labourRate = parseFloat(quoteData.LabourRate || 0);
        const labourHours = parseFloat(quoteData.LabourHours || 0);
        const materialsCost = parseFloat(quoteData.MaterialsCost || 0);
        const materialsQuantity = parseFloat(quoteData.MaterialsQuantity || 0);
        const travelCost = parseFloat(quoteData.TravelCost || 0);
        const travelDistance = parseFloat(quoteData.TravelDistance || 0);
        const installationCost = parseFloat(quoteData.InstallationCost || 0);
        
        // Calculate per-room breakdown
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

        const quoteDataForPdf = {
            quoteId,
            quoteDate: new Date().toISOString(),
            validUntil: quoteData.ValidUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            customerName: leadData.CustomerName,
            customerEmail: leadData.CustomerEmail,
            customerPhone: leadData.CustomerPhone,
            customerAddress: `${leadData.Area || ''}, ${leadData.Suburb || ''}`.trim(),
            serviceType: leadData.ServiceType,
            tradespersonName: quoteData.TradespersonName,
            tradespersonEmail: quoteData.TradespersonEmail,
            tradespersonPhone: quoteData.TradespersonPhone,
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
                subtotal: parseFloat(quoteData.Subtotal || 0),
                gst: parseFloat(quoteData.GST || 0),
                final: parseFloat(quoteData.TotalQuote || 0)
            }
        };

        // 3. Generate PDF/HTML with our mobile-optimized fallback system
        let pdfBuffer = null;
        let htmlQuote = null;
        
        try {
            pdfBuffer = await generateQuotePDF(quoteDataForPdf);
            console.log(`✅ PDF generated for approved quote: ${quoteId}`);
        } catch (pdfError) {
            console.error("❌ PDF Generation failed, trying HTML backup:", pdfError);
            try {
                htmlQuote = generateQuoteHTML(quoteDataForPdf);
                console.log(`✅ HTML backup generated for approved quote: ${quoteId}`);
            } catch (htmlError) {
                console.error("❌ HTML Generation also failed:", htmlError);
                return res.redirect(`/quote-status?status=error&message=Failed to generate quote document.`);
            }
        }

        // 4. Create attachment - PDF preferred, HTML mobile-friendly backup
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
            return res.redirect(`/quote-status?status=error&message=Failed to generate quote attachment.`);
        }

        // 5. Generate customer decision links
        const acceptLink = generateCustomerDecisionLink('accept', quoteId);
        const declineLink = generateCustomerDecisionLink('decline', quoteId);
        const viewQuoteLink = generateQuoteViewLink(quoteId);

        // 6. Send the quote email to the customer with our PDF system
        const customerEmailOptions = {
          to: leadData['CustomerEmail'],
          subject: `🎯 Your Quote for ${leadData['ServiceType']} - $${parseFloat(quoteData.TotalQuote || 0).toFixed(2)} is Ready!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">📋 Your Quote is Ready!</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Professional quote for ${leadData['ServiceType']}</p>
                </div>

                <!-- Customer Details -->
                <div style="background-color: #ecf0f1; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #34495e; margin: 0 0 15px 0; font-size: 18px;">📋 Quote Details</h3>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Customer:</strong> ${leadData['CustomerName']}</p>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Service:</strong> ${leadData['ServiceType']}</p>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Location:</strong> ${leadData['Area'] || 'N/A'}, ${leadData['Suburb'] || 'N/A'}</p>
                  <p style="margin: 5px 0; color: #2c3e50;"><strong>Quote ID:</strong> ${quoteId}</p>
                </div>

                <!-- Pricing Breakdown -->
                <div style="background-color: #e8f5e8; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #27ae60; margin: 0 0 15px 0; font-size: 18px;">💰 Cost Breakdown</h3>
                  <div style="border-bottom: 1px solid #c8e6c9; padding-bottom: 15px; margin-bottom: 15px;">
                    <p style="margin: 5px 0; color: #2c3e50; display: flex; justify-content: space-between;">
                      <span><strong>Labour:</strong> ${parseFloat(quoteData.LabourHours || 0)} hours @ $${parseFloat(quoteData.LabourRate || 0).toFixed(2)}/hour</span>
                      <span><strong>$${(parseFloat(quoteData.LabourRate || 0) * parseFloat(quoteData.LabourHours || 0)).toFixed(2)}</strong></span>
                    </p>
                    <p style="margin: 5px 0; color: #2c3e50; display: flex; justify-content: space-between;">
                      <span><strong>Materials:</strong> ${parseFloat(quoteData.MaterialsQuantity || 0)} units @ $${parseFloat(quoteData.MaterialsCost || 0).toFixed(2)}/unit</span>
                      <span><strong>$${(parseFloat(quoteData.MaterialsCost || 0) * parseFloat(quoteData.MaterialsQuantity || 0)).toFixed(2)}</strong></span>
                    </p>
                    <p style="margin: 5px 0; color: #2c3e50; display: flex; justify-content: space-between;">
                      <span><strong>Travel:</strong> ${parseFloat(quoteData.TravelDistance || 0)} km @ $${parseFloat(quoteData.TravelCost || 0).toFixed(2)}/km</span>
                      <span><strong>$${(parseFloat(quoteData.TravelCost || 0) * parseFloat(quoteData.TravelDistance || 0)).toFixed(2)}</strong></span>
                    </p>
                    <p style="margin: 5px 0; color: #2c3e50; display: flex; justify-content: space-between;">
                      <span><strong>Installation & Setup:</strong></span>
                      <span><strong>$${parseFloat(quoteData.InstallationCost || 0).toFixed(2)}</strong></span>
                    </p>
                  </div>
                  <div style="border-bottom: 1px solid #c8e6c9; padding-bottom: 15px; margin-bottom: 15px;">
                    <p style="margin: 5px 0; color: #2c3e50; display: flex; justify-content: space-between; font-size: 16px;">
                      <span><strong>Subtotal:</strong></span>
                      <span><strong>$${parseFloat(quoteData.Subtotal || 0).toFixed(2)}</strong></span>
                    </p>
                    <p style="margin: 5px 0; color: #2c3e50; display: flex; justify-content: space-between;">
                      <span><strong>GST (15%):</strong></span>
                      <span><strong>$${parseFloat(quoteData.GST || 0).toFixed(2)}</strong></span>
                    </p>
                  </div>
                  <div style="background-color: #27ae60; color: white; padding: 15px; border-radius: 6px; text-align: center;">
                    <p style="margin: 0; font-size: 24px; font-weight: bold;">TOTAL: $${parseFloat(quoteData.TotalQuote || 0).toFixed(2)}</p>
                  </div>
                </div>

                <!-- Online Quote Viewer -->
                <div style="background-color: #3498db; border-radius: 6px; padding: 20px; margin-bottom: 25px; text-align: center;">
                  <h3 style="color: white; margin: 0 0 15px 0; font-size: 18px;">🌐 View Your Quote Online</h3>
                  <p style="color: #ecf0f1; margin: 0 0 15px 0;">Click below to view your detailed quote in your browser:</p>
                  <a href="${viewQuoteLink}" style="display: inline-block; background-color: white; color: #3498db; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">📖 View Quote Online</a>
                </div>

                <!-- Quick Decision Buttons -->
                <div style="background-color: #f8f9fa; border-radius: 6px; padding: 25px; text-align: center;">
                  <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px;">🎯 Quick Decision</h3>
                  <p style="color: #5a6c7d; margin: 0 0 20px 0;">Make your decision directly from this email:</p>
                  
                  <div style="margin: 20px 0;">
                    <a href="${acceptLink}" style="display: inline-block; background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">✅ ACCEPT QUOTE</a>
                    <a href="${declineLink}" style="display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">❌ DECLINE QUOTE</a>
                  </div>
                  
                  <p style="color: #7f8c8d; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">Each button can only be used once for security</p>
                </div>

                <!-- PDF Attachment Notice -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
                  <p style="color: #856404; margin: 0; font-weight: bold;">📎 Professional PDF quote attached to this email</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    Questions? Reply to this email or contact us directly.<br>
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>

              </div>
            </div>
          `,
          attachments: [attachment]
        };
        
        await sendEmail(customerEmailOptions);
        console.log(`✅ Customer quote email sent to ${leadData['CustomerEmail']} with PDF attachment`);

        // 5. Update Sheet Status to final
        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:Z1' });
        const header = headerResponse.data.values[0];
        const updates = { 'Admin Status': 'Approved', 'Customer Status': 'Quote Sent' };
        let targetRow = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `Quotes!A${quoteData.rowIndex}:Z${quoteData.rowIndex}` })).data.values[0];
        
        header.forEach((colName, index) => {
            if(updates[colName]) targetRow[index] = updates[colName];
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId, range: `Quotes!A${quoteData.rowIndex}`,
            valueInputOption: 'USER_ENTERED', requestBody: { values: [targetRow] },
        });
        
        return res.redirect(`/quote-status?status=success&message=Quote approved and sent to the customer!`);

    } catch (error) {
        console.error("Quote Approval Error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during quote approval.`);
    }
}
