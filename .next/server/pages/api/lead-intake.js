"use strict";(()=>{var e={};e.id=6947,e.ids=[6947],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,o){return o in t?t[o]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,o)):"function"==typeof t&&"default"===o?t:void 0}}})},2652:(e,t,o)=>{o.r(t),o.d(t,{config:()=>m,default:()=>h,routeModule:()=>f});var r={};o.r(r),o.d(r,{default:()=>g});var i=o(1802),n=o(7153),s=o(6249),a=o(5367),l=o(5184),d=o.n(l),c=o(4770),u=o.n(c);async function p(e,t,o){let r=process.env.GOOGLE_SHEET_ID;if(!r)throw console.error("❌Sheets Config Error: GOOGLE_SHEET_ID is not set."),Error("Google Sheet ID is not configured.");try{console.log(`Attempting to append row to tab: ${t}`),await e.spreadsheets.values.append({spreadsheetId:r,range:`${t}!A1`,valueInputOption:"USER_ENTERED",insertDataOption:"INSERT_ROWS",requestBody:{values:[o]}}),console.log(`✅ Successfully appended row to tab: ${t}`)}catch(e){throw console.error(`❌ Google Sheets API Error while appending to ${t}:`,e.message),e.response&&e.response.data&&console.error("Full Sheets API response:",e.response.data),Error("Failed to write data to Google Sheet.")}}async function g(e,t){if(console.log("\n--- New Lead Intake Request ---"),console.log("Timestamp:",new Date().toISOString()),console.log("Request Body Received:",JSON.stringify(e.body,null,2)),"POST"!==e.method)return t.status(405).json({success:!1,error:"Method not allowed"});let{customerName:o,customerEmail:r,customerPhone:i,serviceType:n,rooms:s,area:l,suburb:c,timeline:g,budget:h,specificDetails:m,projectDetails:f,projectSize:b,isUnlistedSuburb:E,suburbAdditionalInfo:S}=e.body;if(!o||!r)return console.error("Validation Error: Missing customerName or customerEmail."),t.status(400).json({success:!1,error:"Missing required fields"});try{let e=u().randomBytes(6).toString("hex"),b=u().randomBytes(6).toString("hex"),S=(0,a.getGoogleSheetsClient)();console.log("Appending data to 'Leads' tab with exact schema..."),await p(S,"Leads",[e,o,r,i||"",n||"Underfloor Heating",JSON.stringify(s||[]),l||"",c||"",h||"",g||"",m||f||"",new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),"","New Lead"]),console.log("Appending data to 'Quotes' tab with exact format..."),await p(S,"Quotes",[new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),b,e,"","","","Quote Pending","Not Submitted","Not Required","","","","","","","","","","","","","","","","","","",o,r,i||"",n||"Underfloor Heating",`${c||""}${c&&l?", ":""}${l||""}`,g||"",h||"",JSON.stringify(s||[]),""]),console.log("Step 3: Preparing email content...");let v="https://lead-code-phi.vercel.app";if(!v)throw console.error("❌ CRITICAL: NEXT_PUBLIC_BASE_URL is not defined."),Error("Server configuration error: base URL not set.");let w=v.replace(/^(https?:\/\/)/,""),$=Date.now(),A=u().createHmac("sha256",process.env.QUOTE_LINK_SECRET).update(`${b}|${$}`).digest("hex"),L=`https://${w}/quote-submit/${b}?ts=${$}&token=${A}`;console.log("Constructed quote link:",L);let P=s&&s.length>0?`<li><b>Room Details:</b><ul>${s.map(e=>`<li>${e.name||"Unnamed"}: ${e.dimensions||"N/A"}</li>`).join("")}</ul></li>`:"",y=E?`
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="color: #856404; margin-top: 0;">🚨 UNLISTED SUBURB ALERT</h3>
        <p><strong>Suburb:</strong> ${c}</p>
        <p><strong>Status:</strong> This suburb is not in our current service list</p>
        <p><strong>Action Required:</strong> Please review if we can service this area or reject the lead</p>
        
        <div style="margin-top: 15px; text-align: center;">
          <a href="https://${w}/admin-unlisted-suburbs.html" 
             style="display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">
            📋 Manage Unlisted Suburbs
          </a>
        </div>
        
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          <p><strong>Quick Actions:</strong></p>
          <ul style="margin: 5px 0; padding-left: 20px;">
            <li>Review the suburb and decide if we can service it</li>
            <li>Reject the lead if outside our service area</li>
            <li>Contact customer for clarification if needed</li>
          </ul>
        </div>
      </div>
    `:"",I=`
      <p>A new lead has been received with the following details:</p>
      ${y}
      <ul>
        <li><b>Lead ID:</b> ${e}</li>
        <li><b>Customer Name:</b> ${o}</li>
        <li><b>Email:</b> ${r}</li>
        <li><b>Phone:</b> ${i||"Not provided"}</li>
        <li><b>Service:</b> ${n||"Underfloor Heating"}</li>
        <li><b>Location:</b> ${c||""}${c&&l?", ":""}${l||""}</li>
        <li><b>Budget:</b> ${h||"Not specified"}</li>
        <li><b>Timeline:</b> ${g||"Not specified"}</li>
        ${P}
        ${E?`<li><b>⚠️ Unlisted Suburb:</b> ${c} (not in service list)</li>`:""}
      </ul>
    `,G=`
      <hr>
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>⚪ Quote Pending</li>
        <li>⚪ Decision Pending</li>
      </ul>
    `,_=d().createTransport({service:"gmail",auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}}),R={from:`"Kiwi Trade" <${process.env.GMAIL_USER}>`,to:r,subject:"✅ We've Received Your Underfloor Heating Quote Request!",html:`<p>Hi ${o},</p><p>Thanks for your request. We've received your project details and a tradesperson will be in touch with a quote shortly.</p><p>For your records, here are the details you provided:</p>${I}${G}`},O=E?"\uD83D\uDEA8 UNLISTED SUBURB - ":"",T={from:`"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,to:"quangbui0600@gmail.com",subject:`${O}🔔 New Underfloor Heating Lead: ${c||l}`,html:`<h1>New Lead Received</h1>${I}<p>Please prepare a quote for this customer by clicking the link below:</p><h2><a href="${L}">Submit Your Quote Now</a></h2>`},x={from:`"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,to:"danbricks18@gmail.com",subject:`${O}New Lead Logged: ${o} in ${c||l}`,html:`<h1>New Lead Logged (#${e})</h1>${I}<p>A quote link has been sent to the tradesperson.</p><p>Quote Link: ${L}</p>`};return console.log("Step 4: Dispatching emails..."),await _.sendMail(R),console.log(`- Customer email sent to ${r}`),await _.sendMail(T),console.log("- Tradesperson email sent."),await _.sendMail(x),console.log("- Admin email sent."),console.log("--- Lead Intake Request Succeeded ---"),t.status(200).json({success:!0,quoteId:b,leadId:e})}catch(e){return console.error("--- Lead Intake Request Failed ---"),console.error("Error Timestamp:",new Date().toISOString()),console.error("Caught Error:",e.message),t.status(500).json({success:!1,error:"Internal server error"})}}let h=(0,s.l)(r,"default"),m=(0,s.l)(r,"config"),f=new i.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/lead-intake",pathname:"/api/lead-intake",bundlePath:"",filename:""},userland:r})},5367:(e,t,o)=>{let r;o.d(t,{getGoogleSheetsClient:()=>n,getSpreadsheetId:()=>s});var i=o(9993);function n(){if(r)return r;try{console.log("Attempting to initialize Google Sheets client...");let e=process.env.GOOGLE_CLIENT_EMAIL,t=process.env.GOOGLE_PRIVATE_KEY;if(!e||!t)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let o=t.replace(/\n/g,"\\n"),n=JSON.parse(`"${o}"`),s=new i.google.auth.JWT(e,null,n,["https://www.googleapis.com/auth/spreadsheets"]);return r=i.google.sheets({version:"v4",auth:s}),console.log("✅ Google Sheets client initialized successfully."),r}catch(e){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",e.message),Error(`Google Sheets initialization failed: ${e.message}`)}}function s(){let e=process.env.GOOGLE_SHEET_ID;if(!e)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return e}},7153:(e,t)=>{var o;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return o}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(o||(o={}))},1802:(e,t,o)=>{e.exports=o(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var o=t(t.s=2652);module.exports=o})();