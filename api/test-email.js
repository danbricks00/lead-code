import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { toEmail } = req.body;
    
    console.log('🔍 Testing email functionality...');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.json({
        success: false,
        error: 'Gmail credentials not configured',
        gmailUser: !!process.env.GMAIL_USER,
        gmailPassword: !!process.env.GMAIL_APP_PASSWORD
      });
    }

    console.log('✅ Gmail credentials found, attempting to send test email...');

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const testEmailContent = `
      <h2>Test Email from LeadBot</h2>
      <p>This is a test email to verify that the email functionality is working correctly.</p>
      <p>If you receive this email, the Gmail configuration is working!</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `;

    console.log('📧 Sending test email to:', toEmail || process.env.GMAIL_USER);

    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: toEmail || process.env.GMAIL_USER, // Send to provided email or back to sender
      subject: 'Test Email - LeadBot Email Functionality',
      html: testEmailContent
    });

    console.log('✅ Test email sent successfully:', result);

    res.json({
      success: true,
      message: 'Test email sent successfully!',
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email test error:', error);
    console.error('❌ Error details:', error.message);
    
    res.json({
      success: false,
      error: 'Failed to send test email',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 