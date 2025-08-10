export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 Testing email functionality...');
    
    // Check environment variables
    console.log('🔍 Environment Variables:');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
    console.log('MAIL_FROM:', process.env.MAIL_FROM ? '✅ Set' : '❌ Missing');
    console.log('MAIL_REPLY_TO:', process.env.MAIL_REPLY_TO ? '✅ Set' : '❌ Missing');

    // Test Nodemailer import
    let nodemailer;
    let transporter;
    
    try {
      console.log('📧 Testing Nodemailer import...');
      const nodemailerModule = await import('nodemailer');
      nodemailer = nodemailerModule.default || nodemailerModule;
      console.log('✅ Nodemailer imported successfully');
      console.log('📧 Nodemailer type:', typeof nodemailer);
      console.log('📧 Available methods:', Object.keys(nodemailer || {}));
      
      // Test createTransporter method
      const createMethod = nodemailer.createTransporter || 
                         nodemailer.createTransport || 
                         nodemailer.default?.createTransporter ||
                         nodemailer.default?.createTransport;
      
      if (createMethod && typeof createMethod === 'function') {
        console.log('✅ createTransporter method found');
        
        // Create transporter
        transporter = createMethod({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
        console.log('✅ Transporter created successfully');
        
        // Test sending a simple email
        if (req.method === 'POST') {
          const { to, subject, text } = req.body;
          
          if (!to || !subject || !text) {
            return res.status(400).json({
              success: false,
              error: 'Missing required fields: to, subject, text'
            });
          }
          
          console.log('📧 Attempting to send test email...');
          const mailOptions = {
            from: process.env.MAIL_FROM || `Test <${process.env.GMAIL_USER}>`,
            to: to,
            subject: subject,
            text: text,
            html: `<p>${text}</p>`
          };
          
          const info = await transporter.sendMail(mailOptions);
          console.log('✅ Test email sent successfully:', info.messageId);
          
          return res.json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info.messageId,
            environment: {
              gmailUser: process.env.GMAIL_USER ? 'Set' : 'Missing',
              gmailPassword: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing',
              mailFrom: process.env.MAIL_FROM ? 'Set' : 'Missing'
            }
          });
        }
        
      } else {
        throw new Error('createTransporter method not found');
      }
      
    } catch (importError) {
      console.error('❌ Nodemailer test failed:', importError.message);
      return res.status(500).json({
        success: false,
        error: 'Nodemailer test failed',
        details: importError.message,
        environment: {
          gmailUser: process.env.GMAIL_USER ? 'Set' : 'Missing',
          gmailPassword: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing',
          mailFrom: process.env.MAIL_FROM ? 'Set' : 'Missing'
        }
      });
    }

    // Return test results for GET requests
    return res.json({
      success: true,
      message: 'Email test environment ready',
      environment: {
        gmailUser: process.env.GMAIL_USER ? 'Set' : 'Missing',
        gmailPassword: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Missing',
        mailFrom: process.env.MAIL_FROM ? 'Set' : 'Missing',
        mailReplyTo: process.env.MAIL_REPLY_TO ? 'Set' : 'Missing'
      },
      nodemailer: {
        imported: !!nodemailer,
        transporter: !!transporter,
        methods: nodemailer ? Object.keys(nodemailer) : []
      },
      instructions: {
        get: 'GET this endpoint to see test results',
        post: 'POST with {to, subject, text} to send test email'
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
} 