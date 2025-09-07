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
    const range = `${tab}!A:AJ`; // Use 36-column range to match quote-submit.js
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

        // 1. Get Quote and Lead data from Sheets using exact schema
        const quoteData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Quotes',
            searchColumn: 'QuoteID', searchValue: quoteId,
            columnsToFetch: [
                'AdminPersonStatus', 'LeadID', 'TradePersonName', 'TradePersonEmail', 'TradePersonPhone',
                'LabourRate', 'LabourHours', 'LabourTotal', 'MaterialsCost', 'MaterialsQuantity', 'MaterialsTotal',
                'TravelCost', 'TravelDistance', 'TravelTotal', 'InstallationCost', 'Subtotal', 'GST', 'TotalQuote', 
                'Notes', 'ValidUntil', 'ResubmissionAllowed', 'Decision', 'DecisionTimeStamp',
                'CustomerName', 'CustomerEmail', 'CustomerPhone', 'ServiceType', 'Location', 'Timeline', 'Budget', 'Rooms', 'BreakDown'
            ]
        });

        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        
        console.log('🔍 Admin/Approve - Quote data retrieved from Google Sheets:', quoteData);
        
        // ONE-TIME ENFORCEMENT: Check if already approved
        if (quoteData['AdminPersonStatus'] === 'Approved') {
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Already Approved</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">⚠️</div>
                        <h1>Quote Already Approved</h1>
                        <p>This quote has already been approved and cannot be approved again.</p>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact the system administrator.
                        </p>
                    </div>
                </body>
                </html>
            `;
            return res.status(400).send(statusPage);
        }

        const leadData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Leads',
            searchColumn: 'Lead', searchValue: quoteData['LeadID'],
            columnsToFetch: ['CustomerName', 'CustomerEmail', 'CustomerPhone', 'ServiceType', 'Area', 'Suburb', 'Rooms', 'Budget', 'Timelline', 'Specfic Details']
        });
        
        if (!leadData) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);

        // 2. Generate PDF using EXACT SAME logic as quote-submit.js (working system)
        // Use stored rooms data from quote submission, fallback to lead data
        let rooms = [];
        if (quoteData.Rooms) {
            try {
                rooms = JSON.parse(quoteData.Rooms);
            } catch (e) {
                console.log('Could not parse stored rooms data, using lead data');
                rooms = leadData.Rooms ? JSON.parse(leadData.Rooms) : [];
            }
        } else {
            rooms = leadData.Rooms ? JSON.parse(leadData.Rooms) : [];
        }
        const totalSqm = rooms.reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0);
        
        // Parse quote values using exact schema column names
        const labourRate = parseFloat(quoteData.LabourRate || 0);
        const labourHours = parseFloat(quoteData.LabourHours || 0);
        const materialsCost = parseFloat(quoteData.MaterialsCost || 0);
        const materialsQuantity = parseFloat(quoteData.MaterialsQuantity || 0);
        const travelCost = parseFloat(quoteData.TravelCost || 0);
        const travelDistance = parseFloat(quoteData.TravelDistance || 0);
        const installationCost = parseFloat(quoteData.InstallationCost || 0);
        const totalQuote = parseFloat(quoteData.TotalQuote || 0);
        
        // Use actual totals from Google Sheets (from quote submission form)
        const subtotal = parseFloat(quoteData.Subtotal || 0);
        const gst = parseFloat(quoteData.GST || 0);
        const finalTotal = parseFloat(quoteData.TotalQuote || 0);
        
        console.log('💰 Admin/Approve - Using actual totals from Google Sheets:', { 
            subtotal, gst, finalTotal, 
            totalQuote: quoteData.TotalQuote,
            subtotalRaw: quoteData.Subtotal,
            gstRaw: quoteData.GST
        });
        
        // Calculate per-room breakdown (same as quote-submit.js)
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

        // EXACT SAME data structure as quote-submit.js
        const quoteDataForPdf = {
            quoteId,
            quoteDate: new Date().toLocaleString('en-NZ', {
                timeZone: 'Pacific/Auckland',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            validUntil: quoteData.ValidUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NZ'),
            customerName: quoteData.CustomerName || leadData.CustomerName,
            customerEmail: quoteData.CustomerEmail || leadData.CustomerEmail,
            customerPhone: quoteData.CustomerPhone || leadData.CustomerPhone,
            customerAddress: quoteData.Location || `${leadData.Area || ''}, ${leadData.Suburb || ''}`.trim(),
            serviceType: quoteData.ServiceType || leadData.ServiceType,
            tradespersonName: quoteData.TradePersonName || 'Professional Tradesperson',
            tradespersonEmail: quoteData.TradePersonEmail || 'contact@kiwitrade.co.nz',
            tradespersonPhone: quoteData.TradePersonPhone || 'Contact via Kiwi Trade',
            tradespersonLicense: 'Licensed Tradesperson',
            rooms: roomsWithDetails,
            // EXACT SAME breakdown structure as quote-submit.js
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
            // EXACT SAME totals structure as quote-submit.js - using actual values from Google Sheets
            totals: {
                labour: labourRate * labourHours,
                materials: materialsCost * materialsQuantity,
                travel: travelCost * travelDistance,
                installation: installationCost,
                subtotal: subtotal,        // From Google Sheets (quote submission form)
                gst: gst,                  // From Google Sheets (quote submission form)
                final: finalTotal          // From Google Sheets (quote submission form)
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

        // 6. Send CUSTOMER-SPECIFIC quote email (different tracking journey)
        // Always CC the super admin for recordkeeping
        const customerEmailOptions = {
          to: leadData['CustomerEmail'],
          cc: process.env.ADMIN_EMAIL, // Always CC super admin
          subject: `🎯 Your Quote for ${leadData['ServiceType']} - $${finalTotal.toFixed(2)} is Ready!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Approval Badge -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    <div style="font-size: 48px; color: white;">✅</div>
                  </div>
                  <h1 style="color: #28a745; margin: 0; font-size: 32px; font-weight: bold;">Quote Approved!</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Your professional quote is ready for review</p>
                </div>

                <!-- Customer Journey Progress -->
                <div style="margin: 30px 0;">
                  <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">📋 Your Quote Journey</h3>
                  
                  <!-- Step 1: Lead Submitted -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white;">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Lead Submitted</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Your project requirements were received and processed.</p>
                    </div>
                  </div>
                  
                  <!-- Step 2: Quote Prepared -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white;">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Quote Prepared</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Professional tradesperson created your detailed quote.</p>
                    </div>
                  </div>
                  
                  <!-- Step 3: Admin Approval -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745; position: relative;">
                    <div style="position: absolute; top: 0; right: 0; background: #ffc107; color: #856404; padding: 5px 10px; font-size: 12px; font-weight: bold; border-bottom-left-radius: 8px;">JUST COMPLETED!</div>
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white;">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Quote Approved & Sent! 🎉</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Admin reviewed and approved - now ready for your decision!</p>
                    </div>
                  </div>
                  
                  <!-- Step 4: Your Decision -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #ffc107; color: #856404;">⏳</div>
                    <div>
                      <strong style="color: #856404; font-size: 16px;">Your Decision - Awaiting Response</strong>
                      <p style="margin: 5px 0 0 0; color: #856404;">Review the quote and accept or decline when ready.</p>
                    </div>
                  </div>
                </div>

                <!-- Quote Details -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #34495e; margin-top: 0;">📋 Quote Details:</h3>
                  <p><strong>Quote ID:</strong> ${quoteId}</p>
                  <p><strong>Service:</strong> ${leadData['ServiceType']}</p>
                  <p><strong>Tradesperson:</strong> ${quoteDataForPdf.tradespersonName}</p>
                  <p><strong>Total Amount:</strong> $${finalTotal.toFixed(2)}</p>
                  <p><strong>Your Budget:</strong> ${leadData['Budget'] || 'Not specified'}</p>
                  <p><strong>Timeline:</strong> ${leadData['Timelline'] || leadData['Timeline'] || 'Not specified'}</p>
                  <p><strong>Location:</strong> ${leadData['Area']}, ${leadData['Suburb']}</p>
                  <p><strong>Valid Until:</strong> ${new Date(quoteDataForPdf.validUntil).toLocaleDateString('en-NZ')}</p>
                </div>

                <!-- Quote Breakdown -->
                <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin-top: 0;">💰 Quote Breakdown:</h3>
                  <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Labour & Installation:</strong></span>
                      <span>$${quoteDataForPdf.totals.labour.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Materials & Equipment:</strong></span>
                      <span>$${quoteDataForPdf.totals.materials.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Travel & Transport:</strong></span>
                      <span>$${quoteDataForPdf.totals.travel.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Installation:</strong></span>
                      <span>$${quoteDataForPdf.totals.installation.toFixed(2)}</span>
                    </div>
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #dee2e6;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Subtotal (excl. GST):</strong></span>
                      <span>$${quoteDataForPdf.totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>GST (15%):</strong></span>
                      <span>$${quoteDataForPdf.totals.gst.toFixed(2)}</span>
                    </div>
                    <hr style="margin: 15px 0; border: none; border-top: 2px solid #007bff;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 18px; font-weight: bold; color: #007bff;">
                      <span><strong>TOTAL (incl. GST):</strong></span>
                      <span>$${quoteDataForPdf.totals.final.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Decision Buttons -->
                <div style="background-color: #e8f4f8; border-radius: 10px; padding: 25px; text-align: center; margin: 20px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">🎯 Make Your Decision</h3>
                  <p style="color: #495057; margin: 0 0 20px 0;">Review the attached PDF and choose your next step:</p>
                  
                  <div style="margin: 20px 0;">
                    <a href="${acceptLink}" style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">✅ ACCEPT QUOTE</a>
                    <a href="${declineLink}" style="display: inline-block; background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">❌ DECLINE QUOTE</a>
                  </div>
                  
                  <p style="color: #6c757d; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">Secure one-click decision buttons</p>
                </div>

                <!-- PDF Attachment Notice -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center;">
                  <h3 style="margin: 0 0 10px 0; font-size: 22px;">📎 Professional PDF Attached</h3>
                  <p style="margin: 0; font-size: 16px; opacity: 0.9;">Same detailed quote document that your tradesperson and admin received</p>
                </div>

                <!-- Online Quote Viewer -->
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h4 style="color: #495057; margin: 0 0 10px 0;">🌐 Alternative: View Online</h4>
                  <p style="margin: 0 0 15px 0; color: #6c757d;">You can also view your quote in your browser:</p>
                  <a href="${viewQuoteLink}" style="color: #007bff; word-break: break-all;">${viewQuoteLink}</a>
                </div>

                <!-- Contact Information -->
                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h4 style="color: #27ae60; margin: 0 0 10px 0;">👷‍♂️ Your Tradesperson</h4>
                  <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${quoteDataForPdf.tradespersonName}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${quoteDataForPdf.tradespersonEmail}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${quoteDataForPdf.tradespersonPhone}</p>
                  <p style="margin: 15px 0 0 0;">
                    <a href="mailto:${quoteDataForPdf.tradespersonEmail}" style="display: inline-block; background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📧 Contact Tradesperson</a>
                  </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #28a745; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    🎉 Your quote is ready - decision time!
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong> - Professional service, every time
                  </p>
                </div>

              </div>
            </div>
          `,
          attachments: [attachment]
        };
        
        await sendEmail(customerEmailOptions);
        console.log(`✅ Customer quote email sent to ${leadData['CustomerEmail']} with PDF attachment`);

        // 5. Update Sheet Status to final using correct schema column names
        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:AJ1' });
        const header = headerResponse.data.values[0];
        const updates = { 'AdminPersonStatus': 'Approved', 'CustomerStatus': 'Quote Sent' };
        let targetRow = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `Quotes!A${quoteData.rowIndex}:AJ${quoteData.rowIndex}` })).data.values[0];
        
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
