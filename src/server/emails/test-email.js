export default async function handler(req, res) {
  console.log('🔍 Test email API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { testEmail } = req.body;
      console.log('✅ Test email request received for:', testEmail);

      // Test 1: Check if nodemailer can be imported
      console.log('📦 Testing nodemailer import...');
      let nodemailer;
      try {
        nodemailer = await import('nodemailer');
        console.log('✅ Nodemailer imported successfully');
      } catch (importError) {
        console.error('❌ Nodemailer import failed:', importError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to import nodemailer',
          details: importError.message
        });
      }

      // Test 2: Create transporter
      console.log('📧 Creating email transporter...');
      let transporter;
      try {
        transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
        console.log('✅ Transporter created successfully');
      } catch (transporterError) {
        console.error('❌ Transporter creation failed:', transporterError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to create email transporter',
          details: transporterError.message
        });
      }

      // Test 3: Verify transporter
      console.log('🔍 Verifying transporter...');
      try {
        await transporter.verify();
        console.log('✅ Transporter verified successfully');
      } catch (verifyError) {
        console.error('❌ Transporter verification failed:', verifyError.message);
        return res.status(500).json({
          success: false,
          error: 'Email transporter verification failed',
          details: verifyError.message
        });
      }

      // Test 4: Send test email
      console.log('📤 Sending test email...');
      const testMailOptions = {
        from: `Kiwi Underfloor Heating <${process.env.GMAIL_USER}>`,
        to: testEmail || process.env.ADMIN_EMAIL,
        subject: 'Test Email - Chatbot System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Test Email from Chatbot System</h2>
            <p>This is a test email to verify that the email system is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Test ID:</strong> ${Date.now()}</p>
            <p>If you receive this email, the chatbot email system is working!</p>
          </div>
        `
      };

      try {
        const result = await transporter.sendMail(testMailOptions);
        console.log('✅ Test email sent successfully:', result);
        
        return res.json({
          success: true,
          message: 'Test email sent successfully!',
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
      } catch (sendError) {
        console.error('❌ Email sending failed:', sendError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to send test email',
          details: sendError.message
        });
      }

    } catch (error) {
      console.error('❌ Test email API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Test email API failed',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
