import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePdfBuffer, coerceNumeric } from './quote-utils.js';

const SITE_URL = process.env.SITE_URL; // e.g. https://yourdomain.com

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

    // Check if this tradesman has already submitted a quote for this lead
    if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
      try {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Check the Quotes sheet for existing quotes from this tradesman for this lead
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: 'Quotes!A:T',
        });

        const rows = response.data.values || [];
        const existingQuote = rows.find(row => 
          row[1] === leadId && // leadId column
          row[4] === tradesmanEmail // tradesmanEmail column
        );

        if (existingQuote) {
          return res.status(400).json({
            error: 'You have already submitted a quote for this lead. Only one quote per tradesman per lead is allowed.'
          });
        }
      } catch (sheetsError) {
        console.error('❌ Google Sheets error checking existing quotes:', sheetsError.message);
        // Continue with submission if we can't check (fail open for reliability)
      }
    }

    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let adminEmailSent = false;
    let sheetsUpdated = false;

    // Generate PDF and prepare links
    const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = req.body.token || req.body.hmac || '';

    // Build PDF buffer for attachment
    let pdfBuffer = null;
    let onlineQuoteUrl = '';
    let acceptUrl = '';
    let declineUrl = '';
    let attachments = [];

    // Compute links first - use Vercel's default domain
    const origin = process.env.SITE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    console.log('🌐 Origin URL:', origin);
    console.log('🔗 Headers:', {
      host: req.headers.host,
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-forwarded-host': req.headers['x-forwarded-host']
    });
    
    // Generate URLs first
    onlineQuoteUrl = `${origin}/quote.html?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`;
    acceptUrl = `${origin}/api/quote-decision?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}&action=accept`;
    declineUrl = `${origin}/api/quote-decision?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}&action=decline`;
    
    console.log('🔗 Generated URLs:', {
      onlineQuoteUrl,
      acceptUrl,
      declineUrl
    });

    // Now create quoteData with the correct URLs and coerced numeric fields
    const quoteData = {
        timestamp: new Date().toISOString(),
        quoteId: quoteId,
        leadId: leadId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        tradesmanName: tradesmanName,
        tradesmanEmail: tradesmanEmail,
        tradesmanPhone: tradesmanPhone,
        serviceType: serviceType,
        projectDetails: projectDetails,
        projectSize: projectSize,
        location: location,
        budget: coerceNumeric(budget),
        timeline: timeline,
        specificDetails: specificDetails,
        quoteAmount: coerceNumeric(quoteAmount),
        labourRate: coerceNumeric(req.body.labourRate),
        labourHours: coerceNumeric(req.body.labourHours),
        labourSubtotal: coerceNumeric(req.body.labourSubtotal),
        materialRate: coerceNumeric(req.body.materialRate),
        materialSQM: coerceNumeric(req.body.materialSQM),
        materialSubtotal: coerceNumeric(req.body.materialSubtotal),
        installationAmount: coerceNumeric(req.body.installationAmount),
        installationSubtotal: coerceNumeric(req.body.installationSubtotal),
        breakdown: breakdown,
        notes: notes,
        validUntil: req.body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        onlineQuoteUrl: onlineQuoteUrl,
        acceptUrl: acceptUrl,
        declineUrl: declineUrl
      };

      console.log('📋 Quote data prepared:', {
        quoteId: quoteData.quoteId,
        leadId: quoteData.leadId,
        customerName: quoteData.customerName,
        quoteAmount: quoteData.quoteAmount,
        validUntil: quoteData.validUntil
      });

    try {
      // Generate PDF buffer using unified function
      pdfBuffer = await generateQuotePdfBuffer({
        leadId: leadId,
        token: token,
        quoteId: quoteId,
        quoteData: quoteData
      });

      console.log('✅ PDF buffer generated successfully');

      // Prepare attachment
      attachments = [{
        filename: `quote-${quoteId}.html`,
        content: pdfBuffer,
        contentType: 'text/html'
      }];

      // Save to Google Sheets
      try {
        const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
          console.log('⚠️ Google Sheets credentials not found');
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
          
          // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
          let targetSheet = 'Sheet1'; // Default fallback
          if (availableSheets.includes('Quotes')) {
            targetSheet = 'Quotes';
          } else if (availableSheets.includes('Sheet1')) {
            targetSheet = 'Sheet1';
          } else if (availableSheets.length > 0) {
            targetSheet = availableSheets[0];
          }

          // Prepare data for Google Sheets with all fields including Valid Until
          const values = [
            [
              quoteData.timestamp,
              quoteData.quoteId,
              quoteData.leadId,
              quoteData.customerName,
              quoteData.customerEmail,
              quoteData.customerPhone,
              quoteData.tradesmanName,
              quoteData.tradesmanEmail,
              quoteData.tradesmanPhone,
              quoteData.serviceType,
              quoteData.projectDetails,
              quoteData.projectSize,
              quoteData.location,
              quoteData.budget,
              quoteData.timeline,
              quoteData.specificDetails,
              quoteData.quoteAmount,
              quoteData.labourRate,
              quoteData.labourHours,
              quoteData.labourSubtotal,
              quoteData.materialRate,
              quoteData.materialSQM,
              quoteData.materialSubtotal,
              quoteData.installationAmount,
              quoteData.installationSubtotal,
              quoteData.breakdown,
              quoteData.notes,
              quoteData.validUntil,
              quoteData.status,
              quoteData.onlineQuoteUrl,
              quoteData.acceptUrl,
              quoteData.declineUrl
            ]
          ];

          console.log('📊 Saving quote data to Google Sheets:', {
            sheet: targetSheet,
            rowCount: values.length,
            columns: values[0].length
          });

          const response = await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: `${targetSheet}!A:AE`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
          });

          console.log('✅ Quote data saved to Google Sheets:', response.data);
          sheetsUpdated = true;
        }
      } catch (sheetsError) {
        console.error('❌ Google Sheets error:', sheetsError.message);
      }

    } catch (pdfError) {
      console.error('❌ PDF generation error:', pdfError.message);
    }

    // Extract validUntil for email templates (with fallback)
    const validUntil = quoteData?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Send emails
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // 1. Send customer email with quote attachment
      const customerSubject = `Your Quote is Ready - ${serviceType}`;
      const customerHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Your Quote is Ready!</h2>
          <p>Hi ${customerName},</p>
          <p>Thank you for your interest in our ${serviceType} services. We have prepared a detailed quote for your project.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Quote Summary</h3>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Location:</strong> ${location || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${coerceNumeric(quoteAmount).toFixed(2)}</p>
            <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString('en-GB')}</p>
          </div>
          
          <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
            <h3 style="margin-top:0;color:#065f46;">Next Steps</h3>
            <p style="color:#065f46;">You can:</p>
            <ul style="color:#065f46;">
              <li><a href="${onlineQuoteUrl}" style="color:#10b981;">View your quote online</a></li>
              <li><a href="${acceptUrl}" style="color:#10b981;">Accept this quote</a></li>
              <li><a href="${declineUrl}" style="color:#ef4444;">Decline this quote</a></li>
            </ul>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            If you have any questions about this quote, please don't hesitate to contact us at info@kiwitrade.co.nz
          </p>
          
          <p style="margin-top:20px;color:#6b7280;">
            Best regards,<br>
            The Kiwi Trade Team
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
        attachments: attachments
      });
      
      console.log('✅ Customer quote email sent successfully');
      customerEmailSent = true;

      // 2. Send tradesman confirmation email
      const tradesmanSubject = `Quote Submitted - ${customerName}`;
      const tradesmanHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Quote Successfully Submitted</h2>
          <p>Hi ${tradesmanName},</p>
          <p>Your quote has been successfully submitted and sent to the customer. Here are the details:</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Quote Details</h3>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Location:</strong> ${location || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${coerceNumeric(quoteAmount).toFixed(2)}</p>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Lead ID:</strong> ${leadId}</p>
          </div>
          
          <div style="background:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #f59e0b;">
            <h3 style="margin-top:0;color:#92400e;">Quote Breakdown</h3>
            <p style="color:#92400e;"><strong>Materials:</strong> $${coerceNumeric(req.body.materialSubtotal || 0).toFixed(2)}</p>
            <p style="color:#92400e;"><strong>Labor:</strong> $${coerceNumeric(req.body.labourSubtotal || 0).toFixed(2)}</p>
            <p style="color:#92400e;"><strong>Installation:</strong> $${coerceNumeric(req.body.installationSubtotal || 0).toFixed(2)}</p>
            <p style="color:#92400e;"><strong>Total:</strong> $${coerceNumeric(quoteAmount).toFixed(2)}</p>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            The customer has been notified and can view, accept, or decline the quote online.
          </p>
          
          <p style="margin-top:20px;color:#6b7280;">
            Best regards,<br>
            The Kiwi Trade Team
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: tradesmanEmail,
        subject: tradesmanSubject,
        html: tradesmanHtml,
        attachments: attachments
      });
      
      console.log('✅ Tradesman confirmation email sent successfully');
      tradesmanEmailSent = true;

      // 3. Send admin notification email
      const adminSubject = `New Quote Submitted - ${customerName} (${serviceType})`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>New Quote Submitted</h2>
          <p>A new quote has been submitted by a tradesman.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Quote Summary</h3>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Customer Email:</strong> ${customerEmail}</p>
            <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
            <p><strong>Tradesman:</strong> ${tradesmanName}</p>
            <p><strong>Tradesman Email:</strong> ${tradesmanEmail}</p>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Location:</strong> ${location || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${coerceNumeric(quoteAmount).toFixed(2)}</p>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString('en-GB')}</p>
          </div>
          
          <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
            <h3 style="margin-top:0;color:#065f46;">Actions</h3>
            <p style="color:#065f46;">
              <a href="${onlineQuoteUrl}" style="color:#10b981;">View quote online</a> | 
              <a href="${acceptUrl}" style="color:#10b981;">Accept quote</a> | 
              <a href="${declineUrl}" style="color:#ef4444;">Decline quote</a>
            </p>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            This is an automated notification from the Kiwi Trade system.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com', // Admin email
        subject: adminSubject,
        html: adminHtml,
        attachments: attachments
      });
      
      console.log('✅ Admin notification email sent successfully');
      adminEmailSent = true;

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Quote submitted successfully',
      quoteId: quoteId,
      summary: {
        customerEmailSent,
        tradesmanEmailSent,
        adminEmailSent,
        sheetsUpdated,
        quoteId: quoteId
      }
    });

  } catch (error) {
    console.error('❌ Quote submission error:', error);
    res.status(500).json({
      error: 'Failed to submit quote',
      details: error.message
    });
  }
}
