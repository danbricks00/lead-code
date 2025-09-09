"use strict";(()=>{var e={};e.id=8865,e.ids=[8865],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},5470:(e,t,o)=>{o.r(t),o.d(t,{config:()=>f,default:()=>T,routeModule:()=>b});var s={};o.r(s),o.d(s,{default:()=>g});var r=o(1802),a=o(7153),i=o(6249),n=o(5683),l=o(2393),d=o(7026),u=o(5116),c=o(4770),p=o.n(c);function m(e=new Date){return e.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}async function g(e,t){let s=Date.now();if(console.log("[QUOTE-SUBMIT] Request received",{requestId:`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,method:e.method,url:e.url,query:e.query,bodyKeys:Object.keys(e.body||{}),timestamp:new Date().toISOString()}),"POST"!==e.method)return console.log(`[QUOTE-SUBMIT] Method not allowed: ${e.method}`),t.status(405).json({success:!1,error:"Method Not Allowed"});try{let{quoteId:r,ts:a,token:i,quoteDetails:c,leadDetails:g}=e.body;if(!r||!a||!i||!c||!g)return console.log("[QUOTE-SUBMIT] Missing required fields",{quoteId:!!r,ts:!!a,token:!!i,quoteDetails:!!c,leadDetails:!!g}),t.status(400).json({success:!1,error:"Missing required fields for quote submission."});if(i!==function(e,t){let o=process.env.QUOTE_SECRET||"default-secret";return p().createHash("sha256").update(`${e}:${t}:${o}`).digest("hex")}(r,a))return console.log(`[QUOTE-SUBMIT] Invalid token for quoteId: ${r}`),t.status(403).json({success:!1,error:"Invalid or expired link."});let T=(0,n.tB)(r,"quote-submit",{quoteDetails:c,leadDetails:g});console.log(`[QUOTE-SUBMIT] Generated mutationId: ${T}`);let f=g.Lead||g.LeadId;if(f)try{let{getGoogleSheetsClient:e,getSpreadsheetId:s}=await Promise.resolve().then(o.bind(o,5367)),r=e(),a=s();if(a){console.log(`[QUOTE-SUBMIT] Checking lead status for ${f}...`);let e=(await r.spreadsheets.values.get({spreadsheetId:a,range:"Leads!A:Z"})).data.values||[],o=e[0]||[],s=o.findIndex(e=>e.toLowerCase().includes("leadid")),i=o.findIndex(e=>e.toLowerCase().includes("status"));if(-1!==s&&-1!==i){for(let o=1;o<e.length;o++)if(e[o][s]===f){let s=e[o][i];if(console.log(`[QUOTE-SUBMIT] Lead ${f} status: ${s}`),"Rejected"===s)return console.log(`[QUOTE-SUBMIT] Lead ${f} has been rejected - blocking quote submission`),t.status(400).json({success:!1,error:"This lead has been rejected and quote submission is not allowed.",leadStatus:"Rejected"});break}}console.log(`[QUOTE-SUBMIT] Lead ${f} status check passed - allowing quote submission`)}}catch(e){console.error("[QUOTE-SUBMIT] Error checking lead status:",e.message)}let b=(0,d.HF)(g),h={...c},U=b.CustomerName||b.customerName||"Unknown Customer",S=b.CustomerEmail||b.customerEmail||"",v=b.CustomerPhone||b.customerPhone||"",y=b.Location||b.location||b.CustomerAddress||b.customerAddress||"",I=b.ServiceType||b.serviceType||"Underfloor Heating",w=h.tradespersonEmail||"",x=h.tradespersonName||"",E=h.tradespersonPhone||"",Q=h.notes||"",$=h.validUntil||"";b.Timelline||b.Timeline||b.timeline,b.Budget||b.budget,console.log("[QUOTE-SUBMIT] Quote submission data:",{quoteId:r,customerName:U,customerEmail:S,serviceType:I,tradespersonName:x,mutationId:T});let q=parseFloat(h.labourRate)||0,M=parseFloat(h.labourHours)||0,B=parseFloat(h.materialsCost)||0,C=parseFloat(h.materialsQuantity)||0,O=parseFloat(h.travelCost)||0,k=parseFloat(h.travelDistance)||0,F=parseFloat(h.installationCost)||0,L=parseFloat(h.subtotal)||0,D=parseFloat(h.gst)||0,P=parseFloat(h.totalQuote)||0,N={labourRate:q,labourHours:M,labourTotal:q*M,materialsCost:B,materialsQuantity:C,materialsTotal:B*C,travelCost:O,travelDistance:k,travelTotal:O*k,installationCost:F},A=b.Rooms?JSON.parse(b.Rooms):[],j=A.reduce((e,t)=>e+(parseFloat(t.sqm)||0),0),R=A.map(e=>{let t=parseFloat(e.sqm)||0,o=j>0?t/j:0;return{name:e.name,dimensions:e.dimensions,sqm:t,ratio:o,labourCost:(q*M*o).toFixed(2),materialsCost:(B*C*o).toFixed(2),travelCost:(O*k*o).toFixed(2),installationCost:(F*o).toFixed(2),subtotal:((q*M+B*C+O*k+F)*o).toFixed(2)}}),H={quoteId:r,quoteDate:m(),validUntil:$,customerName:U,customerEmail:S,customerPhone:v,customerAddress:y,serviceType:I,tradespersonName:x||"Professional Tradesperson",tradespersonEmail:w||"contact@kiwitrade.co.nz",tradespersonPhone:E||"Contact via Kiwi Trade",tradespersonLicense:"Licensed Tradesperson",rooms:R,breakdown:N,totals:{labour:N.labourTotal,materials:N.materialsTotal,travel:N.travelTotal,installation:N.installationCost,subtotal:L,gst:D,final:P}},G=(0,d.wY)(H);try{console.log(`[QUOTE-SUBMIT] Generating PDF for quoteId: ${r}`);let e=await (0,l.V)(G);e.success?(e.buffer,console.log(`[QUOTE-SUBMIT] PDF generated successfully with ${e.provider} in ${e.processingTime}ms`)):(console.warn(`[QUOTE-SUBMIT] PDF generation failed: ${e.error}`),(0,l.u)(G),console.log("[QUOTE-SUBMIT] Generated HTML backup quote"))}catch(e){console.error("[QUOTE-SUBMIT] PDF generation error:",e.message),(0,l.u)(G),console.log("[QUOTE-SUBMIT] Generated HTML backup quote after error")}let _=(0,n.Lk)(r,b,h,{LastMutationId:T,Status:"Submitted"});console.log("[QUOTE-SUBMIT] Upserting quote data to Google Sheets");let K=await (0,n.B9)(r,_);if("IDEMPOTENT"===K.action)return console.log(`[QUOTE-SUBMIT] Idempotency hit for quoteId=${r} mutationId=${T} - returning success`),t.status(200).json({success:!0,message:"Quote already submitted (idempotent)",quoteId:r,action:"idempotent",processingTime:Date.now()-s});console.log("[QUOTE-SUBMIT] Google Sheets upsert result:",K),process.env.VERCEL_URL&&process.env.VERCEL_URL;let V=m(),z=`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">✅ Quote Submitted Successfully!</h2>
                <p>Your quote has been submitted and is now being processed.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                    <p><strong>Quote ID:</strong> ${r}</p>
                    <p><strong>Customer:</strong> ${U}</p>
                    <p><strong>Service:</strong> ${I}</p>
                    <p><strong>Total Quote:</strong> $${P.toFixed(2)}</p>
                    <p><strong>Submitted:</strong> ${V}</p>
                    <p><strong>Status:</strong> Submitted and being processed</p>
                </div>

                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>📄 Professional quote document being generated</li>
                        <li>📧 Customer will receive quote email with attachment</li>
                        <li>📧 Customer can accept or decline the quote</li>
                        <li>📊 Quote status will be updated in system</li>
                    </ul>
                </div>

                <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
            </div>
        `,Z=`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">📋 New Quote Submitted</h2>
                <p>A new quote has been submitted and requires your review.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #34495e; margin-top: 0;">Quote Information:</h3>
                    <p><strong>Quote ID:</strong> ${r}</p>
                    <p><strong>Customer:</strong> ${U}</p>
                    <p><strong>Email:</strong> ${S}</p>
                    <p><strong>Phone:</strong> ${v||"Not provided"}</p>
                    <p><strong>Service:</strong> ${I}</p>
                    <p><strong>Location:</strong> ${y}</p>
                    <p><strong>Total Quote:</strong> $${P.toFixed(2)}</p>
                    <p><strong>Valid Until:</strong> ${$}</p>
                    <p><strong>Item Breakdown:</strong></p>
                    <pre style="background: #f1f1f1; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${h.itemBreakdown||"No breakdown provided"}</pre>
                    ${Q?`<p><strong>Additional Notes:</strong> ${Q}</p>`:""}
                </div>
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #1976d2; margin-top: 0;">Customer Details:</h3>
                    <p><strong>Name:</strong> ${U||"Not specified"}</p>
                    <p><strong>Email:</strong> ${S||"Not specified"}</p>
                    <p><strong>Phone:</strong> ${v||"Not specified"}</p>
                    <p><strong>Service:</strong> ${I||"Underfloor Heating"}</p>
                    <p><strong>Location:</strong> ${y||"Auckland"}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #856404; margin-top: 0;">Status:</h3>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>✅ Quote submitted successfully</li>
                        <li>📧 Customer will receive quote with attachment</li>
                        <li>📊 Quote status updated in system</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
            </div>
        `;try{console.log("[QUOTE-SUBMIT] Sending confirmation emails"),w&&(await (0,u.Cz)({to:w,subject:`✅ Quote Submitted Successfully - ${r}`,html:z}),console.log(`[QUOTE-SUBMIT] Tradesman confirmation email sent to: ${w}`));let e=process.env.ADMIN_EMAIL||"danbricks18@gmail.com";await (0,u.Cz)({to:e,subject:`📋 New Quote Submitted - ${U} (${r})`,html:Z}),console.log(`[QUOTE-SUBMIT] Admin notification email sent to: ${e}`)}catch(e){console.error("[QUOTE-SUBMIT] Email sending error:",e.message)}let Y=Date.now()-s;return console.log("[QUOTE-SUBMIT] Quote submission completed successfully",{quoteId:r,action:K.action,processingTime:Y,mutationId:T}),t.status(200).json({success:!0,message:"Quote submitted successfully",quoteId:r,action:K.action,processingTime:Y})}catch(o){let e=Date.now()-s;return console.error("[QUOTE-SUBMIT] Error:",{error:o.message,stack:o.stack,processingTime:e}),t.status(500).json({success:!1,error:"Internal server error",message:o.message,processingTime:e})}}let T=(0,i.l)(s,"default"),f=(0,i.l)(s,"config"),b=new r.PagesAPIRouteModule({definition:{kind:a.x.PAGES_API,page:"/api/quote/quote-submit",pathname:"/api/quote/quote-submit",bundlePath:"",filename:""},userland:s})}};var t=require("../../../webpack-api-runtime.js");t.C(e);var o=e=>t(t.s=e),s=t.X(0,[3273,3078,5803],()=>o(5470));module.exports=s})();