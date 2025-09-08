"use strict";exports.id=5803,exports.ids=[5803],exports.modules={7026:(e,t,o)=>{function a(e){if(!e||"string"!=typeof e)return e||"";let t=e.replace(/\s*unlisted\s+suburb\s*$/i,"").trim();return console.log(`[NORMALIZE] Address normalization: "${e}" → "${t}"`),t}function s(e){if(!e||"string"!=typeof e)return e||"";let t=e.replace(/\s*unlisted\s+suburb\s*$/i,"").trim();return console.log(`[NORMALIZE] Suburb normalization: "${e}" → "${t}"`),t}function n(e){if(!e||"string"!=typeof e)return e||"";let t=e.split(/[,\s]+/).filter(e=>e.trim()).map(e=>s(e)).join(" ").trim();return console.log(`[NORMALIZE] Location normalization: "${e}" → "${t}"`),t}function r(e){if(!e||"object"!=typeof e)return e;let t={...e};return t.customerAddress&&(t.customerAddress=a(t.customerAddress)),t.location&&(t.location=n(t.location)),t.breakdown&&t.breakdown.address&&(t.breakdown.address=a(t.breakdown.address)),console.log(`[NORMALIZE] Normalized quote data addresses for quoteId: ${t.quoteId||"unknown"}`),t}function i(e){if(!e||"object"!=typeof e)return e;let t={...e};return t.Location&&(t.Location=n(t.Location)),t.location&&(t.location=n(t.location)),t.Suburb&&(t.Suburb=s(t.Suburb)),t.suburb&&(t.suburb=s(t.suburb)),t.Area&&(t.Area=s(t.Area)),t.area&&(t.area=s(t.area)),console.log(`[NORMALIZE] Normalized lead data addresses for leadId: ${t.LeadId||t.Lead||"unknown"}`),t}o.d(t,{HF:()=>i,wY:()=>r})},2393:(e,t,o)=>{o.d(t,{V:()=>s,u:()=>n});var a=o(3078);async function s(e,t={}){console.log(`[DEBUG] generateQuotePDF: Generating PDF for quoteId=${e.quoteId}`);let o=null,s=Date.now();for(let n of[{name:"PDFShift",enabled:!0},{name:"API2PDF",enabled:!0},{name:"Adobe",enabled:!1}])if(n.enabled)try{console.log(`[DEBUG] generateQuotePDF: Attempting to generate PDF with ${n.name}`);let o=await (0,a.V7)(e,{...t,preferredProvider:n.name}),r=Date.now()-s;return console.log(`[PDF] Successfully generated PDF with ${n.name} in ${r}ms`),o}catch(e){console.error(`[DEBUG] generateQuotePDF: Failed with ${n.name}:`,e.message),o=e}throw o||Error("All PDF providers failed")}function n(e){return console.log(`[DEBUG] generateHTMLQuote: Generating HTML backup for quoteId=${e.quoteId}`),`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quote #${e.quoteId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section-title { border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .total-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
        .total-row { display: flex; justify-content: space-between; }
        .final-total { font-weight: bold; font-size: 1.2em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quote #${e.quoteId}</h1>
          <p>Professional Underfloor Heating Solutions</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">Quote Information</h2>
          <div class="info-grid">
            <div><strong>Quote ID:</strong> ${e.quoteId}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString("en-NZ")}</div>
            <div><strong>Valid Until:</strong> ${e.validUntil?new Date(e.validUntil).toLocaleDateString("en-NZ"):"N/A"}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Customer Details</h2>
          <div class="info-grid">
            <div><strong>Name:</strong> ${e.customerName||"N/A"}</div>
            <div><strong>Email:</strong> ${e.customerEmail||"N/A"}</div>
            <div><strong>Phone:</strong> ${e.customerPhone||"N/A"}</div>
            <div><strong>Address:</strong> ${e.customerAddress||"N/A"}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Tradesperson Details</h2>
          <div class="info-grid">
            <div><strong>Name:</strong> ${e.tradespersonName||"N/A"}</div>
            <div><strong>Email:</strong> ${e.tradespersonEmail||"N/A"}</div>
            <div><strong>Phone:</strong> ${e.tradespersonPhone||"N/A"}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Quote Summary</h2>
          <div class="total-section">
            <div class="total-row">
              <span>Labour:</span>
              <span>$${(e.labourRate*e.labourHours||0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Materials:</span>
              <span>$${(e.materialsCost*e.materialsQuantity||0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Travel:</span>
              <span>$${(e.travelCost*e.travelDistance||0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Installation:</span>
              <span>$${(e.installationCost||0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${(e.subtotal||0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>GST (15%):</span>
              <span>$${(e.gst||0).toFixed(2)}</span>
            </div>
            <div class="total-row final-total">
              <span>Total (incl. GST):</span>
              <span>$${(e.totalQuote||0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Notes</h2>
          <p>${e.notes||"No additional notes."}</p>
        </div>
      </div>
    </body>
    </html>
  `}},5683:(e,t,o)=>{o.d(t,{B9:()=>d,Fc:()=>i,Lk:()=>c,tB:()=>r});var a=o(5367),s=o(4770),n=o.n(s);function r(e,t,o={}){let a=n().createHash("md5").update(JSON.stringify(o)).digest("hex").substring(0,8);return`${e}:${t}:${a}`}async function i(e){console.log(`[DEBUG] getQuoteRowByQuoteId: Searching for quoteId=${e}`);try{let t=await (0,a.getGoogleSheetsClient)(),o=(await t.spreadsheets.values.get({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:"Quotes!A:Z"})).data.values||[];if(0===o.length)return console.log("[DEBUG] getQuoteRowByQuoteId: No rows found in Quotes sheet"),null;let s=o[0],n=s.findIndex(e=>"quoteid"===e.toLowerCase()||"quote id"===e.toLowerCase());if(-1===n)return console.error("[DEBUG] getQuoteRowByQuoteId: QuoteId column not found in headers"),null;let r=[];for(let t=1;t<o.length;t++){let a=o[t];if(a[n]===e){let e={};s.forEach((t,o)=>{e[t]=o<a.length?a[o]:""}),r.push({rowData:e,rowIndex:t+1})}}if(0===r.length)return console.log(`[DEBUG] getQuoteRowByQuoteId: No matching rows found for quoteId=${e}`),null;return r.length>1&&console.log(`[DEBUG] getQuoteRowByQuoteId: Found ${r.length} rows for quoteId=${e}, using most recent`),r[r.length-1]}catch(e){throw console.error("[DEBUG] getQuoteRowByQuoteId: Error fetching quote row:",e),e}}async function l(e,t){console.log(`[DEBUG] updateQuoteRow: Updating row at index ${e}`);try{let o=await (0,a.getGoogleSheetsClient)(),s=(await o.spreadsheets.values.get({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:"Quotes!A1:Z1"})).data.values[0],n=Array(s.length).fill("");return Object.entries(t).forEach(([e,t])=>{let o=s.findIndex(t=>t===e);-1!==o&&(n[o]=t)}),await o.spreadsheets.values.update({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:`Quotes!A${e}:${String.fromCharCode(65+s.length-1)}${e}`,valueInputOption:"USER_ENTERED",resource:{values:[n]}}),console.log(`[DEBUG] updateQuoteRow: Successfully updated row ${e}`),{rowIndex:e,data:t}}catch(e){throw console.error("[DEBUG] updateQuoteRow: Error updating quote row:",e),e}}async function d(e,t){console.log(`[DEBUG] upsertQuoteRow: Upserting data for quoteId=${e}, source=payload`);try{if(t.LastMutationId){let o=await i(e);if(o&&o.rowData.LastMutationId===t.LastMutationId)return console.log(`[DEBUG] upsertQuoteRow: Idempotent operation detected with mutationId=${t.LastMutationId}`),{rowIndex:o.rowIndex,data:o.rowData,action:"IDEMPOTENT"}}let o=await i(e);if(o){console.log(`[DEBUG] upsertQuoteRow: Found existing row at index ${o.rowIndex}, performing UPDATE`);let e={...o.rowData,...t};return await l(o.rowIndex,e)}{console.log("[DEBUG] upsertQuoteRow: No existing row found, performing APPEND");let o=await (0,a.getGoogleSheetsClient)(),s=(await o.spreadsheets.values.get({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:"Quotes!A1:Z1"})).data.values[0],n=Array(s.length).fill(""),r={...t,QuoteId:e};Object.entries(r).forEach(([e,t])=>{let o=s.findIndex(t=>t===e);-1!==o&&(n[o]=t)});let i=(await o.spreadsheets.values.append({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:"Quotes!A1",valueInputOption:"USER_ENTERED",insertDataOption:"INSERT_ROWS",resource:{values:[n]}})).data.updates.updatedRange,l=parseInt(i.split(":")[0].match(/\d+/)[0]);return console.log(`[DEBUG] upsertQuoteRow: Successfully appended new row at index ${l}`),await u(e,l),{rowIndex:l,data:r,action:"APPEND"}}}catch(e){throw console.error("[DEBUG] upsertQuoteRow: Error upserting quote row:",e),e}}async function u(e,t){console.log(`[DEBUG] checkAndMarkDuplicates: Checking for duplicates of quoteId=${e}`);try{let o=await (0,a.getGoogleSheetsClient)(),s=(await o.spreadsheets.values.get({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:"Quotes!A:Z"})).data.values||[];if(s.length<=1)return;let n=s[0],r=n.findIndex(e=>"quoteid"===e.toLowerCase()||"quote id"===e.toLowerCase()),i=n.findIndex(e=>"status"===e.toLowerCase()||"quote status"===e.toLowerCase());if(-1===r||-1===i){console.error("[DEBUG] checkAndMarkDuplicates: Required columns not found");return}let l=[];for(let o=1;o<s.length;o++){let a=o+1,n=s[o];n[r]===e&&a!==t&&l.push({rowIndex:a,row:n})}if(0===l.length){console.log(`[DEBUG] checkAndMarkDuplicates: No duplicates found for quoteId=${e}`);return}for(let{rowIndex:t}of(console.log(`[DEBUG] checkAndMarkDuplicates: Found ${l.length} duplicate rows for quoteId=${e}`),l))await o.spreadsheets.values.update({spreadsheetId:process.env.GOOGLE_SHEETS_ID,range:`Quotes!${String.fromCharCode(65+i)}${t}`,valueInputOption:"USER_ENTERED",resource:{values:[["VOID - DUPLICATE"]]}}),console.log(`[DEBUG] checkAndMarkDuplicates: Marked row ${t} as VOID - DUPLICATE`)}catch(e){console.error("[DEBUG] checkAndMarkDuplicates: Error checking for duplicates:",e)}}function c(e,t,o,a={}){let s=function(e=new Date){return e.toLocaleString("en-NZ",{timeZone:"Pacific/Auckland",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(",","")}();return{TimeStamp:s,QuoteID:e,LeadID:t.Lead||t.LeadId||"",TradePersonName:o.tradespersonName||"",TradePersonEmail:o.tradespersonEmail||"",TradePersonPhone:o.tradespersonPhone||"",CustomerName:t.CustomerName||t.customerName||"",CustomerEmail:t.CustomerEmail||t.customerEmail||"",CustomerPhone:t.CustomerPhone||t.customerPhone||"",ServiceType:t.ServiceType||t.serviceType||"Underfloor Heating",Location:t.Location||t.location||"",ProjectDetails:t.ProjectDetails||t.projectDetails||"",Budget:t.Budget||t.budget||"",Timeline:t.Timeline||t.Timelline||t.timeline||"",Rooms:t.Rooms||"",LabourRate:o.labourRate||0,LabourHours:o.labourHours||0,LabourTotal:(parseFloat(o.labourRate)||0)*(parseFloat(o.labourHours)||0),MaterialsCost:o.materialsCost||0,MaterialsQuantity:o.materialsQuantity||0,MaterialsTotal:(parseFloat(o.materialsCost)||0)*(parseFloat(o.materialsQuantity)||0),TravelCost:o.travelCost||0,TravelDistance:o.travelDistance||0,TravelTotal:(parseFloat(o.travelCost)||0)*(parseFloat(o.travelDistance)||0),InstallationCost:o.installationCost||0,Subtotal:o.subtotal||0,GST:o.gst||0,TotalQuote:o.totalQuote||0,ValidUntil:o.validUntil||"",ItemBreakdown:o.itemBreakdown||"",AdditionalNotes:o.notes||"",AdminPersonStatus:a.AdminPersonStatus||"",AdminPersonTimestamp:a.AdminPersonTimestamp||"",AdminPersonNotes:a.AdminPersonNotes||"",CustomerDecision:a.CustomerDecision||"",CustomerDecisionTimestamp:a.CustomerDecisionTimestamp||"",CustomerDecisionNotes:a.CustomerDecisionNotes||"",FinalStatus:a.FinalStatus||"",FinalStatusTimestamp:a.FinalStatusTimestamp||"",FinalStatusNotes:a.FinalStatusNotes||"",QuoteDate:s,QuoteNumber:e,QuoteVersion:a.QuoteVersion||"1.0",QuoteRevision:a.QuoteRevision||"",QuoteRevisionReason:a.QuoteRevisionReason||"",QuoteRevisionTimestamp:a.QuoteRevisionTimestamp||"",QuoteRevisionNotes:a.QuoteRevisionNotes||"",QuoteRevisionApprovedBy:a.QuoteRevisionApprovedBy||"",Status:a.Status||"Submitted",LastMutationId:a.LastMutationId||""}}}};