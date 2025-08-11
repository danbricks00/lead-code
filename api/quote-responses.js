import { getQuoteById, updateQuoteStatus } from './quote-database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleQuoteResponse(req, res);
      case 'POST':
        return await handleQuoteResponsePost(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Quote response error:', error);
    res.status(500).json({
      success: false,
      error: 'Quote response processing failed',
      details: error.message
    });
  }
}

async function handleQuoteResponse(req, res) {
  try {
    const { action, quoteId, tradesmanEmail } = req.query;
    console.log('📝 Processing quote response:', { action, quoteId, tradesmanEmail });

    if (!action || !quoteId) {
      return res.status(400).json({
        success: false,
        error: 'Action and quote ID are required'
      });
    }

    // Get quote details
    const quote = await getQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    // Check if quote is still valid
    const now = new Date();
    const expiryDate = new Date(quote.expiryDate);
    if (expiryDate < now) {
      return res.status(400).json({
        success: false,
        error: 'Quote has expired'
      });
    }

    let newStatus = '';
    let responseMessage = '';

    switch (action) {
      case 'accept':
        if (tradesmanEmail) {
          // Tradesman accepting
          newStatus = 'tradesman_accepted';
          responseMessage = `Tradesman ${tradesmanEmail} accepted the quote`;
        } else {
          // Customer accepting
          newStatus = 'customer_accepted';
          responseMessage = 'Customer accepted the quote';
        }
        break;
      
      case 'decline':
        if (tradesmanEmail) {
          // Tradesman declining
          newStatus = 'tradesman_declined';
          responseMessage = `Tradesman ${tradesmanEmail} declined the quote`;
        } else {
          // Customer declining
          newStatus = 'customer_declined';
          responseMessage = 'Customer declined the quote';
        }
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action specified'
        });
    }

    // Update quote status
    const updatedQuote = await updateQuoteStatus(quoteId, newStatus, responseMessage);

    if (updatedQuote) {
      console.log('✅ Quote response processed:', { quoteId, action, newStatus });

      // Send notification emails based on the response
      await sendResponseNotifications(quote, action, tradesmanEmail);

      // If customer accepted, calculate and track commission
      if (action === 'accept' && !tradesmanEmail) {
        await trackCommission(quote);
        
        // Update all other quotes for the same job to "Job Awarded to Another Tradesman"
        await updateRelatedQuotes(quote);
      }

      // Return success page
      return res.status(200).send(generateResponsePage(action, quote, tradesmanEmail));
    } else {
      console.log('❌ Failed to update quote status');
      return res.status(500).json({
        success: false,
        error: 'Failed to process quote response'
      });
    }

  } catch (error) {
    console.error('❌ Handle quote response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process quote response',
      details: error.message
    });
  }
}

async function handleQuoteResponsePost(req, res) {
  try {
    const { action, quoteId, tradesmanEmail, response } = req.body;
    console.log('📝 Processing quote response POST:', { action, quoteId, tradesmanEmail });

    if (!action || !quoteId) {
      return res.status(400).json({
        success: false,
        error: 'Action and quote ID are required'
      });
    }

    // Get quote details
    const quote = await getQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    let newStatus = '';
    let responseMessage = response || '';

    switch (action) {
      case 'accept':
        if (tradesmanEmail) {
          newStatus = 'tradesman_accepted';
          responseMessage = responseMessage || `Tradesman ${tradesmanEmail} accepted the quote`;
        } else {
          newStatus = 'customer_accepted';
          responseMessage = responseMessage || 'Customer accepted the quote';
        }
        break;
      
      case 'decline':
        if (tradesmanEmail) {
          newStatus = 'tradesman_declined';
          responseMessage = responseMessage || `Tradesman ${tradesmanEmail} declined the quote`;
        } else {
          newStatus = 'customer_declined';
          responseMessage = responseMessage || 'Customer declined the quote';
        }
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action specified'
        });
    }

    // Update quote status
    const updatedQuote = await updateQuoteStatus(quoteId, newStatus, responseMessage);

    if (updatedQuote) {
      console.log('✅ Quote response processed via POST:', { quoteId, action, newStatus });

      // Send notification emails
      await sendResponseNotifications(quote, action, tradesmanEmail);

      return res.json({
        success: true,
        message: 'Quote response processed successfully',
        quote: updatedQuote
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to process quote response'
      });
    }

  } catch (error) {
    console.error('❌ Handle quote response POST error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process quote response',
      details: error.message
    });
  }
}

async function sendResponseNotifications(quote, action, tradesmanEmail) {
  try {
    // Check if email credentials are available
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured - skipping notifications');
      return;
    }

    // Import nodemailer
    let nodemailer;
    try {
      const module = await import('nodemailer');
      nodemailer = module.default;
    } catch (importError) {
      try {
        nodemailer = require('nodemailer');
      } catch (requireError) {
        console.log('❌ Cannot import Nodemailer - skipping notifications');
        return;
      }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const fromDisplay = process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`;
    const replyTo = process.env.MAIL_REPLY_TO || process.env.GMAIL_USER;

    if (tradesmanEmail) {
      // Tradesman responded - notify customer
      const customerSubject = action === 'accept' 
        ? `Great News! Your ${quote.serviceType} Quote Has Been Accepted`
        : `Update on Your ${quote.serviceType} Quote`;

      const customerMessage = action === 'accept'
        ? `Great news! A tradesman has accepted your quote for ${quote.serviceType}. They will contact you soon to arrange the work.`
        : `Unfortunately, the assigned tradesman has declined your quote for ${quote.serviceType}. We'll find another qualified tradesman for you.`;

      const customerMailOptions = {
        from: fromDisplay,
        replyTo,
        to: quote.customerEmail,
        subject: customerSubject,
        html: generateNotificationEmail(quote, action, 'customer', customerMessage)
      };

      await transporter.sendMail(customerMailOptions);
      console.log('✅ Customer notification sent');

    } else {
      // Customer responded - notify tradesman if assigned
      if (quote.assignedTradesman) {
        const tradesmanSubject = action === 'accept'
          ? `Customer Accepted Your Quote - ${quote.serviceType}`
          : `Customer Declined Your Quote - ${quote.serviceType}`;

        const tradesmanMessage = action === 'accept'
          ? `The customer has accepted your quote for ${quote.serviceType}. Please contact them to arrange the work.`
          : `The customer has declined your quote for ${quote.serviceType}.`;

        const tradesmanMailOptions = {
          from: fromDisplay,
          replyTo,
          to: quote.assignedTradesman,
          subject: tradesmanSubject,
          html: generateNotificationEmail(quote, action, 'tradesman', tradesmanMessage)
        };

        await transporter.sendMail(tradesmanMailOptions);
        console.log('✅ Tradesman notification sent');
      }

      // Also notify admin
      const adminMailOptions = {
        from: fromDisplay,
        replyTo,
        to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
        subject: `Quote ${action === 'accept' ? 'Accepted' : 'Declined'} - ${quote.serviceType}`,
        html: generateNotificationEmail(quote, action, 'admin', `Customer ${action}ed quote for ${quote.serviceType}`)
      };

      await transporter.sendMail(adminMailOptions);
      console.log('✅ Admin notification sent');
    }

  } catch (error) {
    console.error('❌ Send response notifications error:', error);
  }
}

function generateResponsePage(action, quote, tradesmanEmail) {
  const isAccepted = action === 'accept';
  const isTradesman = !!tradesmanEmail;
  const title = isAccepted ? 'Quote Accepted!' : 'Quote Response Received';
  const message = isTradesman
    ? isAccepted
      ? `Thank you for accepting the ${quote.serviceType} project. We'll notify the customer and they will contact you soon.`
      : `Thank you for your response. We'll find another tradesman for this ${quote.serviceType} project.`
    : isAccepted
      ? `Thank you for accepting your ${quote.serviceType} quote! A tradesman will contact you soon to arrange the work.`
      : `Thank you for your response. If you have any questions or would like to discuss the quote, please contact us.`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 50px auto; 
          padding: 40px; 
          background: white; 
          border-radius: 10px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          text-align: center; 
        }
        .icon { 
          font-size: 64px; 
          margin-bottom: 20px; 
        }
        .success { color: #27ae60; }
        .info { color: #3498db; }
        .title { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 20px; 
          color: #2c3e50; 
        }
        .message { 
          font-size: 16px; 
          margin-bottom: 30px; 
          color: #555; 
        }
        .quote-details { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 5px; 
          margin: 20px 0; 
          text-align: left; 
        }
        .contact { 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 1px solid #eee; 
          color: #7f8c8d; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon ${isAccepted ? 'success' : 'info'}">
          ${isAccepted ? '✅' : '📋'}
        </div>
        
        <div class="title">${title}</div>
        
        <div class="message">${message}</div>
        
        <div class="quote-details">
          <h3>Quote Details</h3>
          <p><strong>Quote ID:</strong> ${quote.quoteId}</p>
          <p><strong>Service:</strong> ${quote.serviceType}</p>
          <p><strong>Customer:</strong> ${quote.customerName}</p>
          <p><strong>Amount:</strong> $${quote.quoteAmount}</p>
        </div>
        
        <div class="contact">
          <p>If you have any questions, please contact us at:</p>
          <p><strong>${process.env.MAIL_REPLY_TO || process.env.GMAIL_USER}</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateNotificationEmail(quote, action, recipient, message) {
  const isAccepted = action === 'accept';
  const formattedAmount = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(quote.quoteAmount);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Update</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isAccepted ? '#27ae60' : '#e74c3c'}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .quote-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount { font-size: 20px; font-weight: bold; color: #27ae60; }
        .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quote ${isAccepted ? 'Accepted' : 'Response Received'}</h1>
          <p>Quote #${quote.quoteId}</p>
        </div>
        
        <div class="content">
          <p>${message}</p>
          
          <div class="quote-details">
            <h3>Quote Summary</h3>
            <p><strong>Service:</strong> ${quote.serviceType}</p>
            <p><strong>Customer:</strong> ${quote.customerName}</p>
            <p><strong>Customer Email:</strong> ${quote.customerEmail}</p>
            <p><strong>Project Details:</strong> ${quote.projectDetails}</p>
            <p><strong>Quote Amount:</strong> <span class="amount">${formattedAmount}</span></p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          ${isAccepted 
            ? '<p>Please contact the customer to arrange the work and discuss project details.</p>'
            : '<p>We\'ll work to find an alternative solution or tradesman for this project.</p>'
          }
        </div>
        
        <div class="footer">
          <p>If you have any questions, please contact us at ${process.env.MAIL_REPLY_TO || process.env.GMAIL_USER}</p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 

async function trackCommission(quote) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.log('⚠️ Google Sheets credentials not configured - skipping commission tracking');
      return;
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Calculate commission (10% of total)
    const commissionRate = 0.10;
    const commissionAmount = parseFloat(quote.quoteAmount || quote.total || 0) * commissionRate;
    const responseDate = new Date().toISOString();

    // Find and update the quote row in the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Quotes!A:V',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No quotes found in spreadsheet');
      return;
    }

    // Find the quote by ID (assuming quoteId is in column B)
    let quoteRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][1] === quote.quoteId) { // Column B (index 1) contains quoteId
        quoteRowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (quoteRowIndex === -1) {
      console.log('❌ Quote not found in spreadsheet for commission tracking');
      return;
    }

    // Update the quote row with acceptance and commission data
    const updateRange = `Quotes!T${quoteRowIndex}:V${quoteRowIndex}`; // Columns T, U, V
    const updateValues = [
      ['accepted', responseDate, commissionAmount.toFixed(2)]
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'RAW',
      resource: { values: updateValues }
    });

    console.log('✅ Commission tracked successfully:', {
      quoteId: quote.quoteId,
      commissionAmount: commissionAmount.toFixed(2)
    });

    // Send commission notification to admin
    await sendCommissionNotification(quote, commissionAmount);

  } catch (error) {
    console.error('❌ Error tracking commission:', error.message);
  }
}

async function sendCommissionNotification(quote, commissionAmount) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured - skipping commission notification');
      return;
    }

    let nodemailer;
    try {
      const module = await import('nodemailer');
      nodemailer = module.default;
    } catch (importError) {
      try {
        nodemailer = require('nodemailer');
      } catch (requireError) {
        console.log('❌ Cannot import Nodemailer - skipping commission notification');
        return;
      }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">💰 Commission Earned!</h2>
        <p>Great news! A quote has been accepted and commission has been earned.</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Commission Details</h3>
          <p><strong>Quote ID:</strong> ${quote.quoteId}</p>
          <p><strong>Customer:</strong> ${quote.customerName}</p>
          <p><strong>Service:</strong> ${quote.serviceType}</p>
          <p><strong>Quote Amount:</strong> $${quote.quoteAmount || quote.total}</p>
          <p><strong>Commission Earned:</strong> $${commissionAmount.toFixed(2)}</p>
          <p><strong>Commission Rate:</strong> 10%</p>
          <p><strong>Date Earned:</strong> ${new Date().toLocaleDateString('en-NZ')}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Next Steps</h3>
          <p>• Commission has been automatically tracked in the system</p>
          <p>• You can view all commissions in your admin dashboard</p>
          <p>• The tradesman will be notified to proceed with the work</p>
        </div>

        <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Underfloor Heating System</strong></p>
      </div>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    const mailOptions = {
      from: process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `💰 Commission Earned - $${commissionAmount.toFixed(2)} - Quote ${quote.quoteId}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Commission notification sent to admin');

  } catch (error) {
    console.error('❌ Error sending commission notification:', error.message);
  }
}

async function updateRelatedQuotes(acceptedQuote) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.log('⚠️ Google Sheets credentials not configured - skipping related quotes update');
      return;
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get all quotes from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Quotes!A:V',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No quotes found in spreadsheet');
      return;
    }

    // Find all quotes for the same customer and service type (same job)
    const relatedQuotes = [];
    for (let i = 1; i < rows.length; i++) { // Skip header row
      const row = rows[i];
      const quoteId = row[1]; // Column B
      const customerEmail = row[4]; // Column E
      const serviceType = row[7]; // Column H
      const status = row[18]; // Column S
      
      // Skip the accepted quote and already processed quotes
      if (quoteId === acceptedQuote.quoteId || 
          status === 'customer_accepted' || 
          status === 'job_awarded_to_another') {
        continue;
      }
      
      // Check if it's the same job (same customer email and service type)
      if (customerEmail === acceptedQuote.customerEmail && 
          serviceType === acceptedQuote.serviceType) {
        relatedQuotes.push({
          rowIndex: i + 1, // +1 because sheets are 1-indexed
          quoteId: quoteId,
          tradesmanEmail: row[10] // Column K
        });
      }
    }

    if (relatedQuotes.length === 0) {
      console.log('✅ No related quotes found to update');
      return;
    }

    console.log(`📝 Found ${relatedQuotes.length} related quotes to update`);

    // Update each related quote
    for (const quote of relatedQuotes) {
      const updateRange = `Quotes!S${quote.rowIndex}:U${quote.rowIndex}`; // Columns S, T, U
      const updateValues = [
        ['job_awarded_to_another', new Date().toISOString(), `Job awarded to another tradesman - Quote ${acceptedQuote.quoteId} was accepted`]
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'RAW',
        resource: { values: updateValues }
      });

      console.log(`✅ Updated quote ${quote.quoteId} to "Job Awarded to Another Tradesman"`);
    }

    // Send notifications to other tradesmen
    await sendJobAwardedNotifications(relatedQuotes, acceptedQuote);

  } catch (error) {
    console.error('❌ Error updating related quotes:', error.message);
  }
}

async function sendJobAwardedNotifications(relatedQuotes, acceptedQuote) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured - skipping job awarded notifications');
      return;
    }

    let nodemailer;
    try {
      const module = await import('nodemailer');
      nodemailer = module.default;
    } catch (importError) {
      try {
        nodemailer = require('nodemailer');
      } catch (requireError) {
        console.log('❌ Cannot import Nodemailer - skipping job awarded notifications');
        return;
      }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const fromDisplay = process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`;

    // Send notification to each tradesman whose quote wasn't selected
    for (const quote of relatedQuotes) {
      if (quote.tradesmanEmail) {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">📋 Job Update - Quote Status</h2>
            <p>Hello,</p>
            <p>We wanted to let you know that the customer has selected another tradesman for the ${acceptedQuote.serviceType} project.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Project Details</h3>
              <p><strong>Customer:</strong> ${acceptedQuote.customerName}</p>
              <p><strong>Service Type:</strong> ${acceptedQuote.serviceType}</p>
              <p><strong>Your Quote ID:</strong> ${quote.quoteId}</p>
              <p><strong>Status:</strong> Job Awarded to Another Tradesman</p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">What This Means</h3>
              <p>• Your quote is no longer under consideration for this project</p>
              <p>• The customer has chosen to proceed with another tradesman</p>
              <p>• You can view this update in your dashboard</p>
              <p>• We'll continue to send you new opportunities that match your services</p>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Keep in Touch</h3>
              <p>Thank you for your interest in this project. We appreciate your time and will continue to send you relevant opportunities.</p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>

            <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Underfloor Heating Team</strong></p>
          </div>
        `;

        const mailOptions = {
          from: fromDisplay,
          to: quote.tradesmanEmail,
          subject: `Job Update - ${acceptedQuote.serviceType} Project - Quote ${quote.quoteId}`,
          html: emailContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Job awarded notification sent to ${quote.tradesmanEmail}`);
      }
    }

  } catch (error) {
    console.error('❌ Error sending job awarded notifications:', error.message);
  }
} 