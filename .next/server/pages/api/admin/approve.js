"use strict";(()=>{var e={};e.id=816,e.ids=[816],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},1276:(e,t,o)=>{o.r(t),o.d(t,{config:()=>y,default:()=>h,routeModule:()=>v});var r={};o.r(r),o.d(r,{default:()=>x});var a=o(1802),n=o(7153),i=o(6249),s=o(5367),l=o(3078),d=o(5116),p=o(3637),u=o(4770),c=o.n(u);function g(e,t){let o=c().createHmac("sha256",process.env.QUOTE_LINK_SECRET);return o.update(`${e}|${t}`),o.digest("hex")}function m(e,t){let o=Date.now().toString(),r=g(t,o),a="https://lead-code-phi.vercel.app".replace(/^(https?:\/\/)/,"");return`https://${a}/api/quote-decision/${e}?quoteId=${t}&ts=${o}&token=${r}`}async function f(e){let{sheets:t,spreadsheetId:o,tab:r,searchColumn:a,searchValue:n,columnsToFetch:i}=e,s=`${r}!A:AJ`,l=(await t.spreadsheets.values.get({spreadsheetId:o,range:s})).data.values;if(!l||l.length<2)return null;let d=l[0],p=d.indexOf(a);if(-1===p)throw Error(`Column "${a}" not found in tab "${r}".`);let u=l.find(e=>e[p]===n);if(!u)return null;let c={rowIndex:l.indexOf(u)+1};return i.forEach(e=>{let t=d.indexOf(e);c[e]=-1!==t?u[t]||"":"N/A (Column not found)"}),c}async function x(e,t){let o=p.Z.generateRequestId(),r=Date.now();if(p.Z.adminAccept("Request received",{method:e.method,url:e.url,query:e.query,headers:{"user-agent":e.headers["user-agent"],referer:e.headers.referer,"x-forwarded-for":e.headers["x-forwarded-for"]},bodySize:e.body?JSON.stringify(e.body).length:0},o),"GET"!==e.method)return p.Z.error("Invalid method",null,o),p.Z.response("Sending 405 Method Not Allowed",{method:e.method},o),t.status(405).json({success:!1,error:"Method Not Allowed"});let{quoteId:a,ts:n,token:i}=e.query;if(!a||!n||!i||i!==g(a,n))return p.Z.error("Invalid approval link",{quoteId:a,hasToken:!!i,tokenValid:i===g(a,n)},o),p.Z.response("Redirecting to error page - invalid approval link",null,o),t.redirect("/quote-status?status=error&message=Invalid approval link.");p.Z.adminAccept("Token validated successfully",{quoteId:a},o);try{let e;p.Z.sheets("Initializing Google Sheets client",null,o);let n=await (0,s.getGoogleSheetsClient)(),i=(0,s.getSpreadsheetId)();p.Z.sheets("Fetching quote data from Google Sheets",{spreadsheetId:i.substring(0,10)+"...",quoteId:a},o);let u=await f({sheets:n,spreadsheetId:i,tab:"Quotes",searchColumn:"QuoteID",searchValue:a,columnsToFetch:["AdminPersonStatus","LeadID","TradePersonName","TradePersonEmail","TradePersonPhone","LabourRate","LabourHours","LabourTotal","MaterialsCost","MaterialsQuantity","MaterialsTotal","TravelCost","TravelDistance","TravelTotal","InstallationCost","Subtotal","GST","TotalQuote","Notes","ValidUntil","ResubmissionAllowed","Decision","DecisionTimeStamp","CustomerName","CustomerEmail","CustomerPhone","ServiceType","Location","Timeline","Budget","Rooms","BreakDown"]});if(!u)return p.Z.error("Quote not found in Google Sheets",{quoteId:a},o),p.Z.response("Redirecting to error page - quote not found",null,o),t.redirect("/quote-status?status=error&message=Quote not found.");if(p.Z.dataFlow("Quote data retrieved from Google Sheets",{quoteId:a,adminStatus:u.AdminPersonStatus,leadId:u.LeadID,customerName:u.CustomerName,totalQuote:u.TotalQuote},o),"Approved"===u.AdminPersonStatus){p.Z.adminAccept("Quote already approved - preventing duplicate",{quoteId:a,adminStatus:u.AdminPersonStatus},o),p.Z.response("Sending already approved page",{quoteId:a,processingTime:Date.now()-r},o);let e=`
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
            `;return t.status(400).send(e)}let c=await f({sheets:n,spreadsheetId:i,tab:"Leads",searchColumn:"Lead",searchValue:u.LeadID,columnsToFetch:["CustomerName","CustomerEmail","CustomerPhone","ServiceType","Area","Suburb","Rooms","Budget","Timelline","Specfic Details"]});if(!c)return t.redirect("/quote-status?status=error&message=Lead data not found.");let x=[];if(u.Rooms)try{x=JSON.parse(u.Rooms)}catch(e){console.log("Could not parse stored rooms data, using lead data"),x=c.Rooms?JSON.parse(c.Rooms):[]}else x=c.Rooms?JSON.parse(c.Rooms):[];let h=x.reduce((e,t)=>e+(parseFloat(t.sqm)||0),0),y=parseFloat(u.LabourRate||0),v=parseFloat(u.LabourHours||0),b=parseFloat(u.MaterialsCost||0),w=parseFloat(u.MaterialsQuantity||0),T=parseFloat(u.TravelCost||0),S=parseFloat(u.TravelDistance||0),A=parseFloat(u.InstallationCost||0);parseFloat(u.TotalQuote||0);let D=parseFloat(u.Subtotal||0),$=parseFloat(u.GST||0),C=parseFloat(u.TotalQuote||0);console.log("\uD83D\uDCB0 Admin/Approve - Using actual totals from Google Sheets:",{subtotal:D,gst:$,finalTotal:C,totalQuote:u.TotalQuote,subtotalRaw:u.Subtotal,gstRaw:u.GST});let E=x.map(e=>{let t=parseFloat(e.sqm)||0,o=h>0?t/h:0;return{name:e.name,dimensions:e.dimensions||e.originalInput,sqm:t,labourHours:o*v,labourCost:y*v*o,materialsCost:b*w*o}}),k={quoteId:a,quoteDate:new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),validUntil:u.ValidUntil||new Date(Date.now()+12096e5).toLocaleDateString("en-NZ"),customerName:u.CustomerName||c.CustomerName,customerEmail:u.CustomerEmail||c.CustomerEmail,customerPhone:u.CustomerPhone||c.CustomerPhone,customerAddress:u.Location||`${c.Area||""}, ${c.Suburb||""}`.trim(),serviceType:u.ServiceType||c.ServiceType,tradespersonName:u.TradePersonName||"Professional Tradesperson",tradespersonEmail:u.TradePersonEmail||"contact@kiwitrade.co.nz",tradespersonPhone:u.TradePersonPhone||"Contact via Kiwi Trade",tradespersonLicense:"Licensed Tradesperson",rooms:E,breakdown:{labourRate:y,labourHours:v,labourTotal:y*v,materialsCost:b,materialsQuantity:w,materialsTotal:b*w,travelCost:T,travelDistance:S,travelTotal:T*S,installationCost:A,totalSqm:h},totals:{labour:y*v,materials:b*w,travel:T*S,installation:A,subtotal:D,gst:$,final:C}},P=null,q=null;console.log("\uD83D\uDCCA Quote data for PDF generation:",JSON.stringify(k,null,2));try{P=await (0,l.V7)(k),console.log(`✅ PDF generated for approved quote: ${a}`)}catch(e){console.error("❌ Admin PDF Generation failed:",e),console.error("❌ PDF Error details:",e.message,e.stack);try{q=(0,l.Ml)(k),console.log(`✅ HTML backup generated for approved quote: ${a}`)}catch(e){return console.error("❌ Admin HTML Generation also failed:",e),console.error("❌ HTML Error details:",e.message,e.stack),console.error("❌ Quote data that failed:",JSON.stringify(k,null,2)),t.redirect("/quote-status?status=error&message=Failed to generate quote document.")}}if(P)e={filename:`Quote_${a}.pdf`,content:P,contentType:"application/pdf"};else{if(!q)return t.redirect("/quote-status?status=error&message=Failed to generate quote attachment.");e={filename:`Quote_${a}.html`,content:Buffer.from(q,"utf8"),contentType:"text/html"}}let I=m("accept",a),Q=m("decline",a),N=function(e){let t=Date.now().toString(),o=g(e,t),r="https://lead-code-phi.vercel.app".replace(/^(https?:\/\/)/,"");return`https://${r}/quote-view?quoteId=${e}&ts=${t}&token=${o}`}(a),F={to:c.CustomerEmail,cc:process.env.ADMIN_EMAIL,subject:`🎯 Your Quote for ${c.ServiceType} - $${C.toFixed(2)} is Ready!`,html:`
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
                  <p><strong>Quote ID:</strong> ${a}</p>
                  <p><strong>Service:</strong> ${c.ServiceType}</p>
                  <p><strong>Tradesperson:</strong> ${k.tradespersonName}</p>
                  <p><strong>Total Amount:</strong> $${C.toFixed(2)}</p>
                  <p><strong>Your Budget:</strong> ${c.Budget||"Not specified"}</p>
                  <p><strong>Timeline:</strong> ${c.Timelline||c.Timeline||"Not specified"}</p>
                  <p><strong>Location:</strong> ${c.Area}, ${c.Suburb}</p>
                  <p><strong>Valid Until:</strong> ${new Date(k.validUntil).toLocaleDateString("en-NZ")}</p>
                </div>

                <!-- Quote Breakdown -->
                <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin-top: 0;">💰 Quote Breakdown:</h3>
                  <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Labour & Installation:</strong></span>
                      <span>$${k.totals.labour.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Materials & Equipment:</strong></span>
                      <span>$${k.totals.materials.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Travel & Transport:</strong></span>
                      <span>$${k.totals.travel.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Installation:</strong></span>
                      <span>$${k.totals.installation.toFixed(2)}</span>
                    </div>
                    <hr style="margin: 15px 0; border: none; border-top: 1px solid #dee2e6;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>Subtotal (excl. GST):</strong></span>
                      <span>$${k.totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                      <span><strong>GST (15%):</strong></span>
                      <span>$${k.totals.gst.toFixed(2)}</span>
                    </div>
                    <hr style="margin: 15px 0; border: none; border-top: 2px solid #007bff;">
                    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 18px; font-weight: bold; color: #007bff;">
                      <span><strong>TOTAL (incl. GST):</strong></span>
                      <span>$${k.totals.final.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Decision Buttons -->
                <div style="background-color: #e8f4f8; border-radius: 10px; padding: 25px; text-align: center; margin: 20px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 15px 0; font-size: 20px;">🎯 Make Your Decision</h3>
                  <p style="color: #495057; margin: 0 0 20px 0;">Review the attached PDF and choose your next step:</p>
                  
                  <div style="margin: 20px 0;">
                    <a href="${I}" style="display: inline-block; background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">✅ ACCEPT QUOTE</a>
                    <a href="${Q}" style="display: inline-block; background-color: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px; margin: 0 10px;">❌ DECLINE QUOTE</a>
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
                  <a href="${N}" style="color: #007bff; word-break: break-all;">${N}</a>
                </div>

                <!-- Contact Information -->
                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h4 style="color: #27ae60; margin: 0 0 10px 0;">👷‍♂️ Your Tradesperson</h4>
                  <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${k.tradespersonName}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${k.tradespersonEmail}</p>
                  <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${k.tradespersonPhone}</p>
                  <p style="margin: 15px 0 0 0;">
                    <a href="mailto:${k.tradespersonEmail}" style="display: inline-block; background: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📧 Contact Tradesperson</a>
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
          `,attachments:[e]};p.Z.email("Sending customer quote email",{to:F.to,subject:F.subject,hasAttachment:!!F.attachments},o),await (0,d.Cz)(F),p.Z.email("Customer quote email sent successfully",{customerEmail:c.CustomerEmail,hasAttachment:!!F.attachments},o),p.Z.sheets("Updating Google Sheets with approval status",{quoteId:a},o);let L=(await n.spreadsheets.values.get({spreadsheetId:i,range:"Quotes!A1:AJ1"})).data.values[0],R={AdminPersonStatus:"Approved",CustomerStatus:"Quote Sent",Decision:"Admin Approved",DecisionTimestamp:new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")};p.Z.dataFlow("Preparing Google Sheets update",{updates:R,rowIndex:u.rowIndex},o);let Z=(await n.spreadsheets.values.get({spreadsheetId:i,range:`Quotes!A${u.rowIndex}:AJ${u.rowIndex}`})).data.values[0];return L.forEach((e,t)=>{R[e]&&(Z[t]=R[e])}),await n.spreadsheets.values.update({spreadsheetId:i,range:`Quotes!A${u.rowIndex}`,valueInputOption:"USER_ENTERED",requestBody:{values:[Z]}}),p.Z.sheets("Google Sheets updated with approval status",null,o),p.Z.response("Redirecting to success page",{quoteId:a,processingTime:Date.now()-r},o),t.redirect("/quote-status?status=success&message=Quote approved and sent to the customer!")}catch(e){return p.Z.error("Quote approval error",e,o),p.Z.response("Redirecting to error page",{error:e.message,processingTime:Date.now()-r},o),t.redirect("/quote-status?status=error&message=An internal server error occurred during quote approval.")}}let h=(0,i.l)(r,"default"),y=(0,i.l)(r,"config"),v=new a.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/admin/approve",pathname:"/api/admin/approve",bundlePath:"",filename:""},userland:r})},3637:(e,t,o)=>{function r(e,t,o=null,r=null){let a=new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}),n=r?`[${r}]`:"",i=o?function(e){if("object"!=typeof e||null===e)return e;let t=["password","token","secret","key","auth","credential"],o={...e};for(let e in o)t.some(t=>e.toLowerCase().includes(t))&&(o[e]="[REDACTED]");return o}(o):null,s=`[${a}] ${n} ${e} ${t}`;i?console.log(s,JSON.stringify(i,null,2)):console.log(s)}o.d(t,{Z:()=>a});let a={generateRequestId:function(){return`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`},adminAccept:(e,t=null,o=null)=>{r("[ADMIN-ACCEPT]",e,t,o)},adminDecline:(e,t=null,o=null)=>{r("[ADMIN-DECLINE]",e,t,o)},customerAccept:(e,t=null,o=null)=>{r("[CUSTOMER-ACCEPT]",e,t,o)},customerDecline:(e,t=null,o=null)=>{r("[CUSTOMER-DECLINE]",e,t,o)},apiAccept:(e,t=null,o=null)=>{r("[API-ACCEPT]",e,t,o)},apiDecline:(e,t=null,o=null)=>{r("[API-DECLINE]",e,t,o)},dataFlow:(e,t=null,o=null)=>{r("[DATA-FLOW]",e,t,o)},error:(e,t=null,o=null)=>{r("[ERROR]",e,t?{message:t.message,stack:t.stack,name:t.name}:null,o)},response:(e,t=null,o=null)=>{r("[RESPONSE]",e,t,o)},sheets:(e,t=null,o=null)=>{r("[SHEETS]",e,t,o)},email:(e,t=null,o=null)=>{r("[EMAIL]",e,t,o)},pdf:(e,t=null,o=null)=>{r("[PDF]",e,t,o)},info:(e,t=null,o=null)=>{r("[INFO]",e,t,o)},request:(e,t=null,o=null)=>{r("[REQUEST]",e,t,o)}}}};var t=require("../../../webpack-api-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[3273,3078],()=>o(1276));module.exports=r})();