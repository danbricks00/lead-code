export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log("📧 Testing Nodemailer configuration...");
    
    // Check environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;
    const adminEmail = process.env.ADMIN_EMAIL;
    
    console.log("🔧 Environment variables check:", {
      GMAIL_USER: !!gmailUser,
      GMAIL_PASS: !!gmailPass,
      ADMIN_EMAIL: !!adminEmail
    });
    
    if (!gmailUser || !gmailPass) {
      throw new Error('Missing GMAIL_USER or GMAIL_PASS environment variables');
    }
    
    // Import nodemailer
    const nodemailer = await import('nodemailer');
    console.log("✅ Nodemailer imported successfully");
    
    // Create transporter
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    
    console.log("✅ Transporter created successfully");
    
    // Determine recipient
    const toEmail = adminEmail || gmailUser;
    console.log(`📤 Sending test email to: ${toEmail}`);
    
    // Send test email
    const result = await transporter.sendMail({
      from: gmailUser,
      to: toEmail,
      subject: '✅ Test Email From TradeLead',
      text: 'This is a test email to confirm Nodemailer + Gmail APP Password works.'
    });
    
    console.log(`✅ Test email sent successfully. Message ID: ${result.messageId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      to: toEmail,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Test email failed:", error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send test email',
      timestamp: new Date().toISOString()
    });
  }
}
