import { google } from 'googleapis';

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
    const leadData = req.body;
    console.log('✅ Lead received:', leadData);
    console.log('📧 Customer email check:', {
      customerEmail: leadData.customerEmail,
      customerName: leadData.customerName,
      hasEmail: !!leadData.customerEmail,
      emailType: typeof leadData.customerEmail
    });

    // 1. Send customer confirmation email
    let customerEmailSent = false;
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // Check if customer email is provided
      if (!leadData.customerEmail) {
        console.error('❌ No customer email provided in lead data');
        throw new Error('No customer email provided');
      }

      const customerMailOptions = {
        from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
        to: leadData.customerEmail,
        subject: 'Your Project Request Confirmation - Quote Coming Soon',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Thank you for your project request!</h2>
            <p>Hi ${leadData.customerName || 'there'},</p>
            <p>We have received your request for <strong>${leadData.selectedService || 'our services'}</strong> and are working on your quote.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Project Details:</h3>
              <p><strong>Service:</strong> ${leadData.selectedService || 'Not specified'}</p>
              <p><strong>Project:</strong> ${leadData.projectDetails || 'Not specified'}</p>
              <p><strong>Location:</strong> ${leadData.location || 'Not specified'}</p>
              <p><strong>Size/Scope:</strong> ${leadData.projectSize || 'Not specified'}</p>
              <p><strong>Budget:</strong> ${leadData.budget || 'Not specified'}</p>
              <p><strong>Timeline:</strong> ${leadData.timeline || 'Not specified'}</p>
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
    } catch (emailError) {
      console.error('❌ Customer email error:', emailError.message);
    }

    // 2. Send tradesman notification directly (no API call needed)
    let tradesmanNotified = false;
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // Generate unique lead ID
      const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current URL for quote links
      const currentUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://lead-code.vercel.app';

      // Create quote submission link with pre-filled data
      const quoteLink = `${currentUrl}/api/quote-submission?leadId=${leadId}&customerName=${encodeURIComponent(leadData.customerName)}&customerEmail=${encodeURIComponent(leadData.customerEmail)}&customerPhone=${encodeURIComponent(leadData.customerPhone)}&serviceType=${encodeURIComponent(leadData.selectedService)}&projectDetails=${encodeURIComponent(leadData.projectDetails)}&projectSize=${encodeURIComponent(leadData.projectSize)}&budget=${encodeURIComponent(leadData.budget)}&timeline=${encodeURIComponent(leadData.timeline)}&location=${encodeURIComponent(leadData.location)}`;

      // Send email to tradesmen
      const tradesmanEmails = ['danbricks18@gmail.com']; // Add more tradesman emails here
      
      for (const tradesmanEmail of tradesmanEmails) {
        try {
          const mailOptions = {
            from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
            to: tradesmanEmail,
            subject: `🔥 New Lead: ${leadData.selectedService} - ${leadData.location}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">🔥 New Lead Available!</h2>
                <p>A new customer has submitted a lead request. Here are the details:</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #34495e; margin-top: 0;">Customer Details:</h3>
                  <p><strong>Name:</strong> ${leadData.customerName}</p>
                  <p><strong>Email:</strong> ${leadData.customerEmail}</p>
                  <p><strong>Phone:</strong> ${leadData.customerPhone}</p>
                  <p><strong>Location:</strong> ${leadData.location}</p>
                  
                  <h3 style="color: #34495e;">Project Details:</h3>
                  <p><strong>Service:</strong> ${leadData.selectedService}</p>
                  <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
                  <p><strong>Budget:</strong> ${leadData.budget}</p>
                  <p><strong>Timeline:</strong> ${leadData.timeline}</p>
                  <p><strong>Details:</strong> ${leadData.projectDetails}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${quoteLink}" 
                     style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
                     📝 Submit Quote
                  </a>
                </div>
                
                <p><strong>Lead ID:</strong> ${leadId}</p>
                <p>Click the button above to submit a quote. The form will be pre-filled with the customer's information.</p>
                
                <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
                  This lead was generated from the Kiwi Underfloor Heating website.
                </p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Lead notification sent to ${tradesmanEmail}`);
          tradesmanNotified = true;
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${tradesmanEmail}:`, emailError.message);
        }
      }
    } catch (notificationError) {
      console.error('❌ Tradesman notification error:', notificationError.message);
    }

    // Note: Admin notification is now handled by lead-notification.js to avoid duplicates

    // 3. Save to Google Sheets (if configured)
    let sheetsUpdated = false;
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
            leadData.customerName || '',
            leadData.customerEmail || '',
            leadData.customerPhone || '',
            leadData.selectedService || '',
            leadData.projectDetails || '',
            leadData.budget || '',
            leadData.timeline || '',
            leadData.projectSize || '',
            leadData.specificDetails || '',
            leadData.location || ''
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

    // Return success response
    const response = {
      success: true,
      message: customerEmailSent 
        ? 'Lead submitted successfully! Check your email for confirmation. Quote will be sent within 24 hours.'
        : 'Lead submitted successfully! Admin has been notified.',
      data: leadData,
      timestamp: new Date().toISOString(),
      status: {
        customerEmailSent,
        tradesmanNotified,
        sheetsUpdated
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