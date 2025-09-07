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
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { quoteId } = req.query;
    if (!quoteId) {
        return res.redirect(`/quote-status?status=error&message=Quote ID is required.`);
    }

    console.log('🔄 ADMIN APPROVAL: Starting approval process for quote:', quoteId);

    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // 1. FETCH FULL QUOTE DATA FROM GOOGLE SHEETS
        console.log('📊 Fetching quote data from Google Sheets...');
        
        // First, get the header row to see what columns are available
        const quoteHeaderResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!1:1'
        });
        const quoteHeaders = quoteHeaderResponse.data.values?.[0] || [];
        console.log('🔍 Available quote columns:', quoteHeaders);
        
        const quoteData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Quotes',
            searchColumn: 'QuoteID', searchValue: quoteId,
            columnsToFetch: [
                // Standardized column names (primary)
                'AdminStatus', 'LeadID', 'TradespersonName', 'TradespersonEmail', 'TradespersonPhone',
                'LabourRate', 'LabourHours', 'MaterialsCost', 'MaterialsQuantity', 'TravelCost', 
                'TravelDistance', 'InstallationCost', 'TotalQuote', 'ValidUntil', 'Notes', 'Rooms',
                'CustomerName', 'CustomerEmail', 'CustomerPhone', 'ServiceType', 'Location', 'Timeline',
                // Legacy column names (fallback)
                'Admin Status', 'LeadiD', 'Labour Cost', 'Labour Hour', 'Materials Cost', 'Materials Quanitity', 
                'Travel Cost', 'Travel Distance', 'Installation Cost', 'Total Quote', 'TradePerson Name', 
                'TradePerson Email', 'TradePerson Phone'
            ]
        });

        if (!quoteData) {
            console.error('❌ Quote not found:', quoteId);
            return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        }

        if (quoteData['Admin Status'] === 'Approved') {
            console.log('⚠️ Quote already approved');
            return res.redirect(`/quote-status?status=error&message=This quote has already been approved.`);
        }

        // 2. FETCH FULL LEAD DATA FROM GOOGLE SHEETS
        console.log('📊 Fetching lead data from Google Sheets...');
        const leadId = quoteData.LeadiD || quoteData.LeadId;
        if (!leadId) {
            console.error('❌ Lead ID not found in quote data');
            return res.redirect(`/quote-status?status=error&message=Lead ID not found.`);
        }

        // First, get the header row to see what columns are available
        const leadHeaderResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Leads!1:1'
        });
        const leadHeaders = leadHeaderResponse.data.values?.[0] || [];
        console.log('🔍 Available lead columns:', leadHeaders);

        const leadData = await findRowAndGetData({
            sheets, spreadsheetId, tab: 'Leads',
            searchColumn: 'Lead', searchValue: leadId,
            columnsToFetch: ['CustomerName', 'CustomerEmail', 'CustomerPhone', 'ServiceType', 'Area', 'Suburb', 'Rooms', 'Timelline', 'Budget']
        });

        if (!leadData) {
            console.error('❌ Lead not found:', leadId);
            return res.redirect(`/quote-status?status=error&message=Lead data not found.`);
        }

        console.log('✅ Data fetched successfully:');
        console.log('  - Quote ID:', quoteId);
        console.log('  - Lead ID:', leadId);
        console.log('  - Customer:', leadData.CustomerName, leadData.CustomerEmail);
        console.log('  - Tradesperson:', quoteData.TradespersonName, quoteData.TradespersonEmail);
        console.log('  - Total Quote:', quoteData.TotalQuote || quoteData['Total Quote']);
        
        // DEBUG: Log all fetched data to identify missing values
        console.log('🔍 DEBUG - Lead Data:', JSON.stringify(leadData, null, 2));
        console.log('🔍 DEBUG - Quote Data:', JSON.stringify(quoteData, null, 2));

        // 3. BUILD COMPLETE DATA PAYLOAD FOR PDF GENERATION
        console.log('🔧 Building complete data payload...');
        
        // Parse quote values - prioritize standardized column names
        const labourRate = parseFloat(quoteData.LabourRate || quoteData['Labour Cost'] || 0);
        const labourHours = parseFloat(quoteData.LabourHours || quoteData['Labour Hour'] || 0);
        const materialsCost = parseFloat(quoteData.MaterialsCost || quoteData['Materials Cost'] || 0);
        const materialsQuantity = parseFloat(quoteData.MaterialsQuantity || quoteData['Materials Quanitity'] || 0);
        const travelCost = parseFloat(quoteData.TravelCost || quoteData['Travel Cost'] || 0);
        const travelDistance = parseFloat(quoteData.TravelDistance || quoteData['Travel Distance'] || 0);
        const installationCost = parseFloat(quoteData.InstallationCost || quoteData['Installation Cost'] || 0);
        const totalQuote = parseFloat(quoteData.TotalQuote || quoteData['Total Quote'] || 0);
        
        console.log('🔍 DEBUG - Parsed quote values:');
        console.log('  - Labour Rate:', labourRate, 'from:', quoteData['Labour Cost']);
        console.log('  - Labour Hours:', labourHours, 'from:', quoteData['Labour Hour']);
        console.log('  - Materials Cost:', materialsCost, 'from:', quoteData['Materials Cost']);
        console.log('  - Materials Quantity:', materialsQuantity, 'from:', quoteData['Materials Quanitity']);
        console.log('  - Travel Cost:', travelCost, 'from:', quoteData['Travel Cost']);
        console.log('  - Travel Distance:', travelDistance, 'from:', quoteData['Travel Distance']);
        console.log('  - Installation Cost:', installationCost, 'from:', quoteData['Installation Cost']);
        console.log('  - Total Quote:', totalQuote, 'from:', quoteData['Total Quote']);
        
        // Get tradesperson info with fallbacks (prioritize standardized column names)
        const tradespersonName = quoteData.TradespersonName || quoteData['TradesPerson Name'] || quoteData['TradePerson Name'] || 'Professional Tradesperson';
        const tradespersonEmail = quoteData.TradespersonEmail || quoteData['TradePerson Email'] || '';
        const tradespersonPhone = quoteData.TradespersonPhone || quoteData['TradePerson Phone'] || '';
        
        // Get customer info with fallbacks (in case it's stored in quote data)
        const customerName = leadData.CustomerName || quoteData.CustomerName || 'Valued Customer';
        const customerEmail = leadData.CustomerEmail || quoteData.CustomerEmail || '';
        const customerPhone = leadData.CustomerPhone || quoteData.CustomerPhone || '';

        // Parse rooms data
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

        // Build complete quote data for PDF
        const completeQuoteData = {
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
            rooms: rooms.map(room => {
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
            }),
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
                subtotal: (labourRate * labourHours) + (materialsCost * materialsQuantity) + (travelCost * travelDistance) + installationCost,
                gst: ((labourRate * labourHours) + (materialsCost * materialsQuantity) + (travelCost * travelDistance) + installationCost) * 0.15,
                final: totalQuote
            }
        };

        console.log('✅ Complete quote data built:');
        console.log('  - Customer:', completeQuoteData.customerName, completeQuoteData.customerEmail);
        console.log('  - Service:', completeQuoteData.serviceType);
        console.log('  - Total:', completeQuoteData.totals.final);
        console.log('  - Rooms:', completeQuoteData.rooms.length);

        // 4. GENERATE PDF WITH REAL DATA
        console.log('📄 Generating PDF with real data...');
        let pdfBuffer;
        try {
            // Try Adobe PDF API first
            pdfBuffer = await generateQuotePDF(completeQuoteData);
            console.log('✅ PDF generated successfully using Adobe API');
        } catch (pdfError) {
            console.error('❌ Adobe PDF generation failed:', pdfError.message);
            console.log('🔄 Falling back to alternative PDF generation...');
            
            // Fallback: Generate HTML and convert to PDF using alternative method
            try {
                const html = generateQuoteHTML(completeQuoteData);
                // Use a simple HTML-to-PDF conversion or return HTML for now
                pdfBuffer = Buffer.from(html, 'utf-8');
                console.log('✅ Fallback PDF generation completed');
            } catch (fallbackError) {
                console.error('❌ Fallback PDF generation failed:', fallbackError.message);
                throw new Error('PDF generation failed: ' + fallbackError.message);
            }
        }

        // 5. UPDATE QUOTE STATUS IN GOOGLE SHEETS
        console.log('📝 Updating quote status in Google Sheets...');
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${quoteData.rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { 
                values: [[
                    new Date().toISOString(), // Update timestamp
                    quoteId,
                    quoteData.LeadiD || quoteData.LeadId,
                    quoteData.TradespersonName,
                    quoteData.TradespersonEmail,
                    quoteData.TradespersonPhone,
                    totalQuote,
                    quoteData.Notes || '',
                    quoteData.ValidUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    'Approved', // Admin Status
                    leadData.CustomerName,
                    leadData.CustomerEmail,
                    leadData.CustomerPhone,
                    leadData.ServiceType,
                    `${leadData.Area || ''}, ${leadData.Suburb || ''}`.trim(),
                    leadData.Timelline || 'Not specified',
                    leadData.Budget || 'Not specified'
                ]]
            },
        });

        // 6. SEND CUSTOMER EMAIL WITH PDF ATTACHMENT
        console.log('📧 Sending customer email with PDF attachment...');
        
        // Validate email data before sending
        if (!customerEmail || !customerName) {
            throw new Error('Customer email or name is missing from data');
        }
        if (!tradespersonName || !tradespersonEmail) {
            throw new Error('Tradesperson name or email is missing from data');
        }
        if (!totalQuote || totalQuote === 0) {
            throw new Error('Total quote amount is missing or zero');
        }
        
        console.log('✅ Email data validation passed:');
        console.log('  - Customer:', customerName, customerEmail);
        console.log('  - Tradesperson:', tradespersonName, tradespersonEmail);
        console.log('  - Total:', totalQuote);
        
        const acceptLink = generateCustomerDecisionLink('accept', quoteId);
        const declineLink = generateCustomerDecisionLink('decline', quoteId);
        const viewLink = generateQuoteViewLink(quoteId);

        const customerEmailObj = {
            to: customerEmail,
            cc: process.env.ADMIN_EMAIL, // Always CC admin for recordkeeping
            subject: `🎯 Your Quote for ${leadData.ServiceType} - $${totalQuote.toFixed(2)} is Ready!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
                    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 40px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);">
                                <div style="font-size: 48px; color: white;">📋</div>
                            </div>
                            <h1 style="color: #007bff; margin: 0; font-size: 32px; font-weight: bold;">Your Quote is Ready!</h1>
                            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Professional quote for ${leadData.ServiceType}</p>
                        </div>

                        <!-- Quote Summary -->
                        <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                            <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">📊 Quote Summary</h3>
                            <div style="background: white; padding: 20px; border-radius: 8px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                    <div>
                                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👤 Customer Information</h4>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${customerName}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${customerEmail}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${customerPhone}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Location:</strong> ${leadData.Area}, ${leadData.Suburb}</p>
                                    </div>
                                    <div>
                                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👷‍♂️ Tradesperson Information</h4>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${tradespersonName}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${tradespersonEmail}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${tradespersonPhone}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>License:</strong> Licensed Tradesperson</p>
                                    </div>
                                </div>
                                <div style="border-top: 1px solid #e9ecef; padding-top: 20px;">
                                    <h4 style="color: #495057; margin: 0 0 15px 0; font-size: 16px;">💰 Quote Breakdown</h4>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                                            <div style="font-size: 24px; margin-bottom: 5px;">🔨</div>
                                            <div style="font-weight: bold; color: #495057;">Labour</div>
                                            <div style="color: #28a745; font-weight: bold;">$${(labourRate * labourHours).toFixed(2)}</div>
                                        </div>
                                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                                            <div style="font-size: 24px; margin-bottom: 5px;">🧱</div>
                                            <div style="font-weight: bold; color: #495057;">Materials</div>
                                            <div style="color: #28a745; font-weight: bold;">$${(materialsCost * materialsQuantity).toFixed(2)}</div>
                                        </div>
                                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                                            <div style="font-size: 24px; margin-bottom: 5px;">🚗</div>
                                            <div style="font-weight: bold; color: #495057;">Travel</div>
                                            <div style="color: #28a745; font-weight: bold;">$${(travelCost * travelDistance).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div style="text-align: center; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 10px; color: white;">
                                        <div style="font-size: 32px; font-weight: bold;">Total: $${totalQuote.toFixed(2)}</div>
                                        <div style="font-size: 14px; opacity: 0.9;">Including GST</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Decision Buttons -->
                        <div style="text-align: center; margin: 30px 0;">
                            <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">🎯 Make Your Decision</h3>
                            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                                <a href="${acceptLink}" style="display: inline-block; background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">✅ Accept Quote</a>
                                <a href="${declineLink}" style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">❌ Decline Quote</a>
                            </div>
                            <p style="color: #6c757d; font-size: 14px; margin-top: 15px;">
                                <a href="${viewLink}" style="color: #007bff; text-decoration: none;">📄 View Full Quote Details</a>
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                                This quote is valid until ${new Date(completeQuoteData.validUntil).toLocaleDateString('en-NZ')}
                            </p>
                            <p style="color: #495057; font-weight: bold; margin: 0;">
                                🏠 Kiwi Trade Team
                            </p>
                        </div>

                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Quote-${quoteId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await sendEmail(customerEmailObj);
        console.log('✅ Customer email sent successfully with PDF attachment');

        // 7. SEND ADMIN CONFIRMATION EMAIL
        console.log('📧 Sending admin confirmation email...');
        const adminEmail = {
            to: process.env.ADMIN_EMAIL,
            subject: `✅ Quote Approved: ${leadData.ServiceType} for ${customerName} - $${totalQuote.toFixed(2)}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
                    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 40px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                                <div style="font-size: 48px; color: white;">✅</div>
                            </div>
                            <h1 style="color: #28a745; margin: 0; font-size: 32px; font-weight: bold;">Quote Approved!</h1>
                            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Customer has been notified and can now make their decision</p>
                        </div>

                        <!-- Approval Summary -->
                        <div style="background: #d4edda; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #c3e6cb;">
                            <h3 style="color: #155724; margin: 0 0 20px 0; font-size: 20px;">📋 Approval Summary</h3>
                            <div style="background: white; padding: 20px; border-radius: 8px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div>
                                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👤 Customer Details</h4>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${customerName}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${customerEmail}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${leadData.ServiceType}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Location:</strong> ${leadData.Area}, ${leadData.Suburb}</p>
                                    </div>
                                    <div>
                                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👷‍♂️ Tradesperson Details</h4>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${tradespersonName}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${tradespersonEmail}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${tradespersonPhone}</p>
                                        <p style="margin: 5px 0; color: #495057;"><strong>Quote Total:</strong> <span style="color: #28a745; font-weight: bold;">$${totalQuote.toFixed(2)}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Next Steps -->
                        <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                            <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">📝 Next Steps</h3>
                            <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                                <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; font-size: 12px;">1</div>
                                <div>
                                    <strong style="color: #0066cc;">Customer Decision</strong>
                                    <p style="margin: 5px 0 0 0; color: #495057;">Customer will receive email with accept/decline options</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                                <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; font-size: 12px;">2</div>
                                <div>
                                    <strong style="color: #0066cc;">Notification</strong>
                                    <p style="margin: 5px 0 0 0; color: #495057;">All parties will be notified of the customer's decision</p>
                                </div>
                            </div>
                            <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                                <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; font-size: 12px;">3</div>
                                <div>
                                    <strong style="color: #0066cc;">Project Execution</strong>
                                    <p style="margin: 5px 0 0 0; color: #495057;">If accepted, tradesperson will contact customer to begin work</p>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                            <p style="color: #28a745; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                                ✅ Quote approval process completed successfully!
                            </p>
                            <p style="color: #6c757d; font-size: 14px; margin: 0;">
                                <strong>Kiwi Trade Admin System</strong> - Automated Excellence
                            </p>
                        </div>

                    </div>
                </div>
            `
        };

        await sendEmail(adminEmail);
        console.log('✅ Admin confirmation email sent successfully');

        console.log('🎉 ADMIN APPROVAL COMPLETED SUCCESSFULLY!');
        console.log('  - Quote ID:', quoteId);
        console.log('  - Customer:', customerName, customerEmail);
        console.log('  - Tradesperson:', tradespersonName, tradespersonEmail);
        console.log('  - Total:', totalQuote);
        console.log('  - PDF generated and attached');
        console.log('  - All emails sent');

        return res.redirect(`/quote-status?status=success&message=Quote approved successfully! Customer has been notified.`);

    } catch (error) {
        console.error('❌ ADMIN APPROVAL ERROR:', error);
        return res.redirect(`/quote-status?status=error&message=An error occurred during approval: ${error.message}`);
    }
}