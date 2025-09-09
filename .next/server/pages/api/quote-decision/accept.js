"use strict";(()=>{var e={};e.id=8804,e.ids=[8804],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},4101:(e,t,o)=>{o.r(t),o.d(t,{config:()=>h,default:()=>f,routeModule:()=>y});var i={};o.r(i),o.d(i,{default:()=>x});var r=o(1802),a=o(7153),n=o(6249),s=o(5367),l=o(5116),d=o(3078),p=o(3637),c=o(4770),u=o.n(c);function g(e=new Date){return e.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}async function m(e,t={},o=null){let i,r;p.Z.email("Preparing notification emails for quote acceptance",{quoteDataKeys:Object.keys(e),leadDataKeys:Object.keys(t)},o);let a=e.CustomerEmail||t.CustomerEmail,n=e.CustomerName||t.CustomerName,s=e.TradePersonEmail,c=e.TradePersonName,u=e.ServiceType||t.ServiceType||"",m=e.Budget||t.Budget||"",x=e.Timeline||t.Timelline||t.Timeline||"",f=e.ValidUntil||"N/A";if(p.Z.email("Email recipients identified",{customerEmail:a,tradespersonEmail:s,adminEmail:process.env.ADMIN_EMAIL?"SET":"NOT_SET"},o),!a||"undefined"===a||"N/A (Column not found)"===a)throw p.Z.error("Customer email not found in quote or lead data",{customerEmail:a},o),Error("Customer email not found");if(!s||"undefined"===s||"N/A (Column not found)"===s)throw p.Z.error("Tradesperson email not found in quote data",{tradespersonEmail:s},o),Error("Tradesperson email not found");let h={quoteId:e.QuoteID,quoteDate:e.TimeStamp||g(),validUntil:f,customerName:n,customerEmail:a,customerPhone:e.CustomerPhone||"",customerAddress:e.Location||`${t.Area||""} ${t.Suburb||""}`.trim(),serviceType:u,tradespersonName:c||"Professional Tradesperson",tradespersonEmail:s||"contact@kiwitrade.co.nz",tradespersonPhone:e.TradePersonPhone||"Contact via Kiwi Trade",tradespersonLicense:"Licensed Tradesperson",rooms:[],breakdown:{labourRate:parseFloat(e.LabourRate||0),labourHours:parseFloat(e.LabourHours||0),labourTotal:parseFloat(e.LabourTotal||0),materialsCost:parseFloat(e.MaterialsCost||0),materialsQuantity:parseFloat(e.MaterialsQuantity||0),materialsTotal:parseFloat(e.MaterialsTotal||0),travelCost:parseFloat(e.TravelCost||0),travelDistance:parseFloat(e.TravelDistance||0),travelTotal:parseFloat(e.TravelTotal||0),installationCost:parseFloat(e.InstallationCost||0),totalSqm:0},totals:{labour:parseFloat(e.LabourTotal||0),materials:parseFloat(e.MaterialsTotal||0),travel:parseFloat(e.TravelTotal||0),installation:parseFloat(e.InstallationCost||0),subtotal:parseFloat(e.Subtotal||0),gst:parseFloat(e.GST||0),final:parseFloat(e.TotalQuote||0)}};try{let o=e.Rooms||t.Rooms;if(o){let e=JSON.parse(o);Array.isArray(e)&&(h.rooms=e,h.breakdown.totalSqm=e.reduce((e,t)=>e+(parseFloat(t.sqm)||0),0))}}catch(e){console.log("⚠️ Could not parse rooms data:",e.message)}p.Z.dataFlow("Final quote data prepared for PDF generation",{quoteId:h.quoteId,customerName:h.customerName,totalAmount:h.totals.final,hasRooms:h.rooms.length>0},o);try{p.Z.pdf("Generating PDF for customer",{quoteId:h.quoteId},o),i=await (0,d.V7)(h),p.Z.pdf("PDF generated successfully for customer",{quoteId:h.quoteId,pdfSize:i?i.length:0},o)}catch(e){throw p.Z.error("PDF generation failed",e,o),Error("Failed to generate PDF")}let y={to:a,cc:process.env.ADMIN_EMAIL,subject:`🎉 Quote Accepted! Your ${h.serviceType} Project Journey Begins`,html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Achievement Badge -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                    <div style="font-size: 48px; color: white;">🏆</div>
                  </div>
                  <h1 style="color: #28a745; margin: 0; font-size: 32px; font-weight: bold;">Project Approved!</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Congratulations ${h.customerName}, your ${h.serviceType} quote has been accepted!</p>
                </div>

                <!-- Quote Summary Card -->
                <div style="background: #e8f4f8; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">📋 Your Approved Quote Summary</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                      <div>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Service:</strong> ${h.serviceType}</p>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Budget:</strong> ${m||"Not specified"}</p>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Timeline:</strong> ${x||"Not specified"}</p>
                      </div>
                      <div>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Tradesperson:</strong> ${h.tradespersonName}</p>
                        <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Valid Until:</strong> ${(e=>{if(!e||"N/A"===e)return"N/A";try{return new Date(e).toLocaleDateString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric"})}catch(t){return e}})(h.validUntil)}</p>
                        <p style="margin: 8px 0; color: #28a745; font-size: 18px; font-weight: bold;"><strong>Total Quote:</strong> ${(r=h.totals.final,new Intl.NumberFormat("en-NZ",{style:"currency",currency:"NZD"}).format(r||0))}</p>
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
                      <p style="margin: 5px 0 0 0; color: #495057;">${h.tradespersonName} will call you to discuss project details and scheduling.</p>
                    </div>
                  </div>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
                    <div>
                      <strong style="color: #0066cc;">Project Planning Session</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Review final details, materials, and timeline for your ${h.serviceType} installation.</p>
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
                  <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${h.tradespersonName}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${h.tradespersonEmail}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${h.tradespersonPhone}</p>
                  <p style="margin: 15px 0 0 0;">
                    <a href="mailto:${h.tradespersonEmail}" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">📧 Send Message</a>
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
        `,attachments:[{filename:`Quote-${h.quoteId}.pdf`,content:i,contentType:"application/pdf"}]},b={to:s,subject:`🏆 Victory! ${n} Accepted Your Quote - Level Up!`,html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Victory Animation -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);">
                    <div style="font-size: 48px; color: white;">🏆</div>
                  </div>
                  <h1 style="color: #ff6b35; margin: 0; font-size: 32px; font-weight: bold;">Victory!</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Quote accepted by ${n} - You're a champion!</p>
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
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Customer:</strong> ${n}</p>
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Email:</strong> ${a}</p>
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ ACCEPTED & READY TO PROCEED</span></p>
                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Decision Date:</strong> ${new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland"})} NZT</p>
                  </div>
                </div>

                <!-- Action Plan -->
                <div style="background: #e8f4f8; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">🚀 Your Action Plan (Next 24 Hours)</h3>
                  <div style="display: flex; align-items: flex-start; margin: 15px 0;">
                    <div style="background: #0066cc; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
                    <div>
                      <strong style="color: #0066cc;">Contact Customer (URGENT - Within 2 hours)</strong>
                      <p style="margin: 5px 0 0 0; color: #495057;">Strike while the iron is hot! Call ${n} to express gratitude and discuss next steps.</p>
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
                    <a href="mailto:${a}" style="display: inline-block; background: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">📧 Send Email</a>
                    <a href="mailto:${a}?subject=Congratulations on your quote acceptance!&body=Hi ${n},%0D%0A%0D%0AThank you for accepting my quote! I'm excited to work with you on this project.%0D%0A%0D%0ANext steps:%0D%0A- Schedule planning meeting%0D%0A- Review final details%0D%0A- Begin project preparation%0D%0A%0D%0ABest regards" style="display: inline-block; background: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 10px;">📝 Quick Thank You</a>
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
        `},v={to:process.env.ADMIN_EMAIL,subject:`🎯 Success Metrics: Quote Accepted by ${n}`,html:`
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
                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${n}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${a}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">✅ CONVERTED</span></p>
                      </div>
                      <div>
                        <h4 style="color: #495057; margin: 0 0 10px 0; font-size: 16px;">👷‍♂️ Tradesperson Information</h4>
                        <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${c}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${s}</p>
                        <p style="margin: 5px 0; color: #495057;"><strong>Performance:</strong> <span style="color: #28a745; font-weight: bold;">🏆 WIN</span></p>
                      </div>
                    </div>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                      <p style="margin: 5px 0; color: #495057;"><strong>Decision Timestamp:</strong> ${new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland"})} NZT</p>
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
        `};try{p.Z.email("Sending customer confirmation email",{to:y.to,subject:y.subject},o),await (0,l.Cz)(y),p.Z.email("Customer email sent successfully",null,o),p.Z.email("Sending tradesperson notification email",{to:b.to,subject:b.subject},o),await (0,l.Cz)(b),p.Z.email("Tradesperson email sent successfully",null,o),p.Z.email("Sending admin notification email",{to:v.to,subject:v.subject},o),await (0,l.Cz)(v),p.Z.email("Admin email sent successfully",null,o),p.Z.email("All notification emails sent successfully",null,o)}catch(e){throw p.Z.error("Error sending notification emails",e,o),e}}async function x(e,t){let o=p.Z.generateRequestId(),i=Date.now();if(p.Z.apiAccept("Request received",{method:e.method,url:e.url,query:e.query,headers:{"user-agent":e.headers["user-agent"],referer:e.headers.referer,"x-forwarded-for":e.headers["x-forwarded-for"]},bodySize:e.body?JSON.stringify(e.body).length:0},o),"GET"!==e.method)return p.Z.error("Invalid method",null,o),p.Z.response("Sending 405 Method Not Allowed",{method:e.method},o),t.status(405).json({success:!1,error:"Method Not Allowed"});let{quoteId:r,ts:a,token:n}=e.query;if(!r||!a||!n)return p.Z.error("Missing required parameters",{quoteId:r,ts:a,token:n},o),p.Z.response("Redirecting to error page - missing parameters",null,o),t.redirect("/quote-status?status=error&message=Missing required parameters.");let l=function(e,t){let o=u().createHmac("sha256",process.env.QUOTE_LINK_SECRET);return o.update(`${e}|${t}`),o.digest("hex")}(r,a);if(n!==l)return p.Z.error("Invalid token",{providedToken:n.substring(0,10)+"...",expectedToken:l.substring(0,10)+"..."},o),p.Z.response("Redirecting to error page - invalid token",null,o),t.redirect("/quote-status?status=error&message=Invalid or expired link.");p.Z.customerAccept("Token validated successfully",{quoteId:r},o);try{p.Z.sheets("Initializing Google Sheets client",null,o);let e=await (0,s.getGoogleSheetsClient)(),a=(0,s.getSpreadsheetId)(),n="Quotes!A:AJ";p.Z.sheets("Fetching quote data from Google Sheets",{spreadsheetId:a.substring(0,10)+"...",range:n},o);let l=(await e.spreadsheets.values.get({spreadsheetId:a,range:n})).data.values;if(!l)return p.Z.error("Could not connect to Google Sheets",null,o),p.Z.response("Redirecting to error page - database connection failed",null,o),t.redirect("/quote-status?status=error&message=Could not connect to the database.");p.Z.sheets("Google Sheets data retrieved",{totalRows:l.length,hasHeader:l.length>0},o);let d=l[0],c=l.findIndex(e=>e[1]===r);if(-1===c)return p.Z.error("Quote ID not found in Google Sheets",{quoteId:r,searchedRows:l.length-1,availableQuoteIds:l.slice(1).map(e=>e[1]).filter(e=>e)},o),p.Z.response("Redirecting to error page - quote not found",null,o),t.redirect("/quote-status?status=error&message=Quote ID not found.");p.Z.sheets("Quote found in Google Sheets",{quoteId:r,rowIndex:c+1,totalColumns:d.length},o);let u=l[c],x=u[2]||null;p.Z.dataFlow("Quote row data extracted",{quoteId:r,leadId:x,rowLength:u.length,hasLeadId:!!x},o);let f={};if(x)try{p.Z.sheets("Fetching lead data",{leadId:x},o);let t=(await e.spreadsheets.values.get({spreadsheetId:a,range:"Leads!A:Z"})).data.values;if(t){let e=t[0],i=t.findIndex(e=>e[0]===x);if(-1!==i){let r=t[i];e.forEach((e,t)=>{f[e]=r[t]||""}),p.Z.sheets("Lead data retrieved successfully",{leadId:x,leadRowIndex:i+1,leadDataKeys:Object.keys(f)},o)}else p.Z.error("Lead ID not found in Leads sheet",{leadId:x},o)}}catch(e){p.Z.error("Could not fetch lead data",e,o)}else p.Z.info("No lead ID found in quote data",null,o);let h=d.indexOf("Decision"),y=d.indexOf("DecisionTimestamp"),b=d.indexOf("ValidUntil"),v=-1!==h?u[h]:"",w=-1!==y?u[y]:"",A=-1!==b?u[b]:"";p.Z.dataFlow("Decision and expiry data extracted",{currentDecision:v,currentDecisionTimestamp:w,validUntil:A,decisionIndex:h,decisionTimestampIndex:y,validUntilIndex:b},o);let T=d.indexOf("Status"),E=-1!==T?u[T]:"";if("Rejected"===E){p.Z.customerAccept("Quote rejected - preventing acceptance",{quoteId:r,status:E},o);let e=`
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
            `;return p.Z.response("Sending rejection page",{quoteId:r,processingTime:Date.now()-i},o),t.status(400).send(e)}let k=!1;if(A)try{let e=new Date(A),t=new Date;k=e<t,p.Z.dataFlow("Expiry check completed",{validUntil:A,validUntilDate:e.toISOString(),now:t.toISOString(),isExpired:k},o)}catch(e){p.Z.error("Could not parse ValidUntil date",e,o)}else p.Z.info("No ValidUntil date found",null,o);if(k){if(p.Z.customerAccept("Quote expired - processing expiry logic",{validUntil:A,currentDecision:v},o),!v||""===v.trim()){p.Z.sheets('Locking expired quote as "Expired"',{quoteId:r},o);let t={Decision:"Expired",DecisionTimestamp:g(new Date)},i={};d.forEach((e,o)=>{i[e]=u[o]||"",void 0!==t[e]&&(u[o]=t[e],i[e]=t[e])}),p.Z.sheets("Updating Google Sheets with expired status",{updateData:t,rowIndex:c+1},o),await e.spreadsheets.values.update({spreadsheetId:a,range:`Quotes!A${c+1}`,valueInputOption:"USER_ENTERED",requestBody:{values:[u]}}),p.Z.sheets("Google Sheets updated with expired status",null,o)}p.Z.response("Sending expired quote page",{validUntil:A,currentDecision:v,processingTime:Date.now()-i},o);let n=`
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
                        <p>This quote expired on ${A}.</p>
                        <div class="expiry-info">
                            <div class="expiry-status">Quote Status: Expired</div>
                            <div class="timestamp">Expired on: ${A}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            Please contact us again via the website to request a new quote.
                        </p>
                    </div>
                </body>
                </html>
            `;return t.status(200).send(n)}if(v&&""!==v.trim()&&"Admin Approved"!==v){let e=function(e){if(!e)return"an unknown time";try{return new Date(e).toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch(t){return e}}(w);p.Z.customerAccept("Decision already made - preventing duplicate",{currentDecision:v,formattedTime:e,quoteId:r},o),p.Z.response("Sending already-made decision page",{currentDecision:v,formattedTime:e,processingTime:Date.now()-i},o);let a=`
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
                        <p>You already chose ${v} on ${e}.</p>
                        <div class="decision-info">
                            <div class="decision-status">Decision: ${v}</div>
                            <div class="timestamp">Made on: ${e}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
            `;return t.status(200).send(a)}p.Z.customerAccept("Processing quote acceptance",{quoteId:r},o);let D=g(),S={Decision:"Accepted",DecisionTimestamp:D};p.Z.dataFlow("Preparing Google Sheets update",{updateData:S,rowIndex:c+1},o);let Z={};d.forEach((e,t)=>{Z[e]=u[t]||"",void 0!==S[e]&&(u[t]=S[e],Z[e]=S[e])}),p.Z.sheets("Updating Google Sheets with acceptance",{updateData:S,rowIndex:c+1,quoteDataKeys:Object.keys(Z)},o),await e.spreadsheets.values.update({spreadsheetId:a,range:`Quotes!A${c+1}`,valueInputOption:"USER_ENTERED",requestBody:{values:[u]}}),p.Z.sheets("Google Sheets updated successfully",null,o);try{p.Z.email("Starting notification email process",{customerEmail:Z.CustomerEmail,tradespersonEmail:Z.TradePersonEmail},o),await m(Z,f,o),p.Z.email("All notification emails sent successfully",null,o)}catch(e){p.Z.error("Error sending notification emails",e,o)}p.Z.response("Sending success confirmation page",{quoteId:r,processingTime:Date.now()-i},o);let C=`
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
                    <div class="timestamp">Accepted on: ${D}</div>
                </div>
            </body>
            </html>
        `;return t.status(200).send(C)}catch(e){return p.Z.error("Quote acceptance error",e,o),p.Z.response("Redirecting to error page",{error:e.message,processingTime:Date.now()-i},o),t.redirect("/quote-status?status=error&message=An internal server error occurred.")}}let f=(0,n.l)(i,"default"),h=(0,n.l)(i,"config"),y=new r.PagesAPIRouteModule({definition:{kind:a.x.PAGES_API,page:"/api/quote-decision/accept",pathname:"/api/quote-decision/accept",bundlePath:"",filename:""},userland:i})},3637:(e,t,o)=>{function i(e,t,o=null,i=null){let r=new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}),a=i?`[${i}]`:"",n=o?function(e){if("object"!=typeof e||null===e)return e;let t=["password","token","secret","key","auth","credential"],o={...e};for(let e in o)t.some(t=>e.toLowerCase().includes(t))&&(o[e]="[REDACTED]");return o}(o):null,s=`[${r}] ${a} ${e} ${t}`;n?console.log(s,JSON.stringify(n,null,2)):console.log(s)}o.d(t,{Z:()=>r});let r={generateRequestId:function(){return`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`},adminAccept:(e,t=null,o=null)=>{i("[ADMIN-ACCEPT]",e,t,o)},adminDecline:(e,t=null,o=null)=>{i("[ADMIN-DECLINE]",e,t,o)},customerAccept:(e,t=null,o=null)=>{i("[CUSTOMER-ACCEPT]",e,t,o)},customerDecline:(e,t=null,o=null)=>{i("[CUSTOMER-DECLINE]",e,t,o)},apiAccept:(e,t=null,o=null)=>{i("[API-ACCEPT]",e,t,o)},apiDecline:(e,t=null,o=null)=>{i("[API-DECLINE]",e,t,o)},dataFlow:(e,t=null,o=null)=>{i("[DATA-FLOW]",e,t,o)},error:(e,t=null,o=null)=>{i("[ERROR]",e,t?{message:t.message,stack:t.stack,name:t.name}:null,o)},response:(e,t=null,o=null)=>{i("[RESPONSE]",e,t,o)},sheets:(e,t=null,o=null)=>{i("[SHEETS]",e,t,o)},email:(e,t=null,o=null)=>{i("[EMAIL]",e,t,o)},pdf:(e,t=null,o=null)=>{i("[PDF]",e,t,o)},info:(e,t=null,o=null)=>{i("[INFO]",e,t,o)},request:(e,t=null,o=null)=>{i("[REQUEST]",e,t,o)}}}};var t=require("../../../webpack-api-runtime.js");t.C(e);var o=e=>t(t.s=e),i=t.X(0,[3273,3078],()=>o(4101));module.exports=i})();