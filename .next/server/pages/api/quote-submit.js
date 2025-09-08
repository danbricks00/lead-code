"use strict";(()=>{var t={};t.id=9278,t.ids=[9278],t.modules={9993:t=>{t.exports=require("googleapis")},145:t=>{t.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:t=>{t.exports=require("nodemailer")},4770:t=>{t.exports=require("crypto")},7057:(t,e,o)=>{o.r(e),o.d(e,{config:()=>h,default:()=>b,routeModule:()=>f});var a={};o.r(a),o.d(a,{default:()=>x});var r=o(1802),s=o(7153),l=o(6249),i=o(5367),n=o(3078),d=o(5116),p=o(4770),u=o.n(p);function g(t,e){let o=u().createHmac("sha256",process.env.QUOTE_LINK_SECRET);return o.update(`${t}|${e}`),o.digest("hex")}function c(t,e){let o=Date.now().toString(),a=g(e,o),r="https://lead-code-phi.vercel.app".replace(/^(https?:\/\/)/,"");return`https://${r}/api/admin/${t}?quoteId=${e}&ts=${o}&token=${a}`}function m(t,e){let o=Date.now().toString(),a=g(e,o),r="https://lead-code-phi.vercel.app".replace(/^(https?:\/\/)/,"");return`https://${r}/api/quote-decision/${t}?quoteId=${e}&ts=${o}&token=${a}`}async function x(t,e){if("POST"!==t.method)return e.status(405).json({success:!1,error:"Method Not Allowed"});try{let{quoteId:o,ts:a,token:r,quoteDetails:s,leadDetails:l}=t.body;if(!o||!a||!r||!s||!l)return e.status(400).json({success:!1,error:"Missing required fields for quote submission."});if(r!==g(o,a))return e.status(403).json({success:!1,error:"Invalid or expired link."});let p=l.Lead||l.LeadId;if(p)try{let t=(0,i.getGoogleSheetsClient)(),o=(0,i.getSpreadsheetId)();if(o){console.log(`🔍 Checking lead status for ${p}...`);let a=(await t.spreadsheets.values.get({spreadsheetId:o,range:"Leads!A:Z"})).data.values||[],r=a[0]||[],s=r.findIndex(t=>t.toLowerCase().includes("leadid")),l=r.findIndex(t=>t.toLowerCase().includes("status"));if(-1!==s&&-1!==l){for(let t=1;t<a.length;t++)if(a[t][s]===p){let o=a[t][l];if(console.log(`📊 Lead ${p} status: ${o}`),"Rejected"===o)return console.log(`❌ Lead ${p} has been rejected - blocking quote submission`),e.status(400).json({success:!1,error:"This lead has been rejected and quote submission is not allowed.",leadStatus:"Rejected"});break}}console.log(`✅ Lead ${p} status check passed - allowing quote submission`)}}catch(t){console.error("❌ Error checking lead status:",t.message)}let u=l.CustomerName||l.customerName||"Unknown Customer",x=l.CustomerEmail||l.customerEmail||"",b=l.CustomerPhone||l.customerPhone||"",h=l.Location||l.location||l.CustomerAddress||l.customerAddress||"",f=l.ServiceType||l.serviceType||"Underfloor Heating",y=s.tradespersonEmail||"",$=s.tradespersonName||"",v=s.tradespersonPhone||"",D=s.notes||"",C=s.validUntil||"",F=l.Timelline||l.Timeline||l.timeline||"",T=l.Budget||l.budget||"";console.log("\uD83D\uDCCA Quote submission data:",{quoteId:o,customerName:u,customerEmail:x,serviceType:f,tradespersonName:$}),console.log("\uD83D\uDCCB Quote details received:",JSON.stringify(s,null,2)),console.log("\uD83D\uDCCB Lead details received:",JSON.stringify(l,null,2));let w=parseFloat(s.labourRate)||0,S=parseFloat(s.labourHours)||0,Q=parseFloat(s.materialsCost)||0,N=parseFloat(s.materialsQuantity)||0,A=parseFloat(s.travelCost)||0,k=parseFloat(s.travelDistance)||0,q=parseFloat(s.installationCost)||0,E=parseFloat(s.subtotal)||0,L=parseFloat(s.gst)||0,I=parseFloat(s.totalQuote)||0,P={labourRate:w,labourHours:S,labourTotal:w*S,materialsCost:Q,materialsQuantity:N,materialsTotal:Q*N,travelCost:A,travelDistance:k,travelTotal:A*k,installationCost:q},R={subtotal:E,gst:L,final:I},H=null,G=null;try{console.log("\uD83D\uDCB0 Calculated values:",{labourRate:w,labourHours:S,materialsCost:Q,materialsQuantity:N,travelCost:A,travelDistance:k,installationCost:q,subtotal:E,gst:L,totalQuote:I});let t=l.Rooms?JSON.parse(l.Rooms):[],e=t.reduce((t,e)=>t+(parseFloat(e.sqm)||0),0),a=t.map(t=>{let o=parseFloat(t.sqm)||0,a=e>0?o/e:0;return{name:t.name,dimensions:t.dimensions||t.originalInput,sqm:o,labourHours:a*S,labourCost:w*S*a,materialsCost:Q*N*a}}),r={quoteId:o,quoteDate:new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),validUntil:s.validUntil,customerName:u,customerEmail:x,customerPhone:b,customerAddress:h,serviceType:f,tradespersonName:$,tradespersonEmail:y,tradespersonPhone:v,tradespersonLicense:"Licensed Tradesperson",rooms:a,breakdown:{labourRate:w,labourHours:S,labourTotal:w*S,materialsCost:Q,materialsQuantity:N,materialsTotal:Q*N,travelCost:A,travelDistance:k,travelTotal:A*k,installationCost:q,totalSqm:e},totals:{labour:w*S,materials:Q*N,travel:A*k,installation:q,subtotal:E,gst:L,final:I}},i=w*S,d=Q*N,p=A*k;r.totals.subtotal&&0!==r.totals.subtotal||(r.totals.subtotal=i+d+p+q),r.totals.gst&&0!==r.totals.gst||(r.totals.gst=.15*r.totals.subtotal),r.totals.final&&0!==r.totals.final||(r.totals.final=r.totals.subtotal+r.totals.gst);let g=t=>`$${parseFloat(t).toFixed(2)}`,c=g(r.totals.subtotal),m=g(r.totals.gst),D=g(r.totals.final);r.subtotal=r.totals.subtotal,r.gst=r.totals.gst,r.total=r.totals.final,r.grand_total=r.totals.final,r.totalQuote=r.totals.final,r.subtotalFormatted=c,r.gstFormatted=m,r.totalFormatted=D,console.log("\uD83D\uDCB0 Injected totals:",{numeric:{subtotal:r.totals.subtotal,gst:r.totals.gst,final:r.totals.final},formatted:{subtotal:c,gst:m,total:D}}),console.log("\uD83D\uDCCA Final quote data for PDF:",JSON.stringify(r,null,2));try{H=await (0,n.V7)(r),console.log(`✅ PDF generated successfully for Quote ${o}`)}catch(t){console.error("❌ PDF Generation failed, trying HTML backup:",t);try{G=(0,n.Ml)(r),console.log(`✅ Professional HTML quote created for Quote ${o}`)}catch(t){console.error("❌ HTML Generation also failed, using basic HTML backup:",t),G=function(t){let e=t=>{let e=parseFloat(t);return isNaN(e)?"0.00":e.toFixed(2)},o=t=>new Date(t).toLocaleDateString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric"}),a=t.rooms.map(t=>`
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
</html>`}(r),console.log(`⚠️ Basic HTML backup created for Quote ${o}`)}}}catch(t){return console.error("General Quote Generation Error:",t),e.status(500).json({success:!1,error:"Failed to generate quote."})}let j=await (0,i.getGoogleSheetsClient)(),M=(0,i.getSpreadsheetId)();try{let t=function(t=new Date){return t.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}(),e=l.Rooms?JSON.parse(l.Rooms):[],a=e.reduce((t,e)=>t+(parseFloat(e.sqm)||0),0);e.map(t=>{let e=parseFloat(t.sqm)||0,o=a>0?e/a:0;return{name:t.name,dimensions:t.dimensions||t.originalInput,sqm:e,labourHours:o*S,labourCost:w*S*o,materialsCost:Q*N*o}});let r=[[t,o,l.Lead||l.LeadId,$,y,v,"Quote Pending","Not Submitted","Not Required",P.labourRate,P.labourHours,P.labourTotal,P.materialsCost,P.materialsQuantity,P.materialsTotal,P.travelCost,P.travelDistance,P.travelTotal,P.installationCost,R.subtotal,R.gst,R.final,D||"",C,"","","",u,x,b,f,h,F,T,JSON.stringify(e||[]),JSON.stringify(P||{})]];console.log("\uD83D\uDCCA Google Sheets Append - Tradesperson Data:",{tradespersonName:$,tradespersonEmail:y,tradespersonPhone:v}),console.log("\uD83D\uDCCA Google Sheets Append - Financial Data:",{labourRate:s.labourRate,labourHours:s.labourHours,materialsCost:s.materialsCost,materialsQuantity:s.materialsQuantity,travelCost:s.travelCost,travelDistance:s.travelDistance,installationCost:s.installationCost,subtotal:s.subtotal,gst:s.gst,totalQuote:s.totalQuote}),console.log("\uD83D\uDCCA Google Sheets Append - Full Row Data:",r[0]),await j.spreadsheets.values.append({spreadsheetId:M,range:"Quotes!A:AJ",valueInputOption:"USER_ENTERED",requestBody:{values:r}}),console.log(`[SHEETS] Quote ${o} written to Quotes tab (Lead ${l.Lead||l.LeadId}).`)}catch(t){console.error("Google Sheets Error:",t)}m("accept",o),m("decline",o);let O=function(t){let e="https://lead-code-phi.vercel.app".replace(/^(https?:\/\/)/,"");return`https://${e}/quote-view/${t}`}(o),U=c("approve",o),B=c("decline-form",o),_=process.env.ADMIN_EMAIL,z=`
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">📋 Quote Ready for Review</h1>
            </div>
            <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin: 0 0 20px 0;">Quote Details</h2>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Customer Information:</h3>
                    <p><strong>Name:</strong> ${u}</p>
                    <p><strong>Email:</strong> ${x}</p>
                    <p><strong>Phone:</strong> ${b||"Not provided"}</p>
                    <p><strong>Address:</strong> ${h||"Not provided"}</p>
                    <p><strong>Service:</strong> ${f}</p>
                    <p><strong>Budget:</strong> ${l.Budget||l.budget||"Not specified"}</p>
                    <p><strong>Timeline:</strong> ${l.Timelline||l.Timeline||l.timeline||"Not specified"}</p>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Tradesperson Information:</h3>
                    <p><strong>Name:</strong> ${$}</p>
                    <p><strong>Email:</strong> ${y}</p>
                    <p><strong>Phone:</strong> ${v||"Not provided"}</p>
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
                    <a href="${U}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">✅ Approve & Send to Customer</a>
                    <a href="${B}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">❌ Decline Quote</a>
                </div>
                
                <p><em>Quote ID: ${o}</em></p>
            </div>
        </div>
    `,J=[];if(_&&_.trim()&&J.push(_.trim()),y&&y.trim()&&J.push(y.trim()),console.log("\uD83D\uDCE7 Email recipients:",J),0===J.length)console.error("❌ No valid email recipients found. ADMIN_EMAIL:",_,"tradespersonEmail:",y);else{let t;t=H?{filename:`Quote_${o}.pdf`,content:H,contentType:"application/pdf"}:G?{filename:`Quote_${o}.html`,content:Buffer.from(G,"utf8"),contentType:"text/html"}:{filename:`Quote_${o}.txt`,content:Buffer.from(`Quote ${o} - Error generating attachments`,"utf8"),contentType:"text/plain"};let e={to:J,subject:`ACTION REQUIRED: Review Quote for ${u} - $${parseFloat(I||0).toFixed(2)}`,html:z,attachments:[t]};try{await (0,d.Cz)(e),console.log(`✅ Admin/Tradesperson review email sent successfully to: ${J.join(", ")}`)}catch(t){console.error("❌ Failed to send review email:",t)}}if(console.log(`📋 Quote ${o} created and sent to admin for approval. Customer will be notified after approval.`),y&&y.trim()){let t;let e=`
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">📋 Quote Sent Successfully!</h1>
                </div>
                <div style="background: #fff; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
                    <p>Hi ${$},</p>
                    <p>Your quote for <strong>${u}</strong>'s <strong>${f}</strong> has been sent successfully.</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #333;">Quote Details:</h3>
                        <p><strong>Customer:</strong> ${u}</p>
                        <p><strong>Service:</strong> ${f}</p>
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
                        <a href="${O}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Quote Online</a>
                    </div>
                    
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        <strong>PDF Copy:</strong> A copy of the quote is attached to this email for your records.
                    </p>
                    
                    <p><em>Quote ID: ${o}</em></p>
                </div>
            </div>
        `;t=H?{filename:`Quote_${o}.pdf`,content:H,contentType:"application/pdf"}:G?{filename:`Quote_${o}.html`,content:Buffer.from(G,"utf8"),contentType:"text/html"}:{filename:`Quote_${o}.txt`,content:Buffer.from(`Quote ${o} - Error generating attachments`,"utf8"),contentType:"text/plain"};let a={to:y.trim(),subject:`📋 Quote Sent to Customer - ${f} - $${parseFloat(I||0).toFixed(2)} - ${o}`,html:e,attachments:[t]};try{await (0,d.Cz)(a),console.log(`✅ Tradesperson confirmation email sent successfully to: ${y}`)}catch(t){console.error("❌ Failed to send tradesperson email:",t)}}e.status(200).json({success:!0,message:"Quote submitted successfully with PDF generation."})}catch(t){console.error("A top-level error occurred in quote-submit:",t),e.status(500).json({success:!1,error:"A fatal error occurred during quote submission."})}}let b=(0,l.l)(a,"default"),h=(0,l.l)(a,"config"),f=new r.PagesAPIRouteModule({definition:{kind:s.x.PAGES_API,page:"/api/quote-submit",pathname:"/api/quote-submit",bundlePath:"",filename:""},userland:a})}};var e=require("../../webpack-api-runtime.js");e.C(t);var o=t=>e(e.s=t),a=e.X(0,[3273,3078],()=>o(7057));module.exports=a})();