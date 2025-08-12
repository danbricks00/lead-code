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
            <p>Dear ${leadData.customerName || 'there'},</p>
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

    // 2. Send tradesman notification (only if customer email was sent successfully)
    let tradesmanNotified = false;
    if (customerEmailSent) {
      try {
        const currentUrl = process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}` : 
          'https://lead-code.vercel.app';

        const notificationResponse = await fetch(`${currentUrl}/api/lead-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        });

        if (notificationResponse.ok) {
          const notificationResult = await notificationResponse.json();
          if (notificationResult.success) {
            console.log('✅ Tradesman notification sent successfully');
            tradesmanNotified = true;
          } else {
            console.error('❌ Tradesman notification failed:', notificationResult.error);
          }
        } else {
          console.error('❌ Tradesman notification API call failed:', notificationResponse.status);
        }
      } catch (notificationError) {
        console.error('❌ Tradesman notification error:', notificationError.message);
      }
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