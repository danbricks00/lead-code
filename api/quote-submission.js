import { google } from 'googleapis';
import { sendEmailViaGmailAPI, validateEmail, logEmailAttempt } from './gmail-api-helper.js';
import { generateQuoteDocument } from './word-document-generator.js';

export default async function handler(req, res) {
  console.log('🔍 Quote submission API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { 
      quoteId, 
      leadId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      serviceType, 
      projectDetails, 
      projectSize, 
      budget, 
      timeline, 
      location 
    } = req.query;
    
    const queryParams = new URLSearchParams();
    if (leadId) queryParams.append('leadId', leadId);
    if (quoteId) queryParams.append('quoteId', quoteId);
    if (customerName) queryParams.append('customerName', customerName);
    if (customerEmail) queryParams.append('customerEmail', customerEmail);
    if (customerPhone) queryParams.append('customerPhone', customerPhone);
    if (serviceType) queryParams.append('serviceType', serviceType);
    if (projectDetails) queryParams.append('projectDetails', projectDetails);
    if (projectSize) queryParams.append('projectSize', projectSize);
    if (budget) queryParams.append('budget', budget);
    if (timeline) queryParams.append('timeline', timeline);
    if (location) queryParams.append('location', location);
    
    const queryString = queryParams.toString();
    const redirectUrl = `/quote-form.html${queryString ? '?' + queryString : ''}`;
    
    return res.redirect(redirectUrl);
  }

  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      console.log('✅ Quote received:', quoteData);

      // Basic validation with detailed logging
      console.log('🔍 Validating quote data...');
      console.log('📝 Tradesman Name:', quoteData.tradesmanName);
      console.log('📧 Tradesman Email:', quoteData.tradesmanEmail);
      console.log('💰 Total Amount:', quoteData.totalAmount);
      console.log('📞 Tradesman Phone:', quoteData.tradesmanPhone);
      console.log('📅 Valid Until:', quoteData.validUntil);
      console.log('🔢 Quote Number:', quoteData.quoteNumber);
      
      // Check for pattern validation issues
      if (quoteData.tradesmanPhone && !/^[\+]?[0-9\s\-\(\)]+$/.test(quoteData.tradesmanPhone)) {
        console.log('❌ Phone number pattern validation failed:', quoteData.tradesmanPhone);
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format. Please use only numbers, spaces, hyphens, and parentheses.'
        });
      }
      
      if (quoteData.tradesmanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quoteData.tradesmanEmail)) {
        console.log('❌ Email pattern validation failed:', quoteData.tradesmanEmail);
        return res.status(400).json({
          success: false,
          error: 'Invalid email format. Please enter a valid email address.'
        });
      }
      
      if (!quoteData.tradesmanName || !quoteData.tradesmanEmail || !quoteData.totalAmount) {
        console.log('❌ Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: tradesmanName, tradesmanEmail, totalAmount'
        });
      }

      // Clean and validate data
      try {
        quoteData.tradesmanName = quoteData.tradesmanName.trim();
        quoteData.tradesmanEmail = quoteData.tradesmanEmail.trim();
        quoteData.totalAmount = quoteData.totalAmount.toString().replace(/[^0-9.]/g, '');
        quoteData.tradesmanPhone = quoteData.tradesmanPhone ? quoteData.tradesmanPhone.trim() : '';
        quoteData.itemBreakdown = quoteData.itemBreakdown ? quoteData.itemBreakdown.trim() : '';
        quoteData.additionalNotes = quoteData.additionalNotes ? quoteData.additionalNotes.trim() : '';
        
        console.log('✅ Data cleaned successfully');
        console.log('🧹 Cleaned data:', {
          tradesmanName: quoteData.tradesmanName,
          tradesmanEmail: quoteData.tradesmanEmail,
          totalAmount: quoteData.totalAmount,
          tradesmanPhone: quoteData.tradesmanPhone
        });
      } catch (cleanError) {
        console.error('❌ Error cleaning data:', cleanError);
        return res.status(400).json({
          success: false,
          error: 'Error processing form data: ' + cleanError.message
        });
      }

      // Fetch customer data from Google Sheets if missing
      if ((!quoteData.customerName || !quoteData.customerEmail || !quoteData.customerPhone) && quoteData.leadId && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:K',
          });

          const rows = response.data.values || [];
          const leadRow = rows.find(row => row[13] === quoteData.leadId);

          if (leadRow) {
            quoteData.customerName = quoteData.customerName || leadRow[1] || '';
            quoteData.customerEmail = quoteData.customerEmail || leadRow[2] || '';
            quoteData.customerPhone = quoteData.customerPhone || leadRow[3] || '';
            quoteData.serviceType = quoteData.serviceType || leadRow[4] || 'Underfloor Heating';
            quoteData.projectDetails = quoteData.projectDetails || leadRow[5] || '';
            quoteData.location = quoteData.location || leadRow[10] || 'Auckland';
            console.log('✅ Customer data fetched from Google Sheets');
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error fetching customer data:', sheetsError.message);
        }
      }

      // Initialize status variables
      let sheetsUpdated = false;
      let tradesmanEmailSent = false;
      let customerEmailSent = false;

      // 1. Save to Google Sheets
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
              quoteData.quoteId,
              quoteData.quoteNumber,
              quoteData.tradesmanName,
              quoteData.tradesmanEmail,
              quoteData.tradesmanPhone,
              quoteData.totalAmount,
              quoteData.itemBreakdown,
              quoteData.validUntil,
              quoteData.additionalNotes,
              'submitted',
              quoteData.customerName,
              quoteData.customerEmail,
              quoteData.customerPhone,
              quoteData.serviceType,
              quoteData.location,
              quoteData.projectDetails,
              quoteData.projectSize,
              quoteData.budget,
              quoteData.timeline
            ]
          ];

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:T',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
          });

          console.log('✅ Quote saved to Google Sheets');
          sheetsUpdated = true;
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // Email configuration
      const tradesmanEmail = 'quangbui0600@gmail.com';
      const adminEmail = 'danbricks@outlooki.co.nz';
      const customerEmail = quoteData.customerEmail;
      
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

      // Generate Word document attachment
      let quoteAttachment = null;
      let attachmentFilename = '';
      
      console.log('📄 Generating Word document quote...');
      try {
        const docResult = await generateQuoteDocument(quoteData);
        quoteAttachment = {
          content: docResult.buffer,
          filename: docResult.filename,
          contentType: docResult.contentType
        };
        attachmentFilename = docResult.filename;
        console.log(`✅ Word document generated: ${attachmentFilename}`);
      } catch (docError) {
        console.error('❌ Failed to generate Word document:', docError.message);
        // Continue without attachment
      }

      // 2. Send confirmation email to tradesman
      console.log('📧 Step 1: Sending tradesman confirmation...');
      try {
        const tradesmanSubject = `Quote Submission Successful - ${quoteData.quoteNumber}`;
        const tradesmanHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">✅ Quote Submission Successful!</h2>
            <p>Dear ${quoteData.tradesmanName},</p>
            <p>Your quote has been successfully submitted and is being processed.</p>
      
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Customer:</strong> ${quoteData.customerName || 'Not specified'}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
              <p><strong>Status:</strong> Submitted and being processed</p>
            </div>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>📄 Professional DOCX quote being generated</li>
                <li>📧 Customer will receive quote email with attachment</li>
                <li>📧 Customer can view quote online and accept/decline</li>
                <li>📊 Quote status will be updated in dashboard</li>
              </ul>
            </div>

            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
          </div>
        `;

        const tradesmanResult = await sendEmailViaGmailAPI(tradesmanEmail, tradesmanSubject, tradesmanHtml, quoteAttachment);
        emailResults.tradesman.sent = true;
        logEmailAttempt(tradesmanEmail, tradesmanSubject, 'SUCCESS', null, quoteAttachment);
        console.log(`✅ Tradesman email sent successfully: ${tradesmanResult.messageId}`);
        tradesmanEmailSent = true;
      } catch (error) {
        emailResults.tradesman.error = error.message;
        logEmailAttempt(tradesmanEmail, 'Quote Submission Successful', 'FAILED', error, quoteAttachment);
        console.error(`❌ Failed to send tradesman email:`, error.message);
      }

      // 3. Send email to admin with attachment
      console.log('📧 Step 2: Sending admin notification...');
      try {
        const adminSubject = `Quote ${quoteData.quoteNumber} Submitted - ${quoteData.tradesmanName}`;
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">📄 Quote Submitted - Admin Copy</h2>
            <p>A quote has been submitted by ${quoteData.tradesmanName} for ${quoteData.customerName}.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
              <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
              <p><strong>Phone:</strong> ${quoteData.tradesmanPhone}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
              <p><strong>Item Breakdown:</strong></p>
              <pre style="background: #f1f1f1; padding: 10px; border-radius: 4px; white-space: pre-wrap;">${quoteData.itemBreakdown}</pre>
              ${quoteData.additionalNotes ? `<p><strong>Additional Notes:</strong> ${quoteData.additionalNotes}</p>` : ''}
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">Customer Details:</h3>
              <p><strong>Name:</strong> ${quoteData.customerName || 'Not specified'}</p>
              <p><strong>Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
              <p><strong>Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
              <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
              <p><strong>Location:</strong> ${quoteData.location || 'Auckland'}</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Status:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ Quote submitted successfully</li>
                <li>📧 Customer will receive quote with attachment</li>
                <li>🌐 Customer can view quote online</li>
                <li>📊 Quote status updated in system</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
          </div>
        `;

        const adminResult = await sendEmailViaGmailAPI(adminEmail, adminSubject, adminHtml, quoteAttachment);
        emailResults.admin.sent = true;
        logEmailAttempt(adminEmail, adminSubject, 'SUCCESS', null, quoteAttachment);
        console.log(`✅ Admin email sent successfully: ${adminResult.messageId}`);
      } catch (error) {
        emailResults.admin.error = error.message;
        logEmailAttempt(adminEmail, 'Quote Submitted - Admin Copy', 'FAILED', error, quoteAttachment);
        console.error(`❌ Failed to send admin email:`, error.message);
      }

      // 4. Send email to customer with attachment
      console.log('📧 Step 3: Sending customer quote...');
      try {
        const currentUrl = process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}` : 
          'https://lead-code.vercel.app';

        const customerSubject = `Your Quote - ${quoteData.quoteNumber} - Kiwi Trade`;
        const customerHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Your Quote is Ready!</h2>
            <p>Dear ${quoteData.customerName},</p>
            <p>Thank you for your inquiry. We have prepared a detailed quote for your project.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
              <p><strong>Location:</strong> ${quoteData.location || 'Auckland'}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #27ae60; margin-top: 0;">What's included:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>📄 Professional quote document (attached)</li>
                <li>🌐 Online quote viewer with accept/decline options</li>
                <li>📞 Direct contact with our team</li>
                <li>⚡ Fast response to your decision</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${currentUrl}/api/view-quote?quoteId=${quoteData.quoteId}" 
                 style="background: #4a90e2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold; margin: 10px;">
                 🌐 View Quote Online
              </a>
              <a href="mailto:${quoteData.tradesmanEmail}?subject=Quote ${quoteData.quoteNumber} - Question" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold; margin: 10px;">
                 📧 Ask Questions
              </a>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Next Steps:</h3>
              <ol style="margin: 10px 0; padding-left: 20px;">
                <li>Review the attached quote document</li>
                <li>Visit the online quote to accept or decline</li>
                <li>Contact us if you have any questions</li>
                <li>We'll proceed with your project once confirmed</li>
              </ol>
            </div>
            
            <p><strong>Reference:</strong> ${quoteData.quoteNumber}</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade Team</strong></p>
          </div>
        `;

        const customerResult = await sendEmailViaGmailAPI(customerEmail, customerSubject, customerHtml, quoteAttachment);
        emailResults.customer.sent = true;
        logEmailAttempt(customerEmail, customerSubject, 'SUCCESS', null, quoteAttachment);
        console.log(`✅ Customer email sent successfully: ${customerResult.messageId}`);
        customerEmailSent = true;
      } catch (error) {
        emailResults.customer.error = error.message;
        logEmailAttempt(customerEmail, 'Your Quote', 'FAILED', error, quoteAttachment);
        console.error(`❌ Failed to send customer email:`, error.message);
      }

      // Calculate email success rate
      const totalEmails = 3;
      const successfulEmails = Object.values(emailResults).filter(result => result.sent).length;
      const emailSuccessRate = (successfulEmails / totalEmails) * 100;

      // Return success response
      const response = {
        success: emailSuccessRate >= 66, // At least 2 out of 3 emails must succeed
        message: emailSuccessRate >= 66 ? 'Quote submitted successfully! Professional quote has been created and sent to all parties.' : 'Quote submitted successfully! Some notifications may be delayed.',
        data: {
          quoteNumber: quoteData.quoteNumber,
          customerName: quoteData.customerName,
          totalAmount: quoteData.totalAmount,
          tradesmanName: quoteData.tradesmanName
        },
        status: {
          emailResults,
          emailSuccessRate: `${emailSuccessRate.toFixed(1)}%`,
          sheetsUpdated,
          attachmentGenerated: !!quoteAttachment
        }
      };

      console.log('📊 Quote Submission Response:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ Error processing quote submission:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process quote submission',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
