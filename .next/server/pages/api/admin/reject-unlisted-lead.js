"use strict";(()=>{var e={};e.id=7345,e.ids=[7345],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},6249:(e,o)=>{Object.defineProperty(o,"l",{enumerable:!0,get:function(){return function e(o,t){return t in o?o[t]:"then"in o&&"function"==typeof o.then?o.then(o=>e(o,t)):"function"==typeof o&&"default"===t?o:void 0}}})},6355:(e,o,t)=>{t.r(o),t.d(o,{config:()=>u,default:()=>d,routeModule:()=>c});var r={};t.r(r),t.d(r,{default:()=>l});var s=t(1802),i=t(7153),n=t(6249),a=t(5367);async function l(e,o){if(console.log("✅ Loaded API admin/reject-unlisted-lead.js"),"POST"!==e.method)return o.setHeader("Allow",["POST"]),o.status(405).json({success:!1,error:`Method ${e.method} Not Allowed. Use POST method.`});try{let{leadId:r,suburbName:s,customerEmail:i,customerName:n,adminNotes:l,rejectionReason:d}=e.body;if(!r||!s||!i)return o.status(400).json({success:!1,error:"Missing required fields: leadId, suburbName, customerEmail"});console.log(`🚫 REJECTING UNLISTED SUBURB LEAD: ${r}`),console.log(`📋 Suburb: ${s}`),console.log(`📋 Customer: ${n} (${i})`),console.log(`📋 Reason: ${d||"Outside service area"}`);let u=(()=>{let e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Pacific/Auckland"})).toLocaleString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})})();try{let e=(0,a.getGoogleSheetsClient)(),o=(0,a.getSpreadsheetId)();if(o){console.log("\uD83D\uDCCA Updating unlisted suburb status in Google Sheets...");let t=(await e.spreadsheets.values.get({spreadsheetId:o,range:"UnlistedSuburbs!A:P"})).data.values||[],s=(t[0]||[]).findIndex(e=>e.toLowerCase().includes("leadid"));if(-1===s)throw Error("LeadID column not found in UnlistedSuburbs sheet");let i=-1;for(let e=1;e<t.length;e++)if(t[e][s]===r){i=e+1;break}if(-1===i)throw Error(`Lead ID ${r} not found in UnlistedSuburbs sheet`);let n=["","","","","","","","","","","","","Rejected",l||d||"Outside service area","Rejected",u];await e.spreadsheets.values.update({spreadsheetId:o,range:`UnlistedSuburbs!M${i}:P${i}`,valueInputOption:"USER_ENTERED",requestBody:{values:[n.slice(12,16)]}}),console.log("✅ Unlisted suburb status updated in Google Sheets")}}catch(e){console.error("❌ Failed to update Google Sheets:",e.message)}try{let e=t(5184).createTransporter({service:"gmail",auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}}),o={from:process.env.GMAIL_USER,to:i,subject:"Service Area Update - Kiwi Trade",html:`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
              Kiwi Trade - Service Area Update
            </h2>
            
            <p>Dear ${n},</p>
            
            <p>Thank you for your interest in our underfloor heating services.</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Service Area Information</h3>
              <p>We currently provide services in the Greater Auckland region. Unfortunately, we are not able to service <strong>${s}</strong> at this time.</p>
              <p><strong>Reason:</strong> ${d||"Outside our current service area"}</p>
            </div>

            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">What's Next?</h3>
              <p>We're constantly expanding our service areas. If you'd like to be notified when we start servicing ${s}, please reply to this email and we'll add you to our notification list.</p>
              <p>You can also check our website regularly for service area updates.</p>
            </div>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Alternative Options</h3>
              <p>If you're planning to move to an area we do service, or if you have any questions about our services, please don't hesitate to contact us.</p>
            </div>

            <p>Thank you for considering Kiwi Trade for your underfloor heating needs.</p>
            
            <p>Best regards,<br>
            The Kiwi Trade Team</p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px;">
                This email was sent regarding Lead ID: ${r}<br>
                Timestamp: ${u}
              </p>
            </div>
          </div>
        `};await e.sendMail(o),console.log("✅ Rejection email sent to customer")}catch(e){console.error("❌ Failed to send rejection email:",e.message)}return console.log("\uD83D\uDEAB UNLISTED SUBURB LEAD REJECTED:"),console.log(`   Lead ID: ${r}`),console.log(`   Suburb: ${s}`),console.log(`   Customer: ${n} (${i})`),console.log(`   Reason: ${d||"Outside service area"}`),console.log(`   Timestamp: ${u}`),o.status(200).json({success:!0,message:"Lead rejected and customer notified",leadId:r,suburbName:s,customerEmail:i,timestamp:u})}catch(e){return console.error("❌ Reject unlisted lead API error:",e.message),o.status(500).json({success:!1,error:"Internal server error",message:e.message})}}let d=(0,n.l)(r,"default"),u=(0,n.l)(r,"config"),c=new s.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/admin/reject-unlisted-lead",pathname:"/api/admin/reject-unlisted-lead",bundlePath:"",filename:""},userland:r})},5367:(e,o,t)=>{let r;t.d(o,{getGoogleSheetsClient:()=>i,getSpreadsheetId:()=>n});var s=t(9993);function i(){if(r)return r;try{console.log("Attempting to initialize Google Sheets client...");let e=process.env.GOOGLE_CLIENT_EMAIL,o=process.env.GOOGLE_PRIVATE_KEY;if(!e||!o)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let t=o.replace(/\n/g,"\\n"),i=JSON.parse(`"${t}"`),n=new s.google.auth.JWT(e,null,i,["https://www.googleapis.com/auth/spreadsheets"]);return r=s.google.sheets({version:"v4",auth:n}),console.log("✅ Google Sheets client initialized successfully."),r}catch(e){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",e.message),Error(`Google Sheets initialization failed: ${e.message}`)}}function n(){let e=process.env.GOOGLE_SHEET_ID;if(!e)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return e}},7153:(e,o)=>{var t;Object.defineProperty(o,"x",{enumerable:!0,get:function(){return t}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(t||(t={}))},1802:(e,o,t)=>{e.exports=t(145)}};var o=require("../../../webpack-api-runtime.js");o.C(e);var t=o(o.s=6355);module.exports=t})();