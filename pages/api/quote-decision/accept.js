import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { sendEmail } from '../../../lib/emailHelper';
import { generateQuotePDF } from '../../../lib/pdfGenerator.js';
import quoteLogger from '../../../lib/quoteLogger.js';
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

function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function formatTimestamp(isoString) {
    if (!isoString) return 'an unknown time';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('en-NZ', {
            timeZone: 'Pacific/Auckland',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return isoString;
    }
}

async function sendNotificationEmails(quoteData, leadData = {}, requestId = null) {
    quoteLogger.email('Preparing notification emails for quote acceptance', {
        quoteDataKeys: Object.keys(quoteData),
        leadDataKeys: Object.keys(leadData)
    }, requestId);
    
    // Get customer email - using exact schema column names
    const customerEmail = quoteData['CustomerEmail'] || leadData['CustomerEmail'];
    const customerName = quoteData['CustomerName'] || leadData['CustomerName'];
    
    // Get tradesperson email - using exact schema column names
    const tradespersonEmail = quoteData['TradePersonEmail'];
    const tradespersonName = quoteData['TradePersonName'];
    
    // Get other fields from exact schema
    const serviceType = quoteData['ServiceType'] || leadData['ServiceType'] || '';
    const budget = quoteData['Budget'] || leadData['Budget'] || '';
    const timeline = quoteData['Timeline'] || leadData['Timelline'] || leadData['Timeline'] || '';
    const validUntil = quoteData['ValidUntil'] || 'N/A';
    
    quoteLogger.email('Email recipients identified', {
        customerEmail,
        tradespersonEmail,
        adminEmail: process.env.ADMIN_EMAIL ? 'SET' : 'NOT_SET'
    }, requestId);

    // Validate email addresses
    if (!customerEmail || customerEmail === 'undefined' || customerEmail === 'N/A (Column not found)') {
        quoteLogger.error('Customer email not found in quote or lead data', { customerEmail }, requestId);
        throw new Error('Customer email not found');
    }
    if (!tradespersonEmail || tradespersonEmail === 'undefined' || tradespersonEmail === 'N/A (Column not found)') {
        quoteLogger.error('Tradesperson email not found in quote data', { tradespersonEmail }, requestId);
        throw new Error('Tradesperson email not found');
    }

    // Build finalQuoteData for PDF generation using ACTUAL quote data from Google Sheets
    const finalQuoteData = {
        quoteId: quoteData['QuoteID'],
        quoteDate: quoteData['TimeStamp'] || getNZTimestamp(),
        validUntil: validUntil,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: quoteData['CustomerPhone'] || '',
        customerAddress: quoteData['Location'] || `${leadData['Area'] || ''} ${leadData['Suburb'] || ''}`.trim(),
        serviceType: serviceType,
        tradespersonName: tradespersonName || '',
        tradespersonEmail: tradespersonEmail || '',
        tradespersonPhone: quoteData['TradePersonPhone'] || '',
        tradespersonLicense: '',
        rooms: [],
        breakdown: {
            labourRate: parseFloat(quoteData['LabourRate'] || 0),
            labourHours: parseFloat(quoteData['LabourHours'] || 0),
            labourTotal: parseFloat(quoteData['LabourTotal'] || 0),
            materialsCost: parseFloat(quoteData['MaterialsCost'] || 0),
            materialsQuantity: parseFloat(quoteData['MaterialsQuantity'] || 0),
            materialsTotal: parseFloat(quoteData['MaterialsTotal'] || 0),
            travelCost: parseFloat(quoteData['TravelCost'] || 0),
            travelDistance: parseFloat(quoteData['TravelDistance'] || 0),
            travelTotal: parseFloat(quoteData['TravelTotal'] || 0),
            installationCost: parseFloat(quoteData['InstallationCost'] || 0),
            totalSqm: 0
        },
        totals: {
            labour: parseFloat(quoteData['LabourTotal'] || 0),
            materials: parseFloat(quoteData['MaterialsTotal'] || 0),
            travel: parseFloat(quoteData['TravelTotal'] || 0),
            installation: parseFloat(quoteData['InstallationCost'] || 0),
            subtotal: parseFloat(quoteData['Subtotal'] || 0),
            gst: parseFloat(quoteData['GST'] || 0),
            final: parseFloat(quoteData['TotalQuote'] || 0)
        }
    };

    // Parse rooms data if available
    try {
        const roomsData = quoteData['Rooms'] || leadData['Rooms'];
        if (roomsData) {
            const parsedRooms = JSON.parse(roomsData);
            if (Array.isArray(parsedRooms)) {
                finalQuoteData.rooms = parsedRooms;
                finalQuoteData.breakdown.totalSqm = parsedRooms.reduce((total, room) => total + (parseFloat(room.sqm) || 0), 0);
            }
        }
    } catch (error) {
        console.log('⚠️ Could not parse rooms data:', error.message);
    }

    quoteLogger.dataFlow('Final quote data prepared for PDF generation', {
        quoteId: finalQuoteData.quoteId,
        customerName: finalQuoteData.customerName,
        totalAmount: finalQuoteData.totals.final,
        hasRooms: finalQuoteData.rooms.length > 0
    }, requestId);

    // Generate PDF using the same function as admin/tradesman
    let pdfBuffer;
    try {
        quoteLogger.pdf('Generating PDF for customer', { quoteId: finalQuoteData.quoteId }, requestId);
        pdfBuffer = await generateQuotePDF(finalQuoteData);
        quoteLogger.pdf('PDF generated successfully for customer', { 
            quoteId: finalQuoteData.quoteId,
            pdfSize: pdfBuffer ? pdfBuffer.length : 0
        }, requestId);
    } catch (error) {
        quoteLogger.error('PDF generation failed', error, requestId);
        throw new Error('Failed to generate PDF');
    }

    // Format currency for display
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NZ', {
            style: 'currency',
            currency: 'NZD'
        }).format(amount || 0);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-NZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const customerMail = {
        to: customerEmail,
        cc: process.env.ADMIN_EMAIL,
        subject: `🎉 Quote Accepted! Your ${finalQuoteData.serviceType} Project Journey Begins`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Achievement Badge -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    <div style="font-size: 48px; color: white;">🏆</div>
                  </div>
                  <h1 style="color: #28a745; margin: 0; font-size: 32px; font-weight: bold;">Project Approved!</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Congratulations ${finalQuoteData.customerName}, your ${finalQuoteData.serviceType} quote has been accepted!</p>
                </div>

                <!-- Quote Summary Card -->
                <div style="background: #e8f4f8; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">📋 Your Approved Quote Summary</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                      <div>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Service:</strong> ${finalQuoteData.serviceType}</p>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Budget:</strong> ${budget || 'Not specified'}</p>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
                      </div>
                      <div>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Tradesperson:</strong> ${finalQuoteData.tradespersonName}</p>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Valid Until:</strong> ${formatDate(finalQuoteData.validUntil)}</p>
                        <p style="margin: 8px 0; color: #28a745; font-size: 18px; font-weight: bold;"><strong>Total Quote:</strong> ${formatCurrency(finalQuoteData.totals.final)}</p>
                      </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                      <p style="color: #6c757d; font-size: 14px; margin: 0;">📎 Your detailed quote PDF is attached to this email</p>
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div style="margin: 30px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #495057;">Project Progress</span>
                    <span style="font-weight: bold; color: #28a745; font-size: 18px;">100% Complete!</span>
                  </div>
                  <div style="background: #e9ecef; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
                    <div style="background: linear-gradient(90deg, #28a745 0%, #20c997 100%); height: 100%; width: 100%; border-radius: 6px; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);"></div>
                  </div>
                </div>

                <!-- What Happens Next -->
                <div style="background: #e8f4f8; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">📞 What Happens Next?</h3>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
                    <div>
                      <strong style="color: #0066cc;">Tradesperson Contact (Within 24 hours)</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">${finalQuoteData.tradespersonName} will call you to discuss project details and scheduling.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
                    <div>
                      <strong style="color: #0066cc;">Project Planning Session</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Review final details, materials, and timeline for your ${finalQuoteData.serviceType} installation.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
                    <div>
                      <strong style="color: #0066cc;">Project Execution</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Professional installation begins according to your agreed schedule.</p>
                    </div>
                  </div>
                </div>

                <!-- Quick Contact Card -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border: 1px solid #dee2e6; margin: 30px 0;">
                  <h4 style="color: #495057; margin: 0 0 15px 0;">👷‍♂️ Your Assigned Tradesperson</h4>
                  <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${finalQuoteData.tradespersonName}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${finalQuoteData.tradespersonEmail}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${finalQuoteData.tradespersonPhone}</p>
                  <p style="margin: 15px 0 0 0;">
                    <a href="mailto:${finalQuoteData.tradespersonEmail}" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📧 Send Message</a>
                  </p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                    Questions about your project? We're here to help!
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
                filename: `Quote-${finalQuoteData.quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    const tradespersonMail = {
        to: tradespersonEmail,
        subject: `🏆 Victory! ${customerName} Accepted Your Quote - Level Up!`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Victory Animation -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);">
                    <div style="font-size: 48px; color: white;">🏆</div>
                  </div>
                  <h1 style="color: #ff6b35; margin: 0; font-size: 32px; font-weight: bold;">Victory!</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Quote accepted by ${customerName} - You're a champion!</p>
                </div>

                <!-- Progress Achievement -->
                <div style="margin: 30px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #495057;">Lead Journey Progress</span>
                    <span style="font-weight: bold; color: #28a745; font-size: 18px;">🎯 MISSION COMPLETE!</span>
                  </div>
                  <div style="background: #e9ecef; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
                    <div style="background: linear-gradient(90deg, #28a745 0%, #20c997 100%); height: 100%; width: 100%; border-radius: 6px; box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);"></div>
                  </div>
                </div>

                <!-- Customer Details Card -->
                <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #ffeaa7;">
                  <h3 style="color: #856404; margin: 0 0 20px 0; font-size: 20px;">👤 Your New Customer</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Customer:</strong> ${customerName}</p>
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Email:</strong> ${customerEmail}</p>
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ ACCEPTED & READY TO PROCEED</span></p>
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Decision Date:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT</p>
                  </div>
                </div>

                <!-- Action Plan -->
                <div style="background: #e8f4f8; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">🚀 Your Action Plan (Next 24 Hours)</h3>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
                    <div>
                      <strong style="color: #0066cc;">Contact Customer (URGENT - Within 2 hours)</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Strike while the iron is hot! Call ${customerName} to express gratitude and discuss next steps.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
                    <div>
                      <strong style="color: #0066cc;">Schedule Site Planning Meeting</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Arrange a convenient time to review project details, timeline, and materials.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
                    <div>
                      <strong style="color: #0066cc;">Begin Project Preparation</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Order materials, schedule team, and prepare for a successful installation.</p>
                    </div>
                  </div>
                </div>

                <!-- Quick Contact Buttons -->
                <div style="text-align: center; margin: 30px 0;">
                  <h4 style="color: #495057; margin: 0 0 20px 0;">📞 Quick Contact Options</h4>
                  <div style="margin: 15px 0;">
                    <a href="mailto:${customerEmail}" style="display: inline-block; background: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">📧 Send Email</a>
                    <a href="mailto:${customerEmail}?subject=Congratulations on your quote acceptance!&body=Hi ${customerName},%0D%0A%0D%0AThank you for accepting my quote! I'm excited to work with you on this project.%0D%0A%0D%0ANext steps:%0D%0A- Schedule planning meeting%0D%0A- Review final details%0D%0A- Begin project preparation%0D%0A%0D%0ABest regards" style="display: inline-block; background: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">📝 Quick Thank You</a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #28a745; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    🎉 Congratulations on winning this lead!
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong> - Your success is our success
                  </p>
                </div>

              </div>
            </div>
        `
    };
    
    const adminMail = {
        to: process.env.ADMIN_EMAIL,
        subject: `🎯 Success Metrics: Quote Accepted by ${customerName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Success Metrics -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);">
                    <div style="font-size: 48px; color: white;">📊</div>
                  </div>
                  <h1 style="color: #3498db; margin: 0; font-size: 32px; font-weight: bold;">Success Metrics</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Quote acceptance recorded - Business growing!</p>
                </div>

                <!-- Transaction Details -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">📋 Transaction Details</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                      <div>
                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👤 Customer Information</h4>
                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${customerName}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${customerEmail}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ CONVERTED</span></p>
                      </div>
                      <div>
                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👷‍♂️ Tradesperson Information</h4>
                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${tradespersonName}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${tradespersonEmail}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Performance:</strong> <span style="color: #28a745; font-weight: bold;">🏆 WIN</span></p>
                      </div>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 5px 0; color: #495057;"><strong>Decision Timestamp:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT</p>
                      <p style="margin: 5px 0; color: #495057;"><strong>Project Status:</strong> <span style="color: #ffc107; font-weight: bold;">🔄 Moving to Execution Phase</span></p>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #3498db; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    📊 Business Growing - Lead Conversion Successful!
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Admin System</strong> - Automated Excellence
                  </p>
                </div>

              </div>
            </div>
        `
    };

    try {
        quoteLogger.email('Sending customer confirmation email', { 
            to: customerMail.to,
            subject: customerMail.subject
        }, requestId);
        await sendEmail(customerMail);
        quoteLogger.email('Customer email sent successfully', null, requestId);
        
        quoteLogger.email('Sending tradesperson notification email', { 
            to: tradespersonMail.to,
            subject: tradespersonMail.subject
        }, requestId);
        await sendEmail(tradespersonMail);
        quoteLogger.email('Tradesperson email sent successfully', null, requestId);
        
        quoteLogger.email('Sending admin notification email', { 
            to: adminMail.to,
            subject: adminMail.subject
        }, requestId);
        await sendEmail(adminMail);
        quoteLogger.email('Admin email sent successfully', null, requestId);
        
        quoteLogger.email('All notification emails sent successfully', null, requestId);
    } catch (error) {
        quoteLogger.error('Error sending notification emails', error, requestId);
        throw error;
    }
}

export default async function handler(req, res) {
    const requestId = quoteLogger.generateRequestId();
    const startTime = Date.now();
    
    // Log incoming request details
    quoteLogger.apiAccept('Request received', {
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

    if (!quoteId || !ts || !token) {
        quoteLogger.error('Missing required parameters', { quoteId, ts, token }, requestId);
        quoteLogger.response('Redirecting to error page - missing parameters', null, requestId);
        return res.redirect(`/quote-status?status=error&message=Missing required parameters.`);
    }

    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        quoteLogger.error('Invalid token', { 
            providedToken: token.substring(0, 10) + '...', 
            expectedToken: expectedToken.substring(0, 10) + '...' 
        }, requestId);
        quoteLogger.response('Redirecting to error page - invalid token', null, requestId);
        return res.redirect(`/quote-status?status=error&message=Invalid or expired link.`);
    }
    
    quoteLogger.customerAccept('Token validated successfully', { quoteId }, requestId);
    
    try {
        quoteLogger.sheets('Initializing Google Sheets client', null, requestId);
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        const range = 'Quotes!A:AJ';

        quoteLogger.sheets('Fetching quote data from Google Sheets', { 
            spreadsheetId: spreadsheetId.substring(0, 10) + '...', 
            range 
        }, requestId);

        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        if (!rows) {
            quoteLogger.error('Could not connect to Google Sheets', null, requestId);
            quoteLogger.response('Redirecting to error page - database connection failed', null, requestId);
            return res.redirect(`/quote-status?status=error&message=Could not connect to the database.`);
        }
        
        quoteLogger.sheets('Google Sheets data retrieved', { 
            totalRows: rows.length,
            hasHeader: rows.length > 0 
        }, requestId);
        
        const header = rows[0];
        const rowIndex = rows.findIndex(row => row[1] === quoteId); // QuoteID is in column B (index 1)

        if (rowIndex === -1) {
            quoteLogger.error('Quote ID not found in Google Sheets', { 
                quoteId, 
                searchedRows: rows.length - 1,
                availableQuoteIds: rows.slice(1).map(row => row[1]).filter(id => id)
            }, requestId);
            quoteLogger.response('Redirecting to error page - quote not found', null, requestId);
            return res.redirect(`/quote-status?status=error&message=Quote ID not found.`);
        }
        
        quoteLogger.sheets('Quote found in Google Sheets', { 
            quoteId, 
            rowIndex: rowIndex + 1,
            totalColumns: header.length
        }, requestId);
        
        const targetRow = rows[rowIndex];
        
        // Get lead ID to fetch customer information (LeadID is in column C, index 2)
        const leadId = targetRow[2] || null;
        
        quoteLogger.dataFlow('Quote row data extracted', {
            quoteId,
            leadId,
            rowLength: targetRow.length,
            hasLeadId: !!leadId
        }, requestId);
        
        // Fetch lead data to get customer information
        let leadData = {};
        if (leadId) {
            try {
                quoteLogger.sheets('Fetching lead data', { leadId }, requestId);
                const leadResponse = await sheets.spreadsheets.values.get({ 
                    spreadsheetId, 
                    range: 'Leads!A:Z' 
                });
                const leadRows = leadResponse.data.values;
                if (leadRows) {
                    const leadHeader = leadRows[0];
                    const leadRowIndex = leadRows.findIndex(row => row[0] === leadId);
                    if (leadRowIndex !== -1) {
                        const leadRow = leadRows[leadRowIndex];
                        leadHeader.forEach((headerName, index) => {
                            leadData[headerName] = leadRow[index] || '';
                        });
                        quoteLogger.sheets('Lead data retrieved successfully', { 
                            leadId, 
                            leadRowIndex: leadRowIndex + 1,
                            leadDataKeys: Object.keys(leadData)
                        }, requestId);
                    } else {
                        quoteLogger.error('Lead ID not found in Leads sheet', { leadId }, requestId);
                    }
                }
            } catch (leadError) {
                quoteLogger.error('Could not fetch lead data', leadError, requestId);
            }
        } else {
            quoteLogger.info('No lead ID found in quote data', null, requestId);
        }
        
        // Check for existing decision and expiry using correct schema column names
        const decisionIndex = header.indexOf('Decision');
        const decisionTimestampIndex = header.indexOf('DecisionTimestamp');
        const validUntilIndex = header.indexOf('ValidUntil');
        
        const currentDecision = decisionIndex !== -1 ? targetRow[decisionIndex] : '';
        const currentDecisionTimestamp = decisionTimestampIndex !== -1 ? targetRow[decisionTimestampIndex] : '';
        const validUntil = validUntilIndex !== -1 ? targetRow[validUntilIndex] : '';
        
        quoteLogger.dataFlow('Decision and expiry data extracted', {
            currentDecision,
            currentDecisionTimestamp,
            validUntil,
            decisionIndex,
            decisionTimestampIndex,
            validUntilIndex
        }, requestId);
        
        // Check if quote has been rejected
        const statusIndex = header.indexOf('Status');
        const quoteStatus = statusIndex !== -1 ? targetRow[statusIndex] : '';
        
        if (quoteStatus === 'Rejected') {
            quoteLogger.customerAccept('Quote rejected - preventing acceptance', { 
                quoteId, 
                status: quoteStatus 
            }, requestId);
            
            const rejectionPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Not Available - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Not Available</h1>
                    <div class="error">
                        <h2>Sorry, this quote is no longer available.</h2>
                        <p>This quote has been rejected and is no longer valid.</p>
                        <p>If you have any questions, please contact us directly.</p>
                    </div>
                    <div class="info">
                        <p>Contact us for assistance:</p>
                        <p>Email: info@kiwitrade.co.nz<br>Phone: 0800 KIWI TRADE</p>
                    </div>
                </body>
                </html>
            `;
            
            quoteLogger.response('Sending rejection page', { 
                quoteId, 
                processingTime: Date.now() - startTime 
            }, requestId);
            return res.status(400).send(rejectionPage);
        }

        // Check if quote has expired
        let isExpired = false;
        if (validUntil) {
            try {
                const validUntilDate = new Date(validUntil);
                const now = new Date();
                isExpired = validUntilDate < now;
                quoteLogger.dataFlow('Expiry check completed', {
                    validUntil,
                    validUntilDate: validUntilDate.toISOString(),
                    now: now.toISOString(),
                    isExpired
                }, requestId);
            } catch (error) {
                quoteLogger.error('Could not parse ValidUntil date', error, requestId);
            }
        } else {
            quoteLogger.info('No ValidUntil date found', null, requestId);
        }
        
        // EXPIRY LOCK LOGIC
        if (isExpired) {
            quoteLogger.customerAccept('Quote expired - processing expiry logic', { 
                validUntil, 
                currentDecision 
            }, requestId);
            
            // If quote expired and no decision made yet, lock it as "Expired"
            if (!currentDecision || currentDecision.trim() === '') {
                quoteLogger.sheets('Locking expired quote as "Expired"', { quoteId }, requestId);
                
                // Update the sheet to mark as expired
                const updateData = {
                    'Decision': 'Expired',
                    'DecisionTimestamp': getNZTimestamp(new Date()),
                };
                
                const quoteDataForUpdate = {};
                header.forEach((headerName, index) => {
                    quoteDataForUpdate[headerName] = targetRow[index] || '';
                    if (updateData[headerName] !== undefined) {
                        targetRow[index] = updateData[headerName];
                        quoteDataForUpdate[headerName] = updateData[headerName];
                    }
                });
                
                quoteLogger.sheets('Updating Google Sheets with expired status', { 
                    updateData,
                    rowIndex: rowIndex + 1
                }, requestId);
                
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `Quotes!A${rowIndex + 1}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [targetRow] },
                });
                
                quoteLogger.sheets('Google Sheets updated with expired status', null, requestId);
            }
            
            // Always return expired page (whether just locked or already expired)
            quoteLogger.response('Sending expired quote page', { 
                validUntil, 
                currentDecision,
                processingTime: Date.now() - startTime
            }, requestId);
            
            const expiredPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Expired</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .expiry-info { background: #f8d7da; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0; }
                        .expiry-status { color: #721c24; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">❌</div>
                        <h1>Quote Expired</h1>
                        <p>This quote expired on ${validUntil}.</p>
                        <div class="expiry-info">
                            <div class="expiry-status">Quote Status: Expired</div>
                            <div class="timestamp">Expired on: ${validUntil}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            Please contact us again via the website to request a new quote.
                        </p>
                    </div>
                </body>
                </html>
            `;
            
            return res.status(200).send(expiredPage);
        }
        
        // DECISION LOCK LOGIC (for valid quotes)
        // Allow customer to accept even if admin pre-approved, but prevent if already accepted/declined by customer
        if (currentDecision && currentDecision.trim() !== '' && currentDecision !== 'Admin Approved') {
            const formattedTime = formatTimestamp(currentDecisionTimestamp);
            quoteLogger.customerAccept('Decision already made - preventing duplicate', { 
                currentDecision, 
                formattedTime,
                quoteId
            }, requestId);
            
            // Return user-friendly HTML page for already-made decision
            quoteLogger.response('Sending already-made decision page', { 
                currentDecision,
                formattedTime,
                processingTime: Date.now() - startTime
            }, requestId);
            
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Decision Already Made</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #ffc107; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .decision-info { background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0; }
                        .decision-status { color: #856404; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">⚠️</div>
                        <h1>Quote Decision Already Made</h1>
                        <p>You already chose ${currentDecision} on ${formattedTime}.</p>
                        <div class="decision-info">
                            <div class="decision-status">Decision: ${currentDecision}</div>
                            <div class="timestamp">Made on: ${formattedTime}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
            `;
            
            return res.status(200).send(statusPage);
        }
        
        // --- Update Sheet Data using correct schema column names ---
        quoteLogger.customerAccept('Processing quote acceptance', { quoteId }, requestId);
        
        const nzTimestamp = getNZTimestamp();
        const updateData = {
            'Decision': 'Accepted',
            'DecisionTimestamp': nzTimestamp,
        };

        quoteLogger.dataFlow('Preparing Google Sheets update', { 
            updateData,
            rowIndex: rowIndex + 1
        }, requestId);

        const quoteDataForEmail = {};
        header.forEach((headerName, index) => {
            quoteDataForEmail[headerName] = targetRow[index] || '';
        });

        quoteLogger.sheets('Updating Google Sheets with acceptance', { 
            updateData,
            rowIndex: rowIndex + 1,
            quoteDataKeys: Object.keys(quoteDataForEmail)
        }, requestId);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });

        quoteLogger.sheets('Google Sheets updated successfully', null, requestId);

        // --- Send Emails ---
        try {
            quoteLogger.email('Starting notification email process', { 
                customerEmail: quoteDataForEmail['CustomerEmail'],
                tradespersonEmail: quoteDataForEmail['TradePersonEmail']
            }, requestId);
            
            await sendNotificationEmails(quoteDataForEmail, leadData, requestId);
            quoteLogger.email('All notification emails sent successfully', null, requestId);
        } catch (emailError) {
            quoteLogger.error('Error sending notification emails', emailError, requestId);
            // Still return success page even if emails fail
        }
        
        // Return confirmation HTML page
        quoteLogger.response('Sending success confirmation page', { 
            quoteId,
            processingTime: Date.now() - startTime
        }, requestId);
        
        const confirmationPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quote Accepted</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                    .success-icon { font-size: 48px; margin-bottom: 20px; }
                    .success-title { color: #28a745; font-size: 24px; margin-bottom: 15px; }
                    .success-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                    .timestamp { color: #6c757d; font-size: 14px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">✅</div>
                    <h1>✅ Quote Accepted</h1>
                    <p>Thanks, your choice has been recorded.</p>
                    <div class="timestamp">Accepted on: ${nzTimestamp}</div>
                </div>
            </body>
            </html>
        `;
        
        return res.status(200).send(confirmationPage);

    } catch (error) {
        quoteLogger.error('Quote acceptance error', error, requestId);
        quoteLogger.response('Redirecting to error page', { 
            error: error.message,
            processingTime: Date.now() - startTime
        }, requestId);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}