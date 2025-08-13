import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('📧 Lead notification API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      console.log('✅ Lead data received:', leadData);

      // Generate unique lead ID
      const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current URL for quote links
      const currentUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://lead-code-kh766ffsc-leadcode-b19d9acc.vercel.app';

      // Create quote submission link with pre-filled data
      const quoteLink = `${currentUrl}/api/quote-submission?leadId=${leadId}&customerName=${encodeURIComponent(leadData.customerName)}&customerEmail=${encodeURIComponent(leadData.customerEmail)}&customerPhone=${encodeURIComponent(leadData.customerPhone)}&serviceType=${encodeURIComponent(leadData.selectedService)}&projectDetails=${encodeURIComponent(leadData.projectDetails)}&projectSize=${encodeURIComponent(leadData.projectSize)}&budget=${encodeURIComponent(leadData.budget)}&timeline=${encodeURIComponent(leadData.timeline)}&location=${encodeURIComponent(leadData.location)}`;

      // Send email to tradesmen (you can add multiple tradesman emails)
      const tradesmanEmails = ['quangbui0600@gmail.com']; // Tradesman email for testing
      
      let emailsSent = 0;
      
      for (const tradesmanEmail of tradesmanEmails) {
        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
              user: 'danbricks18@gmail.com',
              pass: 'ptmcojqgthvjbqom'
            }
          });

          const mailOptions = {
            from: 'Kiwi Trade <danbricks18@gmail.com>',
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
                  This lead was generated from the Kiwi Trade website.
                </p>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
          console.log(`✅ Lead notification sent to ${tradesmanEmail}`);
          emailsSent++;
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${tradesmanEmail}:`, emailError.message);
        }
      }

      // Save lead to Google Sheets with notification status
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
              leadData.customerName,
              leadData.customerEmail,
              leadData.customerPhone,
              leadData.selectedService,
              leadData.projectDetails,
              leadData.projectSize,
              leadData.budget,
              leadData.timeline,
              leadData.location,
              leadData.specificDetails || '',
              'new',
              leadId,
              `Tradesman notified: ${emailsSent} emails sent`
            ]
          ];

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Leads!A:N',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
          });

          console.log('✅ Lead saved to Google Sheets');
          sheetsUpdated = true;
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // Return success response
      const response = {
        success: true,
        message: 'Lead notification sent successfully!',
        data: {
          leadId,
          customerName: leadData.customerName,
          serviceType: leadData.selectedService,
          location: leadData.location
        },
        status: {
          emailsSent,
          sheetsUpdated
        }
      };

      console.log('📊 Lead Notification Response:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ Error processing lead notification:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process lead notification',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
