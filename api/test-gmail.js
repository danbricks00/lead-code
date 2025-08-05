import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Testing Gmail credentials...');
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

    console.log('✅ Gmail credentials found, testing connection...');

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Test the connection
    console.log('🔍 Testing transporter connection...');
    const verifyResult = await transporter.verify();
    console.log('✅ Transporter verification result:', verifyResult);

    res.json({
      success: true,
      message: 'Gmail credentials are valid!',
      gmailUser: process.env.GMAIL_USER,
      gmailPasswordSet: !!process.env.GMAIL_APP_PASSWORD,
      verificationResult: verifyResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Gmail test error:', error);
    console.error('❌ Error details:', error.message);
    
    res.json({
      success: false,
      error: 'Gmail credentials test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 