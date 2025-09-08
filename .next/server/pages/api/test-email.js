"use strict";(()=>{var e={};e.id=1082,e.ids=[1082],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5184:e=>{e.exports=require("nodemailer")},1128:(e,s,r)=>{r.r(s),r.d(s,{config:()=>c,default:()=>d,routeModule:()=>u});var t={};r.r(t),r.d(t,{default:()=>l});var o=r(1802),i=r(7153),a=r(6249),n=r(5116);async function l(e,s){if(console.log("✅ Loaded API test-email.js"),"POST"!==e.method)return s.setHeader("Allow",["POST"]),s.status(405).json({success:!1,error:`Method ${e.method} Not Allowed. Use POST method.`});try{if(console.log("\uD83D\uDCE7 Starting test email..."),console.log("\uD83D\uDD27 Environment variables check:",{GMAIL_USER:process.env.GMAIL_USER||"MISSING",GMAIL_PASS:process.env.GMAIL_PASS?"SET":"MISSING",ADMIN_EMAIL:process.env.ADMIN_EMAIL||"MISSING"}),!process.env.ADMIN_EMAIL)return console.error("❌ ADMIN_EMAIL not configured"),s.status(500).json({success:!1,error:"ADMIN_EMAIL not configured"});let e=`
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin: 20px 0;">Test Email from Kiwi Trade System</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p><strong>Test Time:</strong> ${new Date().toLocaleString("en-NZ",{timeZone:"Pacific/Auckland"})}</p>
          <p><strong>System:</strong> Kiwi Trade Lead Management</p>
          <p><strong>Status:</strong> Email system is working correctly</p>
          <p>If you receive this email, the Gmail SMTP configuration is working properly.</p>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            This is an automated test email. Please ignore.
          </p>
        </div>
      </div>
    `;console.log(`📤 Sending test email to: ${process.env.ADMIN_EMAIL}`);let r=await (0,n.Cz)(process.env.ADMIN_EMAIL,"\uD83E\uDDEA Test Email - Kiwi Trade System",e);if(r.success)return console.log(`✅ Test email sent successfully, msgId: ${r.messageId}`),s.status(200).json({success:!0,message:"Test email sent successfully",messageId:r.messageId,to:process.env.ADMIN_EMAIL});return console.error(`❌ Test email failed: ${r.error}`),s.status(500).json({success:!1,error:"Test email failed",details:r.error})}catch(e){return console.error("❌ Test email API error:",e.message),s.status(500).json({success:!1,error:"Test email failed",message:e.message})}}let d=(0,a.l)(t,"default"),c=(0,a.l)(t,"config"),u=new o.PagesAPIRouteModule({definition:{kind:i.x.PAGES_API,page:"/api/test-email",pathname:"/api/test-email",bundlePath:"",filename:""},userland:t})}};var s=require("../../webpack-api-runtime.js");s.C(e);var r=e=>s(s.s=e),t=s.X(0,[3273],()=>r(1128));module.exports=t})();