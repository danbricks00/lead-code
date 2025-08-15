import { google } from 'googleapis';

export async function sendToSheets(leadData) {
  console.log('🔍 sendToSheets function called');
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
      from: 'Kiwi Trade <danbricks18@gmail.com>',
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
          
          <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade</strong></p>
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
      'http://localhost:3000';
    
          const quoteLink = `${currentUrl}/quote-form.html?leadId=${leadId}`;

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

    await transporter.sendMail(tradesmanMailOptions);
    console.log('✅ Tradesman notification email sent successfully');
    tradesmanNotified = true;
  } catch (emailError) {
    console.error('❌ Tradesman email error:', emailError.message);
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
      subject: 'New Lead captured',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">New Lead Captured from Chatbot</h2>
          <p>A new lead has been submitted through the chatbot system.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #34495e; margin-top: 0;">Lead Details:</h3>
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
          
          <p><em>This lead was automatically captured from the chatbot system.</em></p>
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
      
      // Find the correct sheet to use (prefer 'Leads', fallback to 'Sheet1', then first sheet)
      let targetSheet = 'Sheet1'; // Default fallback
      if (availableSheets.includes('Leads')) {
        targetSheet = 'Leads';
      } else if (availableSheets.includes('Sheet1')) {
        targetSheet = 'Sheet1';
      } else if (availableSheets.length > 0) {
        targetSheet = availableSheets[0];
      }
      
      console.log('🎯 Using sheet for lead data:', targetSheet);
      const range = `${targetSheet}!A:Z`;

      // Create timestamp when chatbot responses are completed
      const timestamp = new Date().toISOString();
      console.log('📅 Chatbot completion timestamp:', timestamp);
      
      const values = [
        [
          timestamp, // lead (timestamp) - when chatbot responses completed
          leadData.customerName || '', // Customer Name
          leadData.customerEmail || '', // Customer Email
          leadData.customerPhone || '', // Customer Phone
          leadData.selectedService || '', // Service type
          leadData.projectDetails || '', // Project details
          leadData.projectSize || '', // Project size
          leadData.budget || '', // Budget
          leadData.timeline || '', // Timelione (Timeline)
          leadData.location || '', // Location
          leadData.specificDetails || '', // Specifc details
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
      leadId: `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: timestamp
    }
  };
} 