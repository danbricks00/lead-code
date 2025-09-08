"use strict";exports.id=3273,exports.ids=[3273],exports.modules={6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,o){return o in t?t[o]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,o)):"function"==typeof t&&"default"===o?t:void 0}}})},5116:(e,t,o)=>{function r(e){let t="color: #28a745; font-weight: bold;",o="color: #ffc107; font-weight: bold;",r='<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">';switch(r+='<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>',e){case"lead":r+=`<p style="margin: 5px 0;"><span style="${t}">✔</span> Lead Received</p><p style="margin: 5px 0;"><span style="${o}">⏳</span> Awaiting Quote</p><p style="margin: 5px 0;"><span style="${o}">⏳</span> Awaiting Decision</p>`;break;case"quote":r+=`<p style="margin: 5px 0;"><span style="${t}">✔</span> Lead Received</p><p style="margin: 5px 0;"><span style="${t}">✔</span> Quote Sent</p><p style="margin: 5px 0;"><span style="${o}">⏳</span> Awaiting Decision</p>`;break;case"accepted":r+=`<p style="margin: 5px 0;"><span style="${t}">✔</span> Lead Received</p><p style="margin: 5px 0;"><span style="${t}">✔</span> Quote Sent</p><p style="margin: 5px 0;"><span style="${t}">✔</span> Quote Accepted 🎉</p>`;break;case"declined":r+=`<p style="margin: 5px 0;"><span style="${t}">✔</span> Lead Received</p><p style="margin: 5px 0;"><span style="${t}">✔</span> Quote Sent</p><p style="margin: 5px 0;"><span style="color: #dc3545; font-weight: bold;">✘</span> Quote Declined</p>`}return r+"</div>"}o.d(t,{DF:()=>p,rP:()=>a,Cz:()=>i});let n=null;async function s(){return n||(n=(await Promise.resolve().then(o.t.bind(o,5184,23))).default.createTransport({host:"smtp.gmail.com",port:465,secure:!0,auth:{user:process.env.GMAIL_USER,pass:process.env.GMAIL_APP_PASSWORD}})),n}async function i(e){try{let t;let o=await s();if("string"==typeof e){let[e,o,r]=arguments;t={from:process.env.GMAIL_USER,to:e,subject:o,html:r}}else t={from:process.env.GMAIL_USER,...e};let r=await o.sendMail(t),n=Array.isArray(t.to)?t.to.join(", "):t.to;return console.log(`✅ Email sent to ${n}, msgId: ${r.messageId}`),{success:!0,messageId:r.messageId}}catch(o){let t="string"==typeof e?e:Array.isArray(e?.to)?e.to.join(", "):e?.to;return console.error(`❌ Email failed to ${t}: ${o.message}`),{success:!1,error:o.message}}}function a(e){let{leadId:t,customerName:o,customerEmail:n,serviceType:s,quoteAmount:i,timeline:a,projectDetails:p,budget:d,tradesmanName:l,tradesmanEmail:c,quoteViewUrl:u,acceptUrl:g,declineUrl:m,pdfBuffer:f}=e,x=`📋 Your Quote for ${s||"Not specified"} - ${t||"N/A"}`,y=`
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${r("quote")}
      <h2 style="color: #333; margin: 20px 0;">Your Quote is Ready!</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p>Hi ${o||"there"},</p>
        <p>Your quote for ${s||"your project"} is ready for review.</p>
        <p><strong>Quote Amount:</strong> $${i||"0"}</p>
        <p><strong>Timeline:</strong> ${a||"Not specified"}</p>
        <p><strong>Project Details:</strong> ${p||"Not provided"}</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${u}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">View Quote</a>
        <a href="${g}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Accept Quote</a>
        <a href="${m}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Decline Quote</a>
      </div>
    </div>
  `,$=`📋 Quote Submitted - ${s||"Not specified"} - ${t||"N/A"}`,h=`
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${r("quote")}
      <h2 style="color: #333; margin: 20px 0;">Quote Submitted Successfully</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Lead ID:</strong> ${t||"N/A"}</p>
        <p><strong>Customer:</strong> ${o||"Customer"}</p>
        <p><strong>Service:</strong> ${s||"Not specified"}</p>
        <p><strong>Quote Amount:</strong> $${i||"0"}</p>
        <p><strong>Tradesman:</strong> ${l||"Tradesperson"}</p>
        <p><strong>Timeline:</strong> ${a||"Not specified"}</p>
        <p><strong>Budget:</strong> ${d||"Not specified"}</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${u}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
      </div>
    </div>
  `,A=`📋 Quote Sent Successfully - ${s||"Not specified"} - ${t||"N/A"}`,b=`
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${r("quote")}
      <h2 style="color: #333; margin: 20px 0;">Your Quote Has Been Sent</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p>Hi ${l||"there"},</p>
        <p>Your quote for ${o||"the customer"}'s ${s||"project"} has been sent successfully.</p>
        <p><strong>Quote Details:</strong></p>
        <ul>
          <li><strong>Lead ID:</strong> ${t||"N/A"}</li>
          <li><strong>Customer:</strong> ${o||"Customer"}</li>
          <li><strong>Service:</strong> ${s||"Not specified"}</li>
          <li><strong>Quote Amount:</strong> $${i||"0"}</li>
          <li><strong>Timeline:</strong> ${a||"Not specified"}</li>
        </ul>
        <p>The customer will receive an email with your quote and can accept or decline it.</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${u}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
      </div>
    </div>
  `;return{customer:{subject:x,html:y,attachments:f?[{filename:`quote-${t}.pdf`,content:f}]:void 0},admin:{subject:$,html:h},tradesperson:{subject:A,html:b}}}function p(e){let t,o,n,s;let{action:i,leadId:a,quoteId:p,customerName:d,customerEmail:l,serviceType:c,quoteAmount:u,timeline:g,fullQuoteData:m,leadData:f,quoteData:x}=e,y="accept"===i?"Accepted":"Declined";"accept"===i?(t="\uD83C\uDF89 Quote Accepted - Project Confirmed!",o=`
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${r("accepted")}
        <h2 style="color: #333; margin: 20px 0;">Congratulations! Your Quote Has Been Accepted</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${d||"there"},</p>
          <p>Great news! Your quote for ${c||"your project"} has been accepted.</p>
          <p><strong>Project Details:</strong></p>
          <ul>
            <li><strong>Service:</strong> ${c||"N/A"}</li>
            <li><strong>Quote Amount:</strong> $${u||"N/A"}</li>
            <li><strong>Timeline:</strong> ${g||"To be confirmed"}</li>
          </ul>
        </div>`,m?.tradesmanName&&(o+=`
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-top: 20px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Your Tradesperson Details</h3>
          <p><strong>Name:</strong> ${m.tradesmanName||"Tradesperson"}</p>
          ${m.companyName?`<p><strong>Company:</strong> ${m.companyName||"Unknown Company"}</p>`:""}
          ${m.tradesmanPhone?`<p><strong>Phone:</strong> ${m.tradesmanPhone||"N/A"}</p>`:""}
          <p><strong>Email:</strong> ${m.tradesmanEmail||"N/A"}</p>
        </div>`),o+=`
        <p style="margin-top: 20px;">Your tradesperson will be in touch within 24 hours to schedule your project.</p>
        <p>Best regards,<br>The Kiwi Trade Team</p>
      </div>`):(t="Quote Decision - Thank You",o=`
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${r("declined")}
        <h2 style="color: #333; margin: 20px 0;">Thank You for Your Consideration</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${d||"there"},</p>
          <p>Thank you for considering our quote for ${c||"your project"}.</p>
          <p>We hope to work with you in the future.</p>
          <p>Best regards,<br>The Kiwi Trade Team</p>
        </div>
      </div>`);let $=`Quote ${y}: ${p||"N/A"} - ${a||"N/A"}`,h=`
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${r("accept"===i?"accepted":"declined")}
      <h2 style="color: #333; margin: 20px 0;">Quote ${y}</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Quote ID:</strong> ${p||"N/A"}</p>
        <p><strong>Lead ID:</strong> ${a||"N/A"}</p>
        <p><strong>Customer:</strong> ${d||"N/A"}</p>
        <p><strong>Service:</strong> ${c||"N/A"}</p>
        <p><strong>Amount:</strong> $${u||"N/A"}</p>`;return"accept"===i&&m?.tradesmanName&&(h+=`
        <p><strong>Tradesperson Assigned:</strong> ${m.tradesmanName||"Tradesperson"}</p>
        ${m.companyName?`<p><strong>Company:</strong> ${m.companyName||"Unknown Company"}</p>`:""}
        ${m.tradesmanPhone?`<p><strong>Phone:</strong> ${m.tradesmanPhone||"N/A"}</p>`:""}`),h+=`
      </div>
    </div>`,"accept"===i&&m?.tradesmanEmail?(n=`🎉 CUSTOMER ACCEPTED - FOLLOW UP REQUIRED - ${a||"N/A"}`,s=`
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${r("accepted")}
        <h2 style="color: #333; margin: 20px 0;">Customer Accepted Your Quote!</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p><strong>Customer Accepted – FOLLOW UP</strong></p>
          <p><strong>Customer Name:</strong> ${d||"N/A"}</p>
          <p><strong>Customer Email:</strong> ${l||"N/A"}</p>
          <p><strong>Customer Phone:</strong> ${f?.customerPhone||"N/A"}</p>
          <p><strong>Service:</strong> ${c||"N/A"}</p>
          <p><strong>Quote Amount:</strong> $${u||"N/A"}</p>
          <p><strong>Project Details:</strong> ${x?.details||"N/A"}</p>
          <p><strong>Timeline:</strong> ${g||"N/A"}</p>
        </div>
        <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; font-weight: bold;">⚠️ ACTION REQUIRED: Contact customer within 24 hours to schedule project!</p>
        </div>
      </div>`):"decline"===i&&m?.tradesmanEmail&&(n=`Quote Declined - ${a||"N/A"}`,s=`
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${r("declined")}
        <h2 style="color: #333; margin: 20px 0;">Quote Declined</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${m.tradesmanName||"there"},</p>
          <p>Your quote for ${d||"the customer"}'s ${c||"project"} has been declined.</p>
          <p><strong>Quote Details:</strong></p>
          <ul>
            <li><strong>Lead ID:</strong> ${a||"N/A"}</li>
            <li><strong>Customer:</strong> ${d||"N/A"}</li>
            <li><strong>Service:</strong> ${c||"N/A"}</li>
            <li><strong>Quote Amount:</strong> $${u||"N/A"}</li>
          </ul>
          <p>Consider politely following up with the customer if appropriate.</p>
        </div>
      </div>`),{customer:{subject:t,html:o},admin:{subject:$,html:h},tradesperson:n&&s?{subject:n,html:s}:null}}},7153:(e,t)=>{var o;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return o}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(o||(o={}))},1802:(e,t,o)=>{e.exports=o(145)}};