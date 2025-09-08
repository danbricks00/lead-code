"use strict";exports.id=3078,exports.ids=[3078],exports.modules={5367:(t,e,o)=>{let a;o.d(e,{getGoogleSheetsClient:()=>l,getSpreadsheetId:()=>s});var r=o(9993);function l(){if(a)return a;try{console.log("Attempting to initialize Google Sheets client...");let t=process.env.GOOGLE_CLIENT_EMAIL,e=process.env.GOOGLE_PRIVATE_KEY;if(!t||!e)throw Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY are not set correctly.");let o=e.replace(/\n/g,"\\n"),l=JSON.parse(`"${o}"`),s=new r.google.auth.JWT(t,null,l,["https://www.googleapis.com/auth/spreadsheets"]);return a=r.google.sheets({version:"v4",auth:s}),console.log("✅ Google Sheets client initialized successfully."),a}catch(t){throw console.error("❌ FATAL: Could not initialize Google Sheets client.",t.message),Error(`Google Sheets initialization failed: ${t.message}`)}}function s(){let t=process.env.GOOGLE_SHEET_ID;if(!t)throw Error("GOOGLE_SHEET_ID is not configured in environment variables.");return t}},3078:(t,e,o)=>{o.d(e,{Ml:()=>T,V7:()=>n,getQuoteTemplate:()=>i});var a=o(5367);async function r(){try{let t=await (0,a.getGoogleSheetsClient)(),e=(0,a.getSpreadsheetId)(),o=new Date,r=o.toISOString().slice(0,7),l=(await t.spreadsheets.values.get({spreadsheetId:e,range:"PDFUsage!A:E"})).data.values||[],s=null,i=-1;for(let t=0;t<l.length;t++)if(l[t][0]===r){i=t,s=l[t];break}if(-1===i){let a=o.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),n=[r,0,0,0,a];await t.spreadsheets.values.append({spreadsheetId:e,range:"PDFUsage!A:E",valueInputOption:"USER_ENTERED",requestBody:{values:[n]}}),s=n,i=l.length}return{monthKey:r,adobeCount:parseInt(s[1]||0),pdfshiftCount:parseInt(s[2]||0),api2pdfCount:parseInt(s[3]||0),monthRowIndex:i,existingRow:s}}catch(t){return console.error("❌ PDF Usage Retrieval Error:",t),{monthKey:new Date().toISOString().slice(0,7),adobeCount:0,pdfshiftCount:0,api2pdfCount:0,monthRowIndex:-1,existingRow:null}}}async function l(t){try{let e=await (0,a.getGoogleSheetsClient)(),o=(0,a.getSpreadsheetId)(),l=await r(),s=new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),i={Adobe:1,PDFShift:2,API2PDF:3}[t];if(i&&l.monthRowIndex>=0){let a=parseInt(l.existingRow[i]||0)+1;await e.spreadsheets.values.update({spreadsheetId:o,range:`PDFUsage!${String.fromCharCode(65+i)}${l.monthRowIndex+1}`,valueInputOption:"USER_ENTERED",requestBody:{values:[[a]]}}),await e.spreadsheets.values.update({spreadsheetId:o,range:`PDFUsage!E${l.monthRowIndex+1}`,valueInputOption:"USER_ENTERED",requestBody:{values:[[s]]}});let r="Adobe"===t?a:l.adobeCount,n="PDFShift"===t?a:l.pdfshiftCount,d="API2PDF"===t?a:l.api2pdfCount,u=`[PDF COUNTER] ${l.monthKey} → Adobe: ${r}/500, PDFShift: ${n}/50, API2PDF: ${d}`;r>=450&&(u+="\n⚠️ Warning: Adobe quota at 90% (450/500)"),n>=45&&(u+="\n⚠️ Warning: PDFShift quota at 90% (45/50)"),console.log(u)}}catch(t){console.error("❌ PDF Usage Tracking Error:",t)}}function s(t){return t?new Date(t).toLocaleDateString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric"}):"N/A"}function i(){return`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Template</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .quote-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .company-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .quote-info {
            text-align: right;
            flex: 1;
        }
        
        .quote-title {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .quote-id {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .quote-date {
            font-size: 14px;
            color: #666;
        }
        
        /* Main Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        /* Customer Details */
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .detail-label {
            font-weight: bold;
            width: 120px;
            color: #555;
        }
        
        .detail-value {
            flex: 1;
            color: #333;
        }
        
        /* Room Details Table */
        .room-details {
            grid-column: 1 / -1;
            margin-bottom: 20px;
        }
        
        .room-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .room-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .room-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .room-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .room-table tr:last-child td {
            border-bottom: none;
        }
        
        /* Quote Summary */
        .quote-summary {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .summary-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-value {
            font-size: 18px;
            font-weight: bold;
        }
        
        .total-value {
            font-size: 24px;
            color: #fff;
        }
        
        /* Terms and Conditions */
        .terms {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        
        .terms-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .terms-text {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 11px;
        }
        
        /* Responsive adjustments for print */
        @media print {
            body {
                font-size: 11px;
            }
            
            .quote-container {
                padding: 0;
            }
            
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="quote-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">Kiwi Trade</div>
                <div class="company-tagline">Professional Underfloor Heating Solutions</div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{TRADESPERSON_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{TRADESPERSON_EMAIL}}</div>
                </div>
            </div>
            <div class="quote-info">
                <div class="quote-title">QUOTE</div>
                <div class="quote-id">Quote ID: {{QUOTE_ID}}</div>
                <div class="quote-date">Date: {{QUOTE_DATE}}</div>
                <div class="quote-date">Valid Until: {{VALID_UNTIL}}</div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
            <!-- Customer Details -->
            <div class="section">
                <div class="section-title">Customer Details</div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">{{CUSTOMER_NAME}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{CUSTOMER_EMAIL}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{CUSTOMER_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Address:</div>
                    <div class="detail-value">{{CUSTOMER_ADDRESS}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Service:</div>
                    <div class="detail-value">{{SERVICE_TYPE}}</div>
                </div>
            </div>

            <!-- Tradesperson Details -->
            <div class="section">
                <div class="section-title">Tradesperson Details</div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">{{TRADESPERSON_NAME}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{TRADESPERSON_EMAIL}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{TRADESPERSON_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">License:</div>
                    <div class="detail-value">{{TRADESPERSON_LICENSE}}</div>
                </div>
            </div>
        </div>

        <!-- Room Details -->
        <div class="section room-details">
            <div class="section-title">Project Details</div>
            <table class="room-table">
                <thead>
                    <tr>
                        <th>Room</th>
                        <th>Size</th>
                        <th>Labour</th>
                        <th>Materials</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{ROOM_ROWS}}
                </tbody>
            </table>
        </div>

        <!-- Detailed Breakdown -->
        <div class="breakdown-section" style="margin-bottom: 30px;">
            <div class="summary-title">Detailed Cost Breakdown</div>
            <table class="breakdown-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: left; font-weight: bold;">Service Item</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Rate/Unit</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Quantity</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Calculation</th>
                        <th style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold;">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                <tr style="background-color: #f8f9fa;">
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>🔧 Labour & Installation</strong><br><small style="color: #666;">Professional installation work</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">{{LABOUR_RATE}}/hour</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">{{LABOUR_HOURS}} hours</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">{{LABOUR_RATE}} \xd7 {{LABOUR_HOURS}}h</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{LABOUR_TOTAL}}</td>
                </tr>
                <tr>
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>🏠 Materials & Equipment</strong><br><small style="color: #666;">Heating elements, insulation, controls</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">{{MATERIALS_RATE}}/{{MATERIALS_UNIT}}</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">{{MATERIALS_QUANTITY}} {{MATERIALS_UNIT}}</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">{{MATERIALS_RATE}} \xd7 {{MATERIALS_QUANTITY}}{{MATERIALS_UNIT}}</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{MATERIALS_TOTAL}}</td>
                </tr>
                    <tr style="background-color: #f8f9fa;">
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>🚗 Travel & Transport</strong><br><small style="color: #666;">Vehicle costs and fuel</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">{{TRAVEL_RATE}}/km</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">{{TRAVEL_DISTANCE}} km</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">{{TRAVEL_RATE}} \xd7 {{TRAVEL_DISTANCE}}km</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{TRAVEL_TOTAL}}</td>
                </tr>
                <tr>
                        <td style="border: 1px solid #ddd; padding: 15px;"><strong>⚙️ Setup & Configuration</strong><br><small style="color: #666;">System setup and testing</small></td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-weight: bold;">Fixed cost</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center;">1 job</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: center; font-style: italic; color: #666;">One-time setup</td>
                        <td style="border: 1px solid #ddd; padding: 15px; text-align: right; font-weight: bold; color: #28a745;">{{INSTALLATION_TOTAL}}</td>
                </tr>
                </tbody>
            </table>
            
            <!-- Totals Section -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dee2e6;">
                <h3 style="color: #495057; margin: 0 0 20px 0; font-size: 20px;">💰 Quote Summary</h3>
                <div style="background: white; padding: 15px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #495057;">Subtotal (excl. GST):</span>
                        <span style="font-weight: bold; color: #495057;">{{SUBTOTAL}}</span>
            </div>
                    <div style="display: flex; justify-content: space-between; margin: 12px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                        <span style="font-weight: bold; color: #495057;">GST (15%):</span>
                        <span style="font-weight: bold; color: #495057;">{{GST}}</span>
        </div>
                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 12px 0; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 8px; color: white;">
                        <span style="font-weight: bold; font-size: 18px;">TOTAL (incl. GST):</span>
                        <span style="font-weight: bold; font-size: 18px;">{{FINAL_TOTAL}}</span>
                </div>
                </div>
                </div>
            
            <!-- Project Summary -->
            <div style="background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📐 Project Scope</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Total Area:</strong> {{TOTAL_SQM}} square meters</p>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Service Type:</strong> {{SERVICE_TYPE}}</p>
                </div>
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">⏱️ Timeline</h4>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Quote Valid Until:</strong> {{VALID_UNTIL}}</p>
                        <p style="margin: 0; color: #666; font-size: 14px;"><strong>Estimated Hours:</strong> {{LABOUR_HOURS}} hours</p>
            </div>
            </div>
            </div>
        </div>


        <!-- Terms and Conditions -->
        <div class="terms">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">
                • Quote valid 14 days • 50% deposit required • Fully licensed & insured • Changes may incur additional charges
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing Kiwi Trade for your underfloor heating needs.</p>
            <p>For any questions about this quote, please contact us at {{TRADESPERSON_EMAIL}} or {{TRADESPERSON_PHONE}}</p>
        </div>
    </div>
</body>
</html>`}async function n(t){try{let e;if(console.log("\uD83D\uDD04 ULTRA-ROBUST PDF Generation starting for quote:",t?.quoteId),!t)throw Error("Quote data is required");if(!t.quoteId)throw Error("Quote ID is required");console.log("\uD83D\uDD0D Available data keys:",Object.keys(t)),console.log("\uD83D\uDD0D Quote data structure:",JSON.stringify(t,null,2));let o={hasCustomerData:!!(t.customerName||t.customerEmail),hasTradespersonData:!!(t.tradespersonName||t.tradespersonEmail),hasFinancialData:!!(t.totals||t.breakdown),hasRoomData:!!(t.rooms&&t.rooms.length>0)};console.log("\uD83D\uDD0D Data validation results:",o),o.hasCustomerData||console.warn("⚠️ Missing customer data - using defaults"),o.hasTradespersonData||console.warn("⚠️ Missing tradesperson data - using defaults"),o.hasFinancialData||console.warn("⚠️ Missing financial data - using defaults"),o.hasRoomData||console.warn("⚠️ Missing room data - using defaults"),console.log("✅ Quote data validation completed");let a=i();console.log("✅ HTML template loaded, length:",a.length),console.log("\uD83D\uDD27 Starting ULTRA-ROBUST template filling...");let r=d(a,t);if(console.log("✅ Template filling completed, length:",r.length),!r||0===r.length)throw Error("Template filling resulted in empty HTML");let l=r.match(/\{\{[^}]+\}\}/g);l?(console.warn("⚠️ Unreplaced placeholders found:",l),console.warn("⚠️ This may indicate missing data or template issues"),l.forEach(t=>{console.warn(`⚠️ Missing data for: ${t}`)})):console.log("✅ All template placeholders successfully replaced"),r.includes("<html")&&r.includes("</html>")||console.warn("⚠️ Generated HTML may be malformed"),console.log("\uD83D\uDD04 Starting PDF conversion...");let s=0;for(;s<3;)try{s++,console.log(`🔄 PDF conversion attempt ${s}/3`),e=await c(r);break}catch(t){if(console.error(`❌ PDF conversion attempt ${s} failed:`,t.message),s>=3)throw t;await new Promise(t=>setTimeout(t,1e3))}if(!e)throw Error("PDF buffer is null or undefined");if(0===e.length)throw Error("PDF buffer is empty");return e.length<1e3&&console.warn("⚠️ PDF buffer is unusually small:",e.length,"bytes"),console.log("✅ PDF generated successfully!"),console.log("\uD83D\uDCCA PDF Statistics:",{size:e.length,sizeKB:Math.round(e.length/1024),quoteId:t.quoteId,conversionAttempts:s}),e}catch(o){console.error("❌ ULTRA-ROBUST PDF generation failed:",o),console.error("❌ Comprehensive error details:",{message:o.message,stack:o.stack,quoteId:t?.quoteId,dataKeys:t?Object.keys(t):"No data",dataStructure:t?JSON.stringify(t,null,2):"No data",timestamp:new Date().toISOString()});let e=`Failed to generate PDF: ${o.message}`;throw(o.message.includes("LABOUR_RATE")||o.message.includes("MATERIALS")||o.message.includes("TRAVEL"))&&(e+="\n\nThis appears to be a variable naming issue. The ULTRA-ROBUST normalization should have handled this."),Error(e)}}function d(t,e){console.log("\uD83D\uDD0D PDF Template Data received:",JSON.stringify(e,null,2));let o=t=>{let e=parseFloat(t);return isNaN(e)?"$0.00":"$"+("number"!=typeof e?"0.00":e.toFixed(2))},a=t;a=(a=(a=(a=(a=(a=(a=(a=(a=(a=(a=(a=(a=a.replace(/{{QUOTE_ID}}/g,e.quoteId||"N/A")).replace(/{{QUOTE_DATE}}/g,s(e.quoteDate||new Date))).replace(/{{VALID_UNTIL}}/g,s(e.validUntil||new Date(Date.now()+12096e5)))).replace(/{{CUSTOMER_NAME}}/g,e.customerName||"N/A")).replace(/{{CUSTOMER_EMAIL}}/g,e.customerEmail||"N/A")).replace(/{{CUSTOMER_PHONE}}/g,e.customerPhone||"N/A")).replace(/{{CUSTOMER_ADDRESS}}/g,e.customerAddress||"N/A")).replace(/{{SERVICE_TYPE}}/g,e.serviceType||"Underfloor Heating")).replace(/{{TRADESPERSON_NAME}}/g,e.tradespersonName||"N/A")).replace(/{{TRADESPERSON_EMAIL}}/g,e.tradespersonEmail||"N/A")).replace(/{{TRADESPERSON_PHONE}}/g,e.tradespersonPhone||"N/A")).replace(/{{TRADESPERSON_LICENSE}}/g,e.tradespersonLicense||"N/A")).replace(/{{ROOM_ROWS}}/g,function(t,e=null){return t&&0!==t.length?t.map((t,e)=>{let o=parseFloat(t.sqm)||0,a=t.dimensions||t.originalInput||"N/A",r=o>0?`${a} (${o.toFixed(1)}m\xb2)`:a,l=parseFloat(t.labourCost||0),s=parseFloat(t.materialsCost||0);return`
    <tr>
      <td>${t.name||"N/A"}</td>
      <td>${r}</td>
      <td>$${l.toFixed(2)}</td>
      <td>$${s.toFixed(2)}</td>
      <td style="font-weight: bold; color: #28a745;">$${(l+s).toFixed(2)}</td>
    </tr>
  `}).join(""):`
      <tr>
        <td colspan="5" style="text-align: center; color: #666; font-style: italic;">
          No room details available
        </td>
      </tr>
    `}(e.rooms||[],e.roomPricingData)),console.log("\uD83D\uDCB0 Totals data:",e.totals),console.log("\uD83D\uDD0D Breakdown data:",e.breakdown),console.log("\uD83D\uDD0D Labour value:",e.totals?.labour),console.log("\uD83D\uDD0D Formatted labour:",o(e.totals?.labour||0)),console.log("\uD83D\uDD0D Processing breakdown placeholders with robust normalization...");let r=function(t){console.log("\uD83D\uDD27 ULTRA-ROBUST: Normalizing labour data...");let e={rate:0,hours:0,total:0,unit:"hour",description:"Labour & Installation"},o=[t.breakdown?.labourRate,t.breakdown?.labour_rate,t.breakdown?.LabourRate,t.breakdown?.LABOUR_RATE,t.breakdown?.laborRate,t.breakdown?.labor_rate,t.breakdown?.LaborRate,t.breakdown?.LABOR_RATE,t.breakdown?.hourlyRate,t.breakdown?.hourly_rate,t.breakdown?.HourlyRate,t.breakdown?.HOURLY_RATE,t.labourRate,t.labour_rate,t.LabourRate,t.LABOUR_RATE,t.laborRate,t.labor_rate,t.LaborRate,t.LABOR_RATE,t.hourlyRate,t.hourly_rate,t.HourlyRate,t.HOURLY_RATE,...(t.rooms||[]).map(t=>{let e=u(t);return(t.labourRate||t.laborRate||t.hourlyRate||25)*e.labour}),t.breakdown?.labourTotal&&t.breakdown?.labourHours?t.breakdown.labourTotal/t.breakdown.labourHours:null,t.totals?.labour&&t.breakdown?.labourHours?t.totals.labour/t.breakdown.labourHours:null],a=[t.breakdown?.labourHours,t.breakdown?.labour_hours,t.breakdown?.LabourHours,t.breakdown?.LABOUR_HOURS,t.breakdown?.laborHours,t.breakdown?.labor_hours,t.breakdown?.LaborHours,t.breakdown?.LABOR_HOURS,t.breakdown?.hours,t.breakdown?.Hours,t.breakdown?.HOURS,t.breakdown?.workHours,t.breakdown?.work_hours,t.breakdown?.WorkHours,t.breakdown?.WORK_HOURS,t.labourHours,t.labour_hours,t.LabourHours,t.LABOUR_HOURS,t.laborHours,t.labor_hours,t.LaborHours,t.LABOR_HOURS,t.hours,t.Hours,t.HOURS,t.workHours,t.work_hours,t.WorkHours,t.WORK_HOURS,...(t.rooms||[]).map(t=>{let e=u(t),o=t.labourHours||t.laborHours||t.hours||0,a=parseFloat(t.sqm)||0;return o||.5*a*e.labour}),t.breakdown?.labourTotal&&t.breakdown?.labourRate?t.breakdown.labourTotal/t.breakdown.labourRate:null,t.totals?.labour&&t.breakdown?.labourRate?t.totals.labour/t.breakdown.labourRate:null],r=[t.totals?.labour,t.totals?.labour_total,t.totals?.Labour,t.totals?.LABOUR,t.totals?.labor,t.totals?.labor_total,t.totals?.Labor,t.totals?.LABOR,t.totals?.work,t.totals?.work_total,t.totals?.Work,t.totals?.WORK,t.labourTotal,t.labour_total,t.LabourTotal,t.LABOUR_TOTAL,t.laborTotal,t.labor_total,t.LaborTotal,t.LABOR_TOTAL,t.workTotal,t.work_total,t.WorkTotal,t.WORK_TOTAL,t.breakdown?.labourTotal,t.breakdown?.labour_total,t.breakdown?.LabourTotal,t.breakdown?.LABOUR_TOTAL,t.breakdown?.laborTotal,t.breakdown?.labor_total,t.breakdown?.LaborTotal,t.breakdown?.LABOR_TOTAL,t.breakdown?.workTotal,t.breakdown?.work_total,t.breakdown?.WorkTotal,t.breakdown?.WORK_TOTAL,...(t.rooms||[]).map(t=>{let e=u(t);t.labourCost||t.laborCost||t.workCost;let o=t.labourRate||t.laborRate||t.hourlyRate||25,a=t.labourHours||t.laborHours||t.hours||0,r=parseFloat(t.sqm)||0;return o*e.labour*(a||.5*r*e.labour)}),t.breakdown?.labourRate&&t.breakdown?.labourHours?t.breakdown.labourRate*t.breakdown.labourHours:null];for(let t of o)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.rate=parseFloat(t),console.log("✅ Found labour rate:",e.rate,"from source:",t);break}for(let t of a)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.hours=parseFloat(t),console.log("✅ Found labour hours:",e.hours,"from source:",t);break}for(let t of r)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.total=parseFloat(t),console.log("✅ Found labour total:",e.total,"from source:",t);break}return 0===e.total&&(e.rate>0&&e.hours>0?(e.total=e.rate*e.hours,console.log("\uD83D\uDD22 Calculated labour total from rate \xd7 hours:",e.total)):e.rate>0&&t.breakdown?.labourHours?(e.hours=parseFloat(t.breakdown.labourHours),e.total=e.rate*e.hours,console.log("\uD83D\uDD22 Calculated labour total from rate \xd7 labourHours:",e.total)):e.hours>0&&t.totals?.labour&&(e.rate=parseFloat(t.totals.labour)/e.hours,e.total=parseFloat(t.totals.labour),console.log("\uD83D\uDD22 Calculated labour rate from total \xf7 hours:",e.rate))),0===e.rate&&0===e.hours&&0===e.total&&(console.warn("⚠️ No labour data found, using defaults"),e.rate=25,e.hours=8,e.total=200),t.breakdown?.labourHours||t.labourHours,e.unit="hour",console.log("✅ ULTRA-ROBUST normalized labour data:",e),e}(e),l=function(t){console.log("\uD83D\uDD27 ULTRA-ROBUST: Normalizing materials data...");let e={cost:0,quantity:0,total:0,unit:"sqm",description:"Materials & Equipment"},o=[t.breakdown?.materialsCost,t.breakdown?.materials_cost,t.breakdown?.MaterialsCost,t.breakdown?.MATERIALS_COST,t.breakdown?.materialsRate,t.breakdown?.materials_rate,t.breakdown?.MaterialsRate,t.breakdown?.MATERIALS_RATE,t.breakdown?.materialCost,t.breakdown?.material_cost,t.breakdown?.MaterialCost,t.breakdown?.MATERIAL_COST,t.materialsCost,t.materials_cost,t.MaterialsCost,t.MATERIALS_COST,t.materialsRate,t.materials_rate,t.MaterialsRate,t.MATERIALS_RATE,t.materialCost,t.material_cost,t.MaterialCost,t.MATERIAL_COST,...(t.rooms||[]).map(t=>{let e=u(t),o=t.materialsCost||t.materialCost||0,a=parseFloat(t.sqm)||0;return o*e.materials*a}),t.breakdown?.materialsTotal&&t.breakdown?.materialsQuantity?t.breakdown.materialsTotal/t.breakdown.materialsQuantity:null,t.totals?.materials&&t.breakdown?.materialsQuantity?t.totals.materials/t.breakdown.materialsQuantity:null],a=[t.breakdown?.materialsQuantity,t.breakdown?.materials_quantity,t.breakdown?.MaterialsQuantity,t.breakdown?.MATERIALS_QUANTITY,t.breakdown?.materialQuantity,t.breakdown?.material_quantity,t.breakdown?.MaterialQuantity,t.breakdown?.MATERIAL_QUANTITY,t.breakdown?.totalSqm,t.breakdown?.total_sqm,t.breakdown?.TotalSqm,t.breakdown?.TOTAL_SQM,t.materialsQuantity,t.materials_quantity,t.MaterialsQuantity,t.MATERIALS_QUANTITY,t.materialQuantity,t.material_quantity,t.MaterialQuantity,t.MATERIAL_QUANTITY,t.totalSqm,t.total_sqm,t.TotalSqm,t.TOTAL_SQM,...(t.rooms||[]).map(t=>parseFloat(t.sqm)||0),t.breakdown?.materialsTotal&&t.breakdown?.materialsCost?t.breakdown.materialsTotal/t.breakdown.materialsCost:null,t.totals?.materials&&t.breakdown?.materialsCost?t.totals.materials/t.breakdown.materialsCost:null],r=[t.totals?.materials,t.totals?.materials_total,t.totals?.Materials,t.totals?.MATERIALS,t.totals?.material,t.totals?.material_total,t.totals?.Material,t.totals?.MATERIAL,t.materialsTotal,t.materials_total,t.MaterialsTotal,t.MATERIALS_TOTAL,t.materialTotal,t.material_total,t.MaterialTotal,t.MATERIAL_TOTAL,t.breakdown?.materialsTotal,t.breakdown?.materials_total,t.breakdown?.MaterialsTotal,t.breakdown?.MATERIALS_TOTAL,t.breakdown?.materialTotal,t.breakdown?.material_total,t.breakdown?.MaterialTotal,t.breakdown?.MATERIAL_TOTAL,...(t.rooms||[]).map(t=>{let e=u(t),o=t.materialsCost||t.materialCost||0,a=parseFloat(t.sqm)||0;return o*e.materials*a}),t.breakdown?.materialsCost&&t.breakdown?.materialsQuantity?t.breakdown.materialsCost*t.breakdown.materialsQuantity:null];for(let t of o)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.cost=parseFloat(t),console.log("✅ Found materials cost:",e.cost,"from source:",t);break}for(let t of a)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.quantity=parseFloat(t),console.log("✅ Found materials quantity:",e.quantity,"from source:",t);break}for(let t of r)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.total=parseFloat(t),console.log("✅ Found materials total:",e.total,"from source:",t);break}return 0===e.total&&(e.cost>0&&e.quantity>0?(e.total=e.cost*e.quantity,console.log("\uD83D\uDD22 Calculated materials total from cost \xd7 quantity:",e.total)):e.cost>0&&t.breakdown?.totalSqm?(e.quantity=parseFloat(t.breakdown.totalSqm),e.total=e.cost*e.quantity,console.log("\uD83D\uDD22 Calculated materials total from cost \xd7 totalSqm:",e.total)):e.quantity>0&&t.totals?.materials&&(e.cost=parseFloat(t.totals.materials)/e.quantity,e.total=parseFloat(t.totals.materials),console.log("\uD83D\uDD22 Calculated materials cost from total \xf7 quantity:",e.cost))),0===e.cost&&0===e.quantity&&0===e.total&&(console.warn("⚠️ No materials data found, using defaults"),e.cost=10,e.quantity=1,e.total=10),t.breakdown?.totalSqm||t.totalSqm?e.unit="sqm":t.breakdown?.materialsQuantity&&t.breakdown.materialsQuantity>100?e.unit="sqm":e.unit="unit",console.log("✅ ULTRA-ROBUST normalized materials data:",e),e}(e),i=function(t){console.log("\uD83D\uDD27 ULTRA-ROBUST: Normalizing travel data...");let e={cost:0,distance:0,total:0,unit:"km",description:"Travel & Transport"},o=[t.breakdown?.travelCost,t.breakdown?.travel_cost,t.breakdown?.TravelCost,t.breakdown?.TRAVEL_COST,t.breakdown?.travelRate,t.breakdown?.travel_rate,t.breakdown?.TravelRate,t.breakdown?.TRAVEL_RATE,t.breakdown?.fuelCost,t.breakdown?.fuel_cost,t.breakdown?.FuelCost,t.breakdown?.FUEL_COST,t.travelCost,t.travel_cost,t.TravelCost,t.TRAVEL_COST,t.travelRate,t.travel_rate,t.TravelRate,t.TRAVEL_RATE,t.fuelCost,t.fuel_cost,t.FuelCost,t.FUEL_COST,t.breakdown?.travelTotal&&t.breakdown?.travelDistance?t.breakdown.travelTotal/t.breakdown.travelDistance:null,t.totals?.travel&&t.breakdown?.travelDistance?t.totals.travel/t.breakdown.travelDistance:null],a=[t.breakdown?.travelDistance,t.breakdown?.travel_distance,t.breakdown?.TravelDistance,t.breakdown?.TRAVEL_DISTANCE,t.breakdown?.distance,t.breakdown?.Distance,t.breakdown?.DISTANCE,t.breakdown?.km,t.breakdown?.Km,t.breakdown?.KM,t.travelDistance,t.travel_distance,t.TravelDistance,t.TRAVEL_DISTANCE,t.distance,t.Distance,t.DISTANCE,t.km,t.Km,t.KM,t.breakdown?.travelTotal&&t.breakdown?.travelCost?t.breakdown.travelTotal/t.breakdown.travelCost:null,t.totals?.travel&&t.breakdown?.travelCost?t.totals.travel/t.breakdown.travelCost:null],r=[t.totals?.travel,t.totals?.travel_total,t.totals?.Travel,t.totals?.TRAVEL,t.totals?.fuel,t.totals?.fuel_total,t.totals?.Fuel,t.totals?.FUEL,t.travelTotal,t.travel_total,t.TravelTotal,t.TRAVEL_TOTAL,t.fuelTotal,t.fuel_total,t.FuelTotal,t.FUEL_TOTAL,t.breakdown?.travelTotal,t.breakdown?.travel_total,t.breakdown?.TravelTotal,t.breakdown?.TRAVEL_TOTAL,t.breakdown?.fuelTotal,t.breakdown?.fuel_total,t.breakdown?.FuelTotal,t.breakdown?.FUEL_TOTAL,t.breakdown?.travelCost&&t.breakdown?.travelDistance?t.breakdown.travelCost*t.breakdown.travelDistance:null];for(let t of o)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.cost=parseFloat(t),console.log("✅ Found travel cost:",e.cost,"from source:",t);break}for(let t of a)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.distance=parseFloat(t),console.log("✅ Found travel distance:",e.distance,"from source:",t);break}for(let t of r)if(null!=t&&!isNaN(parseFloat(t))&&parseFloat(t)>=0){e.total=parseFloat(t),console.log("✅ Found travel total:",e.total,"from source:",t);break}return 0===e.total&&(e.cost>0&&e.distance>0?(e.total=e.cost*e.distance,console.log("\uD83D\uDD22 Calculated travel total from cost \xd7 distance:",e.total)):e.cost>0&&t.breakdown?.travelDistance?(e.distance=parseFloat(t.breakdown.travelDistance),e.total=e.cost*e.distance,console.log("\uD83D\uDD22 Calculated travel total from cost \xd7 travelDistance:",e.total)):e.distance>0&&t.totals?.travel&&(e.cost=parseFloat(t.totals.travel)/e.distance,e.total=parseFloat(t.totals.travel),console.log("\uD83D\uDD22 Calculated travel cost from total \xf7 distance:",e.cost))),0===e.cost&&0===e.distance&&0===e.total&&(console.warn("⚠️ No travel data found, using defaults"),e.cost=1,e.distance=10,e.total=10),t.breakdown?.travelDistance||t.travelDistance,e.unit="km",console.log("✅ ULTRA-ROBUST normalized travel data:",e),e}(e),n=parseFloat(e.totals?.installation||e.totals?.Installation||e.totals?.INSTALLATION||e.breakdown?.installationCost||e.breakdown?.InstallationCost||e.breakdown?.INSTALLATION_COST||e.installationCost||e.InstallationCost||e.INSTALLATION_COST||0),d=parseFloat(e.breakdown?.totalSqm||e.breakdown?.total_sqm||e.breakdown?.TotalSqm||e.breakdown?.TOTAL_SQM||e.totalSqm||e.total_sqm||e.TotalSqm||e.TOTAL_SQM||0);a=(a=(a=(a=(a=(a=(a=(a=a.replace(/{{LABOUR_RATE}}/g,o(r.rate))).replace(/{{LABOUR_HOURS}}/g,r.hours.toFixed(1))).replace(/{{MATERIALS_RATE}}/g,o(l.cost))).replace(/{{MATERIALS_QUANTITY}}/g,l.quantity.toString())).replace(/{{MATERIALS_UNIT}}/g,"sqm")).replace(/{{TRAVEL_RATE}}/g,o(i.cost))).replace(/{{TRAVEL_DISTANCE}}/g,i.distance.toString())).replace(/{{TOTAL_SQM}}/g,d.toFixed(1)),console.log("✅ All breakdown placeholders processed with robust normalization"),console.log("\uD83D\uDD0D Sample replacements:",{labourRate:o(r.rate),labourHours:r.hours.toFixed(1),materialsRate:o(l.cost),materialsQuantity:l.quantity.toString()}),a=(a=(a=(a=a.replace(/{{LABOUR_TOTAL}}/g,o(r.total))).replace(/{{MATERIALS_TOTAL}}/g,o(l.total))).replace(/{{TRAVEL_TOTAL}}/g,o(i.total))).replace(/{{INSTALLATION_TOTAL}}/g,o(n)),console.log("\uD83D\uDD0D PDF Generator - Looking for totals in data:",{"data.totals":e.totals,"data.subtotal":e.subtotal,"data.gst":e.gst,"data.final":e.final,"data.totals?.subtotal":e.totals?.subtotal,"data.totals?.gst":e.totals?.gst,"data.totals?.final":e.totals?.final});let c=parseFloat(e.totals?.subtotal||e.totals?.Subtotal||e.totals?.SUBTOTAL||e.subtotal||e.Subtotal||e.SUBTOTAL||0),p=parseFloat(e.totals?.gst||e.totals?.GST||e.totals?.Gst||e.gst||e.GST||e.Gst||0),b=parseFloat(e.totals?.final||e.totals?.Final||e.totals?.FINAL||e.totals?.total||e.totals?.Total||e.totals?.TOTAL||e.final||e.Final||e.FINAL||e.total||e.Total||e.TOTAL||0);return 0===c&&console.log("\uD83D\uDD22 Calculated subtotal from components:",c=r.total+l.total+i.total+n),0===p&&c>0&&console.log("\uD83D\uDD22 Calculated GST (15%):",p=.15*c),0===b&&c>0&&console.log("\uD83D\uDD22 Calculated final total:",b=c+p),console.log("\uD83D\uDCB0 PDF Generator - Final calculated totals:",{subtotal:c,gst:p,finalTotal:b}),a=(a=(a=(a=(a=(a=(a=(a=(a=(a=(a=a.replace(/{{SUBTOTAL}}/g,o(c))).replace(/{{GST}}/g,o(p))).replace(/{{FINAL_TOTAL}}/g,o(b))).replace(/\{\{subtotal\}\}/g,o(c))).replace(/\{\{totals\.subtotal\}\}/g,o(c))).replace(/\{\{gst\}\}/g,o(p))).replace(/\{\{totals\.gst\}\}/g,o(p))).replace(/\{\{total\}\}/g,o(b))).replace(/\{\{grand_total\}\}/g,o(b))).replace(/\{\{totalQuote\}\}/g,o(b))).replace(/\{\{totals\.final\}\}/g,o(b)),console.log("✅ Template replacement completed with robust placeholder mappings"),a}function u(t,e=null){let o=(t.name||"").toLowerCase(),a=t.roomType||t.type||"",r=(t,o)=>e&&void 0!==e[t]?e[t]:o,l={bathroom:{labour:r("bathroomLabourMultiplier",1.5),materials:r("bathroomMaterialsMultiplier",2),hoursPerSqm:r("bathroomHoursPerSqm",.8),description:"Bathroom (plumbing, waterproofing, tiling)"},kitchen:{labour:r("kitchenLabourMultiplier",1.4),materials:r("kitchenMaterialsMultiplier",1.8),hoursPerSqm:r("kitchenHoursPerSqm",.7),description:"Kitchen (cabinetry, appliances, plumbing)"},laundry:{labour:r("bathroomLabourMultiplier",1.5),materials:r("bathroomMaterialsMultiplier",2),hoursPerSqm:r("bathroomHoursPerSqm",.8),description:"Laundry (plumbing, waterproofing)"},wetroom:{labour:r("bathroomLabourMultiplier",1.5),materials:r("bathroomMaterialsMultiplier",2),hoursPerSqm:r("bathroomHoursPerSqm",.8),description:"Wetroom (extensive waterproofing)"},ensuite:{labour:r("bathroomLabourMultiplier",1.5),materials:r("bathroomMaterialsMultiplier",2),hoursPerSqm:r("bathroomHoursPerSqm",.8),description:"Ensuite (bathroom complexity)"},living:{labour:r("livingLabourMultiplier",1.1),materials:r("livingMaterialsMultiplier",1.2),hoursPerSqm:r("livingHoursPerSqm",.6),description:"Living room (standard installation)"},lounge:{labour:r("livingLabourMultiplier",1.1),materials:r("livingMaterialsMultiplier",1.2),hoursPerSqm:r("livingHoursPerSqm",.6),description:"Lounge (standard installation)"},dining:{labour:r("livingLabourMultiplier",1.1),materials:r("livingMaterialsMultiplier",1.2),hoursPerSqm:r("livingHoursPerSqm",.6),description:"Dining room (standard installation)"},family:{labour:r("livingLabourMultiplier",1.1),materials:r("livingMaterialsMultiplier",1.2),hoursPerSqm:r("livingHoursPerSqm",.6),description:"Family room (standard installation)"},bedroom:{labour:r("bedroomLabourMultiplier",1),materials:r("bedroomMaterialsMultiplier",1),hoursPerSqm:r("bedroomHoursPerSqm",.5),description:"Bedroom (simple installation)"},study:{labour:r("bedroomLabourMultiplier",1),materials:r("bedroomMaterialsMultiplier",1),hoursPerSqm:r("bedroomHoursPerSqm",.5),description:"Study (simple installation)"},office:{labour:r("bedroomLabourMultiplier",1),materials:r("bedroomMaterialsMultiplier",1),hoursPerSqm:r("bedroomHoursPerSqm",.5),description:"Office (simple installation)"},hallway:{labour:r("bedroomLabourMultiplier",1),materials:r("bedroomMaterialsMultiplier",1),hoursPerSqm:r("bedroomHoursPerSqm",.5),description:"Hallway (simple installation)"},corridor:{labour:r("bedroomLabourMultiplier",1),materials:r("bedroomMaterialsMultiplier",1),hoursPerSqm:r("bedroomHoursPerSqm",.5),description:"Corridor (simple installation)"},garage:{labour:.8,materials:.9,hoursPerSqm:.3,description:"Garage (basic installation)"},basement:{labour:1.2,materials:1.3,hoursPerSqm:.7,description:"Basement (access challenges)"},attic:{labour:1.3,materials:1.4,hoursPerSqm:.8,description:"Attic (access challenges)"}},s={labour:r("bedroomLabourMultiplier",1),materials:r("bedroomMaterialsMultiplier",1),hoursPerSqm:r("bedroomHoursPerSqm",.5),description:"Standard room"};for(let[t,e]of Object.entries(l))if(o.includes(t)||t.includes(o)){s=e;break}return a&&l[a.toLowerCase()]&&(s=l[a.toLowerCase()]),s}async function c(t){let e=await r(),o=function(t){let{adobeCount:e,pdfshiftCount:o}=t;return e<500?(console.log(`🎯 Adobe available: ${e}/500 - using Adobe first`),"Adobe"):(console.log(`⚠️ Adobe quota reached (500/500) – falling back to PDFShift`),o<50)?(console.log(`🎯 PDFShift available: ${o}/50 - using PDFShift`),"PDFShift"):(console.log(`⚠️ PDFShift quota reached (50/50) – falling back to API2PDF`),console.log(`🎯 Using API2PDF (paid service, no limit)`),"API2PDF")}(e);console.log("\uD83D\uDD0D PDF Service Environment Check:"),console.log("   Adobe PDF:",process.env.ADOBE_PDF_CLIENT_ID?"✅ Set":"❌ Missing"),console.log("   PDFShift:",process.env.PDFSHIFT_API_KEY?"✅ Set":"❌ Missing"),console.log("   API2PDF:",process.env.API2PDF_API_KEY?"✅ Set":"❌ Missing"),console.log("   HTML/CSS to PDF:",process.env.HTMLCSSTOPDF_API_KEY?"✅ Set":"❌ Missing"),console.log(`🎯 Selected provider: ${o} (based on current usage)`);let a=[];for(let r of("Adobe"===o&&process.env.ADOBE_PDF_CLIENT_ID&&process.env.ADOBE_PDF_CLIENT_SECRET&&a.push("Adobe"),"PDFShift"===o&&process.env.PDFSHIFT_API_KEY&&a.push("PDFShift"),"API2PDF"===o&&process.env.API2PDF_API_KEY&&a.push("API2PDF"),"Adobe"!==o&&process.env.ADOBE_PDF_CLIENT_ID&&process.env.ADOBE_PDF_CLIENT_SECRET&&e.adobeCount<500&&a.push("Adobe"),"PDFShift"!==o&&process.env.PDFSHIFT_API_KEY&&e.pdfshiftCount<50&&a.push("PDFShift"),"API2PDF"!==o&&process.env.API2PDF_API_KEY&&a.push("API2PDF"),process.env.HTMLCSSTOPDF_API_KEY&&a.push("HTMLCSSTOPDF"),a))try{let e;switch(console.log(`🎯 Trying ${r}...`),r){case"Adobe":e=await p(t);break;case"PDFShift":e=await m(t);break;case"API2PDF":e=await b(t);break;case"HTMLCSSTOPDF":e=await g(t);break;default:continue}return console.log(`✅ PDF generation successful with ${r}`),e}catch(t){console.log(`⚠️ ${r} failed, trying next service:`,t.message);continue}throw console.log("⚠️ No PDF service API key found, PDF generation not available"),Error("PDF generation requires API service configuration (Adobe PDF, API2PDF, or PDFShift)")}async function p(t){console.log("\uD83D\uDD04 Converting HTML to PDF using Adobe PDF Services...");try{if(!process.env.ADOBE_PDF_CLIENT_ID||!process.env.ADOBE_PDF_CLIENT_SECRET)throw Error("Adobe PDF credentials not configured");let e=await fetch("https://ims-na1.adobelogin.com/ims/token/v3",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:process.env.ADOBE_PDF_CLIENT_ID,client_secret:process.env.ADOBE_PDF_CLIENT_SECRET,grant_type:"client_credentials",scope:"https://ims-na1.adobelogin.com/s/ent_pdf_services_sdk"})});if(!e.ok){let t=await e.text();throw console.error("❌ Adobe Auth Error:",{status:e.status,statusText:e.statusText,error:t}),Error(`Adobe auth failed: ${e.status} - ${t}`)}let o=await e.json();console.log("✅ Adobe authentication successful");let a=await fetch("https://pdf-services.adobe.io/operation/createpdf",{method:"POST",headers:{Authorization:`Bearer ${o.access_token}`,"x-api-key":process.env.ADOBE_PDF_CLIENT_ID,"Content-Type":"application/json"},body:JSON.stringify({assetID:"urn:aaid:AS:UE1:"+Date.now(),mediaType:"text/html",html:t,json:JSON.stringify({includeHeaderFooter:!1,landscape:!1,paperSize:"A4",marginTop:"0.5in",marginBottom:"0.5in",marginLeft:"0.5in",marginRight:"0.5in"})})});if(!a.ok){let t=await a.text();throw console.error("❌ Adobe PDF API Error:",{status:a.status,statusText:a.statusText,error:t}),Error(`Adobe PDF API error: ${a.status} - ${t}`)}let r=Buffer.from(await a.arrayBuffer());return console.log("✅ Adobe PDF conversion successful, PDF size:",r.length,"bytes"),await l("Adobe"),r}catch(t){throw console.error("❌ Adobe PDF conversion failed:",t),t}}async function b(t){console.log("\uD83D\uDD04 Converting HTML to PDF using API2PDF...");let e=await fetch("https://v2018.api2pdf.com/chrome/html",{method:"POST",headers:{Authorization:process.env.API2PDF_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({html:t,landscape:!0,format:"A4",margin:{top:"0.5in",right:"0.5in",bottom:"0.5in",left:"0.5in"},printBackground:!0})});if(!e.ok){let t=await e.text();throw console.error("❌ API2PDF Error:",{status:e.status,error:t}),Error(`API2PDF error: ${e.status} - ${t}`)}let o=await e.json(),a=await fetch(o.pdf);if(!a.ok)throw Error(`Failed to download PDF from API2PDF: ${a.status}`);let r=Buffer.from(await a.arrayBuffer());return console.log("✅ API2PDF conversion successful, PDF size:",r.length,"bytes"),await l("API2PDF"),r}async function m(t){console.log("\uD83D\uDD04 Converting HTML to PDF using PDFShift..."),console.log("\uD83D\uDCC4 HTML length:",t.length,"characters"),console.log("\uD83D\uDD11 API Key present:",process.env.PDFSHIFT_API_KEY?"Yes":"No");let e=await fetch("https://api.pdfshift.io/v3/convert/pdf",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({source:t,format:"A4",landscape:!0,margin:{top:"0.5in",right:"0.5in",bottom:"0.5in",left:"0.5in"}})});if(!e.ok){let t=await e.text();throw console.error("❌ PDFShift API Error:",{status:e.status,statusText:e.statusText,error:t}),Error(`PDFShift API error: ${e.status} ${e.statusText} - ${t}`)}let o=Buffer.from(await e.arrayBuffer());return console.log("✅ PDFShift conversion successful, PDF size:",o.length,"bytes"),await l("PDFShift"),o}async function g(t){let e=await fetch("https://htmlcsstoimage.com/demo",{method:"POST",headers:{Authorization:`Bearer ${process.env.HTMLCSSTOPDF_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({html:t,format:"pdf",landscape:!0,margin:"20mm"})});if(!e.ok)throw Error(`HTML/CSS to PDF API error: ${e.status} ${e.statusText}`);return Buffer.from(await e.arrayBuffer())}function T(t){console.log("\uD83D\uDD04 Generating formatted HTML for quote:",t.quoteId);try{let e=i(),o=d(e,t),a=`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote ${t.quoteId} - Kiwi Trade</title>
    <style>
        /* Add print styles for better browser-based PDF generation */
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
        }
        
        /* Add button for manual PDF generation */
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            font-weight: bold;
        }
        
        .print-button:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="print-notice no-print" style="position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 10px 20px; border-radius: 5px; z-index: 1000; font-weight: bold;">
        🖨️ Use your browser's Print function (Ctrl+P) to save as PDF
    </div>
    ${o}
</body>
</html>`;return console.log("✅ HTML quote generated successfully"),a}catch(t){throw console.error("❌ HTML generation failed:",t),Error(`Failed to generate HTML: ${t.message}`)}}}};