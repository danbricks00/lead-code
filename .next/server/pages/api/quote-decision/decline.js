"use strict";(()=>{var e={};e.id=227,e.ids=[227],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},4770:e=>{e.exports=require("crypto")},5606:(e,t,o)=>{o.r(t),o.d(t,{config:()=>f,default:()=>x,routeModule:()=>h});var i={};o.r(i),o.d(i,{default:()=>m});var r=o(1802),n=o(7153),a=o(6249),s=o(5367),d=o(5116),l=o(3637),c=o(4770),p=o.n(c);function u(e=new Date){return e.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}async function g(e,t={},o=null){l.Z.email("Preparing notification emails for quote decline",{quoteDataKeys:Object.keys(e),leadDataKeys:Object.keys(t)},o);let i=e.CustomerEmail||e["Customer Email"]||e.customerEmail||t.CustomerEmail||t["Customer Email"]||t.customerEmail,r=e.CustomerName||e["Customer Name"]||e.customerName||t.CustomerName||t["Customer Name"]||t.customerName,n=e.TradespersonEmail||e["Tradesperson Email"]||e.tradespersonEmail||e["TradePerson Email"]||e["TradesPerson Email"],a=e.TradespersonName||e["Tradesperson Name"]||e.tradespersonName||e["TradePerson Name"]||e["TradesPerson Name"];if(l.Z.email("Email recipients identified",{customerEmail:i,tradespersonEmail:n,adminEmail:process.env.ADMIN_EMAIL?"SET":"NOT_SET"},o),!i||"undefined"===i||"N/A (Column not found)"===i)throw l.Z.error("Customer email not found in quote or lead data",{customerEmail:i},o),Error("Customer email not found");if(!n||"undefined"===n||"N/A (Column not found)"===n)throw l.Z.error("Tradesperson email not found in quote data",{tradespersonEmail:n},o),Error("Tradesperson email not found");let s={to:i,subject:"Thank You for Your Consideration - Future Opportunities Await",html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header with Respectful Design -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
                    <div style="font-size: 48px; color: white;">🤝</div>
                  </div>
                  <h1 style="color: #6c757d; margin: 0; font-size: 32px; font-weight: bold;">Thank You</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">We appreciate you considering our services, ${r}</p>
                </div>

                <!-- Journey Completion -->
                <div style="margin: 30px 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #495057;">Your Journey With Us</span>
                    <span style="font-weight: bold; color: #6c757d; font-size: 18px;">Decision Complete</span>
                  </div>
                  <div style="background: #e9ecef; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
                    <div style="background: linear-gradient(90deg, #6c757d 0%, #495057 100%); height: 100%; width: 100%; border-radius: 6px;"></div>
                  </div>
                </div>

                <!-- Understanding Message -->
                <div style="background: #e2e3e5; color: #495057; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center;">
                  <h3 style="margin: 0 0 15px 0; font-size: 22px;">We Completely Understand</h3>
                  <p style="margin: 0; font-size: 16px;">Choosing the right tradesperson is an important decision. We respect your choice and thank you for the opportunity to quote on your project.</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    🙏 Thank you for considering Kiwi Trade
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong> - Here when you need us
                  </p>
                </div>

              </div>
            </div>
        `},c={to:n,subject:`Quote Decision: ${r} Declined Your Quote`,html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
                    <div style="font-size: 48px; color: white;">💼</div>
                  </div>
                  <h1 style="color: #6c757d; margin: 0; font-size: 32px; font-weight: bold;">Quote Update</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Customer has made their decision</p>
                </div>

                <!-- Decision Summary -->
                <div style="background: #f8d7da; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #f5c6cb; text-align: center;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 20px;">📝 Decision</h3>
                  <p style="color: #721c24; margin: 0; font-size: 24px; font-weight: bold;">Quote Declined</p>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">The customer has chosen not to proceed at this time</p>
                </div>

                <!-- Customer Details -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">👤 Customer Details</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p style="margin: 5px 0; color: #495057;"><strong>Customer:</strong> ${r}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${i}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Decision Date:</strong> ${new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland"})} NZT</p>
                  </div>
                </div>

                <!-- Encouragement -->
                <div style="background: #fff3cd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #ffeaa7; text-align: center;">
                  <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 20px;">💪 Keep Going!</h3>
                  <p style="color: #856404; margin: 0; font-size: 16px;">Every "no" brings you closer to a "yes". Stay positive and keep providing excellent quotes!</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    🔄 Ready for the next opportunity!
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Team</strong> - Supporting your success
                  </p>
                </div>

              </div>
            </div>
        `},p={to:process.env.ADMIN_EMAIL,subject:`📉 Quote Analytics: ${r} Declined`,html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f7fa; padding: 20px;">
              <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); padding: 20px; border-radius: 50%; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);">
                    <div style="font-size: 48px; color: white;">📉</div>
                  </div>
                  <h1 style="color: #6c757d; margin: 0; font-size: 32px; font-weight: bold;">Quote Analytics</h1>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 18px;">Customer decision analysis and insights</p>
                </div>

                <!-- Decision Summary -->
                <div style="background: #f8d7da; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #f5c6cb; text-align: center;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 20px;">📊 Decision Result</h3>
                  <p style="color: #721c24; margin: 0; font-size: 24px; font-weight: bold;">Quote Declined</p>
                  <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 14px;">Lead conversion was not successful</p>
                </div>

                <!-- Transaction Details -->
                <div style="background: #e8f4fd; padding: 25px; border-radius: 10px; margin: 30px 0; border: 2px solid #b8daff;">
                  <h3 style="color: #0066cc; margin: 0 0 20px 0; font-size: 20px;">📋 Transaction Details</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px;">
                    <p style="margin: 5px 0; color: #495057;"><strong>Customer:</strong> ${r}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${i}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Tradesperson:</strong> ${a}</p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">❌ NOT CONVERTED</span></p>
                    <p style="margin: 5px 0; color: #495057;"><strong>Timestamp:</strong> ${new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland"})} NZT</p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                  <p style="color: #6c757d; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">
                    📊 Analytics Complete - Learning Opportunity Identified
                  </p>
                  <p style="color: #6c757d; font-size: 14px; margin: 0;">
                    <strong>Kiwi Trade Admin System</strong> - Continuous Improvement
                  </p>
                </div>

              </div>
            </div>
        `};try{l.Z.email("Sending customer acknowledgment email",{to:s.to,subject:s.subject},o),await (0,d.Cz)(s),l.Z.email("Customer email sent successfully",null,o),l.Z.email("Sending tradesperson notification email",{to:c.to,subject:c.subject},o),await (0,d.Cz)(c),l.Z.email("Tradesperson email sent successfully",null,o),l.Z.email("Sending admin analytics email",{to:p.to,subject:p.subject},o),await (0,d.Cz)(p),l.Z.email("Admin email sent successfully",null,o),l.Z.email("All notification emails sent successfully",null,o)}catch(e){throw l.Z.error("Error sending notification emails",e,o),e}}async function m(e,t){let o=l.Z.generateRequestId(),i=Date.now();if(l.Z.apiDecline("Request received",{method:e.method,url:e.url,query:e.query,headers:{"user-agent":e.headers["user-agent"],referer:e.headers.referer,"x-forwarded-for":e.headers["x-forwarded-for"]},bodySize:e.body?JSON.stringify(e.body).length:0},o),"GET"!==e.method)return l.Z.error("Invalid method",null,o),l.Z.response("Sending 405 Method Not Allowed",{method:e.method},o),t.status(405).json({success:!1,error:"Method Not Allowed"});let{quoteId:r,ts:n,token:a}=e.query;if(!r||!n||!a)return l.Z.error("Missing required parameters",{quoteId:r,ts:n,token:a},o),l.Z.response("Redirecting to error page - missing parameters",null,o),t.redirect("/quote-status?status=error&message=Missing required parameters.");let d=function(e,t){let o=p().createHmac("sha256",process.env.QUOTE_LINK_SECRET);return o.update(`${e}|${t}`),o.digest("hex")}(r,n);if(a!==d)return l.Z.error("Invalid token",{providedToken:a.substring(0,10)+"...",expectedToken:d.substring(0,10)+"..."},o),l.Z.response("Redirecting to error page - invalid token",null,o),t.redirect("/quote-status?status=error&message=Invalid or expired link.");l.Z.customerDecline("Token validated successfully",{quoteId:r},o);try{l.Z.sheets("Initializing Google Sheets client",null,o);let e=await (0,s.getGoogleSheetsClient)(),n=(0,s.getSpreadsheetId)(),a="Quotes!A:AJ";l.Z.sheets("Fetching quote data from Google Sheets",{spreadsheetId:n.substring(0,10)+"...",range:a},o);let d=(await e.spreadsheets.values.get({spreadsheetId:n,range:a})).data.values;if(!d)return l.Z.error("Could not connect to Google Sheets",null,o),l.Z.response("Redirecting to error page - database connection failed",null,o),t.redirect("/quote-status?status=error&message=Could not connect to the database.");l.Z.sheets("Google Sheets data retrieved",{totalRows:d.length,hasHeader:d.length>0},o);let c=d[0],p=d.findIndex(e=>e[1]===r);if(-1===p)return l.Z.error("Quote ID not found in Google Sheets",{quoteId:r,searchedRows:d.length-1,availableQuoteIds:d.slice(1).map(e=>e[1]).filter(e=>e)},o),l.Z.response("Redirecting to error page - quote not found",null,o),t.redirect("/quote-status?status=error&message=Quote ID not found.");l.Z.sheets("Quote found in Google Sheets",{quoteId:r,rowIndex:p+1,totalColumns:c.length},o);let m=d[p],x=m[2]||null;l.Z.dataFlow("Quote row data extracted",{quoteId:r,leadId:x,rowLength:m.length,hasLeadId:!!x},o);let f={};if(x)try{l.Z.sheets("Fetching lead data",{leadId:x},o);let t=(await e.spreadsheets.values.get({spreadsheetId:n,range:"Leads!A:Z"})).data.values;if(t){let e=t[0],i=t.findIndex(e=>e[0]===x);if(-1!==i){let r=t[i];e.forEach((e,t)=>{f[e]=r[t]||""}),l.Z.sheets("Lead data retrieved successfully",{leadId:x,leadRowIndex:i+1,leadDataKeys:Object.keys(f)},o)}else l.Z.error("Lead ID not found in Leads sheet",{leadId:x},o)}}catch(e){l.Z.error("Could not fetch lead data",e,o)}else l.Z.info("No lead ID found in quote data",null,o);let h=c.indexOf("Decision"),y=c.indexOf("DecisionTimestamp"),b=c.indexOf("ValidUntil"),v=-1!==h?m[h]:"",w=-1!==y?m[y]:"",E=-1!==b?m[b]:"";l.Z.dataFlow("Decision and expiry data extracted",{currentDecision:v,currentDecisionTimestamp:w,validUntil:E,decisionIndex:h,decisionTimestampIndex:y,validUntilIndex:b},o);let D=c.indexOf("Status"),T=-1!==D?m[D]:"";if("Rejected"===T){l.Z.customerDecline("Quote rejected - preventing decline",{quoteId:r,status:T},o);let e=`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Not Available - Kiwi Trade</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>Quote Not Available</h1>
                    <div class="error">
                        <h2>Sorry, this quote is no longer available.</h2>
                        <p>This quote has been rejected and is no longer valid.</p>
                        <p>If you have any questions, please contact us directly.</p>
                    </div>
                    <div class="info">
                        <p>Contact us for assistance:</p>
                        <p>Email: info@kiwitrade.co.nz<br>Phone: 0800 KIWI TRADE</p>
                    </div>
                </body>
                </html>
            `;return l.Z.response("Sending rejection page",{quoteId:r,processingTime:Date.now()-i},o),t.status(400).send(e)}let Z=!1;if(E)try{let e=new Date(E),t=new Date;Z=e<t,l.Z.dataFlow("Expiry check completed",{validUntil:E,validUntilDate:e.toISOString(),now:t.toISOString(),isExpired:Z},o)}catch(e){l.Z.error("Could not parse ValidUntil date",e,o)}else l.Z.info("No ValidUntil date found",null,o);if(Z){if(l.Z.customerDecline("Quote expired - processing expiry logic",{validUntil:E,currentDecision:v},o),!v||""===v.trim()){l.Z.sheets('Locking expired quote as "Expired"',{quoteId:r},o);let t={Decision:"Expired",DecisionTimestamp:u(new Date)},i={};c.forEach((e,o)=>{i[e]=m[o]||"",void 0!==t[e]&&(m[o]=t[e],i[e]=t[e])}),l.Z.sheets("Updating Google Sheets with expired status",{updateData:t,rowIndex:p+1},o),await e.spreadsheets.values.update({spreadsheetId:n,range:`Quotes!A${p+1}`,valueInputOption:"USER_ENTERED",requestBody:{values:[m]}}),l.Z.sheets("Google Sheets updated with expired status",null,o)}l.Z.response("Sending expired quote page",{validUntil:E,currentDecision:v,processingTime:Date.now()-i},o);let a=`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Expired</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .expiry-info { background: #f8d7da; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0; }
                        .expiry-status { color: #721c24; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">❌</div>
                        <h1>Quote Expired</h1>
                        <p>This quote expired on ${E}.</p>
                        <div class="expiry-info">
                            <div class="expiry-status">Quote Status: Expired</div>
                            <div class="timestamp">Expired on: ${E}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            Please contact us again via the website to request a new quote.
                        </p>
                    </div>
                </body>
                </html>
            `;return t.status(200).send(a)}if(v&&""!==v.trim()&&"Admin Approved"!==v){let e=function(e){if(!e)return"an unknown time";try{return new Date(e).toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch(t){return e}}(w);l.Z.customerDecline("Decision already made - preventing duplicate",{currentDecision:v,formattedTime:e,quoteId:r},o),l.Z.response("Sending already-made decision page",{currentDecision:v,formattedTime:e,processingTime:Date.now()-i},o);let n=`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Quote Decision Already Made</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                        .error-icon { font-size: 48px; margin-bottom: 20px; }
                        .error-title { color: #ffc107; font-size: 24px; margin-bottom: 15px; }
                        .error-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                        .decision-info { background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0; }
                        .decision-status { color: #856404; font-weight: bold; font-size: 18px; }
                        .timestamp { color: #6c757d; font-size: 14px; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error-icon">⚠️</div>
                        <h1>Quote Decision Already Made</h1>
                        <p>You already chose ${v} on ${e}.</p>
                        <div class="decision-info">
                            <div class="decision-status">Decision: ${v}</div>
                            <div class="timestamp">Made on: ${e}</div>
                        </div>
                        <p style="color: #6c757d; font-size: 14px;">
                            If you believe this is an error, please contact our support team.
                        </p>
                    </div>
                </body>
                </html>
            `;return t.status(200).send(n)}l.Z.customerDecline("Processing quote decline",{quoteId:r},o);let S=u(),A={Decision:"Declined",DecisionTimestamp:S};l.Z.dataFlow("Preparing Google Sheets update",{updateData:A,rowIndex:p+1},o);let k={};c.forEach((e,t)=>{k[e]=m[t]||"",void 0!==A[e]&&(m[t]=A[e],k[e]=A[e])}),l.Z.sheets("Updating Google Sheets with decline",{updateData:A,rowIndex:p+1,quoteDataKeys:Object.keys(k)},o),await e.spreadsheets.values.update({spreadsheetId:n,range:`Quotes!A${p+1}`,valueInputOption:"USER_ENTERED",requestBody:{values:[m]}}),l.Z.sheets("Google Sheets updated successfully",null,o);try{l.Z.email("Starting notification email process",{customerEmail:k.CustomerEmail,tradespersonEmail:k.TradePersonEmail},o),await g(k,f,o),l.Z.email("All notification emails sent successfully",null,o)}catch(e){l.Z.error("Error sending notification emails",e,o)}l.Z.response("Sending success confirmation page",{quoteId:r,processingTime:Date.now()-i},o);let C=`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quote Declined</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #f5f7fa; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
                    .success-icon { font-size: 48px; margin-bottom: 20px; }
                    .success-title { color: #dc3545; font-size: 24px; margin-bottom: 15px; }
                    .success-message { color: #6c757d; font-size: 16px; margin-bottom: 20px; }
                    .timestamp { color: #6c757d; font-size: 14px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">❌</div>
                    <h1>❌ Quote Declined</h1>
                    <p>Your decline has been recorded.</p>
                    <div class="timestamp">Declined on: ${S}</div>
                </div>
            </body>
            </html>
        `;return t.status(200).send(C)}catch(e){return l.Z.error("Quote decline error",e,o),l.Z.response("Redirecting to error page",{error:e.message,processingTime:Date.now()-i},o),t.redirect("/quote-status?status=error&message=An internal server error occurred.")}}let x=(0,a.l)(i,"default"),f=(0,a.l)(i,"config"),h=new r.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/quote-decision/decline",pathname:"/api/quote-decision/decline",bundlePath:"",filename:""},userland:i})},5367:(e,t,o)=>{let i;o.d(t,{getGoogleSheetsClient:()=>n,getSpreadsheetId:()=>a});var r=o(9993);function n(){if(i)return i;try{console.log("Attempting to initialize Google Sheets client...");let e=process.env.GOOGLE_CLIENT_EMAIL,t=process.env.GOOGLE_PRIVATE_KEY;if(!e||!t)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let o=t.replace(/\n/g,"\\n"),n=JSON.parse(`"${o}"`),a=new r.google.auth.JWT(e,null,n,["https://www.googleapis.com/auth/spreadsheets"]);return i=r.google.sheets({version:"v4",auth:a}),console.log("✅ Google Sheets client initialized successfully."),i}catch(e){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",e.message),Error(`Google Sheets initialization failed: ${e.message}`)}}function a(){let e=process.env.GOOGLE_SHEET_ID;if(!e)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return e}},3637:(e,t,o)=>{function i(e,t,o=null,i=null){let r=new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!1}),n=i?`[${i}]`:"",a=o?function(e){if("object"!=typeof e||null===e)return e;let t=["password","token","secret","key","auth","credential"],o={...e};for(let e in o)t.some(t=>e.toLowerCase().includes(t))&&(o[e]="[REDACTED]");return o}(o):null,s=`[${r}] ${n} ${e} ${t}`;a?console.log(s,JSON.stringify(a,null,2)):console.log(s)}o.d(t,{Z:()=>r});let r={generateRequestId:function(){return`req_${Date.now()}_${Math.random().toString(36).substr(2,9)}`},adminAccept:(e,t=null,o=null)=>{i("[ADMIN-ACCEPT]",e,t,o)},adminDecline:(e,t=null,o=null)=>{i("[ADMIN-DECLINE]",e,t,o)},customerAccept:(e,t=null,o=null)=>{i("[CUSTOMER-ACCEPT]",e,t,o)},customerDecline:(e,t=null,o=null)=>{i("[CUSTOMER-DECLINE]",e,t,o)},apiAccept:(e,t=null,o=null)=>{i("[API-ACCEPT]",e,t,o)},apiDecline:(e,t=null,o=null)=>{i("[API-DECLINE]",e,t,o)},dataFlow:(e,t=null,o=null)=>{i("[DATA-FLOW]",e,t,o)},error:(e,t=null,o=null)=>{i("[ERROR]",e,t?{message:t.message,stack:t.stack,name:t.name}:null,o)},response:(e,t=null,o=null)=>{i("[RESPONSE]",e,t,o)},sheets:(e,t=null,o=null)=>{i("[SHEETS]",e,t,o)},email:(e,t=null,o=null)=>{i("[EMAIL]",e,t,o)},pdf:(e,t=null,o=null)=>{i("[PDF]",e,t,o)},info:(e,t=null,o=null)=>{i("[INFO]",e,t,o)},request:(e,t=null,o=null)=>{i("[REQUEST]",e,t,o)}}}};var t=require("../../../webpack-api-runtime.js");t.C(e);var o=e=>t(t.s=e),i=t.X(0,[3273],()=>o(5606));module.exports=i})();