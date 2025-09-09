"use strict";(()=>{var e={};e.id=7031,e.ids=[7031],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},3947:(e,t,r)=>{r.r(t),r.d(t,{config:()=>f,default:()=>m,routeModule:()=>h});var o={};r.r(o),r.d(o,{default:()=>g});var s=r(1802),i=r(7153),n=r(6249),a=r(5367),d=r(5116),l=r(4770),u=r.n(l);function c(e,t){let r=u().createHmac("sha256",process.env.QUOTE_LINK_SECRET);return r.update(`${e}|${t}`),r.digest("hex")}async function p(e){let{sheets:t,spreadsheetId:r,tab:o,searchColumn:s,searchValue:i,columnsToFetch:n}=e,a=`${o}!A:Z`,d=(await t.spreadsheets.values.get({spreadsheetId:r,range:a})).data.values;if(!d||d.length<2)return null;let l=d[0],u=l.indexOf(s);if(-1===u)throw Error(`Column "${s}" not found in tab "${o}".`);let c=d.find(e=>e[u]===i);if(!c)return null;let p={rowIndex:d.indexOf(c)+1};return n.forEach(e=>{let t=l.indexOf(e);p[e]=-1!==t?c[t]||"":"N/A (Column not found)"}),p}async function g(e,t){if("GET"!==e.method)return t.status(405).json({success:!1,error:"Method Not Allowed"});let{quoteId:r,ts:o,token:s,reason:i}=e.query;if(!r||!o||!s||s!==c(r,o))return t.redirect("/quote-status?status=error&message=Invalid decline link.");try{let e=(0,a.getGoogleSheetsClient)(),o=(0,a.getSpreadsheetId)(),s=await p({sheets:e,spreadsheetId:o,tab:"Quotes",searchColumn:"QuoteID",searchValue:r,columnsToFetch:["Admin Status","TradePerson Email","TradesPerson Name","LeadiD","Reesubmission Allowed"]});if(!s)return t.redirect("/quote-status?status=error&message=Quote not found.");if("Declined"===s["Admin Status"])return t.redirect("/quote-status?status=error&message=This quote has already been declined.");if("Approved"===s["Admin Status"])return t.redirect("/quote-status?status=error&message=This quote has already been approved and cannot be declined.");let n=await p({sheets:e,spreadsheetId:o,tab:"Leads",searchColumn:"Lead",searchValue:s.LeadiD,columnsToFetch:["CustomerName","CustomerEmail","ServiceType"]});if(!n)return t.redirect("/quote-status?status=error&message=Lead data not found.");let l=(await e.spreadsheets.values.get({spreadsheetId:o,range:"Quotes!A1:Z1"})).data.values[0],u={"Admin Status":"Declined","TradePerson Status":"Needs Revision","Reesubmission Allowed":"Yes"},g=(await e.spreadsheets.values.get({spreadsheetId:o,range:`Quotes!A${s.rowIndex}:Z${s.rowIndex}`})).data.values[0];l.forEach((e,t)=>{u[e]&&(g[t]=u[e])}),await e.spreadsheets.values.update({spreadsheetId:o,range:`Quotes!A${s.rowIndex}`,valueInputOption:"USER_ENTERED",requestBody:{values:[g]}});let m=function(e){let t=Date.now().toString(),r=c(e,t),o="https://lead-code-phi.vercel.app".replace(/^(https?:\/\/)/,"");return`https://${o}/quote-submit/${e}?ts=${t}&token=${r}`}(r),f={to:s["TradePerson Email"],subject:`⚠️ Quote Revision Required - ${n.ServiceType} for ${n.CustomerName}`,html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">⚠️ Quote Needs Revision</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin review required changes</p>
                </div>

                <!-- Quote Details -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📋 Quote Details</h3>
                  <p style="margin: 5px 0; color: #856404;"><strong>Customer:</strong> ${n.CustomerName}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Service:</strong> ${n.ServiceType}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Quote ID:</strong> ${r}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Status:</strong> Declined - Revision Required</p>
                </div>

                <!-- Reason for Decline -->
                ${i?`
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 18px;">📝 Reason for Decline</h3>
                  <p style="color: #721c24; margin: 0;">${decodeURIComponent(i)}</p>
                </div>
                `:""}

                <!-- Next Steps -->
                <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">🔄 Next Steps</h3>
                  <p style="color: #0c5460; margin: 0 0 15px 0;">
                    Your quote has been declined by the admin and needs revision. You can:
                  </p>
                  <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                    <li>Review and edit the quote details</li>
                    <li>Update pricing, timeline, or other information</li>
                    <li>Resubmit for admin approval</li>
                  </ul>
                </div>

                <!-- Resubmission Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${m}" style="display: inline-block; background-color: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">🔄 Revise & Resubmit Quote</a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    Questions about the required changes? Reply to this email.<br>
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>

              </div>
            </div>
          `};await (0,d.Cz)(f),console.log(`✅ Quote decline notification sent to ${s["TradePerson Email"]}`);let h={to:process.env.ADMIN_EMAIL,subject:`Quote Declined - ${n.ServiceType} for ${n.CustomerName}`,html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">Quote Declined Successfully</h2>
              <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                <p><strong>Quote ID:</strong> ${r}</p>
                <p><strong>Customer:</strong> ${n.CustomerName}</p>
                <p><strong>Service:</strong> ${n.ServiceType}</p>
                <p><strong>Tradesperson:</strong> ${s["TradesPerson Name"]}</p>
                <p><strong>Status:</strong> Declined - Tradesperson notified for revision</p>
                ${i?`<p><strong>Decline Reason:</strong> ${decodeURIComponent(i)}</p>`:""}
                <p>The tradesperson has been notified and can resubmit the quote after making revisions.</p>
              </div>
            </div>
          `};return await (0,d.Cz)(h),t.redirect("/quote-status?status=success&message=Quote declined successfully. Tradesperson has been notified and can resubmit.")}catch(e){return console.error("Quote Decline Error:",e),t.redirect("/quote-status?status=error&message=An error occurred while declining the quote.")}}let m=(0,n.l)(o,"default"),f=(0,n.l)(o,"config"),h=new s.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/admin/decline",pathname:"/api/admin/decline",bundlePath:"",filename:""},userland:o})},5367:(e,t,r)=>{let o;r.d(t,{getGoogleSheetsClient:()=>i,getSpreadsheetId:()=>n});var s=r(9993);function i(){if(o)return o;try{console.log("Attempting to initialize Google Sheets client...");let e=process.env.GOOGLE_CLIENT_EMAIL,t=process.env.GOOGLE_PRIVATE_KEY;if(!e||!t)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let r=t.replace(/\n/g,"\\n"),i=JSON.parse(`"${r}"`),n=new s.google.auth.JWT(e,null,i,["https://www.googleapis.com/auth/spreadsheets"]);return o=s.google.sheets({version:"v4",auth:n}),console.log("✅ Google Sheets client initialized successfully."),o}catch(e){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",e.message),Error(`Google Sheets initialization failed: ${e.message}`)}}function n(){let e=process.env.GOOGLE_SHEET_ID;if(!e)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return e}}};var t=require("../../../webpack-api-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[3273],()=>r(3947));module.exports=o})();