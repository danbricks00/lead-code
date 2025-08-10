import { getQuoteById, updateQuoteStatus } from './quote-database.js';

export default async function handler(req, res) {
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

  const { type } = req.query;

  try {
    switch (type) {
      case 'customer':
        return await sendCustomerQuoteEmail(req, res);
      case 'tradesman':
        return await sendTradesmanQuoteEmail(req, res);
      default:
        return res.status(400).json({ error: 'Invalid email type specified' });
    }
  } catch (error) {
    console.error('❌ Quote email error:', error);
    res.status(500).json({
      success: false,
      error: 'Email sending failed',
      details: error.message
    });
  }
}

async function sendCustomerQuoteEmail(req, res) {
  try {
    const { quoteId, customMessage } = req.body;
    console.log('📧 Sending customer quote email for:', quoteId);

    if (!quoteId) {
      return res.status(400).json({
        success: false,
        error: 'Quote ID is required'
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

    // Check if email credentials are available
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured'
      });
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
        throw new Error('Cannot import Nodemailer');
      }
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Generate quote acceptance/rejection URLs
    const baseUrl = process.env.BASE_URL || 'https://your-domain.vercel.app';
    const acceptUrl = `${baseUrl}/api/quote-responses?action=accept&quoteId=${quoteId}`;
    const declineUrl = `${baseUrl}/api/quote-responses?action=decline&quoteId=${quoteId}`;

    // Create email content
    const emailContent = generateCustomerQuoteEmail(quote, acceptUrl, declineUrl, customMessage);

    // Send email
    const fromDisplay = process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`;
    const replyTo = process.env.MAIL_REPLY_TO || process.env.GMAIL_USER;

    const mailOptions = {
      from: fromDisplay,
      replyTo,
      to: quote.customerEmail,
      subject: `Your Quote for ${quote.serviceType} - Quote #${quote.quoteId}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Customer quote email sent successfully');

    // Update quote status to indicate email sent
    await updateQuoteStatus(quoteId, 'email_sent', 'Customer quote email sent');

    return res.json({
      success: true,
      message: 'Quote email sent to customer successfully',
      quoteId: quoteId,
      customerEmail: quote.customerEmail
    });

  } catch (error) {
    console.error('❌ Send customer quote email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send customer quote email',
      details: error.message
    });
  }
}

async function sendTradesmanQuoteEmail(req, res) {
  try {
    const { quoteId, tradesmanEmail, customMessage } = req.body;
    console.log('📧 Sending tradesman quote email for:', quoteId, 'to:', tradesmanEmail);

    if (!quoteId || !tradesmanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Quote ID and tradesman email are required'
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

    // Check if email credentials are available
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured'
      });
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
        throw new Error('Cannot import Nodemailer');
      }
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Generate quote acceptance/rejection URLs
    const baseUrl = process.env.BASE_URL || 'https://your-domain.vercel.app';
    const acceptUrl = `${baseUrl}/api/quote-responses?action=accept&quoteId=${quoteId}&tradesmanEmail=${encodeURIComponent(tradesmanEmail)}`;
    const declineUrl = `${baseUrl}/api/quote-responses?action=decline&quoteId=${quoteId}&tradesmanEmail=${encodeURIComponent(tradesmanEmail)}`;

    // Create email content
    const emailContent = generateTradesmanQuoteEmail(quote, acceptUrl, declineUrl, customMessage);

    // Send email
    const fromDisplay = process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`;
    const replyTo = process.env.MAIL_REPLY_TO || process.env.GMAIL_USER;

    const mailOptions = {
      from: fromDisplay,
      replyTo,
      to: tradesmanEmail,
      subject: `New Quote Assignment - ${quote.serviceType} for ${quote.customerName}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Tradesman quote email sent successfully');

    // Update quote status to indicate tradesman email sent
    await updateQuoteStatus(quoteId, 'tradesman_notified', `Tradesman email sent to ${tradesmanEmail}`);

    return res.json({
      success: true,
      message: 'Quote email sent to tradesman successfully',
      quoteId: quoteId,
      tradesmanEmail: tradesmanEmail
    });

  } catch (error) {
    console.error('❌ Send tradesman quote email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send tradesman quote email',
      details: error.message
    });
  }
}

function generateCustomerQuoteEmail(quote, acceptUrl, declineUrl, customMessage) {
  const formattedAmount = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(quote.quoteAmount);

  const expiryDate = new Date(quote.expiryDate).toLocaleDateString('en-NZ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Quote</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .quote-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .accept { background: #27ae60; color: white; }
        .decline { background: #e74c3c; color: white; }
        .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Quote</h1>
          <p>Quote #${quote.quoteId}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${quote.customerName},</h2>
          
          <p>Thank you for your interest in our ${quote.serviceType} services. We're pleased to provide you with a detailed quote for your project.</p>
          
          ${customMessage ? `<p><strong>Additional Notes:</strong> ${customMessage}</p>` : ''}
          
          <div class="quote-details">
            <h3>Quote Details</h3>
            <p><strong>Service:</strong> ${quote.serviceType}</p>
            <p><strong>Project Details:</strong> ${quote.projectDetails}</p>
            <p><strong>Quote Amount:</strong> <span class="amount">${formattedAmount}</span></p>
            <p><strong>Valid Until:</strong> ${expiryDate}</p>
          </div>
          
          <h3>What's Next?</h3>
          <p>Please review the quote details above. If you're happy with the terms, you can accept the quote by clicking the button below. If you have any questions or would like to discuss modifications, please don't hesitate to contact us.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" class="button accept">Accept Quote</a>
            <a href="${declineUrl}" class="button decline">Decline Quote</a>
          </div>
          
          <p><strong>Important:</strong> This quote is valid for 30 days from the date of issue. After this period, pricing may be subject to change.</p>
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

function generateTradesmanQuoteEmail(quote, acceptUrl, declineUrl, customMessage) {
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
      <title>New Quote Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .quote-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount { font-size: 24px; font-weight: bold; color: #27ae60; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .accept { background: #27ae60; color: white; }
        .decline { background: #e74c3c; color: white; }
        .footer { text-align: center; padding: 20px; color: #7f8c8d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Quote Assignment</h1>
          <p>Quote #${quote.quoteId}</p>
        </div>
        
        <div class="content">
          <h2>Hello,</h2>
          
          <p>A new quote has been assigned to you for a ${quote.serviceType} project. Please review the details below and let us know if you can take on this work.</p>
          
          ${customMessage ? `<p><strong>Additional Notes:</strong> ${customMessage}</p>` : ''}
          
          <div class="quote-details">
            <h3>Project Details</h3>
            <p><strong>Customer:</strong> ${quote.customerName}</p>
            <p><strong>Customer Email:</strong> ${quote.customerEmail}</p>
            <p><strong>Service:</strong> ${quote.serviceType}</p>
            <p><strong>Project Details:</strong> ${quote.projectDetails}</p>
            <p><strong>Quote Amount:</strong> <span class="amount">${formattedAmount}</span></p>
            <p><strong>Quote ID:</strong> ${quote.quoteId}</p>
          </div>
          
          <h3>Your Response</h3>
          <p>Please review this quote and let us know if you can accept this project. If you accept, we'll connect you with the customer to arrange the work.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" class="button accept">Accept Project</a>
            <a href="${declineUrl}" class="button decline">Decline Project</a>
          </div>
          
          <p><strong>Note:</strong> Please respond within 48 hours to ensure the customer receives timely service.</p>
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