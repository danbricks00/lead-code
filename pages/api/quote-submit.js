import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { upsertQuoteRow } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { getLeadById } from '../../utils/sheets.js';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.BASE_URL || 'http://localhost:3000';

const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

export default async function handler(req, res) {
  try {
    const { quoteId, leadId, isDraft = false } = req.body;
    console.log(`[DEBUG] quote-submit: Received quoteId=${quoteId}, leadId=${leadId}, isDraft=${isDraft}`);

    if (!quoteId || !leadId) {
      return res.status(400).json({ error: 'Missing quoteId or leadId' });
    }

    if (!isDraft) {
      const requiredFields = ['customerEmail', 'customerName', 'serviceType', 'subtotal', 'totalQuote'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Cannot submit final quote: missing required fields: ${missingFields.join(', ')}`
        });
      }
    }

    const sheets = await getSheetsClient();
    const lead = await getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    let totalSqm = 0;
    if (req.body.rooms && Array.isArray(req.body.rooms)) {
      totalSqm = req.body.rooms.reduce((acc, room) => {
        const width = parseFloat(room.width) || 0;
        const length = parseFloat(room.length) || 0;
        return acc + width * length;
      }, 0);
    }

    if (totalSqm === 0 && req.body.totalSqm) {
      totalSqm = parseFloat(req.body.totalSqm) || 0;
    }

    // This is the authoritative data for this submission, combining lead info and form data.
    const quoteDataForSubmission = {
      ...lead,
      ...req.body,
      quoteId: quoteId,
      leadId: leadId,
      totalSqm: totalSqm.toFixed(2),
      // Ensure tradesperson details from the form are included
      tradePersonName: req.body.tradePersonName,
      tradePersonEmail: req.body.tradePersonEmail,
      tradePersonPhone: req.body.tradePersonPhone,
      // Ensure totals are formatted
      labourTotal: (parseFloat(req.body.labourTotal) || 0).toFixed(2),
      materialsTotal: (parseFloat(req.body.materialsTotal) || 0).toFixed(2),
      travelTotal: (parseFloat(req.body.travelTotal) || 0).toFixed(2),
      subtotal: (parseFloat(req.body.subtotal) || 0).toFixed(2),
      gst: (parseFloat(req.body.gst) || 0).toFixed(2),
      totalQuote: (parseFloat(req.body.totalQuote) || 0).toFixed(2),
    };

    console.log('Constructed quoteDataForSubmission:', quoteDataForSubmission);

    const quoteRow = buildQuoteRow({
      lead: lead,
      quoteId: quoteId,
      body: quoteDataForSubmission,
      mode: isDraft ? 'draft' : 'submitted',
    });

    // Always update the sheet for final submissions to persist the latest data.
    await upsertQuoteRow(quoteId, quoteRow, { req, caller: 'quote-submit-update' });

    if (isDraft) {
      console.log(`✅ Quote saved as draft: ${quoteId}`);
      return res.status(200).json({ success: true, message: 'Quote saved as draft' });
    }

    // For final submissions, generate PDF and send emails using the authoritative data.
    const pdfBuffer = await generateQuotePDF(quoteDataForSubmission);

    const { 
        customerEmail, customerName, serviceType, totalQuote,
        labourTotal, materialsTotal, travelTotal, installationCost, 
        subtotal, gst, tradePersonName, tradePersonEmail, tradePersonPhone 
    } = quoteDataForSubmission;

    const acceptLink  = `${normalizedBaseUrl}/api/customer-accept?quoteId=${quoteId}`;
    const declineLink = `${normalizedBaseUrl}/api/customer-decline?quoteId=${quoteId}`;
    const viewLink    = `${normalizedBaseUrl}/quote/view/${quoteId}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    // --- Customer Email ---
    const customerHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Your Kiwi Trade Quote</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; }
          .header { background-color: #0275d8; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .total-row td { font-weight: bold; border-top: 2px solid #000; }
          .tradesperson { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          .buttons { text-align: center; margin: 25px 0; }
          .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 0 10px; }
          .accept { background-color: #28a745; color: white; }
          .decline { background-color: #dc3545; color: white; }
          .view { background-color: #0275d8; color: white; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Kiwi Trade Quote #${quoteId}</h1></div>
        <div class="content">
          <h2>Dear ${customerName},</h2>
          <p>Thank you for choosing Kiwi Trade. Here is your quote for the ${serviceType} project:</p>
          <table>
            <tr><th>Item</th><th style="text-align: right;">Amount</th></tr>
            <tr><td>Labour</td><td style="text-align: right;">$${labourTotal || '0.00'}</td></tr>
            <tr><td>Materials</td><td style="text-align: right;">$${materialsTotal || '0.00'}</td></tr>
            <tr><td>Travel</td><td style="text-align: right;">$${travelTotal || '0.00'}</td></tr>
            <tr><td>Installation</td><td style="text-align: right;">$${installationCost || '0.00'}</td></tr>
            <tr><td style="font-weight: bold;">Subtotal</td><td style="text-align: right; font-weight: bold;">$${subtotal || '0.00'}</td></tr>
            <tr><td>GST (15%)</td><td style="text-align: right;">$${gst || '0.00'}</td></tr>
            <tr class="total-row"><td style="font-size: 16px;">TOTAL</td><td style="text-align: right; font-size: 16px;">$${totalQuote || '0.00'}</td></tr>
          </table>
          <div class="tradesperson">
            <h3>Your Tradesperson:</h3>
            <p><strong>Name:</strong> ${tradePersonName || 'N/A'}<br><strong>Email:</strong> ${tradePersonEmail || 'N/A'}<br><strong>Phone:</strong> ${tradePersonPhone || 'N/A'}</p>
          </div>
          <div class="buttons">
            <a href="${viewLink}" class="button view">View Quote Details</a>
            <a href="${acceptLink}" class="button accept">Accept Quote</a>
            <a href="${declineLink}" class="button decline">Decline Quote</a>
          </div>
          <p>A detailed PDF of your quote is attached.</p>
        </div>
      </body>
      </html>`;

    await transporter.sendMail({
      from: `"Kiwi Trade" <${GMAIL_USER}>`,
      to: customerEmail,
      subject: `📄 Your Kiwi Trade Quote #${quoteId} - ${serviceType}`,
      html: customerHtmlContent,
      attachments: [{
        filename: `KiwiTrade_Quote_${quoteId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    console.log(`✅ Quote email sent to customer: ${customerEmail}`);

    // --- Internal Team Email ---
    const internalHtmlContent = `
      <!DOCTYPE html><html><head><title>Internal - New Quote Sent</title></head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h1>Internal Notification: Quote #${quoteId} Sent</h1>
          <p>The following quote has been sent to ${customerName} for the ${serviceType} project:</p>
          <p><strong>The quote has been sent to the customer and we are now awaiting their decision. An email will be sent if the quote is accepted. Please follow up accordingly.</strong></p>
          <p><strong>Total:</strong> $${totalQuote}</p>
          <a href="${viewLink}">View Quote Details Online</a>
        </div>
      </body></html>`;

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const internalRecipients = [tradePersonEmail, adminEmail].filter(Boolean);

    if (internalRecipients.length > 0) {
      await transporter.sendMail({
        from: `"Kiwi Trade" <${GMAIL_USER}>`,
        to: internalRecipients.join(','),
        subject: `[Internal] Quote #${quoteId} Sent to ${customerName}`,
        html: internalHtmlContent,
        attachments: [{
          filename: `KiwiTrade_Quote_${quoteId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });
      console.log(`✅ Internal notification sent to: ${internalRecipients.join(', ')}`);
    }
    
    return res.status(200).json({ success: true, message: 'Quote sent to customer' });

  } catch (err) {
    console.error("[Quote Submit Error]", err);
    return res.status(500).json({ error: 'Internal error submitting quote' });
  }
}