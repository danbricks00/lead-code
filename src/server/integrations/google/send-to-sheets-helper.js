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
    
    const quoteLink = `${currentUrl}/src/web/pages/quote-form.html?leadId=${leadId}`;

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

  // 3. Save to Google Sheets (if configured)
  let sheetsUpdated = false;
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

    if (!serviceAccountEmail || !privateKey) {
      console.log('⚠️ Google Sheets credentials not found in environment variables');
      console.log('📝 Skipping Google Sheets update - emails still sent successfully');
    } else {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: serviceAccountEmail,
          private_key: privateKey.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const range = 'Leads!A:Z';

      const values = [
        [
          new Date().toISOString(),
          leadData.customerName || '',
          leadData.customerEmail || '',
          leadData.customerPhone || '',
          leadData.selectedService || '',
          leadData.projectDetails || '',
          leadData.projectSize || '',
          leadData.location || '',
          leadData.budget || '',
          leadData.timeline || '',
          leadData.specificDetails || '',
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
      sheetsUpdated,
      leadId: `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  };
} 