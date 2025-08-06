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
    console.log('🔍 Testing Nodemailer import...');
    
    // Try different import methods
    let nodemailer;
    let importMethod = '';
    
    try {
      // Method 1: Dynamic import
      console.log('📧 Trying dynamic import...');
      const module = await import('nodemailer');
      nodemailer = module.default;
      importMethod = 'dynamic import';
      console.log('✅ Dynamic import successful');
    } catch (error1) {
      console.log('❌ Dynamic import failed:', error1.message);
      
      try {
        // Method 2: CommonJS require (if available)
        console.log('📧 Trying require...');
        nodemailer = require('nodemailer');
        importMethod = 'require';
        console.log('✅ Require successful');
      } catch (error2) {
        console.log('❌ Require failed:', error2.message);
        
        // Method 3: Try with different syntax
        try {
          console.log('📧 Trying import with different syntax...');
          const { default: nm } = await import('nodemailer');
          nodemailer = nm;
          importMethod = 'destructured import';
          console.log('✅ Destructured import successful');
        } catch (error3) {
          console.log('❌ All import methods failed');
          throw new Error('All Nodemailer import methods failed');
        }
      }
    }

    console.log('📧 Nodemailer type:', typeof nodemailer);
    console.log('📧 Available methods:', Object.keys(nodemailer || {}));
    
    if (nodemailer && typeof nodemailer.createTransporter === 'function') {
      console.log('✅ createTransporter method found!');
      
      // Test creating a transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER || 'test@example.com',
          pass: process.env.GMAIL_APP_PASSWORD || 'test'
        }
      });
      
      console.log('✅ Transporter created successfully');
      
      res.json({
        success: true,
        message: 'Nodemailer is working!',
        importMethod,
        nodemailerType: typeof nodemailer,
        availableMethods: Object.keys(nodemailer),
        transporterCreated: true,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ createTransporter method not found');
      res.json({
        success: false,
        error: 'createTransporter method not found',
        importMethod,
        nodemailerType: typeof nodemailer,
        availableMethods: Object.keys(nodemailer || {}),
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Nodemailer test error:', error);
    res.json({
      success: false,
      error: 'Nodemailer test failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 