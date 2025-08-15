import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      leadId,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      projectDetails,
      projectSize,
      location,
      budget,
      timeline,
      specificDetails,
      quoteAmount,
      breakdown,
      notes
    } = req.body;

    console.log('📋 Quote submission received:', {
      leadId,
      tradesmanName,
      customerName,
      serviceType,
      quoteAmount
    });

    // Validate required fields
    if (!leadId || !tradesmanName || !tradesmanEmail || !customerName || !customerEmail || !quoteAmount) {
      return res.status(400).json({
        error: 'Missing required fields: leadId, tradesmanName, tradesmanEmail, customerName, customerEmail, quoteAmount'
      });
    }

    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let adminEmailSent = false;
    let sheetsUpdated = false;

    // 1. Send customer email with quote
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      const customerMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: customerEmail,
        subject: `Quote for ${serviceType} - ${customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Your Quote from Kiwi Trade</h2>
            <p>Hi ${customerName},</p>
            <p>Thank you for your interest in our services. Here is your quote:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Project:</strong> ${projectDetails || 'Not specified'}</p>
              <p><strong>Location:</strong> ${location || 'Not specified'}</p>
              <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
              ${breakdown ? `<p><strong>Breakdown:</strong> ${breakdown}</p>` : ''}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept Quote</a>
              <a href="#" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Decline Quote</a>
            </div>
            
            <p><strong>Tradesman:</strong> ${tradesmanName}</p>
            <p><strong>Phone:</strong> ${tradesmanPhone || 'Contact via email'}</p>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Kiwi Trade Team</p>
          </div>
        `
      };

      await transporter.sendMail(customerMailOptions);
      console.log('✅ Customer quote email sent successfully');
      customerEmailSent = true;
    } catch (emailError) {
      console.error('❌ Customer email error:', emailError.message);
    }

    // 2. Send tradesman confirmation email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      const tradesmanMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: tradesmanEmail,
        subject: 'Quote Submitted Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Quote Submitted Successfully</h2>
            <p>Hi ${tradesmanName},</p>
            <p>Your quote has been submitted and sent to the customer.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
              <p><strong>Lead ID:</strong> ${leadId}</p>
            </div>
            
            <p>The customer will receive an email with your quote and can accept or decline it.</p>
            <p>Best regards,<br>The Kiwi Trade Team</p>
          </div>
        `
      };

      await transporter.sendMail(tradesmanMailOptions);
      console.log('✅ Tradesman confirmation email sent successfully');
      tradesmanEmailSent = true;
    } catch (emailError) {
      console.error('❌ Tradesman email error:', emailError.message);
    }

    // 3. Send admin notification email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      const adminMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com',
        subject: 'New Quote Submitted',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Quote Submitted</h2>
            <p>A new quote has been submitted by a tradesman.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
              <p><strong>Tradesman:</strong> ${tradesmanName} (${tradesmanEmail})</p>
              <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Quote Amount:</strong> $${quoteAmount}</p>
              <p><strong>Lead ID:</strong> ${leadId}</p>
              ${breakdown ? `<p><strong>Breakdown:</strong> ${breakdown}</p>` : ''}
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            <p><em>This quote was automatically generated from the quote submission system.</em></p>
          </div>
        `
      };

      await transporter.sendMail(adminMailOptions);
      console.log('✅ Admin notification email sent successfully');
      adminEmailSent = true;
    } catch (emailError) {
      console.error('❌ Admin email error:', emailError.message);
    }

    // 4. Save quote to Google Sheets
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

      // Get available sheets to find the correct one to use
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
      });
      
      const availableSheets = metadata.data.sheets.map(s => s.properties.title);
      console.log('📋 Available sheets:', availableSheets);
      
      // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
      let targetSheet = 'Sheet1'; // Default fallback
      if (availableSheets.includes('Quotes')) {
        targetSheet = 'Quotes';
      } else if (availableSheets.includes('Sheet1')) {
        targetSheet = 'Sheet1';
      } else if (availableSheets.length > 0) {
        targetSheet = availableSheets[0];
      }
      
      console.log('🎯 Using sheet for quote data:', targetSheet);
      const range = `${targetSheet}!A:Z`;

      const values = [
        [
          new Date().toISOString(),
          leadId,
          tradesmanName,
          tradesmanEmail,
          tradesmanPhone,
          customerName,
          customerEmail,
          customerPhone,
          serviceType,
          projectDetails,
          projectSize,
          location,
          budget,
          timeline,
          specificDetails,
          quoteAmount,
          breakdown,
          notes,
          customerEmailSent ? 'Sent' : 'Failed',
          tradesmanEmailSent ? 'Sent' : 'Failed',
          adminEmailSent ? 'Sent' : 'Failed',
          'Submitted'
        ]
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });

      console.log('✅ Quote data saved to Google Sheets');
      sheetsUpdated = true;
    } catch (sheetsError) {
      console.error('❌ Google Sheets error:', sheetsError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Quote submitted successfully',
      details: {
        customerEmailSent,
        tradesmanEmailSent,
        adminEmailSent,
        sheetsUpdated,
        quoteId: `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    });

  } catch (error) {
    console.error('❌ Quote submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit quote',
      details: error.message
    });
  }
}
