import { google } from 'googleapis';
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
    const leadData = req.body;
    console.log('✅ Lead received:', leadData);

    let sheetsUpdated = false;
    let customerEmailSent = false;
    let tradesmanEmailSent = false;

    // 1. Try to add to Google Sheets (if credentials are available)
    try {
      if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY) {
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
      }
    } catch (sheetsError) {
      console.error('❌ Google Sheets error:', sheetsError);
    }

    // 2. Try to send email to customer (if Gmail credentials are available)
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });

        const customerEmailContent = `
          <h2>Thank you for your inquiry!</h2>
          <p>Dear ${leadData.customerName},</p>
          <p>Thank you for submitting your project request. Here's a summary of your inquiry:</p>
          <ul>
            <li><strong>Service:</strong> ${leadData.selectedService}</li>
            <li><strong>Project Details:</strong> ${leadData.projectDetails}</li>
            <li><strong>Location:</strong> ${leadData.location}</li>
            <li><strong>Budget:</strong> ${leadData.budget}</li>
            <li><strong>Timeline:</strong> ${leadData.timeline}</li>
          </ul>
          <p>We've forwarded your request to qualified tradesmen in your area. You should receive quotes and contact information within 24-48 hours.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The LeadBot Team</p>
        `;

        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: leadData.customerEmail,
          subject: 'Your Project Request - LeadBot',
          html: customerEmailContent
        });

        console.log('✅ Customer email sent successfully');
        customerEmailSent = true;
      } else {
        console.log('⚠️ Gmail credentials not configured - skipping customer email');
      }
    } catch (emailError) {
      console.error('❌ Customer email error:', emailError);
    }

    // 3. Try to send email to tradesmen (if Gmail credentials are available)
    try {
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });

        // Tradesmen email configuration
        const tradesmenEmails = {
          builder: ['danbricks18@gmail.com'],
          electrician: ['electrician1@example.com'],
          plumber: ['plumber1@example.com'],
          painter: ['painter1@example.com'],
          roofer: ['roofer1@example.com'],
          landscaper: ['landscaper1@example.com'],
          heating: ['heating1@example.com'],
          other: ['general@example.com']
        };

        const tradesmenEmailsList = tradesmenEmails[leadData.selectedService] || tradesmenEmails.other;
        
        const tradesmanEmailContent = `
          <h2>New Lead Alert!</h2>
          <p>A new customer is looking for ${leadData.selectedService} services.</p>
          <h3>Project Details:</h3>
          <ul>
            <li><strong>Customer Name:</strong> ${leadData.customerName}</li>
            <li><strong>Customer Email:</strong> ${leadData.customerEmail}</li>
            <li><strong>Customer Phone:</strong> ${leadData.customerPhone}</li>
            <li><strong>Project Description:</strong> ${leadData.projectDetails}</li>
            <li><strong>Project Size:</strong> ${leadData.projectSize}</li>
            <li><strong>Specific Requirements:</strong> ${leadData.specificDetails}</li>
            <li><strong>Location:</strong> ${leadData.location}</li>
            <li><strong>Budget:</strong> ${leadData.budget}</li>
            <li><strong>Timeline:</strong> ${leadData.timeline}</li>
          </ul>
          <p>Please contact the customer directly to discuss the project and provide a quote.</p>
          <p>This lead was generated by LeadBot.</p>
        `;

        for (const email of tradesmenEmailsList) {
          try {
            await transporter.sendMail({
              from: process.env.GMAIL_USER,
              to: email,
              subject: `New ${leadData.selectedService} Lead - ${leadData.location}`,
              html: tradesmanEmailContent
            });
            console.log(`✅ Email sent to tradesman: ${email}`);
            tradesmanEmailSent = true;
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${email}:`, emailError);
          }
        }
      } else {
        console.log('⚠️ Gmail credentials not configured - skipping tradesman emails');
      }
    } catch (emailError) {
      console.error('❌ Tradesman email error:', emailError);
    }

    // Return success response with detailed status
    const response = {
      success: true,
      message: 'Lead submitted successfully! Check your email for confirmation.',
      data: leadData,
      timestamp: new Date().toISOString(),
      status: {
        logged: true,
        sheetsUpdated,
        customerEmailSent,
        tradesmanEmailSent,
        note: sheetsUpdated && customerEmailSent ? 'Full functionality working!' : 'Some features need environment variables'
      }
    };

    console.log('📊 Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error processing lead:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process lead',
      details: error.message 
    });
  }
} 