"use strict";(()=>{var t={};t.id=9278,t.ids=[9278],t.modules={9993:t=>{t.exports=require("googleapis")},145:t=>{t.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:t=>{t.exports=require("nodemailer")},4770:t=>{t.exports=require("crypto")},7057:(t,e,o)=>{o.r(e),o.d(e,{config:()=>h,default:()=>b,routeModule:()=>f});var a={};o.r(a),o.d(a,{default:()=>x});var r=o(1802),s=o(7153),l=o(6249),i=o(5367),n=o(3078),d=o(5116),p=o(4770),u=o.n(p);function g(t,e){let o=u().createHmac("sha256",process.env.QUOTE_LINK_SECRET);return o.update(`${t}|${e}`),o.digest("hex")}function c(t,e){let o=Date.now().toString(),a=g(e,o),r=(process.env.NEXT_PUBLIC_BASE_URL||"").replace(/^(https?:\/\/)/,"");return`https://${r}/api/admin/${t}?quoteId=${e}&ts=${o}&token=${a}`}function m(t,e){let o=Date.now().toString(),a=g(e,o),r=(process.env.NEXT_PUBLIC_BASE_URL||"").replace(/^(https?:\/\/)/,"");return`https://${r}/api/quote-decision/${t}?quoteId=${e}&ts=${o}&token=${a}`}async function x(t,e){if("POST"!==t.method)return e.status(405).json({success:!1,error:"Method Not Allowed"});try{let{quoteId:o,ts:a,token:r,quoteDetails:s,leadDetails:l}=t.body;if(!o||!a||!r||!s||!l)return e.status(400).json({success:!1,error:"Missing required fields for quote submission."});if(r!==g(o,a))return e.status(403).json({success:!1,error:"Invalid or expired link."});let p=l.CustomerName||l.customerName||"Unknown Customer",u=l.CustomerEmail||l.customerEmail||"",x=l.CustomerPhone||l.customerPhone||"",b=l.Location||l.location||l.CustomerAddress||l.customerAddress||"",h=l.ServiceType||l.serviceType||"Underfloor Heating",f=s.tradespersonEmail||"",y=s.tradespersonName||"",$=s.tradespersonPhone||"",v=s.notes||"",D=s.validUntil||"",C=l.Timelline||l.Timeline||l.timeline||"",F=l.Budget||l.budget||"";console.log("\uD83D\uDCCA Quote submission data:",{quoteId:o,customerName:p,customerEmail:u,serviceType:h,tradespersonName:y}),console.log("\uD83D\uDCCB Quote details received:",JSON.stringify(s,null,2)),console.log("\uD83D\uDCCB Lead details received:",JSON.stringify(l,null,2));let T=parseFloat(s.labourRate)||0,w=parseFloat(s.labourHours)||0,Q=parseFloat(s.materialsCost)||0,S=parseFloat(s.materialsQuantity)||0,N=parseFloat(s.travelCost)||0,A=parseFloat(s.travelDistance)||0,E=parseFloat(s.installationCost)||0,q=parseFloat(s.subtotal)||0,k=parseFloat(s.gst)||0,L=parseFloat(s.totalQuote)||0,I={labourRate:T,labourHours:w,labourTotal:T*w,materialsCost:Q,materialsQuantity:S,materialsTotal:Q*S,travelCost:N,travelDistance:A,travelTotal:N*A,installationCost:E},P={subtotal:q,gst:k,final:L},R=null,H=null;try{console.log("\uD83D\uDCB0 Calculated values:",{labourRate:T,labourHours:w,materialsCost:Q,materialsQuantity:S,travelCost:N,travelDistance:A,installationCost:E,subtotal:q,gst:k,totalQuote:L});let t=l.Rooms?JSON.parse(l.Rooms):[],e=t.reduce((t,e)=>t+(parseFloat(e.sqm)||0),0),a=t.map(t=>{let o=parseFloat(t.sqm)||0,a=e>0?o/e:0;return{name:t.name,dimensions:t.dimensions||t.originalInput,sqm:o,labourHours:a*w,labourCost:T*w*a,materialsCost:Q*S*a}}),r={quoteId:o,quoteDate:new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),validUntil:s.validUntil,customerName:p,customerEmail:u,customerPhone:x,customerAddress:b,serviceType:h,tradespersonName:y,tradespersonEmail:f,tradespersonPhone:$,tradespersonLicense:"Licensed Tradesperson",rooms:a,breakdown:{labourRate:T,labourHours:w,labourTotal:T*w,materialsCost:Q,materialsQuantity:S,materialsTotal:Q*S,travelCost:N,travelDistance:A,travelTotal:N*A,installationCost:E,totalSqm:e},totals:{labour:T*w,materials:Q*S,travel:N*A,installation:E,subtotal:q,gst:k,final:L}},i=T*w,d=Q*S,g=N*A;r.totals.subtotal&&0!==r.totals.subtotal||(r.totals.subtotal=i+d+g+E),r.totals.gst&&0!==r.totals.gst||(r.totals.gst=.15*r.totals.subtotal),r.totals.final&&0!==r.totals.final||(r.totals.final=r.totals.subtotal+r.totals.gst);let c=t=>`$${parseFloat(t).toFixed(2)}`,m=c(r.totals.subtotal),v=c(r.totals.gst),D=c(r.totals.final);r.subtotal=r.totals.subtotal,r.gst=r.totals.gst,r.total=r.totals.final,r.grand_total=r.totals.final,r.totalQuote=r.totals.final,r.subtotalFormatted=m,r.gstFormatted=v,r.totalFormatted=D,console.log("\uD83D\uDCB0 Injected totals:",{numeric:{subtotal:r.totals.subtotal,gst:r.totals.gst,final:r.totals.final},formatted:{subtotal:m,gst:v,total:D}}),console.log("\uD83D\uDCCA Final quote data for PDF:",JSON.stringify(r,null,2));try{R=await (0,n.V7)(r),console.log(`✅ PDF generated successfully for Quote ${o}`)}catch(t){console.error("❌ PDF Generation failed, trying HTML backup:",t);try{H=(0,n.Ml)(r),console.log(`✅ Professional HTML quote created for Quote ${o}`)}catch(t){console.error("❌ HTML Generation also failed, using basic HTML backup:",t),H=function(t){let e=t=>{let e=parseFloat(t);return isNaN(e)?"0.00":e.toFixed(2)},o=t=>new Date(t).toLocaleDateString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric"}),a=t.rooms.map(t=>`
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${t.name||"N/A"}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${t.dimensions||"N/A"}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${t.sqm?e(t.sqm)+"m\xb2":"N/A"}</td>
        </tr>
    `).join("");return`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quote ${t.quoteId}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .total-row { background: #667eea; color: white; font-weight: bold; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 KIWI TRADE - QUOTE</h1>
        <p>Quote ID: ${t.quoteId}</p>
        <p>Date: ${o(t.quoteDate)}</p>
        <p>Valid Until: ${o(t.validUntil)}</p>
    </div>

    <div class="section">
        <h2>Customer Details</h2>
        <p><strong>Name:</strong> ${t.customerName}</p>
        <p><strong>Email:</strong> ${t.customerEmail}</p>
        <p><strong>Phone:</strong> ${t.customerPhone||"N/A"}</p>
        <p><strong>Address:</strong> ${t.customerAddress||"N/A"}</p>
        <p><strong>Service:</strong> ${t.serviceType}</p>
    </div>

    <div class="section">
        <h2>Tradesperson Details</h2>
        <p><strong>Name:</strong> ${t.tradespersonName}</p>
        <p><strong>Email:</strong> ${t.tradespersonEmail}</p>
        <p><strong>Phone:</strong> ${t.tradespersonPhone}</p>
        <p><strong>License:</strong> ${t.tradespersonLicense}</p>
    </div>

    <div class="section">
        <h2>Project Details</h2>
        <table>
            <thead>
                <tr>
                    <th>Room Name</th>
                    <th>Dimensions</th>
                    <th>Square Meters</th>
                </tr>
            </thead>
            <tbody>
                ${a}
            </tbody>
        </table>
    </div>

    <div class="summary">
        <h2>Quote Summary</h2>
        <table>
            <tr><td><strong>Labour:</strong></td><td style="text-align: right;">$${e(t.totals.labour)}</td></tr>
            <tr><td><strong>Materials:</strong></td><td style="text-align: right;">$${e(t.totals.materials)}</td></tr>
            <tr><td><strong>Travel:</strong></td><td style="text-align: right;">$${e(t.totals.travel)}</td></tr>
            <tr><td><strong>Installation:</strong></td><td style="text-align: right;">$${e(t.totals.installation)}</td></tr>
            <tr style="border-top: 2px solid #333;"><td><strong>Subtotal (excl. GST):</strong></td><td style="text-align: right;"><strong>$${e(t.totals.subtotal)}</strong></td></tr>
            <tr><td><strong>GST (15%):</strong></td><td style="text-align: right;">$${e(t.totals.gst)}</td></tr>
            <tr class="total-row"><td><strong>TOTAL (incl. GST):</strong></td><td style="text-align: right;"><strong>$${e(t.totals.final)}</strong></td></tr>
        </table>
    </div>

    <div class="section">
        <h3>Terms & Conditions</h3>
        <p>• This quote is valid for 14 days from the date of issue.</p>
        <p>• Payment terms: 50% deposit required to commence work, balance due upon completion.</p>
        <p>• All work is covered by our comprehensive warranty.</p>
        <p>• We are fully licensed and insured for your peace of mind.</p>
    </div>

    <p style="text-align: center; color: #666; margin-top: 30px;">
        Thank you for choosing Kiwi Trade for your underfloor heating needs.
    </p>
</body>
</html>`}(r),console.log(`⚠️ Basic HTML backup created for Quote ${o}`)}}}catch(t){return console.error("General Quote Generation Error:",t),e.status(500).json({success:!1,error:"Failed to generate quote."})}let U=await (0,i.r)(),_=(0,i.D)();try{let t=function(t=new Date){return t.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}(),e=l.Rooms?JSON.parse(l.Rooms):[],a=e.reduce((t,e)=>t+(parseFloat(e.sqm)||0),0);e.map(t=>{let e=parseFloat(t.sqm)||0,o=a>0?e/a:0;return{name:t.name,dimensions:t.dimensions||t.originalInput,sqm:e,labourHours:o*w,labourCost:T*w*o,materialsCost:Q*S*o}});let r=[[t,o,l.Lead||l.LeadId,y,f,$,"Quote Pending","Not Submitted","Not Required",I.labourRate,I.labourHours,I.labourTotal,I.materialsCost,I.materialsQuantity,I.materialsTotal,I.travelCost,I.travelDistance,I.travelTotal,I.installationCost,P.subtotal,P.gst,P.final,v||"",D,"","","",p,u,x,h,b,C,F,JSON.stringify(e||[]),JSON.stringify(I||{})]];console.log("\uD83D\uDCCA Google Sheets Append - Tradesperson Data:",{tradespersonName:y,tradespersonEmail:f,tradespersonPhone:$}),console.log("\uD83D\uDCCA Google Sheets Append - Financial Data:",{labourRate:s.labourRate,labourHours:s.labourHours,materialsCost:s.materialsCost,materialsQuantity:s.materialsQuantity,travelCost:s.travelCost,travelDistance:s.travelDistance,installationCost:s.installationCost,subtotal:s.subtotal,gst:s.gst,totalQuote:s.totalQuote}),console.log("\uD83D\uDCCA Google Sheets Append - Full Row Data:",r[0]),await U.spreadsheets.values.append({spreadsheetId:_,range:"Quotes!A:AJ",valueInputOption:"USER_ENTERED",requestBody:{values:r}}),console.log(`[SHEETS] Quote ${o} written to Quotes tab (Lead ${l.Lead||l.LeadId}).`)}catch(t){console.error("Google Sheets Error:",t)}m("accept",o),m("decline",o);let B=function(t){let e=(process.env.NEXT_PUBLIC_BASE_URL||"").replace(/^(https?:\/\/)/,"");return`https://${e}/quote-view/${t}`}(o),G=c("approve",o),M=c("decline-form",o),O=process.env.ADMIN_EMAIL,j=`
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">📋 Quote Ready for Review</h1>
            </div>
            <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin: 0 0 20px 0;">Quote Details</h2>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Customer Information:</h3>
                    <p><strong>Name:</strong> ${p}</p>
                    <p><strong>Email:</strong> ${u}</p>
                    <p><strong>Phone:</strong> ${x||"Not provided"}</p>
                    <p><strong>Address:</strong> ${b||"Not provided"}</p>
                    <p><strong>Service:</strong> ${h}</p>
                    <p><strong>Budget:</strong> ${l.Budget||l.budget||"Not specified"}</p>
                    <p><strong>Timeline:</strong> ${l.Timelline||l.Timeline||l.timeline||"Not specified"}</p>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Tradesperson Information:</h3>
                    <p><strong>Name:</strong> ${y}</p>
                    <p><strong>Email:</strong> ${f}</p>
                    <p><strong>Phone:</strong> ${$||"Not provided"}</p>
                </div>

                <h3>Quote Summary:</h3>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Labour (${s.labourHours}h @ $${s.labourRate}/h):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(s.labourRate)*parseFloat(s.labourHours)||0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Materials (${s.materialsQuantity}m\xb2 @ $${s.materialsCost}/m\xb2):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(s.materialsCost)*parseFloat(s.materialsQuantity)||0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Travel (${s.travelDistance}km @ $${s.travelCost}/km):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(s.travelCost)*parseFloat(s.travelDistance)||0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Installation:</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${parseFloat(s.installationCost||0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 8px 0; font-weight: bold;">Subtotal (excl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold;">$${parseFloat(s.subtotal||0).toFixed(2)}</td></tr>
                        <tr><td style="padding: 5px 0;">GST (15%):</td><td style="text-align: right; padding: 5px 0;">$${parseFloat(s.gst||0).toFixed(2)}</td></tr>
                        <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0; font-weight: bold; font-size: 1.1em;">Total (incl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold; font-size: 1.1em;">$${parseFloat(s.totalQuote||0).toFixed(2)}</td></tr>
                    </table>
                </div>
                <p><strong>Valid Until:</strong> ${new Date(s.validUntil).toLocaleDateString("en-NZ")}</p>
                ${s.notes?`<p><strong>Notes:</strong> ${s.notes}</p>`:""}
                
                <div style="margin: 20px 0; text-align: center;">
                    <a href="${G}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">✅ Approve & Send to Customer</a>
                    <a href="${M}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">❌ Decline Quote</a>
                </div>
                
                <p><em>Quote ID: ${o}</em></p>
            </div>
        </div>
    `,z=[];if(O&&O.trim()&&z.push(O.trim()),f&&f.trim()&&z.push(f.trim()),console.log("\uD83D\uDCE7 Email recipients:",z),0===z.length)console.error("❌ No valid email recipients found. ADMIN_EMAIL:",O,"tradespersonEmail:",f);else{let t;t=R?{filename:`Quote_${o}.pdf`,content:R,contentType:"application/pdf"}:H?{filename:`Quote_${o}.html`,content:Buffer.from(H,"utf8"),contentType:"text/html"}:{filename:`Quote_${o}.txt`,content:Buffer.from(`Quote ${o} - Error generating attachments`,"utf8"),contentType:"text/plain"};let e={to:z,subject:`ACTION REQUIRED: Review Quote for ${p} - $${parseFloat(L||0).toFixed(2)}`,html:j,attachments:[t]};try{await (0,d.Cz)(e),console.log(`✅ Admin/Tradesperson review email sent successfully to: ${z.join(", ")}`)}catch(t){console.error("❌ Failed to send review email:",t)}}if(console.log(`📋 Quote ${o} created and sent to admin for approval. Customer will be notified after approval.`),f&&f.trim()){let t;let e=`
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">📋 Quote Sent Successfully!</h1>
                </div>
                <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p>Hi ${y},</p>
                    <p>Your quote for <strong>${p}</strong>'s <strong>${h}</strong> has been sent successfully.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Quote Details:</h3>
                        <p><strong>Customer:</strong> ${p}</p>
                        <p><strong>Service:</strong> ${h}</p>
                        <p><strong>Valid Until:</strong> ${new Date(s.validUntil).toLocaleDateString("en-NZ")}</p>
                        
                        <h4 style="margin: 15px 0 10px 0; color: #333;">Cost Breakdown:</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Labour (${s.labourHours}h @ $${s.labourRate}/h):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(s.labourRate)*parseFloat(s.labourHours)||0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Materials (${s.materialsQuantity}m\xb2 @ $${s.materialsCost}/m\xb2):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(s.materialsCost)*parseFloat(s.materialsQuantity)||0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Travel (${s.travelDistance}km @ $${s.travelCost}/km):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(s.travelCost)*parseFloat(s.travelDistance)||0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Installation:</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${parseFloat(s.installationCost||0).toFixed(2)}</td></tr>
                            <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0 5px 0; font-weight: bold;">Subtotal (excl. GST):</td><td style="text-align: right; padding: 8px 0 5px 0; font-weight: bold;">$${parseFloat(s.subtotal||0).toFixed(2)}</td></tr>
                            <tr><td style="padding: 5px 0;">GST (15%):</td><td style="text-align: right; padding: 5px 0;">$${parseFloat(s.gst||0).toFixed(2)}</td></tr>
                            <tr style="background: #28a745; color: white;"><td style="padding: 10px 5px; font-weight: bold; font-size: 16px;">TOTAL (incl. GST):</td><td style="text-align: right; padding: 10px 5px; font-weight: bold; font-size: 16px;">$${parseFloat(s.totalQuote||0).toFixed(2)}</td></tr>
                        </table>
                    </div>
                    
                    <p>The customer will receive an email with your quote and can accept or decline it.</p>
                    <p>You will be notified immediately when they make their decision.</p>
                    
                    <div style="margin: 20px 0; text-align: center;">
                        <a href="${B}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Quote Online</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        <strong>PDF Copy:</strong> A copy of the quote is attached to this email for your records.
                    </p>
                    
                    <p><em>Quote ID: ${o}</em></p>
                </div>
            </div>
        `;t=R?{filename:`Quote_${o}.pdf`,content:R,contentType:"application/pdf"}:H?{filename:`Quote_${o}.html`,content:Buffer.from(H,"utf8"),contentType:"text/html"}:{filename:`Quote_${o}.txt`,content:Buffer.from(`Quote ${o} - Error generating attachments`,"utf8"),contentType:"text/plain"};let a={to:f.trim(),subject:`📋 Quote Sent to Customer - ${h} - $${parseFloat(L||0).toFixed(2)} - ${o}`,html:e,attachments:[t]};try{await (0,d.Cz)(a),console.log(`✅ Tradesperson confirmation email sent successfully to: ${f}`)}catch(t){console.error("❌ Failed to send tradesperson email:",t)}}e.status(200).json({success:!0,message:"Quote submitted successfully with PDF generation."})}catch(t){console.error("A top-level error occurred in quote-submit:",t),e.status(500).json({success:!1,error:"A fatal error occurred during quote submission."})}}let b=(0,l.l)(a,"default"),h=(0,l.l)(a,"config"),f=new r.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/quote-submit",pathname:"/api/quote-submit",bundlePath:"",filename:""},userland:a})}};var e=require("../../webpack-api-runtime.js");e.C(t);var o=t=>e(e.s=t),a=e.X(0,[3273,3078],()=>o(7057));module.exports=a})();