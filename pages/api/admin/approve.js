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
        
        console.log('📊 Quote data for PDF generation:', JSON.stringify(quoteDataForPdf, null, 2));
        
        try {
            pdfBuffer = await generateQuotePDF(quoteDataForPdf);
            console.log(`✅ PDF generated for approved quote: ${quoteId}`);
        } catch (pdfError) {
            console.error("❌ Admin PDF Generation failed:", pdfError);
            console.error("❌ PDF Error details:", pdfError.message, pdfError.stack);
            try {
                htmlQuote = generateQuoteHTML(quoteDataForPdf);
                console.log(`✅ HTML backup generated for approved quote: ${quoteId}`);
            } catch (htmlError) {
                console.error("❌ Admin HTML Generation also failed:", htmlError);
                console.error("❌ HTML Error details:", htmlError.message, htmlError.stack);
                console.error("❌ Quote data that failed:", JSON.stringify(quoteDataForPdf, null, 2));
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

        // 6. Send UNIFIED quote email to customer (same format as tradesperson and admin)
        const customerEmailOptions = {
          to: leadData['CustomerEmail'],
          subject: `Quote ${quoteId} - Copy for ${leadData['CustomerName']}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Quote Copy</h2>
              <p>Here's your approved quote from ${quoteData.TradespersonName}.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                <p><strong>Quote ID:</strong> ${quoteId}</p>
                <p><strong>Customer:</strong> ${leadData['CustomerName']}</p>
                <p><strong>Tradesperson:</strong> ${quoteData.TradespersonName}</p>
                <p><strong>Service:</strong> ${leadData['ServiceType']}</p>
                <p><strong>Total Amount:</strong> $${parseFloat(quoteData.TotalQuote || 0).toFixed(2)}</p>
                <p><strong>Location:</strong> ${leadData['Area']}, ${leadData['Suburb']}</p>
              </div>

              <!-- Quick Decision Buttons -->
              <div style="background-color: #f8f9fa; border-radius: 6px; padding: 25px; text-align: center; margin: 20px 0;">
                <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 18px;">🎯 Quick Decision</h3>
                <p style="color: #5a6c7d; margin: 0 0 20px 0;">Make your decision directly from this email:</p>
                
                <div style="margin: 20px 0;">
                  <a href="${acceptLink}" style="display: inline-block; background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">✅ ACCEPT QUOTE</a>
                  <a href="${declineLink}" style="display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">❌ DECLINE QUOTE</a>
                </div>
                
                <p style="color: #7f8c8d; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">Each button can only be used once for security</p>
              </div>
              
              <p>You can also view the quote online using the link: <a href="${viewQuoteLink}" style="color: #3498db;">${viewQuoteLink}</a></p>
              <p>Questions? Contact ${quoteData.TradespersonName} at ${quoteData.TradespersonEmail}</p>
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
