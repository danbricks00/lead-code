import { google } from 'googleapis';

export async function sendToSheets(leadData) {
  console.log('🔍 sendToSheets function called');
  console.log('✅ Lead received:', leadData);
  
  // Create timestamp when chatbot responses are completed
  const timestamp = new Date().toISOString();
  console.log('📅 Chatbot completion timestamp:', timestamp);
  
  // Generate unique lead ID for tracking (moved to top for scope)
  const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('📧 Generated lead ID:', leadId);
  
  console.log('📧 Customer email check:', {
    customerEmail: leadData.customerEmail,
    customerName: leadData.customerName,
    hasEmail: !!leadData.customerEmail,
    emailType: typeof leadData.customerEmail
  });

  // 1. Send gamified welcome email to customer
  let customerEmailSent = false;
  try {
    // Check if customer email is provided
    if (!leadData.customerEmail) {
      console.error('❌ No customer email provided in lead data');
      throw new Error('No customer email provided');
    }

    // Send gamified welcome email
    const welcomeEmailResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/send-gamified-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: leadData.customerEmail,
        customerName: leadData.customerName || 'there',
        leadId: leadId,
        emailType: 'welcome'
      })
    });

    const welcomeEmailResult = await welcomeEmailResponse.json();
    if (welcomeEmailResult.success) {
      console.log('✅ Gamified welcome email sent successfully');
      customerEmailSent = true;
    } else {
      console.error('❌ Error sending gamified email:', welcomeEmailResult.error);
    }
  } catch (emailError) {
    console.error('❌ Customer email error:', emailError.message);
  }

  // 2. Send tradesman notification directly (no API call needed)
  let tradesmanNotified = false;
  console.log('📧 Starting tradesman email process...');
  try {
    console.log('📧 Importing nodemailer for tradesman email...');
    const nodemailer = await import('nodemailer');
    console.log('📧 Creating transporter for tradesman email...');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: 'danbricks18@gmail.com',
        pass: 'ptmcojqgthvjbqom'
      }
    });

    // Get current URL for quote links
    const currentUrl = process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000';
    console.log('📧 Current URL for quote link:', currentUrl);
    
    // Use leadId for the quote link
    const quoteLink = `${currentUrl}/quote-form.html?leadId=${leadId}`;
    console.log('📧 Quote link generated:', quoteLink);

    console.log('📧 Creating tradesman email options...');
    const tradesmanMailOptions = {
      from: 'Kiwi Trade <danbricks18@gmail.com>',
      to: 'quangbui0600@gmail.com',
      subject: 'New Lead - Underfloor Heating Project',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">New Lead Received</h2>
          <p>A new lead has been submitted for underfloor heating services.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #34495e; margin-top: 0;">Lead Details:</h3>
            <p><strong>Customer:</strong> ${leadData.customerName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${leadData.customerEmail || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${leadData.customerPhone || 'Not provided'}</p>
            <p><strong>Location:</strong> ${leadData.location || 'Not provided'}</p>
            <p><strong>Project:</strong> ${leadData.projectDetails || 'Not provided'}</p>
            <p><strong>Size/Scope:</strong> ${leadData.projectSize || 'Not provided'}</p>
            <p><strong>Budget:</strong> ${leadData.budget || 'Not specified'}</p>
            <p><strong>Timeline:</strong> ${leadData.timeline || 'Not specified'}</p>
            ${leadData.specificDetails ? `<p><strong>Specific Requirements:</strong> ${leadData.specificDetails}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteLink}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Submit Quote</a>
          </div>
          
          <p><strong>Lead ID:</strong> ${leadId}</p>
        </div>
      `
    };

    console.log('📧 Sending tradesman email...');
    console.log('📧 Email options:', {
      from: tradesmanMailOptions.from,
      to: tradesmanMailOptions.to,
      subject: tradesmanMailOptions.subject
    });
    
    await transporter.sendMail(tradesmanMailOptions);
    console.log('✅ Tradesman notification email sent successfully');
    tradesmanNotified = true;
  } catch (emailError) {
    console.error('❌ Tradesman email error:', emailError.message);
    console.error('❌ Tradesman email error stack:', emailError.stack);
  }

  // 3. Send admin notification email
  let adminNotified = false;
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: 'danbricks18@gmail.com',
        pass: 'ptmcojqgthvjbqom'
      }
    });

    const adminMailOptions = {
      from: 'Kiwi Trade <danbricks18@gmail.com>',
      to: 'danbricks18@gmail.com',
      subject: '🎯 New Lead Captured - Admin Dashboard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🎯 New Lead Captured!</h1>
            <p>Hello Admin, a new lead has been submitted through the chatbot system.</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2>📊 Lead Management Journey</h2>
            <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); height: 100%; width: 25%; transition: width 0.3s ease;"></div>
            </div>
            <p><strong>Step 1 of 4 completed</strong></p>
            
            <div style="margin: 20px 0;">
              <h3>✅ Lead Management Checklist</h3>
              
              <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                <div>
                  <strong>Lead Captured</strong>
                  <p style="margin: 5px 0 0 0;">New lead details have been captured and stored in the system.</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc;">○</div>
                <div>
                  <strong>Tradesman Assignment</strong>
                  <p style="margin: 5px 0 0 0;">Lead will be assigned to qualified tradesmen for quote preparation.</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc;">○</div>
                <div>
                  <strong>Quote Generated</strong>
                  <p style="margin: 5px 0 0 0;">Tradesman will generate and send quote to customer.</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc;">○</div>
                <div>
                  <strong>Project Won/Lost</strong>
                  <p style="margin: 5px 0 0 0;">Customer will make decision on quote and project status.</p>
                </div>
              </div>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4>📋 Lead Details</h4>
              <p><strong>Customer:</strong> ${leadData.customerName || 'Not provided'}</p>
              <p><strong>Email:</strong> ${leadData.customerEmail || 'Not provided'}</p>
              <p><strong>Phone:</strong> ${leadData.customerPhone || 'Not provided'}</p>
              <p><strong>Location:</strong> ${leadData.location || 'Not provided'}</p>
              <p><strong>Service:</strong> ${leadData.selectedService || 'Not specified'}</p>
              <p><strong>Project:</strong> ${leadData.projectDetails || 'Not specified'}</p>
              <p><strong>Size/Scope:</strong> ${leadData.projectSize || 'Not specified'}</p>
              <p><strong>Budget:</strong> ${leadData.budget || 'Not specified'}</p>
              <p><strong>Timeline:</strong> ${leadData.timeline || 'Not specified'}</p>
              ${leadData.specificDetails ? `<p><strong>Specific Details:</strong> ${leadData.specificDetails}</p>` : ''}
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4>🎯 Admin Actions</h4>
              <p><strong>This lead has been automatically processed and notifications sent to:</strong></p>
              <ul>
                <li>✅ Customer confirmation email</li>
                <li>✅ Tradesman notification emails</li>
                <li>✅ Google Sheets updated (if configured)</li>
              </ul>
              <p style="margin-top: 15px;"><em>No immediate action required - the system is handling the lead automatically.</em></p>
            </div>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(adminMailOptions);
    console.log('✅ Admin notification email sent successfully');
    adminNotified = true;
  } catch (emailError) {
    console.error('❌ Admin email error:', emailError.message);
  }

  // 4. Save to Google Sheets (if configured)
  let sheetsUpdated = false;
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

    if (!serviceAccountEmail || !privateKey || !process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_PRIVATE_KEY_ID || !process.env.GOOGLE_CLIENT_ID) {
      console.log('⚠️ Google Sheets credentials not found in environment variables');
      console.log('📝 Required variables: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY_ID, GOOGLE_CLIENT_ID');
      console.log('📝 Skipping Google Sheets update - emails still sent successfully');
    } else {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: serviceAccountEmail,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      
      // Get available sheets to find the correct one to use
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });
      
      const availableSheets = metadata.data.sheets.map(s => s.properties.title);
      console.log('📋 Available sheets:', availableSheets);
      
      // Find the correct sheet to use (prefer 'Zone', fallback to 'Leads', then 'Sheet1', then first sheet)
      let targetSheet = 'Sheet1'; // Default fallback
      if (availableSheets.includes('Zone')) {
        targetSheet = 'Zone';
      } else if (availableSheets.includes('Leads')) {
        targetSheet = 'Leads';
      } else if (availableSheets.includes('Sheet1')) {
        targetSheet = 'Sheet1';
      } else if (availableSheets.length > 0) {
        targetSheet = availableSheets[0];
      }
      
      console.log('🎯 Using sheet for lead data:', targetSheet, '(preferred: Zone)');
      const range = `${targetSheet}!A:Z`;
      
      const values = [
        [
          timestamp, // Timestamp - when chatbot responses completed
          leadId, // Lead ID - unique identifier for tracking
          leadData.customerName || '', // Customer Name
          leadData.customerEmail || '', // Customer Email
          leadData.customerPhone || '', // Customer Phone
          leadData.selectedService || '', // Service type
          leadData.projectDetails || '', // Project details
          leadData.projectSize || '', // Project size
          leadData.budget || '', // Budget
          leadData.timeline || '', // Timeline
          leadData.location || '', // Location
          leadData.specificDetails || '', // Specific details
          customerEmailSent ? 'Sent' : 'Failed',
          tradesmanNotified ? 'Sent' : 'Failed',
          'New'
        ]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });

      console.log('✅ Lead data saved to Google Sheets');
      sheetsUpdated = true;
    }
  } catch (sheetsError) {
    console.error('❌ Google Sheets error:', sheetsError.message);
  }

  return {
    success: true,
    message: 'Lead processed successfully',
    details: {
      customerEmailSent,
      tradesmanNotified,
      adminNotified,
      sheetsUpdated,
      leadId: leadId,
      timestamp: timestamp
    }
  };
} 