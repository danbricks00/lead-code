export default async function handler(req, res) {
  console.log('🔍 Vercel Email Test API called:', req.method, req.url);
  
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
      const { testEmail, testType } = req.body;
      console.log('✅ Test email request received for:', testEmail, 'Type:', testType);

      // Test 1: Check environment variables
      console.log('🔍 Checking environment variables...');
      const envCheck = {
        GMAIL_USER: process.env.GMAIL_USER ? '✅ Set' : '❌ Missing',
        GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing',
        NODE_ENV: process.env.NODE_ENV || '❌ Missing',
        VERCEL_URL: process.env.VERCEL_URL || '❌ Missing'
      };
      
      console.log('📋 Environment Status:', envCheck);

      // Test 2: Check if nodemailer can be imported
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
          details: importError.message,
          environment: envCheck
        });
      }

      // Test 3: Create transporter
      console.log('📧 Creating email transporter...');
      let transporter;
      try {
        const gmailUser = process.env.GMAIL_USER || 'danbricks18@gmail.com';
        const gmailPass = process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom';
        
        console.log('🔑 Using Gmail credentials:', { user: gmailUser, passSet: !!gmailPass });
        
        transporter = nodemailer.default.createTransporter({
          service: 'gmail',
          auth: {
            user: gmailUser,
            pass: gmailPass
          }
        });
        console.log('✅ Transporter created successfully');
      } catch (transporterError) {
        console.error('❌ Transporter creation failed:', transporterError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to create email transporter',
          details: transporterError.message,
          environment: envCheck
        });
      }

      // Test 4: Verify transporter
      console.log('🔍 Verifying transporter...');
      try {
        await transporter.verify();
        console.log('✅ Transporter verified successfully');
      } catch (verifyError) {
        console.error('❌ Transporter verification failed:', verifyError.message);
        return res.status(500).json({
          success: false,
          error: 'Email transporter verification failed',
          details: verifyError.message,
          environment: envCheck
        });
      }

      // Test 5: Send test email
      console.log('📤 Sending test email...');
      const testMailOptions = {
        from: 'Kiwi Trade Test <danbricks18@gmail.com>',
        to: testEmail || 'danbricks18@gmail.com',
        subject: `Vercel Email Test - ${testType || 'Basic'} - ${new Date().toISOString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">✅ Vercel Email Test Successful!</h2>
            <p>This is a test email to verify that the email system is working correctly in your Vercel deployment.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Test Details:</h3>
              <p><strong>Test Type:</strong> ${testType || 'Basic'}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>Test ID:</strong> ${Date.now()}</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'Unknown'}</p>
              <p><strong>Vercel URL:</strong> ${process.env.VERCEL_URL || 'Not set'}</p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What this means:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ Email system is working in Vercel</li>
                <li>✅ Gmail authentication is successful</li>
                <li>✅ Environment variables are configured</li>
                <li>✅ Quote emails should now work</li>
              </ul>
            </div>

            <p>If you receive this email, your chatbot email system is working correctly in Vercel!</p>
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
          timestamp: new Date().toISOString(),
          environment: envCheck,
          testType: testType || 'Basic'
        });
      } catch (sendError) {
        console.error('❌ Email sending failed:', sendError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to send test email',
          details: sendError.message,
          environment: envCheck
        });
      }

    } catch (error) {
      console.error('❌ Vercel email test API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Vercel email test API failed',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
