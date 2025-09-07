import { getGoogleSheetsClient, getSpreadsheetId } from "../../../lib/googleSheets.js";
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

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
        }) + ' NZT';
    } catch (e) {
        return isoString; // Fallback to original string if parsing fails
    }
}

async function sendNotificationEmails(quoteData, leadData = {}) {
    console.log('📧 Preparing notification emails for quote acceptance');
    console.log('📋 Quote data keys:', Object.keys(quoteData));
    console.log('📋 Lead data keys:', Object.keys(leadData));
    
    // Get customer email - try quote data first, then lead data
    const customerEmail = quoteData['CustomerEmail'] || quoteData['Customer Email'] || quoteData['customerEmail'] || 
                         leadData['CustomerEmail'] || leadData['Customer Email'] || leadData['customerEmail'];
    const customerName = quoteData['CustomerName'] || quoteData['Customer Name'] || quoteData['customerName'] || 
                        leadData['CustomerName'] || leadData['Customer Name'] || leadData['customerName'];
    
    // Get tradesperson email - try different possible column names  
    const tradespersonEmail = quoteData['TradespersonEmail'] || quoteData['Tradesperson Email'] || quoteData['tradespersonEmail'] || 
                             quoteData['TradePerson Email'] || quoteData['TradesPerson Email'];
    const tradespersonName = quoteData['TradespersonName'] || quoteData['Tradesperson Name'] || quoteData['tradespersonName'] || 
                            quoteData['TradePerson Name'] || quoteData['TradesPerson Name'];
    
    console.log('📧 Email recipients:');
    console.log('  - Customer:', customerEmail);
    console.log('  - Tradesperson:', tradespersonEmail);
    console.log('  - Admin:', process.env.ADMIN_EMAIL);

    // Validate email addresses
    if (!customerEmail) {
        console.error('❌ Customer email not found in quote or lead data');
        throw new Error('Customer email not found');
    }
    if (!tradespersonEmail) {
        console.error('❌ Tradesperson email not found in quote data');
        throw new Error('Tradesperson email not found');
    }

    const customerMail = {
        to: customerEmail,
        subject: `🎉 Quote Accepted! Your Project Journey Begins`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Achievement Badge -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    <div style="font-size: 48px; color: white;">🏆</div>
                  </div>
                  <h1 style="color: #28a745; margin: 0; font-size: 32px; font-weight: bold;">Project Approved!</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Congratulations ${customerName}, your quote has been accepted!</p>
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

                <!-- Gamified Journey Checklist -->
                <div style="margin: 30px 0;">
                  <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">🎯 Your Project Journey</h3>
                  
                  <!-- Step 1: Lead Submitted -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Lead Submitted</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Your project requirements were successfully received and processed.</p>
                    </div>
                  </div>
                  
                  <!-- Step 2: Quote Prepared -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Professional Quote Prepared</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Our expert tradesperson created a detailed quote just for you.</p>
                    </div>
                  </div>
                  
                  <!-- Step 3: Decision Made -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; right: 0; background: #ffc107; color: #856404; padding: 5px 10px; font-size: 12px; font-weight: bold; border-bottom-left-radius: 8px;">JUST COMPLETED!</div>
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3); animation: pulse 2s infinite;">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Quote Accepted! 🎉</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">You've made your decision - the project is approved and ready to begin!</p>
                    </div>
                  </div>
                  
                  <!-- Step 4: Project Execution -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #ffc107; color: #856404; box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);">🔄</div>
                    <div>
                      <strong style="color: #856404; font-size: 16px;">Project Execution - Starting Soon!</strong>
                      <p style="margin: 5px 0 0 0; color: #856404;">Your tradesperson will contact you within 24 hours to schedule the work.</p>
                    </div>
                  </div>
                </div>

                <!-- Achievement Unlocked -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -10px; right: -10px; background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%;"></div>
                  <div style="position: absolute; bottom: -15px; left: -15px; background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%;"></div>
                  <h3 style="margin: 0 0 10px 0; font-size: 22px;">🏅 Achievement Unlocked!</h3>
                  <p style="margin: 0; font-size: 16px; opacity: 0.9;">"Decisive Customer" - Made a quick and confident project decision!</p>
                </div>

                <!-- What Happens Next -->
                <div style="background: #e8f4f8; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">📞 What Happens Next?</h3>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
                    <div>
                      <strong style="color: #0066cc;">Tradesperson Contact (Within 24 hours)</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">${tradespersonName} will call you to discuss project details and scheduling.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
                    <div>
                      <strong style="color: #0066cc;">Project Planning Session</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Review final details, materials, and timeline for your underfloor heating installation.</p>
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
                  <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${tradespersonName}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${tradespersonEmail}</p>
                  <p style="margin: 15px 0 0 0;">
                    <a href="mailto:${tradespersonEmail}" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📧 Send Message</a>
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

            <style>
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            </style>
        `,
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

                <!-- Gamified Achievement Journey -->
                <div style="margin: 30px 0;">
                  <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">🎯 Your Achievement Journey</h3>
                  
                  <!-- Step 1: Lead Received -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Lead Received & Assigned</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Successfully matched with a quality customer lead.</p>
                    </div>
                  </div>
                  
                  <!-- Step 2: Quote Prepared -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Professional Quote Delivered</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Created and submitted a competitive, detailed quote.</p>
                    </div>
                  </div>
                  
                  <!-- Step 3: Quote Won! -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); border-radius: 8px; border-left: 4px solid #ffc107; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: 0; right: 0; background: #ff6b35; color: white; padding: 5px 10px; font-size: 12px; font-weight: bold; border-bottom-left-radius: 8px;">🔥 HOT WIN!</div>
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #ffc107; color: #856404; box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4); animation: bounce 2s infinite;">🏆</div>
                    <div>
                      <strong style="color: #856404; font-size: 16px;">Quote Accepted - You Won! 🎉</strong>
                      <p style="margin: 5px 0 0 0; color: #856404;">Customer chose YOU! Your expertise and competitive pricing won the day!</p>
                    </div>
                  </div>
                </div>

                <!-- Achievement Badges -->
                <div style="display: flex; justify-content: space-around; margin: 30px 0; text-align: center;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; flex: 1; margin: 0 5px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎯</div>
                    <strong style="font-size: 14px;">Quote Winner</strong>
                  </div>
                  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; flex: 1; margin: 0 5px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚡</div>
                    <strong style="font-size: 14px;">Fast Response</strong>
                  </div>
                  <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; flex: 1; margin: 0 5px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">💼</div>
                    <strong style="font-size: 14px;">Professional</strong>
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

            <style>
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
              }
            </style>
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

                <!-- System Performance Dashboard -->
                <div style="margin: 30px 0;">
                  <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">📈 System Performance Dashboard</h3>
                  
                  <!-- Success Indicator -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Lead Conversion Success</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">Another customer journey completed successfully from lead to conversion!</p>
                    </div>
                  </div>
                  
                  <!-- Process Flow -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #28a745; color: white; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">✓</div>
                    <div>
                      <strong style="color: #155724; font-size: 16px;">Automated Workflow Executed</strong>
                      <p style="margin: 5px 0 0 0; color: #155724;">All notification emails sent, databases updated, timeline tracking active.</p>
                    </div>
                  </div>
                  
                  <!-- Revenue Tracking -->
                  <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; background: #ffc107; color: #856404; box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);">💰</div>
                    <div>
                      <strong style="color: #856404; font-size: 16px;">Revenue Pipeline Active</strong>
                      <p style="margin: 5px 0 0 0; color: #856404;">Project moving to execution phase - revenue generation in progress.</p>
                    </div>
                  </div>
                </div>

                <!-- Key Performance Indicators -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎯</div>
                    <strong style="font-size: 16px;">Lead Quality</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">High-converting lead matched successfully</p>
                  </div>
                  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⚡</div>
                    <strong style="font-size: 16px;">Response Time</strong>
                    <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Fast decision made by customer</p>
                  </div>
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

                <!-- Action Items & Next Steps -->
                <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #ffeaa7;">
                  <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">📝 Admin Action Items</h3>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #856404; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; font-size: 12px;">1</div>
                    <div>
                      <strong style="color: #856404;">Monitor Project Progress</strong>
                      <p style="margin: 5px 0 0 0; color: #6c757d;">Track project timeline and ensure smooth execution.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #856404; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; font-size: 12px;">2</div>
                    <div>
                      <strong style="color: #856404;">Customer Satisfaction Follow-up</strong>
                      <p style="margin: 5px 0 0 0; color: #6c757d;">Schedule check-in after project completion for feedback.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #856404; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; font-size: 12px;">3</div>
                    <div>
                      <strong style="color: #856404;">Performance Analytics Update</strong>
                      <p style="margin: 5px 0 0 0; color: #6c757d;">Record conversion metrics for business intelligence.</p>
                    </div>
                  </div>
                </div>

                <!-- System Status -->
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border: 1px solid #dee2e6; margin: 30px 0;">
                  <h4 style="color: #495057; margin: 0 0 15px 0;">⚙️ System Status</h4>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #495057;">All automated processes:</span>
                    <span style="color: #28a745; font-weight: bold;">✅ EXECUTED SUCCESSFULLY</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="color: #495057;">Database updates:</span>
                    <span style="color: #28a745; font-weight: bold;">✅ COMPLETED</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="color: #495057;">Email notifications:</span>
                    <span style="color: #28a745; font-weight: bold;">✅ SENT TO ALL PARTIES</span>
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
        console.log('📧 Sending customer confirmation email...');
        await sendEmail(customerMail);
        console.log('✅ Customer email sent successfully');
        
        console.log('📧 Sending tradesperson notification email...');
        await sendEmail(tradespersonMail);
        console.log('✅ Tradesperson email sent successfully');
        
        console.log('📧 Sending admin notification email...');
        await sendEmail(adminMail);
        console.log('✅ Admin email sent successfully');
        
        console.log('✅ All notification emails sent successfully');
    } catch (error) {
        console.error('❌ Error sending notification emails:', error);
        throw error;
    }
}


export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token } = req.query;

    if (!quoteId || !ts || !token) {
        return res.redirect(`/quote-status?status=error&message=Missing required parameters.`);
    }

    const expectedToken = verifyToken(quoteId, ts);
    if (token !== expectedToken) {
        return res.redirect(`/quote-status?status=error&message=Invalid or expired link.`);
    }
    
    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        const range = 'Quotes!A:Z';

        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        if (!rows) {
            return res.redirect(`/quote-status?status=error&message=Could not connect to the database.`);
        }
        
        const header = rows[0];
        const rowIndex = rows.findIndex(row => row[0] === quoteId);

        if (rowIndex === -1) {
            return res.redirect(`/quote-status?status=error&message=Quote ID not found.`);
        }
        
        const targetRow = rows[rowIndex];
        
        // Get lead ID to fetch customer information
        const leadIdIndex = header.findIndex(col => col && (col.toLowerCase().includes('lead') || col.toLowerCase().includes('leadi')));
        const leadId = leadIdIndex !== -1 ? targetRow[leadIdIndex] : null;
        
        // Fetch lead data to get customer information
        let leadData = {};
        if (leadId) {
            try {
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
                    }
                }
            } catch (leadError) {
                console.log('⚠️ Could not fetch lead data:', leadError.message);
            }
        }
        
        // Check if quote has expired (Valid Until date)
        const validUntilIndex = header.findIndex(col => 
            col && (col.toLowerCase().includes('valid until') || 
                   col.toLowerCase().includes('expiry') || 
                   col.toLowerCase().includes('expires'))
        );
        
        if (validUntilIndex !== -1 && targetRow[validUntilIndex]) {
            const validUntilDate = new Date(targetRow[validUntilIndex]);
            const now = new Date();
            
            if (validUntilDate < now) {
                const expiredMessage = encodeURIComponent(
                    "This quote has expired and is no longer valid. Please contact us to request a new quote."
                );
                return res.redirect(`/quote-status?status=error&message=${expiredMessage}`);
            }
        }
        
        const decisionIndex = header.indexOf('Decision');
        const decisionTimestampIndex = header.indexOf('Decision Timestamp');

        // ROBUST ONE-TIME DECISION CHECK
        if (decisionIndex !== -1 && targetRow[decisionIndex] && targetRow[decisionIndex].trim() !== '') {
            const decision = targetRow[decisionIndex];
            const timestamp = (decisionTimestampIndex !== -1) ? targetRow[decisionTimestampIndex] : '';
            const formattedTime = formatTimestamp(timestamp);
            
            console.log(`🚫 DECISION ALREADY MADE: ${decision} on ${formattedTime}`);
            
            // Create a detailed error page showing the decision status
            const errorMessage = `This quote was already ${decision.toLowerCase()} on ${formattedTime}.`;
            const statusPage = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Decision Already Made</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .decision-info { background: #f8d7da; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0; }
                        .decision-status { color: #721c24; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">⚠️</div>
                        <h1 class="error-title">Decision Already Made</h1>
                        <p class="error-message">This quote decision has already been processed and cannot be changed.</p>
                        <div class="decision-info">
                            <div class="decision-status">Decision: ${decision}</div>
                            <div class="timestamp">Made on: ${formattedTime}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
            `;
            
            return res.status(400).send(statusPage);
        }
        
        // --- Update Sheet Data ---
        console.log('📝 Updating quote decision in Google Sheets...');
        
        // Find the correct column indices for updating (reuse existing variables)
        const customerStatusIndex = header.indexOf('Customer Status');
        const tradespersonStatusIndex = header.indexOf('Tradesperson Status');
        const adminStatusIndex = header.indexOf('Admin Status');

        // Update the target row with decision data
        if (decisionIndex !== -1) targetRow[decisionIndex] = 'Accepted';
        if (decisionTimestampIndex !== -1) targetRow[decisionTimestampIndex] = new Date().toISOString();
        if (customerStatusIndex !== -1) targetRow[customerStatusIndex] = 'Quote Decision';
        if (tradespersonStatusIndex !== -1) targetRow[tradespersonStatusIndex] = 'Quote Decision';
        if (adminStatusIndex !== -1) targetRow[adminStatusIndex] = 'Accepted';

        // Prepare data for email notifications
        const quoteDataForEmail = {};
        header.forEach((headerName, index) => {
            quoteDataForEmail[headerName] = targetRow[index] || '';
        });

        // Update the Google Sheet
        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Quotes!A${rowIndex + 1}:Z${rowIndex + 1}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [targetRow] },
            });
            console.log('✅ Quote decision updated in Google Sheets');
        } catch (updateError) {
            console.error('❌ Error updating Google Sheets:', updateError);
            throw new Error('Failed to update quote decision: ' + updateError.message);
        }

        // --- Send Emails ---
        await sendNotificationEmails(quoteDataForEmail, leadData);
        
        return res.redirect(`/quote-status?status=success&message=Your acceptance has been recorded!`);

    } catch (error) {
        console.error("Quote acceptance error:", error);
        return res.redirect(`/quote-status?status=error&message=An internal server error occurred.`);
    }
}