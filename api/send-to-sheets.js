import { google } from 'googleapis';

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
    const leadData = req.body;
    console.log('✅ Lead received:', leadData);

    let sheetsUpdated = false;
    let customerEmailSent = false;
    let tradesmanEmailSent = false;

    // Debug: Log all environment variables
    console.log('🔍 ALL ENVIRONMENT VARIABLES:');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');

    // 1. Try to add to Google Sheets (if credentials are available)
    console.log('🔍 Checking Google Sheets credentials...');

    try {
      if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY) {
        console.log('✅ Google Sheets credentials found, attempting to write...');

        const auth = new google.auth.GoogleAuth({
          credentials: {
            type: "service_account",
            project_id: process.env.GOOGLE_PROJECT_ID,
            private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            client_id: process.env.GOOGLE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        const range = 'Sheet1!A:K';

        const values = [[
          new Date().toISOString(),
          leadData.customerName,
          leadData.customerEmail,
          leadData.customerPhone,
          leadData.selectedService,
          leadData.projectDetails,
          leadData.projectSize,
          leadData.specificDetails,
          leadData.location,
          leadData.budget,
          leadData.timeline
        ]];

        console.log('📊 Attempting to write to spreadsheet:', spreadsheetId);
        console.log('📊 Data to write:', values);

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: { values }
        });

        console.log('✅ Data added to Google Sheets successfully');
        sheetsUpdated = true;
      } else {
        console.log('⚠️ Google Sheets credentials not configured - skipping sheets update');
        console.log('Missing:', {
          projectId: !process.env.GOOGLE_PROJECT_ID,
          privateKey: !process.env.GOOGLE_PRIVATE_KEY,
          spreadsheetId: !process.env.GOOGLE_SPREADSHEET_ID
        });
      }
    } catch (sheetsError) {
      console.error('❌ Google Sheets error:', sheetsError);
      console.error('❌ Error details:', sheetsError.message);
    }

    // 2. Email functionality - Fixed Nodemailer import
    console.log('🔍 Attempting to send emails...');
    
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        console.log('✅ Gmail credentials found, attempting to send emails...');
        
        // Try to import Nodemailer with different methods
        let nodemailer;
        try {
          // Method 1: Try dynamic import
          const module = await import('nodemailer');
          nodemailer = module.default;
          console.log('✅ Nodemailer imported successfully via dynamic import');
        } catch (importError) {
          console.log('❌ Dynamic import failed, trying alternative method...');
          // Method 2: Try require (if available in this environment)
          try {
            nodemailer = require('nodemailer');
            console.log('✅ Nodemailer imported successfully via require');
          } catch (requireError) {
            console.log('❌ All import methods failed:', requireError.message);
            throw new Error('Cannot import Nodemailer');
          }
        }

        console.log('📧 Nodemailer type:', typeof nodemailer);
        console.log('📧 Available methods:', Object.keys(nodemailer || {}));
        
        // Check for the correct method name
        const createTransporterMethod = nodemailer.createTransporter || nodemailer.createTransport;
        
        if (createTransporterMethod && typeof createTransporterMethod === 'function') {
          console.log('✅ createTransporter/createTransport method available');
          
          // Create transporter
          const transporter = createTransporterMethod({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER,
              pass: process.env.GMAIL_APP_PASSWORD
            }
          });

          // Validate email format before sending
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(leadData.customerEmail)) {
            console.log('❌ Invalid customer email format:', leadData.customerEmail);
            throw new Error(`Invalid email format: ${leadData.customerEmail}`);
          }

          // Send customer email
          console.log('📧 Sending customer email to:', leadData.customerEmail);
          const customerMailOptions = {
            from: process.env.GMAIL_USER,
            to: leadData.customerEmail,
            subject: 'Your Lead Request Confirmation',
            html: `
              <h2>Thank you for your lead request!</h2>
              <p><strong>Service:</strong> ${leadData.selectedService}</p>
              <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
              <p><strong>Location:</strong> ${leadData.location}</p>
              <p><strong>Budget:</strong> ${leadData.budget}</p>
              <p><strong>Timeline:</strong> ${leadData.timeline}</p>
              <p>We'll be in touch with you soon with a quote and next steps.</p>
              <p>Best regards,<br>Your Trade Team</p>
            `
          };

          await transporter.sendMail(customerMailOptions);
          console.log('✅ Customer email sent successfully');
          customerEmailSent = true;

          // Send tradesman email
          console.log('📧 Sending tradesman email to: danbricks18@gmail.com');
          const tradesmanMailOptions = {
            from: process.env.GMAIL_USER,
            to: 'danbricks18@gmail.com',
            subject: `New ${leadData.selectedService} Lead - ${leadData.customerName}`,
            html: `
              <h2>New Lead Received!</h2>
              <p><strong>Customer:</strong> ${leadData.customerName}</p>
              <p><strong>Email:</strong> ${leadData.customerEmail}</p>
              <p><strong>Phone:</strong> ${leadData.customerPhone}</p>
              <p><strong>Service:</strong> ${leadData.selectedService}</p>
              <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
              <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
              <p><strong>Specific Details:</strong> ${leadData.specificDetails}</p>
              <p><strong>Location:</strong> ${leadData.location}</p>
              <p><strong>Budget:</strong> ${leadData.budget}</p>
              <p><strong>Timeline:</strong> ${leadData.timeline}</p>
              <p>Please contact the customer as soon as possible.</p>
            `
          };

          await transporter.sendMail(tradesmanMailOptions);
          console.log('✅ Tradesman email sent successfully');
          tradesmanEmailSent = true;

        } else {
          console.log('❌ createTransporter/createTransport method not available');
          console.log('📧 Available methods:', Object.keys(nodemailer || {}));
          throw new Error('Nodemailer createTransporter/createTransport method not found');
        }
      } else {
        console.log('⚠️ Gmail credentials not configured - skipping email sending');
      }
    } catch (emailError) {
      console.error('❌ Email error:', emailError);
      console.error('❌ Error details:', emailError.message);
      console.error('❌ Error stack:', emailError.stack);
    }

    // Return success response with detailed status
    const response = {
      success: true,
      message: customerEmailSent && tradesmanEmailSent
        ? 'Lead submitted successfully! Check your email for confirmation.'
        : 'Lead submitted successfully! Google Sheets updated. Email status: ' +
          (customerEmailSent ? 'Customer email sent' : 'Customer email failed') + ', ' +
          (tradesmanEmailSent ? 'Tradesman email sent' : 'Tradesman email failed'),
      data: leadData,
      timestamp: new Date().toISOString(),
      status: {
        logged: true,
        sheetsUpdated,
        customerEmailSent,
        tradesmanEmailSent,
        note: customerEmailSent && tradesmanEmailSent
          ? 'All systems working!'
          : 'Google Sheets working! Email may need configuration'
      }
    };

    console.log('📊 Final Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error processing lead:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to process lead',
      details: error.message
    });
  }
} 