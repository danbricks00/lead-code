"use strict";(()=>{var e={};e.id=7345,e.ids=[7345],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},6249:(e,r)=>{Object.defineProperty(r,"l",{enumerable:!0,get:function(){return function e(r,o){return o in r?r[o]:"then"in r&&"function"==typeof r.then?r.then(r=>e(r,o)):"function"==typeof r&&"default"===o?r:void 0}}})},6355:(e,r,o)=>{o.r(r),o.d(r,{config:()=>u,default:()=>d,routeModule:()=>c});var t={};o.r(t),o.d(t,{default:()=>l});var s=o(1802),i=o(7153),n=o(6249),a=o(5367);async function l(e,r){if(console.log("✅ Loaded API admin/reject-unlisted-lead.js"),"POST"!==e.method)return r.setHeader("Allow",["POST"]),r.status(405).json({success:!1,error:`Method ${e.method} Not Allowed. Use POST method.`});try{let{leadId:t,suburbName:s,customerEmail:i,customerName:n,adminNotes:l,rejectionReason:d}=e.body;if(!t||!s||!i)return r.status(400).json({success:!1,error:"Missing required fields: leadId, suburbName, customerEmail"});console.log(`🚫 REJECTING UNLISTED SUBURB LEAD: ${t}`),console.log(`📋 Suburb: ${s}`),console.log(`📋 Customer: ${n} (${i})`),console.log(`📋 Reason: ${d||"Outside service area"}`);let u=(()=>{let e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Pacific/Auckland"})).toLocaleString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})})();try{let e=(0,a.r)(),r=(0,a.D)();if(r){console.log("\uD83D\uDCCA Updating unlisted suburb status in Google Sheets...");let o=(await e.spreadsheets.values.get({spreadsheetId:r,range:"UnlistedSuburbs!A:P"})).data.values||[],s=(o[0]||[]).findIndex(e=>e.toLowerCase().includes("leadid"));if(-1===s)throw Error("LeadID column not found in UnlistedSuburbs sheet");let i=-1;for(let e=1;e<o.length;e++)if(o[e][s]===t){i=e+1;break}if(-1===i)throw Error(`Lead ID ${t} not found in UnlistedSuburbs sheet`);let n=["","","","","","","","","","","","","Rejected",l||d||"Outside service area","Rejected",u];await e.spreadsheets.values.update({spreadsheetId:r,range:`UnlistedSuburbs!M${i}:P${i}`,valueInputOption:"USER_ENTERED",requestBody:{values:[n.slice(12,16)]}}),console.log("✅ Unlisted suburb status updated in Google Sheets")}}catch(e){console.error("❌ Failed to update Google Sheets:",e.message)}try{let e=o(5184).createTransporter({service:"gmail",auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}}),r={from:process.env.GMAIL_USER,to:i,subject:"Service Area Update - Kiwi Trade",html:`
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
                This email was sent regarding Lead ID: ${t}<br>
                Timestamp: ${u}
              </p>
            </div>
          </div>
        `};await e.sendMail(r),console.log("✅ Rejection email sent to customer")}catch(e){console.error("❌ Failed to send rejection email:",e.message)}return console.log("\uD83D\uDEAB UNLISTED SUBURB LEAD REJECTED:"),console.log(`   Lead ID: ${t}`),console.log(`   Suburb: ${s}`),console.log(`   Customer: ${n} (${i})`),console.log(`   Reason: ${d||"Outside service area"}`),console.log(`   Timestamp: ${u}`),r.status(200).json({success:!0,message:"Lead rejected and customer notified",leadId:t,suburbName:s,customerEmail:i,timestamp:u})}catch(e){return console.error("❌ Reject unlisted lead API error:",e.message),r.status(500).json({success:!1,error:"Internal server error",message:e.message})}}let d=(0,n.l)(t,"default"),u=(0,n.l)(t,"config"),c=new s.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/admin/reject-unlisted-lead",pathname:"/api/admin/reject-unlisted-lead",bundlePath:"",filename:""},userland:t})},5367:(e,r,o)=>{let t;o.d(r,{D:()=>n,r:()=>i});var s=o(9993);function i(){if(t)return t;try{console.log("Attempting to initialize Google Sheets client...");let e=process.env.GOOGLE_CLIENT_EMAIL,r=process.env.GOOGLE_PRIVATE_KEY;if(!e||!r)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let o=r.replace(/\n/g,"\\n"),i=JSON.parse(`"${o}"`),n=new s.google.auth.JWT(e,null,i,["https://www.googleapis.com/auth/spreadsheets"]);return t=s.google.sheets({version:"v4",auth:n}),console.log("✅ Google Sheets client initialized successfully."),t}catch(e){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",e.message),Error(`Google Sheets initialization failed: ${e.message}`)}}function n(){let e=process.env.GOOGLE_SHEET_ID;if(!e)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return e}},7153:(e,r)=>{var o;Object.defineProperty(r,"x",{enumerable:!0,get:function(){return o}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(o||(o={}))},1802:(e,r,o)=>{e.exports=o(145)}};var r=require("../../../webpack-api-runtime.js");r.C(e);var o=r(r.s=6355);module.exports=o})();