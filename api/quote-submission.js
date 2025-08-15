import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePdfBuffer } from './quote-pdf.js';

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

    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let adminEmailSent = false;
    let sheetsUpdated = false;

    // Generate PDF and prepare links
    const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = req.body.token || ''; // whichever you already pass/validate

    // Build PDF buffer for attachment
    let pdfBuffer = null;
    let onlineQuoteUrl = '';
    let acceptUrl = '';
    let declineUrl = '';
    let attachments = [];

    try {
      // Try to generate PDF
      try {
        // Pass the actual quote data to the PDF generator
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
          budget: budget,
          timeline: timeline,
          specificDetails: specificDetails,
          quoteAmount: quoteAmount,
          labourRate: req.body.labourRate || '',
          labourHours: req.body.labourHours || '',
          labourSubtotal: req.body.labourSubtotal || '',
          materialRate: req.body.materialRate || '',
          materialSQM: req.body.materialSQM || '',
          materialSubtotal: req.body.materialSubtotal || '',
          installationAmount: req.body.installationAmount || '',
          installationSubtotal: req.body.installationSubtotal || '',
          breakdown: breakdown,
          notes: notes,
          status: 'Pending',
          onlineQuoteUrl: onlineQuoteUrl,
          acceptUrl: acceptUrl,
          declineUrl: declineUrl
        };
        
        pdfBuffer = await generateQuotePdfBuffer({ leadId, token, quoteId, quoteData });
        console.log('✅ PDF generated successfully with quote data');
      } catch (e) {
        console.error('PDF generation failed: ', e);
        pdfBuffer = null;
      }

      // Compute links - use the actual domain, not Vercel's internal URLs
      const origin = SITE_URL || `https://${req.headers.host}`;
      console.log('🌐 Origin URL:', origin);
      console.log('🔗 Headers:', {
        host: req.headers.host,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host']
      });
      
      onlineQuoteUrl = `${origin}/quote.html?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`;
      acceptUrl = `${origin}/api/quote-decision?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}&action=accept`;
      declineUrl = `${origin}/api/quote-decision?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}&action=decline`;
      
      console.log('🔗 Generated URLs:', {
        onlineQuoteUrl,
        acceptUrl,
        declineUrl
      });

          // Attachments array
    attachments = pdfBuffer ? [{
      filename: `quote-${quoteId}.html`,
      content: pdfBuffer,
      contentType: 'text/html'
    }] : [];
    } catch (e) {
      console.error('Error in PDF/link generation: ', e);
      // Continue without PDF and links
      pdfBuffer = null;
      attachments = [];
    }

    // 1. Send customer email with quote
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

                        // Email HTML (customer) — professional, with a real button (anchor styled as button)
                  const customerHtml = `
                    <div style="font-family: Arial, sans-serif; color:#1f2937;">
                      <h2>Your Quote from Kiwi Trade</h2>
                      <p>Hi ${customerName || ''},</p>
                      <p>Thank you for your interest in our services. Your professional quote is attached as an HTML document.</p>
                      <h3 style="background:#f3f4f6;padding:10px;border-radius:6px;">Quote Summary</h3>
                      <p><strong>Service:</strong> ${serviceType || 'Underfloor Heating'}</p>
                      <p><strong>Location:</strong> ${location || ''}</p>
                      <p><strong>Quote Amount:</strong> $${Number(quoteAmount || 0).toFixed(2)}</p>
                      <p><strong>Breakdown:</strong> Labour: $${Number(req.body.labourSubtotal||0).toFixed(2)}, Materials: $${Number(req.body.materialSubtotal||0).toFixed(2)}, Installation: $${Number(req.body.installationSubtotal||0).toFixed(2)}</p>
                      <p style="margin-top:16px;">You can view and respond online here:</p>
                      <p>
                        <a href="${onlineQuoteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Quote Online</a>
                      </p>
                      <p style="margin-top:10px;">
                        <a href="${acceptUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:10px;">Accept Quote</a>
                        <a href="${declineUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:8px 14px;border-radius:6px;text-decoration:none;">Decline Quote</a>
                      </p>
                      <p style="margin-top:16px;color:#6b7280;">This quote was generated automatically by our system.</p>
                    </div>
                  `;

      const customerMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: customerEmail,
        subject: `Your Quote from Kiwi Trade - ${quoteId}`,
        html: customerHtml,
        attachments
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
        subject: `Quote Submitted - ${customerName} - $${Number(quoteAmount || 0).toFixed(2)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Quote Submitted Successfully</h2>
            <p>Hi ${tradesmanName},</p>
            <p>Your quote has been submitted and sent to the customer. A copy of the quote is attached for your records.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Customer Email:</strong> ${customerEmail}</p>
              <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
              <p><strong>Service:</strong> ${serviceType}</p>
              <p><strong>Location:</strong> ${location || 'Not provided'}</p>
              <p><strong>Quote Amount:</strong> $${Number(quoteAmount || 0).toFixed(2)}</p>
              <p><strong>Breakdown:</strong> Labour: $${Number(req.body.labourSubtotal||0).toFixed(2)}, Materials: $${Number(req.body.materialSubtotal||0).toFixed(2)}, Installation: $${Number(req.body.installationSubtotal||0).toFixed(2)}</p>
              <p><strong>Lead ID:</strong> ${leadId}</p>
              <p><strong>Quote ID:</strong> ${quoteId}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h4 style="color: #155724; margin-top: 0;">Customer Actions:</h4>
              <p>The customer can view and respond to your quote online:</p>
              <p><a href="${onlineQuoteUrl}" style="color: #2563eb;">View Quote Online</a></p>
              <p><a href="${acceptUrl}" style="color: #16a34a;">Customer Accept Link</a></p>
              <p><a href="${declineUrl}" style="color: #dc2626;">Customer Decline Link</a></p>
            </div>
            
            <p><strong>Notes:</strong> ${notes || 'No additional notes'}</p>
            <p>Best regards,<br>The Kiwi Trade Team</p>
          </div>
        `,
        attachments
      };

      console.log('📧 Sending tradesman email to:', tradesmanEmail);
      await transporter.sendMail(tradesmanMailOptions);
      console.log('✅ Tradesman confirmation email sent successfully with quote attachment');
      tradesmanEmailSent = true;
    } catch (emailError) {
      console.error('❌ Tradesman email error:', emailError.message);
    }

    // 3. Save quote data to Google Sheets
    try {
      console.log('📊 Starting Google Sheets save process...');
      const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

      console.log('🔑 Credentials check:', {
        hasServiceAccountEmail: !!serviceAccountEmail,
        hasPrivateKey: !!privateKey,
        hasSpreadsheetId: !!spreadsheetId,
        spreadsheetId: spreadsheetId
      });

      if (serviceAccountEmail && privateKey && spreadsheetId) {
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
        console.log('📋 Available sheets in spreadsheet:', availableSheets);
        
        // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
        let targetSheet = 'Sheet1'; // Default fallback
        if (availableSheets.includes('Quotes')) {
          targetSheet = 'Quotes';
        } else if (availableSheets.includes('Sheet1')) {
          targetSheet = 'Sheet1';
        } else if (availableSheets.length > 0) {
          targetSheet = availableSheets[0];
        }
        
        console.log('📝 Target sheet selected:', targetSheet);

        // Prepare quote data for Google Sheets
        const quoteData = [
          [
            new Date().toISOString(), // Timestamp
            quoteId, // Quote ID
            leadId, // Lead ID
            customerName, // Customer Name
            customerEmail, // Customer Email
            customerPhone, // Customer Phone
            tradesmanName, // Tradesman Name
            tradesmanEmail, // Tradesman Email
            tradesmanPhone, // Tradesman Phone
            serviceType, // Service Type
            projectDetails, // Project Details
            projectSize, // Project Size
            location, // Location
            budget, // Budget
            timeline, // Timeline
            specificDetails, // Specific Details
            quoteAmount, // Quote Amount
            req.body.labourRate || '', // Labour Rate
            req.body.labourHours || '', // Labour Hours
            req.body.labourSubtotal || '', // Labour Subtotal
            req.body.materialRate || '', // Material Rate
            req.body.materialSQM || '', // Material SQM
            req.body.materialSubtotal || '', // Material Subtotal
            req.body.installationAmount || '', // Installation Amount
            req.body.installationSubtotal || '', // Installation Subtotal
            breakdown, // Breakdown
            notes || '', // Notes
            'Pending', // Status
            onlineQuoteUrl, // Online Quote URL
            acceptUrl, // Accept URL
            declineUrl // Decline URL
          ]
        ];
        
        console.log('📊 Quote data for Google Sheets:', {
          quoteId,
          leadId,
          customerName,
          quoteAmount,
          targetSheet,
          dataLength: quoteData[0].length,
          onlineQuoteUrl
        });
        
        console.log('📊 Quote data prepared:', {
          quoteId,
          leadId,
          customerName,
          quoteAmount,
          targetSheet,
          dataLength: quoteData[0].length
        });

        // Append quote data to the sheet
        await sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId,
          range: `${targetSheet}!A:Z`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: { values: quoteData }
        });

        console.log('✅ Quote data saved to Google Sheets');
        sheetsUpdated = true;
      }
    } catch (sheetsError) {
      console.error('❌ Google Sheets error:', sheetsError.message);
    }

    // 4. Send admin notification email
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // Send admin email (you may already have this)
      const adminMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com',
        subject: `New Quote Submitted - ${quoteId}`,
        html: `
          <h2>New Quote Submitted</h2>
          <p>A new quote has been submitted by ${tradesmanName || 'Unknown'}.</p>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Amount:</strong> $${Number(quoteAmount || 0).toFixed(2)}</p>
          <p><a href="${onlineQuoteUrl}">Open Online Quote</a></p>
        `,
        attachments
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
          new Date().toISOString(), // Timestamp
          quoteId, // Quote ID
          leadId, // Lead ID
          customerName, // Customer Name
          customerEmail, // Customer Email
          customerPhone, // Customer Phone
          tradesmanName, // Tradesman Name
          tradesmanEmail, // Tradesman Email
          tradesmanPhone, // Tradesman Phone
          serviceType, // Service Type
          projectDetails, // Project Details
          projectSize, // Project Size
          location, // Location
          budget, // Budget
          timeline, // Timeline
          specificDetails, // Specific Details
          quoteAmount, // Quote Amount
          req.body.labourRate || '', // Labour Rate
          req.body.labourHours || '', // Labour Hours
          req.body.labourSubtotal || '', // Labour Subtotal
          req.body.materialRate || '', // Material Rate
          req.body.materialSQM || '', // Material SQM
          req.body.materialSubtotal || '', // Material Subtotal
          req.body.installationAmount || '', // Installation Amount
          req.body.installationSubtotal || '', // Installation Subtotal
          breakdown, // Breakdown
          notes || '', // Notes
          'Pending', // Status
          onlineQuoteUrl, // Online Quote URL
          acceptUrl, // Accept URL
          declineUrl // Decline URL
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
        quoteId: quoteId
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
