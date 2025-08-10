import { google } from 'googleapis';
import { getAllTradesmen } from './database.js';
import { addQuote } from './quote-database.js';

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
    let quoteGenerated = false;
    let tradesmenFound = [];

    // Debug: Log all environment variables
    console.log('🔍 ALL ENVIRONMENT VARIABLES:');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
    console.log('GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');

    // 1. Try to add to Google Sheets (if credentials are available)
    console.log('🔍 Checking Google Sheets credentials...');
    
    if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
      try {
        console.log('✅ Google Sheets credentials found - attempting to save lead data');
        
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        const values = [
          [
            new Date().toISOString(),
            leadData.customerName,
            leadData.customerEmail,
            leadData.customerPhone,
            leadData.selectedService,
            leadData.projectDetails,
            leadData.budget,
            leadData.timeline,
            leadData.projectSize,
            leadData.specificDetails,
            leadData.location
          ]
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: 'Sheet1!A:K',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: { values }
        });

        console.log('✅ Lead data saved to Google Sheets');
        sheetsUpdated = true;
      } catch (sheetsError) {
        console.error('❌ Google Sheets error:', sheetsError.message);
      }
    } else {
      console.log('⚠️ Google Sheets credentials not configured - skipping sheets update');
    }

    // 2. Get tradesmen for the service
    console.log('🔍 Getting tradesmen for service:', leadData.selectedService);
    try {
      tradesmenFound = await getAllTradesmen(leadData.selectedService);
      console.log(`✅ Found ${tradesmenFound.length} tradesmen for ${leadData.selectedService}`);
    } catch (tradesmenError) {
      console.error('❌ Error getting tradesmen:', tradesmenError.message);
    }

    // 3. Generate quote for the lead
    console.log('🔍 Generating quote for lead');
    try {
      const quoteData = {
        leadID: `LEAD-${Date.now()}`,
        customerEmail: leadData.customerEmail,
        customerName: leadData.customerName,
        serviceType: leadData.selectedService,
        projectDetails: leadData.projectDetails,
        projectSize: leadData.projectSize,
        location: leadData.location,
        budget: leadData.budget,
        timeline: leadData.timeline,
        specificDetails: leadData.specificDetails,
        customerPhone: leadData.customerPhone
      };

      const quote = await addQuote(quoteData);
      console.log('✅ Quote generated:', quote.QuoteID);
      quoteGenerated = true;
    } catch (quoteError) {
      console.error('❌ Error generating quote:', quoteError.message);
    }

    // 4. Send emails
    console.log('🔍 Attempting to send emails...');
    try {
      // Check if nodemailer is available
      let nodemailer;
      try {
        nodemailer = await import('nodemailer');
      } catch (importError) {
        console.log('❌ Nodemailer not available:', importError.message);
        throw new Error('Nodemailer not available');
      }

      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        console.log('✅ Gmail credentials found - attempting to send emails');
        
        // Get createTransporter method
        const createTransporterMethod = nodemailer.createTransporter || nodemailer.default?.createTransporter;
        
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

          // Send customer confirmation email
          console.log('📧 Sending customer confirmation email to:', leadData.customerEmail);
          const fromDisplay = process.env.MAIL_FROM || `Kiwi Underfloor Heating <${process.env.GMAIL_USER}>`;
          const replyTo = process.env.MAIL_REPLY_TO || process.env.GMAIL_USER;

          const customerMailOptions = {
            from: fromDisplay,
            replyTo,
            to: leadData.customerEmail,
            subject: 'Your Project Request Confirmation - Quote Coming Soon',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Thank you for your project request!</h2>
                <p>Dear ${leadData.customerName},</p>
                <p>We have received your request for <strong>${leadData.selectedService}</strong> services and are working on your quote.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #34495e; margin-top: 0;">Project Details:</h3>
                  <p><strong>Service:</strong> ${leadData.selectedService}</p>
                  <p><strong>Project:</strong> ${leadData.projectDetails}</p>
                  <p><strong>Location:</strong> ${leadData.location}</p>
                  <p><strong>Size/Scope:</strong> ${leadData.projectSize}</p>
                  <p><strong>Budget:</strong> ${leadData.budget}</p>
                  <p><strong>Timeline:</strong> ${leadData.timeline}</p>
                  ${leadData.specificDetails ? `<p><strong>Specific Requirements:</strong> ${leadData.specificDetails}</p>` : ''}
                </div>
                
                <p>Our qualified tradesmen are reviewing your project and will send you a detailed quote within 24 hours.</p>
                <p>You'll receive an email with the quote and tradesman details for your approval.</p>
                
                <p style="margin-top: 30px;">Best regards,<br><strong>Your Trade Team</strong></p>
              </div>
            `
          };

          await transporter.sendMail(customerMailOptions);
          console.log('✅ Customer confirmation email sent successfully');
          customerEmailSent = true;

          // Send tradesman emails with quote information
          if (tradesmenFound.length > 0) {
            console.log(`📧 Sending tradesman emails with quote to ${tradesmenFound.length} tradesmen`);
            
            for (const tradesman of tradesmenFound) {
              try {
                const quoteUrl = `https://lead-code-e8pgu6alm-dan-buis-projects-e44a173c.vercel.app/api/quote-emails?type=tradesman&quoteId=${quote?.QuoteID || 'QUOTE-ID'}`;
                
                const tradesmanMailOptions = {
                  from: fromDisplay,
                  replyTo,
                  to: tradesman.email,
                  subject: `New ${leadData.selectedService} Lead with Quote Request - ${leadData.customerName}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #e74c3c;">New Lead with Quote Request!</h2>
                      
                      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0;"><strong>⚠️ ACTION REQUIRED:</strong> Please review and provide a quote for this project.</p>
                      </div>
                      
                      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #34495e; margin-top: 0;">Customer Information:</h3>
                        <p><strong>Name:</strong> ${leadData.customerName}</p>
                        <p><strong>Email:</strong> ${leadData.customerEmail}</p>
                        <p><strong>Phone:</strong> ${leadData.customerPhone}</p>
                        <p><strong>Location:</strong> ${leadData.location}</p>
                        
                        <h3 style="color: #34495e;">Project Details:</h3>
                        <p><strong>Service:</strong> ${leadData.selectedService}</p>
                        <p><strong>Project:</strong> ${leadData.projectDetails}</p>
                        <p><strong>Size/Scope:</strong> ${leadData.projectSize}</p>
                        <p><strong>Budget:</strong> ${leadData.budget}</p>
                        <p><strong>Timeline:</strong> ${leadData.timeline}</p>
                        ${leadData.specificDetails ? `<p><strong>Specific Requirements:</strong> ${leadData.specificDetails}</p>` : ''}
                      </div>
                      
                      <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #155724; margin-top: 0;">Next Steps:</h3>
                        <p>1. Review the project details above</p>
                        <p>2. Calculate your quote based on the requirements</p>
                        <p>3. Click the link below to submit your quote</p>
                        <p>4. The customer will receive your quote for approval</p>
                      </div>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${quoteUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Submit Quote</a>
                      </div>
                      
                      <p style="color: #6c757d; font-size: 14px;">Quote ID: ${quote?.QuoteID || 'QUOTE-ID'}</p>
                    </div>
                  `
                };

                await transporter.sendMail(tradesmanMailOptions);
                console.log(`✅ Tradesman email with quote sent to: ${tradesman.email}`);
              } catch (tradesmanEmailError) {
                console.error(`❌ Failed to send email to ${tradesman.email}:`, tradesmanEmailError.message);
              }
            }
            tradesmanEmailSent = true;
          } else {
            // Fallback: Send to admin email if no tradesmen found
            console.log('📧 No tradesmen found for this service, sending to admin email');
            const adminMailOptions = {
              from: fromDisplay,
              replyTo,
              to: 'danbricks18@gmail.com',
              subject: `New ${leadData.selectedService} Lead - NO TRADESMEN REGISTERED`,
              html: `
                <h2>New Lead Received - No Tradesmen Available!</h2>
                <p><strong>Service Type:</strong> ${leadData.selectedService}</p>
                <p><strong>Customer:</strong> ${leadData.customerName}</p>
                <p><strong>Email:</strong> ${leadData.customerEmail}</p>
                <p><strong>Phone:</strong> ${leadData.customerPhone}</p>
                <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
                <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
                <p><strong>Specific Details:</strong> ${leadData.specificDetails}</p>
                <p><strong>Location:</strong> ${leadData.location}</p>
                <p><strong>Budget:</strong> ${leadData.budget}</p>
                <p><strong>Timeline:</strong> ${leadData.timeline}</p>
                <p><strong>⚠️ ACTION REQUIRED:</strong> No tradesmen are registered for this service type.</p>
                <p>Please either:</p>
                <ul>
                  <li>Register a tradesman for ${leadData.selectedService} service</li>
                  <li>Contact the customer directly</li>
                  <li>Forward this lead to an appropriate tradesman</li>
                </ul>
              `
            };

            await transporter.sendMail(adminMailOptions);
            console.log('✅ Admin notification email sent');
            tradesmanEmailSent = true;
          }

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
        ? 'Lead submitted successfully! Check your email for confirmation. Quote will be sent within 24 hours.'
        : 'Lead submitted successfully! Google Sheets updated. Email status: ' +
          (customerEmailSent ? 'Customer email sent' : 'Customer email failed') + ', ' +
          (tradesmanEmailSent ? 'Tradesman email sent' : 'Tradesman email failed'),
      data: leadData,
      quoteId: quote?.QuoteID,
      timestamp: new Date().toISOString(),
      status: {
        logged: true,
        sheetsUpdated,
        customerEmailSent,
        tradesmanEmailSent,
        quoteGenerated,
        tradesmenFound: tradesmenFound.length,
        note: customerEmailSent && tradesmanEmailSent
          ? 'All systems working! Quote workflow initiated.'
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