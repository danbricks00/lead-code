import { google } from 'googleapis';
import { sendEmailViaGmailAPI, validateEmail, logEmailAttempt } from './gmail-api-helper.js';

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

      // Email configuration
      const tradesmanEmail = 'quangbui0600@gmail.com';
      const adminEmail = 'danbricks@outlooki.co.nz';
      const customerEmail = leadData.customerEmail;
      
      console.log('📧 Email recipients configured:');
      console.log(`📧 Tradesman: ${tradesmanEmail}`);
      console.log(`📧 Admin: ${adminEmail}`);
      console.log(`📧 Customer: ${customerEmail}`);

      // Validate email addresses
      if (!validateEmail(tradesmanEmail)) {
        throw new Error(`Invalid tradesman email: ${tradesmanEmail}`);
      }
      if (!validateEmail(adminEmail)) {
        throw new Error(`Invalid admin email: ${adminEmail}`);
      }
      if (!validateEmail(customerEmail)) {
        throw new Error(`Invalid customer email: ${customerEmail}`);
      }

      let emailResults = {
        tradesman: { sent: false, error: null },
        admin: { sent: false, error: null },
        customer: { sent: false, error: null }
      };

      // 1. Send email to tradesman
      console.log('📧 Step 1: Sending tradesman notification...');
      try {
        const tradesmanSubject = `🔥 New Lead: ${leadData.selectedService} - ${leadData.location}`;
        const tradesmanHtml = `
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
        `;

        const tradesmanResult = await sendEmailViaGmailAPI(tradesmanEmail, tradesmanSubject, tradesmanHtml);
        emailResults.tradesman.sent = true;
        logEmailAttempt(tradesmanEmail, tradesmanSubject, 'SUCCESS');
        console.log(`✅ Tradesman email sent successfully: ${tradesmanResult.messageId}`);
      } catch (error) {
        emailResults.tradesman.error = error.message;
        logEmailAttempt(tradesmanEmail, '🔥 New Lead', 'FAILED', error);
        console.error(`❌ Failed to send tradesman email:`, error.message);
      }

      // 2. Send email to admin
      console.log('📧 Step 2: Sending admin notification...');
      try {
        const adminSubject = `📋 New Lead: ${leadData.customerName} - ${leadData.selectedService}`;
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">📋 New Lead Received - Admin Copy</h2>
            <p>A new lead has been submitted and assigned to a tradesman for quote.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Lead Details:</h3>
              <p><strong>Customer Name:</strong> ${leadData.customerName}</p>
              <p><strong>Customer Email:</strong> ${leadData.customerEmail}</p>
              <p><strong>Customer Phone:</strong> ${leadData.customerPhone}</p>
              <p><strong>Service Type:</strong> ${leadData.selectedService}</p>
              <p><strong>Location:</strong> ${leadData.location}</p>
              <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
              <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
              <p><strong>Budget:</strong> ${leadData.budget}</p>
              <p><strong>Timeline:</strong> ${leadData.timeline}</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Status:</h3>
              <p><strong>Lead ID:</strong> ${leadId}</p>
              <p><strong>Assigned Tradesman:</strong> quangbui0600@gmail.com</p>
              <p><strong>Status:</strong> Quote request sent - awaiting response</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Next Steps:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Tradesman will receive quote request email</li>
                <li>Tradesman will submit quote within 24 hours</li>
                <li>Customer will receive professional quote with attachment</li>
                <li>Monitor quote status in dashboard</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
          </div>
        `;

        const adminResult = await sendEmailViaGmailAPI(adminEmail, adminSubject, adminHtml);
        emailResults.admin.sent = true;
        logEmailAttempt(adminEmail, adminSubject, 'SUCCESS');
        console.log(`✅ Admin email sent successfully: ${adminResult.messageId}`);
      } catch (error) {
        emailResults.admin.error = error.message;
        logEmailAttempt(adminEmail, '📋 New Lead', 'FAILED', error);
        console.error(`❌ Failed to send admin email:`, error.message);
      }

      // 3. Send email to customer
      console.log('📧 Step 3: Sending customer confirmation...');
      try {
        const customerSubject = `Thank you for your inquiry - Kiwi Trade`;
        const customerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Thank you for your inquiry!</h2>
            <p>Dear ${leadData.customerName},</p>
            <p>Thank you for submitting your inquiry through our chatbot. We have received your request and are processing it.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Your Request Details:</h3>
              <p><strong>Service:</strong> ${leadData.selectedService}</p>
              <p><strong>Location:</strong> ${leadData.location}</p>
              <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
              <p><strong>Budget:</strong> ${leadData.budget}</p>
              <p><strong>Timeline:</strong> ${leadData.timeline}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Our team will review your requirements</li>
                <li>We'll prepare a detailed quote for your project</li>
                <li>You'll receive a professional quote within 24 hours</li>
                <li>You can then review and accept/decline the quote</li>
              </ul>
            </div>
            
            <p><strong>Reference ID:</strong> ${leadId}</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade Team</strong></p>
          </div>
        `;

        const customerResult = await sendEmailViaGmailAPI(customerEmail, customerSubject, customerHtml);
        emailResults.customer.sent = true;
        logEmailAttempt(customerEmail, customerSubject, 'SUCCESS');
        console.log(`✅ Customer email sent successfully: ${customerResult.messageId}`);
      } catch (error) {
        emailResults.customer.error = error.message;
        logEmailAttempt(customerEmail, 'Thank you for your inquiry', 'FAILED', error);
        console.error(`❌ Failed to send customer email:`, error.message);
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
              `Tradesman: ${emailResults.tradesman.sent ? 'Sent' : 'Failed'}, Admin: ${emailResults.admin.sent ? 'Sent' : 'Failed'}, Customer: ${emailResults.customer.sent ? 'Sent' : 'Failed'}`
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

      // Calculate email success rate
      const totalEmails = 3;
      const successfulEmails = Object.values(emailResults).filter(result => result.sent).length;
      const emailSuccessRate = (successfulEmails / totalEmails) * 100;

      // Return success response
      const response = {
        success: emailSuccessRate >= 66, // At least 2 out of 3 emails must succeed
        message: emailSuccessRate >= 66 ? 'Lead notification sent successfully!' : 'Lead notification partially sent',
        data: {
          leadId,
          customerName: leadData.customerName,
          serviceType: leadData.selectedService,
          location: leadData.location
        },
        status: {
          emailResults,
          emailSuccessRate: `${emailSuccessRate.toFixed(1)}%`,
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
