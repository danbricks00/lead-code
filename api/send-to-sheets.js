import { google } from 'googleapis';
import { getAllTradesmen } from './database.js';
import { addQuote } from './quote-database.js';

export default async function handler(req, res) {
  console.log('🔍 API endpoint called:', req.method, req.url);
  
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
    const { action, ...data } = req.body;

    // Handle different actions
    if (action === 'log-interrupted-session') {
      return await handleInterruptedSession(data, res);
    } else {
      // Default action: submit lead
      return await handleLeadSubmission(data, res);
    }
  } catch (error) {
    console.error('❌ Error in send-to-sheets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}

async function handleInterruptedSession(sessionData, res) {
  try {
    const result = await logInterruptedSession(sessionData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Interrupted session logged successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to log interrupted session'
      });
    }
  } catch (error) {
    console.error('❌ Error handling interrupted session:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function handleLeadSubmission(leadData, res) {
  try {
    console.log('✅ Lead received:', leadData);

    let sheetsUpdated = false;
    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let quoteGenerated = false;
    let quote = null;
    let tradesmenFound = [];
    let emailErrorDetails = null;

    // 1. Try to add to Google Sheets
    if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
      try {
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
    }

    // 2. Get tradesmen for the service
    try {
      tradesmenFound = await getAllTradesmen(leadData.selectedService);
      console.log(`✅ Found ${tradesmenFound.length} tradesmen for ${leadData.selectedService}`);
    } catch (tradesmenError) {
      console.error('❌ Error getting tradesmen:', tradesmenError.message);
    }

    // 3. Generate quote for the lead
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

      quote = await addQuote(quoteData);
      console.log('✅ Quote generated:', quote.quoteId);
      quoteGenerated = true;
    } catch (quoteError) {
      console.error('❌ Error generating quote:', quoteError.message);
    }

    // 4. Send emails
    try {
      let nodemailer;
      let transporter;
      
      try {
        const nodemailerModule = await import('nodemailer');
        nodemailer = nodemailerModule.default || nodemailerModule;
        
        const createMethod = nodemailer.createTransporter || 
                           nodemailer.createTransport || 
                           nodemailer.default?.createTransporter ||
                           nodemailer.default?.createTransport;
        
        if (createMethod && typeof createMethod === 'function') {
          // Use fallback credentials
          const gmailUser = process.env.GMAIL_USER || 'danbricks18@gmail.com';
          const gmailPass = process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom';

          transporter = createMethod({
            service: 'gmail',
            auth: {
              user: gmailUser,
              pass: gmailPass
            }
          });
        }
      } catch (importError) {
        console.error('❌ Nodemailer import failed:', importError.message);
      }

      if (transporter) {
        // Send customer confirmation email
        const fromDisplay = `Kiwi Underfloor Heating <${process.env.GMAIL_USER || 'danbricks18@gmail.com'}>`;
        const replyTo = process.env.GMAIL_USER || 'danbricks18@gmail.com';

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

        try {
          await transporter.sendMail(customerMailOptions);
          console.log('✅ Customer confirmation email sent successfully');
          customerEmailSent = true;
        } catch (customerEmailError) {
          console.error('❌ Customer email failed:', customerEmailError.message);
        }

        // Send tradesman emails
        if (tradesmenFound.length > 0) {
          const currentUrl = process.env.VERCEL_URL ? 
            `https://${process.env.VERCEL_URL}` : 
            'https://lead-code-4syyu57e9-leadcode-b19d9acc.vercel.app';
          
          for (const tradesman of tradesmenFound) {
            try {
              const quoteUrl = `${currentUrl}/api/quote-submission?quoteId=${quote?.quoteId || 'QUOTE-ID'}`;
              
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
                    
                    <p style="color: #6c757d; font-size: 14px;">Quote ID: ${quote?.quoteId || 'QUOTE-ID'}</p>
                  </div>
                `
              };

              await transporter.sendMail(tradesmanMailOptions);
              console.log(`✅ Tradesman email sent to: ${tradesman.email}`);
            } catch (tradesmanEmailError) {
              console.error(`❌ Failed to send email to ${tradesman.email}:`, tradesmanEmailError.message);
            }
          }
          tradesmanEmailSent = true;
        } else {
          // Send to admin if no tradesmen found
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
            `
          };

          try {
            await transporter.sendMail(adminMailOptions);
            console.log('✅ Admin notification email sent');
            tradesmanEmailSent = true;
          } catch (adminEmailError) {
            console.error('❌ Admin email failed:', adminEmailError.message);
          }
        }
      }
    } catch (emailError) {
      console.error('❌ Email error:', emailError.message);
      emailErrorDetails = emailError.message;
    }

    // Return success response
    const response = {
      success: true,
      message: customerEmailSent && tradesmanEmailSent
        ? 'Lead submitted successfully! Check your email for confirmation. Quote will be sent within 24 hours.'
        : 'Lead submitted successfully! Google Sheets updated. Email status: ' +
          (customerEmailSent ? 'Customer email sent' : 'Customer email failed') + ', ' +
          (tradesmanEmailSent ? 'Tradesman email sent' : 'Tradesman email failed'),
      data: leadData,
      quoteId: quote?.quoteId,
      timestamp: new Date().toISOString(),
      status: {
        logged: true,
        sheetsUpdated,
        customerEmailSent,
        tradesmanEmailSent,
        quoteGenerated,
        tradesmenFound: tradesmenFound.length,
        emailErrorDetails
      }
    };

    console.log('📊 Final Response:', response);
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

export async function logInterruptedSession(sessionData) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      return { success: true };
    }

    const { google } = await import('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const rowData = [
      new Date().toISOString(),
      'INTERRUPTED',
      sessionData.customerEmail || 'Unknown',
      sessionData.customerName || 'Unknown',
      sessionData.selectedService || 'Unknown',
      sessionData.projectDetails || 'Session interrupted',
      sessionData.projectSize || '',
      sessionData.location || '',
      sessionData.budget || '',
      sessionData.timeline || '',
      sessionData.customerPhone || '',
      sessionData.specificDetails || '',
      'Chat session was closed by user',
      'interrupted'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Leads!A:N',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [rowData] }
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error logging interrupted session:', error);
    return { success: false, error: error.message };
  }
} 