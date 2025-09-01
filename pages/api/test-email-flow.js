export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("🧪 Starting comprehensive email flow test...");
    
    // Environment checks
    console.log("🔧 Environment variables check:", {
      GMAIL_USER: process.env.GMAIL_USER || "MISSING",
      GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
      TEAM_EMAIL: process.env.TEAM_EMAIL || "MISSING"
    });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || !process.env.ADMIN_EMAIL) {
      return res.status(500).json({
        success: false,
        error: "Missing required email environment variables",
        required: ["GMAIL_USER", "GMAIL_PASS", "ADMIN_EMAIL"]
      });
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const testResults = {
      leadIntake: false,
      quoteSent: false,
      quoteAccepted: false,
      quoteDeclined: false,
      errors: []
    };

    // Test data
    const testLeadId = `TEST-LEAD-${Date.now()}`;
    const testCustomerEmail = process.env.ADMIN_EMAIL; // Send to admin for testing
    const testTradespersonEmail = process.env.TEAM_EMAIL || process.env.ADMIN_EMAIL;

    // Gamified status renderer function
    function renderStatus(stage) {
      const baseStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;";
      const checkStyle = "color: #28a745; font-weight: bold;";
      const pendingStyle = "color: #ffc107; font-weight: bold;";
      const crossStyle = "color: #dc3545; font-weight: bold;";
      
      let statusHtml = `<div style="${baseStyle}">`;
      statusHtml += `<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>`;
      
      switch(stage) {
        case "lead":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Quote</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
          break;
        case "quote":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
          break;
        case "accepted":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Accepted 🎉</p>`;
          break;
        case "declined":
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
          statusHtml += `<p style="margin: 5px 0;"><span style="${crossStyle}">✘</span> Quote Declined</p>`;
          break;
      }
      
      statusHtml += `</div>`;
      return statusHtml;
    }

    // Stage 1: Lead Intake Test
    console.log("📧 Testing Stage 1: Lead Intake...");
    try {
      const leadIntakeSubject = `🧪 TEST - Stage 1: Lead Intake - ${testLeadId}`;
      const leadIntakeHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("lead")}
          <h2 style="color: #333; margin: 20px 0;">🧪 TEST: Lead Intake Email</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Test Lead ID:</strong> ${testLeadId}</p>
            <p><strong>Service:</strong> Underfloor Heating Installation</p>
            <p><strong>Customer:</strong> Test Customer</p>
            <p><strong>Timeline:</strong> Within a week</p>
            <p><strong>Budget:</strong> $5,000 - $10,000</p>
            <p><strong>Area:</strong> Central Auckland</p>
            <p><strong>Suburb:</strong> Ponsonby</p>
            <p><strong>Rooms:</strong> 3 rooms (Living Room: 4m x 5m, Kitchen: 3m x 4m, Master Bedroom: 4m x 4m)</p>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #1976d2;"><strong>✅ Stage 1 Test Passed:</strong> Lead intake email sent successfully</p>
          </div>
        </div>
      `;

      const leadIntakeResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: leadIntakeSubject,
        html: leadIntakeHtml
      });
      
      console.log(`✅ Stage 1 test email sent, msgId: ${leadIntakeResult.messageId}`);
      testResults.leadIntake = true;
    } catch (error) {
      console.error(`❌ Stage 1 test failed: ${error.message}`);
      testResults.errors.push(`Stage 1: ${error.message}`);
    }

    // Stage 2: Quote Sent Test
    console.log("📧 Testing Stage 2: Quote Sent...");
    try {
      const quoteSentSubject = `🧪 TEST - Stage 2: Quote Sent - ${testLeadId}`;
      const quoteSentHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("quote")}
          <h2 style="color: #333; margin: 20px 0;">🧪 TEST: Quote Sent Email</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Test Lead ID:</strong> ${testLeadId}</p>
            <p><strong>Quote Amount:</strong> $8,500</p>
            <p><strong>Service:</strong> Underfloor Heating Installation</p>
            <p><strong>Timeline:</strong> Within a week</p>
            <p><strong>Project Details:</strong> Complete underfloor heating system installation for 3 rooms</p>
            <p><strong>Tradesperson:</strong> Test Tradesperson</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">View Quote</a>
            <a href="#" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Accept Quote</a>
            <a href="#" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Decline Quote</a>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #1976d2;"><strong>✅ Stage 2 Test Passed:</strong> Quote sent email with decision links</p>
          </div>
        </div>
      `;

      const quoteSentResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: quoteSentSubject,
        html: quoteSentHtml
      });
      
      console.log(`✅ Stage 2 test email sent, msgId: ${quoteSentResult.messageId}`);
      testResults.quoteSent = true;
    } catch (error) {
      console.error(`❌ Stage 2 test failed: ${error.message}`);
      testResults.errors.push(`Stage 2: ${error.message}`);
    }

    // Stage 3: Quote Accepted Test
    console.log("📧 Testing Stage 3: Quote Accepted...");
    try {
      const quoteAcceptedSubject = `🧪 TEST - Stage 3: Quote Accepted - ${testLeadId}`;
      const quoteAcceptedHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("accepted")}
          <h2 style="color: #333; margin: 20px 0;">🧪 TEST: Quote Accepted Email</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Test Lead ID:</strong> ${testLeadId}</p>
            <p><strong>Service:</strong> Underfloor Heating Installation</p>
            <p><strong>Quote Amount:</strong> $8,500</p>
            <p><strong>Timeline:</strong> Within a week</p>
          </div>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-top: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Tradesperson Details</h3>
            <p><strong>Name:</strong> Test Tradesperson</p>
            <p><strong>Company:</strong> Test Heating Solutions</p>
            <p><strong>Phone:</strong> 021 123 4567</p>
            <p><strong>Email:</strong> test@heating.co.nz</p>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #1976d2;"><strong>✅ Stage 3 Test Passed:</strong> Quote accepted email with tradesperson details</p>
          </div>
        </div>
      `;

      const quoteAcceptedResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: quoteAcceptedSubject,
        html: quoteAcceptedHtml
      });
      
      console.log(`✅ Stage 3 (Accepted) test email sent, msgId: ${quoteAcceptedResult.messageId}`);
      testResults.quoteAccepted = true;
    } catch (error) {
      console.error(`❌ Stage 3 (Accepted) test failed: ${error.message}`);
      testResults.errors.push(`Stage 3 (Accepted): ${error.message}`);
    }

    // Stage 3: Quote Declined Test
    console.log("📧 Testing Stage 3: Quote Declined...");
    try {
      const quoteDeclinedSubject = `🧪 TEST - Stage 3: Quote Declined - ${testLeadId}`;
      const quoteDeclinedHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
          ${renderStatus("declined")}
          <h2 style="color: #333; margin: 20px 0;">🧪 TEST: Quote Declined Email</h2>
          <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
            <p><strong>Test Lead ID:</strong> ${testLeadId}</p>
            <p><strong>Service:</strong> Underfloor Heating Installation</p>
            <p><strong>Quote Amount:</strong> $8,500</p>
            <p>Thank you for considering our quote. We hope to work with you in the future.</p>
          </div>
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #1976d2;"><strong>✅ Stage 3 Test Passed:</strong> Quote declined email sent</p>
          </div>
        </div>
      `;

      const quoteDeclinedResult = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: quoteDeclinedSubject,
        html: quoteDeclinedHtml
      });
      
      console.log(`✅ Stage 3 (Declined) test email sent, msgId: ${quoteDeclinedResult.messageId}`);
      testResults.quoteDeclined = true;
    } catch (error) {
      console.error(`❌ Stage 3 (Declined) test failed: ${error.message}`);
      testResults.errors.push(`Stage 3 (Declined): ${error.message}`);
    }

    // Summary
    const allTestsPassed = testResults.leadIntake && testResults.quoteSent && testResults.quoteAccepted && testResults.quoteDeclined;
    
    console.log("🧪 Email flow test completed:", {
      leadIntake: testResults.leadIntake,
      quoteSent: testResults.quoteSent,
      quoteAccepted: testResults.quoteAccepted,
      quoteDeclined: testResults.quoteDeclined,
      errors: testResults.errors.length
    });

    return res.status(200).json({
      success: allTestsPassed,
      message: allTestsPassed ? "All email flow tests passed" : "Some email flow tests failed",
      testResults,
      testLeadId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Email flow test failed:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      message: "Email flow test failed",
      timestamp: new Date().toISOString()
    });
  }
}
