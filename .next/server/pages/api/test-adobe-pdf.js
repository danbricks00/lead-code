"use strict";(()=>{var e={};e.id=1099,e.ids=[1099],e.modules={9993:e=>{e.exports=require("googleapis")},145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,s){return s in t?t[s]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,s)):"function"==typeof t&&"default"===s?t:void 0}}})},5949:(e,t,s)=>{s.r(t),s.d(t,{config:()=>l,default:()=>c,routeModule:()=>D});var n={};s.r(n),s.d(n,{default:()=>d});var o=s(1802),r=s(7153),i=s(6249),a=s(3078);async function d(e,t){if("GET"!==e.method)return t.status(405).json({success:!1,error:"Method Not Allowed"});try{console.log("\uD83E\uDDEA Testing Adobe PDF Services...");let e=!!process.env.ADOBE_PDF_CLIENT_ID,s=!!process.env.ADOBE_PDF_CLIENT_SECRET,n=!!process.env.ADOBE_PDF_ORGANIZATION_ID;if(console.log("\uD83D\uDD0D Adobe PDF Environment Check:"),console.log("   ADOBE_PDF_CLIENT_ID:",e?"✅ Set":"❌ Missing"),console.log("   ADOBE_PDF_CLIENT_SECRET:",s?"✅ Set":"❌ Missing"),console.log("   ADOBE_PDF_ORGANIZATION_ID:",n?"✅ Set":"❌ Missing"),!e||!s)return t.status(400).json({success:!1,error:"Adobe PDF credentials not configured",details:{hasClientId:e,hasClientSecret:s,hasOrgId:n}});let o=`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Adobe PDF Test</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
                    .content { margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🧪 Adobe PDF Services Test</h1>
                    <p>Testing PDF generation with Adobe PDF Services</p>
                </div>
                <div class="content">
                    <h2>Test Content</h2>
                    <p>This is a test PDF generated using Adobe PDF Services.</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                    <p>If you can see this PDF, Adobe PDF Services is working correctly!</p>
                </div>
            </body>
            </html>
        `;console.log("\uD83D\uDD04 Attempting Adobe PDF conversion...");let r=await (0,a.convertWithAdobePDF)(o);return console.log("✅ Adobe PDF test successful!"),t.setHeader("Content-Type","application/pdf"),t.setHeader("Content-Disposition",'inline; filename="adobe-test.pdf"'),t.setHeader("Content-Length",r.length),t.status(200).send(r)}catch(e){return console.error("❌ Adobe PDF test failed:",e),t.status(500).json({success:!1,error:"Adobe PDF test failed",details:{message:e.message,stack:e.stack,environment:{hasClientId:!!process.env.ADOBE_PDF_CLIENT_ID,hasClientSecret:!!process.env.ADOBE_PDF_CLIENT_SECRET,hasOrgId:!!process.env.ADOBE_PDF_ORGANIZATION_ID,clientIdPrefix:process.env.ADOBE_PDF_CLIENT_ID?process.env.ADOBE_PDF_CLIENT_ID.substring(0,10)+"...":"Not set"}}})}}let c=(0,i.l)(n,"default"),l=(0,i.l)(n,"config"),D=new o.PagesAPIRouteModule({definition:{kind:r.x.PAGES_API,page:"/api/test-adobe-pdf",pathname:"/api/test-adobe-pdf",bundlePath:"",filename:""},userland:n})},7153:(e,t)=>{var s;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return s}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(s||(s={}))},1802:(e,t,s)=>{e.exports=s(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var s=e=>t(t.s=e),n=t.X(0,[3078],()=>s(5949));module.exports=n})();