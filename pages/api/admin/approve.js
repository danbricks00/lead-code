import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { generateQuotePDF, generateQuoteHTML } from "../../../lib/pdfGenerator.js";
import { sendEmail } from '../../../lib/emailHelper';
import { getLeadById, upsertQuoteRow } from '../../../utils/sheets.js';
import { buildQuoteRow } from '../../../utils/quotes.js';
import quoteLogger from '../../../lib/quoteLogger.js';
import crypto from "crypto";

// --- Helper Functions ---
function verifyToken(id, ts) {
    const secret = process.env.QUOTE_LINK_SECRET || 'fallback-secret';
    const hmac = crypto.createHmac("sha256", secret);
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
    
    // Find the actual header row (skip empty rows at the top)
    let headerRowIndex = 0;
    let header = rows[0];
    
    // Look for a row that contains the search column
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] && rows[i].includes(searchColumn)) {
            headerRowIndex = i;
            header = rows[i];
            break;
        }
    }
    
    console.log(`🔍 Found header row at index ${headerRowIndex} for tab ${tab}`);
    console.log(`🔍 Header row:`, header);
    
    const searchColumnIndex = header.indexOf(searchColumn);
    if (searchColumnIndex === -1) {
        console.error(`❌ Column "${searchColumn}" not found in tab "${tab}". Available columns:`, header);
        throw new Error(`Column "${searchColumn}" not found in tab "${tab}".`);
    }
    
    // Look for the data row starting from after the header
    const dataRows = rows.slice(headerRowIndex + 1);
    const dataRow = dataRows.find(row => row && row[searchColumnIndex] === searchValue);
    if (!dataRow) {
        console.error(`❌ No data row found for ${searchColumn} = ${searchValue}`);
        return null;
    }
    
    const actualRowIndex = rows.indexOf(dataRow) + 1; // 1-based index for Google Sheets
    console.log(`🔍 Found data row at index ${actualRowIndex} for ${searchColumn} = ${searchValue}`);
    
    const result = {
        rowIndex: actualRowIndex
    };
    
    columnsToFetch.forEach(columnName => {
        const index = header.indexOf(columnName);
        if (index !== -1) {
            result[columnName] = dataRow[index] || '';
            console.log(`🔍 ${columnName}: "${result[columnName]}" (from column ${index})`);
        } else {
            result[columnName] = 'N/A (Column not found)';
            console.log(`❌ ${columnName}: Column not found in header`);
        }
    });
    
    return result;
}

// --- Main Handler ---
export default async function handler(req, res) {
    // Simple test to see if the endpoint is reachable at all
    console.log('🔍 [ADMIN-APPROVE] ENDPOINT HIT!', {
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
    
    const requestId = quoteLogger.generateRequestId();
    const startTime = Date.now();
    
    // Enhanced logging for debugging
    console.log('🔍 [ADMIN-APPROVE] Request received:', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
            'x-forwarded-for': req.headers['x-forwarded-for']
        },
        bodySize: req.body ? JSON.stringify(req.body).length : 0,
        timestamp: new Date().toISOString()
    });
    
    // Log incoming request details
    quoteLogger.adminAccept('Request received', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
            'x-forwarded-for': req.headers['x-forwarded-for']
        },
        bodySize: req.body ? JSON.stringify(req.body).length : 0
    }, requestId);
    
    if (req.method !== 'GET') {
        quoteLogger.error('Invalid method', null, requestId);
        quoteLogger.response('Sending 405 Method Not Allowed', { method: req.method }, requestId);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    // Enhanced token validation debugging
    const expectedToken = verifyToken(quoteId, ts);
    const tokenValid = token === expectedToken;
    
    console.log('🔍 [ADMIN-APPROVE] Token validation:', {
        quoteId,
        ts,
        receivedToken: token,
        expectedToken,
        tokenValid,
        hasSecret: !!process.env.QUOTE_LINK_SECRET
    });

    if (!quoteId || !ts || !token || !tokenValid) {
        quoteLogger.error('Invalid approval link', { 
            quoteId, 
            hasToken: !!token,
            hasTs: !!ts,
            tokenValid,
            expectedToken,
            receivedToken: token
        }, requestId);
        quoteLogger.response('Redirecting to error page - invalid approval link', null, requestId);
        return res.redirect(`/quote-status?status=error&message=Invalid approval link.`);
    }
    
    quoteLogger.adminAccept('Token validated successfully', { quoteId }, requestId);

    console.log('🔄 ADMIN APPROVAL: Starting approval process for quote:', quoteId);

    try {
        quoteLogger.sheets('Initializing Google Sheets client', null, requestId);
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. Get Quote and Lead data from Sheets using exact schema
        quoteLogger.sheets('Fetching quote data from Google Sheets', { 
            spreadsheetId: spreadsheetId.substring(0, 10) + '...', 
            quoteId 
        }, requestId);
        
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

        if (!quoteData) {
            quoteLogger.error('Quote not found in Google Sheets', { quoteId }, requestId);
            quoteLogger.response('Redirecting to error page - quote not found', null, requestId);
            return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        }

        // Check if quote is already processed
        if (quoteData.AdminPersonStatus === 'Approved') {
            quoteLogger.adminAccept('Quote already approved', { quoteId }, requestId);
            return res.redirect(`/quote-status?status=info&message=Quote ${quoteId} has already been approved.`);
        }
        
        if (quoteData.AdminPersonStatus === 'Declined') {
            quoteLogger.adminAccept('Quote already declined', { quoteId }, requestId);
            return res.redirect(`/quote-status?status=info&message=Quote ${quoteId} has already been declined.`);
        }
        
        quoteLogger.dataFlow('Quote data retrieved from Google Sheets', {
            quoteId,
            adminStatus: quoteData['AdminPersonStatus'],
            leadId: quoteData['LeadID'],
            customerName: quoteData['CustomerName'],
            totalQuote: quoteData['TotalQuote']
        }, requestId);
        
        // ONE-TIME ENFORCEMENT: Check if already approved
        if (quoteData['AdminPersonStatus'] === 'Approved') {
            quoteLogger.adminAccept('Quote already approved - preventing duplicate', { 
                quoteId,
                adminStatus: quoteData['AdminPersonStatus']
            }, requestId);
            
            quoteLogger.response('Sending already approved page', { 
                quoteId,
                processingTime: Date.now() - startTime
            }, requestId);
            
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
            tradespersonName: quoteData.TradePersonName || '',
            tradespersonEmail: quoteData.TradePersonEmail || '',
            tradespersonPhone: quoteData.TradePersonPhone || '',
            tradespersonLicense: '',
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
            // Try Adobe PDF API first
            pdfBuffer = await generateQuotePDF(quoteDataForPdf);
            console.log('✅ PDF generated successfully using Adobe API');
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

        // 6. SEND CUSTOMER EMAIL WITH PDF ATTACHMENT
        console.log('📧 Sending customer email with PDF attachment...');
        
        // Validate email data before sending
        const customerEmail = leadData['CustomerEmail'];
        const customerName = leadData['CustomerName'];
        const tradespersonName = quoteData['TradePersonName'];
        const tradespersonEmail = quoteData['TradePersonEmail'];
        const totalQuoteAmount = parseFloat(quoteData['TotalQuote'] || 0);
        
        if (!customerEmail || !customerName) {
            throw new Error('Customer email or name is missing from data');
        }
        if (!tradespersonName || !tradespersonEmail) {
            throw new Error('Tradesperson name or email is missing from data');
        }
        if (!totalQuoteAmount || totalQuoteAmount === 0) {
            throw new Error('Total quote amount is missing or zero');
        }
        
        console.log('✅ Email data validation passed:');
        console.log('  - Customer:', customerName, customerEmail);
        console.log('  - Tradesperson:', tradespersonName, tradespersonEmail);
        console.log('  - Total:', totalQuoteAmount);
        
        const acceptLink = generateCustomerDecisionLink('accept', quoteId);
        const declineLink = generateCustomerDecisionLink('decline', quoteId);
        const viewLink = generateQuoteViewLink(quoteId);

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
                  <a href="${viewLink}" style="color: #007bff; word-break: break-all;">${viewLink}</a>
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
        
        quoteLogger.email('Sending customer quote email', { 
            to: customerEmailOptions.to,
            subject: customerEmailOptions.subject,
            hasAttachment: !!customerEmailOptions.attachments
        }, requestId);
        
        await sendEmail(customerEmailOptions);
        quoteLogger.email('Customer quote email sent successfully', { 
            customerEmail: leadData['CustomerEmail'],
            hasAttachment: !!customerEmailOptions.attachments
        }, requestId);

        // 5. Update Sheet Status to final using correct schema column names
        quoteLogger.sheets('Updating Google Sheets with approval status', { quoteId }, requestId);
        
        const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Quotes!A1:AJ1' });
        const header = headerResponse.data.values[0];
        // Use new unified system for approval
        const lead = await getLeadById(quoteData.LeadID);
        if (!lead) {
            throw new Error('Lead not found for approval');
        }

        const approvedRow = buildQuoteRow({
            lead,
            quoteId: quoteData.QuoteID,
            tradePersonName: quoteData.TradePersonName || '',
            tradePersonEmail: quoteData.TradePersonEmail || '',
            tradePersonPhone: quoteData.TradePersonPhone || '',
            body: {
                labourRate: quoteData.LabourRate || '',
                labourHours: quoteData.LabourHours || '',
                labourTotal: quoteData.LabourTotal || '',
                materialsCost: quoteData.MaterialsCost || '',
                materialsQuantity: quoteData.MaterialsQuantity || '',
                materialsTotal: quoteData.MaterialsTotal || '',
                travelCost: quoteData.TravelCost || '',
                travelDistance: quoteData.TravelDistance || '',
                travelTotal: quoteData.TravelTotal || '',
                installationCost: quoteData.InstallationCost || '',
                subtotal: quoteData.Subtotal || '',
                gst: quoteData.GST || '',
                totalQuote: quoteData.TotalQuote || '',
                notes: quoteData.Notes || '',
                validUntil: quoteData.ValidUntil || ''
            },
            mode: 'accepted'
        });

        // Override with admin approval status
        approvedRow.AdminPersonStatus = 'Approved';
        approvedRow.CustomerStatus = 'Quote Sent';
        approvedRow.Decison = 'Admin Approved';

        quoteLogger.dataFlow('Preparing Google Sheets update with unified system', { 
            quoteId: quoteData.QuoteID,
            leadId: quoteData.LeadID
        }, requestId);

        const result = await upsertQuoteRow(quoteData.QuoteID, approvedRow, { req, caller: 'admin-approve' });
        
        quoteLogger.sheets('Google Sheets updated with approval status', null, requestId);

        // Send approval notification emails (if enabled)
        if (process.env.ENABLE_APPROVE_DECLINE_EMAILS === 'true') {
            try {
                // Send customer the approved quote with PDF attachment
                const customerQuoteEmail = {
                    to: leadData['CustomerEmail'],
                    subject: `✅ Your Quote is Ready - ${leadData['ServiceType']} for ${leadData['CustomerName']}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                
                                <!-- Header -->
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #28a745; margin: 0; font-size: 28px;">✅ Your Quote is Ready!</h1>
                                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Professional quote approved and ready for your project</p>
                                </div>

                                <!-- Quote Summary -->
                                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="color: #27ae60; margin: 0 0 15px 0;">📋 Quote Summary</h3>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Quote ID:</strong> ${quoteData.QuoteID}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${leadData['ServiceType']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Location:</strong> ${leadData['Area']}, ${leadData['Suburb']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Total Quote:</strong> $${quoteData.TotalQuote}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Valid Until:</strong> ${quoteData.ValidUntil}</p>
                                </div>

                                <!-- Decision Buttons -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <h3 style="color: #495057; margin: 0 0 20px 0;">Make Your Decision</h3>
                                    <div style="margin: 20px 0;">
                                        <a href="${generateCustomerDecisionLink('accept', quoteData.QuoteID)}" style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">✅ ACCEPT QUOTE</a>
                                        <a href="${generateCustomerDecisionLink('decline', quoteData.QuoteID)}" style="display: inline-block; background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">❌ DECLINE QUOTE</a>
                                    </div>
                                    <p style="color: #6c757d; font-size: 14px; margin: 15px 0 0 0; font-style: italic;">Secure one-click decision buttons</p>
                                </div>

                                <!-- PDF Attachment Notice -->
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center;">
                                    <h3 style="margin: 0 0 10px 0; font-size: 22px;">📎 Professional PDF Attached</h3>
                                    <p style="margin: 0; font-size: 16px; opacity: 0.9;">Detailed quote document with all pricing breakdowns</p>
                                </div>

                                <!-- Tradesperson Contact -->
                                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h4 style="color: #27ae60; margin: 0 0 10px 0;">👷‍♂️ Your Tradesperson</h4>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${quoteData.TradePersonName}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${quoteData.TradePersonEmail}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${quoteData.TradePersonPhone}</p>
                                    <p style="margin: 15px 0 0 0;">
                                        <a href="mailto:${quoteData.TradePersonEmail}" style="display: inline-block; background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📧 Contact Tradesperson</a>
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
                await sendEmail(customerQuoteEmail);

                // Send tradesperson notification email
                const tradespersonApprovalEmail = {
                    to: quoteData.TradePersonEmail,
                    subject: `✅ Quote Approved - ${leadData['ServiceType']} for ${leadData['CustomerName']}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #28a745; margin: 0; font-size: 28px;">✅ Quote Approved!</h1>
                                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin has approved your quote</p>
                                </div>
                                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="color: #27ae60; margin: 0 0 10px 0;">Customer Details</h3>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${leadData['CustomerName']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${leadData['CustomerEmail']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${leadData['CustomerPhone']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${leadData['ServiceType']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Total:</strong> $${quoteData.TotalQuote}</p>
                                </div>
                                <div style="text-align: center; margin-top: 30px;">
                                    <p style="color: #28a745; font-size: 16px; font-weight: bold;">🎉 You can now proceed with the project!</p>
                                </div>
                            </div>
                        </div>
                    `
                };
                await sendEmail(tradespersonApprovalEmail);

                // Send admin confirmation email
                const adminConfirmationEmail = {
                    to: process.env.ADMIN_EMAIL,
                    subject: `✅ Quote ${quoteData.QuoteID} Approved - Confirmation`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #28a745; margin: 0; font-size: 28px;">✅ Quote Approved</h1>
                                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin approval confirmation</p>
                                </div>
                                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="color: #27ae60; margin: 0 0 10px 0;">Quote Details</h3>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Quote ID:</strong> ${quoteData.QuoteID}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Customer:</strong> ${leadData['CustomerName']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${leadData['ServiceType']}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Tradesperson:</strong> ${quoteData.TradePersonName}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Total:</strong> $${quoteData.TotalQuote}</p>
                                </div>
                                <div style="text-align: center; margin-top: 30px;">
                                    <p style="color: #28a745; font-size: 16px; font-weight: bold;">✅ Approval emails sent to customer and tradesperson</p>
                                </div>
                            </div>
                        </div>
                    `
                };
                await sendEmail(adminConfirmationEmail);

                console.log(JSON.stringify({ tag: 'QUOTE_APPROVED_EMAILS_SENT', quoteId: quoteData.QuoteID }));
                quoteLogger.email('Approval notification emails sent successfully', { quoteId: quoteData.QuoteID }, requestId);
            } catch (emailError) {
                console.error(JSON.stringify({ tag: 'QUOTE_APPROVED_EMAILS_FAIL', quoteId: quoteData.QuoteID, error: String(emailError?.message || emailError) }));
                quoteLogger.error('Failed to send approval notification emails', { quoteId: quoteData.QuoteID, error: emailError }, requestId);
            }
        } else {
            console.log(JSON.stringify({ tag: 'QUOTE_APPROVED_EMAILS_SKIPPED', quoteId: quoteData.QuoteID, reason: 'env flag off' }));
            quoteLogger.email('Approval notification emails skipped', { quoteId: quoteData.QuoteID, reason: 'ENABLE_APPROVE_DECLINE_EMAILS not set' }, requestId);
        }
        
        quoteLogger.response('Redirecting to success page', { 
            quoteId,
            processingTime: Date.now() - startTime
        }, requestId);
        
        return res.redirect(`/quote-status?status=success&message=Quote approved and sent to the customer!`);

    } catch (error) {
        quoteLogger.error('Quote approval error', error, requestId);
        quoteLogger.response('Redirecting to error page', { 
            error: error.message,
            processingTime: Date.now() - startTime
        }, requestId);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred during quote approval.`);
    }
}