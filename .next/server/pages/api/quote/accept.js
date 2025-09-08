"use strict";(()=>{var e={};e.id=4966,e.ids=[4966],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},8219:(e,t,o)=>{o.r(t),o.d(t,{config:()=>h,default:()=>g,routeModule:()=>f});var a={};o.r(a),o.d(a,{default:()=>m});var r=o(1802),s=o(7153),n=o(6249),i=o(5683),l=o(2393),d=o(7026),p=o(5116),u=o(3637);function c(e=new Date){return e.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}async function m(e,t){let o=u.Z.generateRequestId(),a=Date.now();if(u.Z.adminAccept("Request received",{method:e.method,url:e.url,query:e.query,headers:{"user-agent":e.headers["user-agent"]}},o),"GET"!==e.method)return u.Z.adminAccept("Method not allowed",{method:e.method},o),t.status(405).json({success:!1,error:"Method Not Allowed"});try{let{quoteId:r,ts:s,token:n}=e.query;if(!r||!s||!n)return u.Z.adminAccept("Missing required parameters",{quoteId:!!r,ts:!!s,token:!!n},o),t.status(400).json({success:!1,error:"Missing required parameters"});let m=(0,i.tB)(r,"admin-accept",{ts:s,token:n});u.Z.adminAccept("Generated mutationId",{mutationId:m},o);let g=await (0,i.Fc)(r);if(!g)return u.Z.adminAccept("Quote not found",{quoteId:r},o),t.status(404).json({success:!1,error:"Quote not found"});let h=g.data;if(u.Z.adminAccept("Found existing quote data",{quoteId:r,customerName:h.CustomerName,totalQuote:h.TotalQuote,status:h.Status},o),"Approved"===h.AdminPersonStatus){u.Z.adminAccept("Quote already approved - preventing duplicate",{quoteId:r,adminStatus:h.AdminPersonStatus},o);let e=`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Already Approved - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Already Approved</h1>
                    <div class="success">
                        <h2>This quote has already been approved.</h2>
                        <p>Quote ID: <strong>${r}</strong></p>
                        <p>Customer: <strong>${h.CustomerName}</strong></p>
                        <p>Approved on: <strong>${h.AdminPersonTimestamp}</strong></p>
                    </div>
                    <div class="info">
                        <p>The customer has been notified and can now accept or decline the quote.</p>
                    </div>
                </body>
                </html>
            `;return u.Z.response("Sending already approved page",{quoteId:r,processingTime:Date.now()-a},o),t.status(400).send(e)}if("Rejected"===h.Status){u.Z.adminAccept("Quote rejected - cannot approve",{quoteId:r,status:h.Status},o);let e=`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Rejected - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Cannot Be Approved</h1>
                    <div class="error">
                        <h2>This quote has been rejected and cannot be approved.</h2>
                        <p>Quote ID: <strong>${r}</strong></p>
                        <p>Status: <strong>Rejected</strong></p>
                    </div>
                </body>
                </html>
            `;return u.Z.response("Sending rejection page",{quoteId:r,processingTime:Date.now()-a},o),t.status(400).send(e)}if(h.LastMutationId===m){u.Z.adminAccept("Idempotency hit - quote already processed",{quoteId:r,mutationId:m},o);let e=`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Already Processed - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Already Processed</h1>
                    <div class="info">
                        <h2>This quote has already been processed.</h2>
                        <p>Quote ID: <strong>${r}</strong></p>
                        <p>No action needed.</p>
                    </div>
                </body>
                </html>
            `;return u.Z.response("Sending idempotent page",{quoteId:r,processingTime:Date.now()-a},o),t.status(200).send(e)}let f={quoteId:h.QuoteID,quoteDate:h.QuoteDate||c(),validUntil:h.ValidUntil,customerName:h.CustomerName,customerEmail:h.CustomerEmail,customerPhone:h.CustomerPhone,customerAddress:h.Location,serviceType:h.ServiceType,tradespersonName:h.TradePersonName||"Professional Tradesperson",tradespersonEmail:h.TradePersonEmail||"contact@kiwitrade.co.nz",tradespersonPhone:h.TradePersonPhone||"Contact via Kiwi Trade",tradespersonLicense:"Licensed Tradesperson",rooms:h.Rooms?JSON.parse(h.Rooms):[],breakdown:{labourRate:parseFloat(h.LabourRate)||0,labourHours:parseFloat(h.LabourHours)||0,labourTotal:parseFloat(h.LabourTotal)||0,materialsCost:parseFloat(h.MaterialsCost)||0,materialsQuantity:parseFloat(h.MaterialsQuantity)||0,materialsTotal:parseFloat(h.MaterialsTotal)||0,travelCost:parseFloat(h.TravelCost)||0,travelDistance:parseFloat(h.TravelDistance)||0,travelTotal:parseFloat(h.TravelTotal)||0,installationCost:parseFloat(h.InstallationCost)||0},totals:{labour:parseFloat(h.LabourTotal)||0,materials:parseFloat(h.MaterialsTotal)||0,travel:parseFloat(h.TravelTotal)||0,installation:parseFloat(h.InstallationCost)||0,subtotal:parseFloat(h.Subtotal)||0,gst:parseFloat(h.GST)||0,final:parseFloat(h.TotalQuote)||0}},y=(0,d.wY)(f);u.Z.adminAccept("Built customer quote data from actual quote",{quoteId:r,customerName:y.customerName,totalQuote:y.totals.final,source:"fetched-from-sheets"},o);let v=null;try{u.Z.pdf("Generating PDF for approved quote",{quoteId:r},o);let e=await (0,l.V)(y);e.success?(v=e.buffer,u.Z.pdf("PDF generated successfully",{quoteId:r,provider:e.provider,processingTime:e.processingTime},o)):u.Z.pdf("PDF generation failed",{quoteId:r,error:e.error},o)}catch(e){u.Z.error("PDF generation error",{quoteId:r,error:e.message,stack:e.stack},o)}try{u.Z.email("Sending customer quote email",{to:y.customerEmail,quoteId:r},o);let e={to:y.customerEmail,subject:`Your Quote is Ready - ${r}`,html:`
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1976d2;">Your Quote is Ready!</h2>
                        <p>Dear ${y.customerName},</p>
                        <p>Thank you for your interest in our ${y.serviceType} services. We're pleased to provide you with a detailed quote.</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #34495e; margin-top: 0;">Quote Summary</h3>
                            <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                                <div>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Quote ID:</strong> ${r}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Service:</strong> ${y.serviceType}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Location:</strong> ${y.customerAddress}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Valid Until:</strong> ${y.validUntil}</p>
                                </div>
                                <div>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Tradesperson:</strong> ${y.tradespersonName}</p>
                                    <p style="margin: 8px 0; color: #495057; font-size: 16px;"><strong>Valid Until:</strong> ${y.validUntil}</p>
                                    <p style="margin: 8px 0; color: #28a745; font-size: 18px; font-weight: bold;"><strong>Total Quote:</strong> $${y.totals.final.toFixed(2)}</p>
                                </div>
                            </div>
                            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                                <p style="color: #6c757d; font-size: 14px; margin: 0;">📎 Your detailed quote PDF is attached to this email</p>
                            </div>
                        </div>

                        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #0066cc; margin-top: 0;">Next Steps</h3>
                            <p>Please review your quote and let us know your decision:</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:"https://lead-code.vercel.app"}/quote-decision/accept?quoteId=${r}&ts=${Date.now()}&token=accept_token" 
                                   style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px;">
                                    ✅ Accept Quote
                                </a>
                                <a href="${process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:"https://lead-code.vercel.app"}/quote-decision/decline?quoteId=${r}&ts=${Date.now()}&token=decline_token" 
                                   style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px;">
                                    ❌ Decline Quote
                                </a>
                            </div>
                        </div>

                        <p>If you have any questions about this quote, please don't hesitate to contact us.</p>
                        <p>Best regards,<br><strong>Kiwi Trade Team</strong></p>
                    </div>
                `,attachments:v?[{filename:`quote-${r}.pdf`,content:v,contentType:"application/pdf"}]:[]};await (0,p.Cz)(e),u.Z.email("Customer quote email sent successfully",{to:y.customerEmail,quoteId:r,hasAttachment:!!v},o)}catch(e){u.Z.error("Failed to send customer email",{quoteId:r,error:e.message,stack:e.stack},o)}let x={AdminPersonStatus:"Approved",AdminPersonTimestamp:c(),AdminPersonNotes:"Quote approved by admin",Status:"Approved",LastMutationId:m};u.Z.sheets("Updating Google Sheets with approval status",{quoteId:r,updateData:x},o);let T=await (0,i.B9)(r,x);return u.Z.sheets("Google Sheets updated successfully",{quoteId:r,action:T.action,rowIndex:T.rowIndex},o),u.Z.response("Redirecting to success page",{quoteId:r,processingTime:Date.now()-a},o),t.redirect("/quote-status?status=success&message=Quote approved and sent to the customer!")}catch(e){return u.Z.error("Admin accept error",{error:e.message,stack:e.stack},o),t.status(500).json({success:!1,error:"Internal server error",message:e.message})}}let g=(0,n.l)(a,"default"),h=(0,n.l)(a,"config"),f=new r.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/quote/accept",pathname:"/api/quote/accept",bundlePath:"",filename:""},userland:a})},3637:(e,t,o)=>{function a(e,t,o=null,a=null){let r=new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}),s=a?`[${a}]`:"",n=o?function(e){if("object"!=typeof e||null===e)return e;let t=["password","token","secret","key","auth","credential"],o={...e};for(let e in o)t.some(t=>e.toLowerCase().includes(t))&&(o[e]="[REDACTED]");return o}(o):null,i=`[${r}] ${s} ${e} ${t}`;n?console.log(i,JSON.stringify(n,null,2)):console.log(i)}o.d(t,{Z:()=>r});let r={generateRequestId:function(){return`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`},adminAccept:(e,t=null,o=null)=>{a("[ADMIN-ACCEPT]",e,t,o)},adminDecline:(e,t=null,o=null)=>{a("[ADMIN-DECLINE]",e,t,o)},customerAccept:(e,t=null,o=null)=>{a("[CUSTOMER-ACCEPT]",e,t,o)},customerDecline:(e,t=null,o=null)=>{a("[CUSTOMER-DECLINE]",e,t,o)},apiAccept:(e,t=null,o=null)=>{a("[API-ACCEPT]",e,t,o)},apiDecline:(e,t=null,o=null)=>{a("[API-DECLINE]",e,t,o)},dataFlow:(e,t=null,o=null)=>{a("[DATA-FLOW]",e,t,o)},error:(e,t=null,o=null)=>{a("[ERROR]",e,t?{message:t.message,stack:t.stack,name:t.name}:null,o)},response:(e,t=null,o=null)=>{a("[RESPONSE]",e,t,o)},sheets:(e,t=null,o=null)=>{a("[SHEETS]",e,t,o)},email:(e,t=null,o=null)=>{a("[EMAIL]",e,t,o)},pdf:(e,t=null,o=null)=>{a("[PDF]",e,t,o)},info:(e,t=null,o=null)=>{a("[INFO]",e,t,o)},request:(e,t=null,o=null)=>{a("[REQUEST]",e,t,o)}}}};var t=require("../../../webpack-api-runtime.js");t.C(e);var o=e=>t(t.s=e),a=t.X(0,[3273,3078,5803],()=>o(8219));module.exports=a})();