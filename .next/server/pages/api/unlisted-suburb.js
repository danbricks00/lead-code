"use strict";(()=>{var e={};e.id=8578,e.ids=[8578],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},6249:(e,o)=>{Object.defineProperty(o,"l",{enumerable:!0,get:function(){return function e(o,t){return t in o?o[t]:"then"in o&&"function"==typeof o.then?o.then(o=>e(o,t)):"function"==typeof o&&"default"===t?o:void 0}}})},6250:(e,o,t)=>{t.r(o),t.d(o,{config:()=>u,default:()=>a,routeModule:()=>c});var r={};t.r(r),t.d(r,{default:()=>d});var s=t(1802),i=t(7153),n=t(6249),l=t(5367);async function d(e,o){if(console.log("✅ Loaded API unlisted-suburb.js"),"POST"!==e.method)return o.setHeader("Allow",["POST"]),o.status(405).json({success:!1,error:`Method ${e.method} Not Allowed. Use POST method.`});try{let{suburbName:r,additionalInfo:s,customerName:i,customerEmail:n,customerPhone:d,leadId:a,serviceType:u,rooms:c,area:g,budget:p,timeline:m}=e.body;if(!r||!i||!n)return o.status(400).json({success:!1,error:"Missing required fields: suburbName, customerName, customerEmail"});console.log(`🚨 UNLISTED SUBURB DETECTED: ${r}`),console.log(`📋 Customer: ${i} (${n})`),console.log(`📋 Lead ID: ${a}`),console.log(`📋 Additional Info: ${s||"None provided"}`);let f=(()=>{let e=new Date;return new Date(e.toLocaleString("en-US",{timeZone:"Pacific/Auckland"})).toLocaleString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})})();try{let e=(0,l.getGoogleSheetsClient)(),o=(0,l.getSpreadsheetId)();if(o){console.log("\uD83D\uDCCA Logging unlisted suburb to Google Sheets...");let t=[f,a||"N/A",r,s||"",i,n,d||"",u||"Underfloor Heating",g||"",p||"",m||"",JSON.stringify(c||[]),"Pending Review","","",""];await e.spreadsheets.values.append({spreadsheetId:o,range:"UnlistedSuburbs!A:P",valueInputOption:"USER_ENTERED",requestBody:{values:[t]}}),console.log("✅ Unlisted suburb logged to Google Sheets")}}catch(e){console.error("❌ Failed to log to Google Sheets:",e.message)}try{let e=t(5184).createTransporter({service:"gmail",auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}}),o={from:process.env.GMAIL_USER,to:process.env.ADMIN_EMAIL||"danbricks18@gmail.com",subject:`🚨 UNLISTED SUBURB: ${r} - Lead from ${i}`,html:`
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">
              🚨 Unlisted Suburb Detected
            </h2>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Suburb Information</h3>
              <p><strong>Suburb Name:</strong> ${r}</p>
              <p><strong>Additional Info:</strong> ${s||"None provided"}</p>
            </div>

            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Customer Details</h3>
              <p><strong>Name:</strong> ${i}</p>
              <p><strong>Email:</strong> ${n}</p>
              <p><strong>Phone:</strong> ${d||"Not provided"}</p>
              <p><strong>Lead ID:</strong> ${a||"N/A"}</p>
            </div>

            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">Project Details</h3>
              <p><strong>Service:</strong> ${u||"Underfloor Heating"}</p>
              <p><strong>Area:</strong> ${g||"Not specified"}</p>
              <p><strong>Budget:</strong> ${p||"Not specified"}</p>
              <p><strong>Timeline:</strong> ${m||"Not specified"}</p>
              <p><strong>Rooms:</strong> ${JSON.stringify(c||[],null,2)}</p>
            </div>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Action Required</h3>
              <p>Please review this unlisted suburb and decide:</p>
              <ul>
                <li>Add to the zones list if it's a valid Auckland suburb</li>
                <li>Reject the lead if it's outside service area</li>
                <li>Contact customer for clarification if needed</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px;">
                Timestamp: ${f}<br>
                This is an automated notification from the Kiwi Trade lead system.
              </p>
            </div>
          </div>
        `};await e.sendMail(o),console.log("✅ Admin notification email sent")}catch(e){console.error("❌ Failed to send admin notification:",e.message)}return console.log("\uD83D\uDEA8 UNLISTED SUBURB ALERT:"),console.log(`   Suburb: ${r}`),console.log(`   Customer: ${i} (${n})`),console.log(`   Lead ID: ${a}`),console.log(`   Additional Info: ${s||"None"}`),console.log(`   Timestamp: ${f}`),o.status(200).json({success:!0,message:"Unlisted suburb logged and admin notified",leadId:a,suburbName:r,timestamp:f})}catch(e){return console.error("❌ Unlisted suburb API error:",e.message),o.status(500).json({success:!1,error:"Internal server error",message:e.message})}}let a=(0,n.l)(r,"default"),u=(0,n.l)(r,"config"),c=new s.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/unlisted-suburb",pathname:"/api/unlisted-suburb",bundlePath:"",filename:""},userland:r})},5367:(e,o,t)=>{let r;t.d(o,{getGoogleSheetsClient:()=>i,getSpreadsheetId:()=>n});var s=t(9993);function i(){if(r)return r;try{console.log("Attempting to initialize Google Sheets client...");let e=process.env.GOOGLE_CLIENT_EMAIL,o=process.env.GOOGLE_PRIVATE_KEY;if(!e||!o)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let t=o.replace(/\n/g,"\\n"),i=JSON.parse(`"${t}"`),n=new s.google.auth.JWT(e,null,i,["https://www.googleapis.com/auth/spreadsheets"]);return r=s.google.sheets({version:"v4",auth:n}),console.log("✅ Google Sheets client initialized successfully."),r}catch(e){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",e.message),Error(`Google Sheets initialization failed: ${e.message}`)}}function n(){let e=process.env.GOOGLE_SHEET_ID;if(!e)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return e}},7153:(e,o)=>{var t;Object.defineProperty(o,"x",{enumerable:!0,get:function(){return t}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(t||(t={}))},1802:(e,o,t)=>{e.exports=t(145)}};var o=require("../../webpack-api-runtime.js");o.C(e);var t=o(o.s=6250);module.exports=t})();