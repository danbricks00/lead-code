import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { upsertQuoteRow } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { getLeadById } from '../../utils/sheets.js';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
// Fix this line to use the correct environment variable name
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.BASE_URL || 'http://localhost:3000';

// Normalize base URL to ensure it doesn't have trailing slash
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

// Sheets auth
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      // Update this line to use the correct variable name
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

    // If this is a final submission (not draft), validate required fields
    if (!isDraft) {
      const requiredFields = ['customerEmail', 'customerName', 'serviceType', 'subtotal', 'totalQuote'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Cannot submit final quote: missing required fields: ${missingFields.join(', ')}`
        });
      }
    }

    const sheets = await getSheetsClient();

    // Fetch lead data first, as it's always needed
    const lead = await getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Quotes!A:AZ',
    });

    const rows = response.data.values;
    const headers = rows[0];
    
    console.log(`[DEBUG] quote-submit: Looking for row with QuoteID=${quoteId} and LeadID=${leadId}`);
    console.log(`[DEBUG] quote-submit: Found ${rows.length} total rows in spreadsheet`);
    
    let row = rows.find(r =>
      r[headers.indexOf('QuoteID')] === quoteId &&
      r[headers.indexOf('LeadID')] === leadId
    );

    // Find the row by just quoteId if both don't match
    if (!row) {
      console.log(`[DEBUG] quote-submit: Trying to find row with just QuoteID=${quoteId}`);
      row = rows.find(r => r[headers.indexOf('QuoteID')] === quoteId);
      
      if (!row) {
        console.log(`[DEBUG] quote-submit: Quote not found in spreadsheet. QuoteID=${quoteId}`);
        
        // Get lead details to create a new row is already done above
        
        // Create a new quote row
        const mode = isDraft ? 'draft' : 'submitted';
        
        // Calculate line totals
        const labourRate = parseFloat(req.body.labourRate) || 0;
        const labourHours = parseFloat(req.body.labourHours) || 0;
        const labourTotal = labourRate * labourHours;
        
        const materialsCost = parseFloat(req.body.materialsCost) || 0;
        const materialsQty = parseFloat(req.body.materialsQuantity) || 1;
        const materialsTotal = materialsCost * materialsQty;
        
        const travelCost = parseFloat(req.body.travelCost) || 0;
        const travelDistance = parseFloat(req.body.travelDistance) || 0;
        const travelTotal = travelCost * travelDistance;
        
        const installationCost = parseFloat(req.body.installationCost) || 0;
        
        // Calculate subtotal, GST, and total
        const subtotal = labourTotal + materialsTotal + travelTotal + installationCost;
        const gst = subtotal * 0.15; // 15% GST
        const totalQuote = subtotal + gst;
        
        // Create quote row with calculated values
        const quoteRow = buildQuoteRow({
          lead,
          quoteId,
          tradePersonName: req.body.tradespersonName,
          tradePersonEmail: req.body.tradespersonEmail,
          tradePersonPhone: req.body.tradespersonPhone,
          body: {
            ...req.body,
            labourTotal: labourTotal.toFixed(2),
            materialsTotal: materialsTotal.toFixed(2),
            travelTotal: travelTotal.toFixed(2),
            subtotal: subtotal.toFixed(2),
            gst: gst.toFixed(2),
            totalQuote: totalQuote.toFixed(2)
          },
          mode
        });
        
        // Insert the row
        await upsertQuoteRow(quoteId, quoteRow, { req, caller: 'quote-submit' });
        
        // Re-fetch the row
        const updatedResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Quotes!A:AZ'
        });
        
        const updatedRows = updatedResponse.data.values || [];
        const updatedHeaders = updatedRows[0];
        row = updatedRows.find(r => r[updatedHeaders.indexOf('QuoteID')] === quoteId);
        
        if (!row) {
          return res.status(500).json({ error: 'Failed to create quote row' });
        }
      }
    }

    // If this is a draft submission, just save to spreadsheet and return
    if (isDraft) {
      // Update the row with draft status
      const rowIndex = rows.findIndex(r => r[headers.indexOf('QuoteID')] === quoteId) + 1;
      
      if (rowIndex > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Quotes!A${rowIndex}:AZ${rowIndex}`,
          valueInputOption: 'RAW',
          resource: {
            values: [row.map((val, idx) => {
              if (headers[idx] === 'TradePersonStatus') return 'Draft';
              if (headers[idx] === 'CustomerStatus') return 'Pending';
              return val;
            })]
          }
        });
      }
      
      console.log(`✅ Quote saved as draft: ${quoteId}`);
      return res.status(200).json({ success: true, message: 'Quote saved as draft' });
    }

    // For final submissions, continue with PDF generation and email
    // Create a proper quoteData object from row and headers
    const quoteDataFromSheet = {};
    headers.forEach((header, index) => {
      if (index < row.length) {
        quoteDataFromSheet[header] = row[index];
      }
    });

    // Combine lead data and quote data for the PDF
    const quoteDataForPdf = { ...lead, ...quoteDataFromSheet, quoteId: quoteId };

    // Additional validation before PDF generation
    if (!quoteDataForPdf.CustomerEmail || !quoteDataForPdf.TotalQuote) {
      return res.status(400).json({ 
        error: 'Cannot submit final quote: missing required customer or total fields.' 
      });
    }

    // Now pass the properly formatted quoteData object
    const pdfBuffer = await generateQuotePDF(quoteDataForPdf);

    // ⚠️ --- Old Admin Approval Email --- ⚠️
    /*
    const adminEmail = process.env.ADMIN_EMAIL;
    await transporter.sendMail({
      to: adminEmail,
      subject: `New Quote Requires Approval`,
      html: `<p>A new quote has been submitted and requires admin approval.</p>`,
      attachments: [
        { filename: `Quote_${quoteId}.pdf`, content: pdfBuffer }
      ]
    });
    */

    // --- New Phase 1: Send directly to Customer ---
    const customerEmail = row[headers.indexOf('CustomerEmail')];
    const customerName  = row[headers.indexOf('CustomerName')] || "Customer";
    const serviceType   = row[headers.indexOf('ServiceType')] || "Service";
    const totalQuote    = row[headers.indexOf('TotalQuote')] || "0";
    
    // Fix the links to use the correct format
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://lead-code-phi.vercel.app';
    const acceptLink  = `${baseUrl}/api/customer-accept?quoteId=${quoteId}`;
    const declineLink = `${baseUrl}/api/customer-decline?quoteId=${quoteId}`;
    const viewLink    = `${baseUrl}/quote/view/${quoteId}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    // Extract all needed values before creating the HTML content
    const labourTotal      = row[headers.indexOf('LabourTotal')] || '0';
    const materialsTotal   = row[headers.indexOf('MaterialsTotal')] || '0';
    const travelTotal      = row[headers.indexOf('TravelTotal')] || '0';
    const installationCost = row[headers.indexOf('InstallationCost')] || '0';
    const subtotal         = row[headers.indexOf('Subtotal')] || '0';
    const gst              = row[headers.indexOf('GST')] || '0';
    
    // Get tradesperson details
    const tradePersonName = row[headers.indexOf('TradePersonName')] || 'Your Tradesperson';
    const tradePersonEmail = row[headers.indexOf('TradePersonEmail')] || '';
    const tradePersonPhone = row[headers.indexOf('TradePersonPhone')] || '';
    
    // Create HTML content as a separate variable
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Kiwi Trade Quote</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0275d8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
          .quote-summary { margin-top: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .total-row td { font-weight: bold; border-top: 2px solid #000; border-bottom: none; }
          .tradesperson { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .buttons { text-align: center; margin: 25px 0; }
          .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 0 10px; }
          .accept { background-color: #28a745; color: white; }
          .decline { background-color: #dc3545; color: white; }
          .view { background-color: #0275d8; color: white; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kiwi Trade Quote</h1>
          <p>Quote #${quoteId}</p>
        </div>
        
        <div class="content">
          <h2>Dear ${customerName},</h2>
          <p>Thank you for choosing Kiwi Trade. We're pleased to provide you with the following quote for your ${serviceType} project:</p>
          
          <div class="quote-summary">
            <table>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              <tr>
                <td>Labour</td>
                <td style="text-align: right;">$${labourTotal}</td>
              </tr>
              <tr>
                <td>Materials</td>
                <td style="text-align: right;">$${materialsTotal}</td>
              </tr>
              <tr>
                <td>Travel</td>
                <td style="text-align: right;">$${travelTotal}</td>
              </tr>
              <tr>
                <td>Installation</td>
                <td style="text-align: right;">$${installationCost}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Subtotal</td>
                <td style="text-align: right; font-weight: bold;">$${subtotal}</td>
              </tr>
              <tr>
                <td>GST (15%)</td>
                <td style="text-align: right;">$${gst}</td>
              </tr>
              <tr class="total-row">
                <td style="font-size: 16px;">TOTAL</td>
                <td style="text-align: right; font-size: 16px;">$${totalQuote}</td>
              </tr>
            </table>
          </div>

          <div class="tradesperson">
            <h3>Your Tradesperson:</h3>
            <p>
              <strong>Name:</strong> ${tradePersonName}<br>
              <strong>Email:</strong> ${tradePersonEmail}<br>
              <strong>Phone:</strong> ${tradePersonPhone}
            </p>
          </div>

          <p>Please review this quote and let us know your decision:</p>
          
          <div class="buttons">
            <a href="${viewLink}" class="button view">View Quote Details</a>
            <a href="${acceptLink}" class="button accept">Accept Quote</a>
            <a href="${declineLink}" class="button decline">Decline Quote</a>
          </div>
          
          <p>A detailed PDF of your quote is attached to this email for your records.</p>
          
          <p>If you have any questions or need further information, please don't hesitate to contact your tradesperson directly or reply to this email.</p>
          
          <p>Thank you for your business!</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kiwi Trade. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // --- Customer Email ---
    await transporter.sendMail({
      from: `"Kiwi Trade" <${GMAIL_USER}>`,
      to: customerEmail,
      subject: `📄 Your Kiwi Trade Quote #${quoteId} - ${serviceType}`,
      html: htmlContent,
      attachments: [
        {
          filename: `KiwiTrade_Quote_${quoteId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    console.log(`✅ Quote email sent to customer: ${customerEmail}`);

    // --- Internal Team Email (Admin and Tradesperson) ---
    const internalHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Internal - New Quote Sent</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0275d8; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
          .quote-summary { margin-top: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .total-row td { font-weight: bold; border-top: 2px solid #000; border-bottom: none; }
          .notification { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #0275d8; }
          .buttons { text-align: center; margin: 25px 0; }
          .button { display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 0 10px; }
          .view { background-color: #0275d8; color: white; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Internal Notification</h1>
          <p>Quote #${quoteId} Sent to Customer</p>
        </div>
        
        <div class="content">
          <h2>Hello Team,</h2>
          <p>The following quote has been sent to ${customerName} for the ${serviceType} project:</p>

          <div class="notification">
            <p>The quote has been sent to the customer and we are now awaiting their decision. An email will be sent if the when a decison is made. Please follow up accordingly.</p>
          </div>
          
          <div class="quote-summary">
            <table>
              <tr>
                <th>Item</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              <tr>
                <td>Labour</td>
                <td style="text-align: right;">$${labourTotal}</td>
              </tr>
              <tr>
                <td>Materials</td>
                <td style="text-align: right;">$${materialsTotal}</td>
              </tr>
              <tr>
                <td>Travel</td>
                <td style="text-align: right;">$${travelTotal}</td>
              </tr>
              <tr>
                <td>Installation</td>
                <td style="text-align: right;">$${installationCost}</td>
              </tr>
              <tr>
                <td style="font-weight: bold;">Subtotal</td>
                <td style="text-align: right; font-weight: bold;">$${subtotal}</td>
              </tr>
              <tr>
                <td>GST (15%)</td>
                <td style="text-align: right;">$${gst}</td>
              </tr>
              <tr class="total-row">
                <td style="font-size: 16px;">TOTAL</td>
                <td style="text-align: right; font-size: 16px;">$${totalQuote}</td>
              </tr>
            </table>
          </div>

          <div class="buttons">
            <a href="${viewLink}" class="button view">View Quote Details</a>
          </div>
          
          <p>A detailed PDF of the quote is attached for your records.</p>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kiwi Trade. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const internalRecipients = [tradePersonEmail, adminEmail].filter(Boolean);

    if (internalRecipients.length > 0) {
      await transporter.sendMail({
        from: `"Kiwi Trade" <${GMAIL_USER}>`,
        to: internalRecipients.join(','),
        subject: `[Internal] Quote #${quoteId} Sent to ${customerName}`,
        html: internalHtmlContent,
        attachments: [
          {
            filename: `KiwiTrade_Quote_${quoteId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      console.log(`✅ Internal notification sent to: ${internalRecipients.join(', ')}`);
    }
    
    return res.status(200).json({ success: true, message: 'Quote sent to customer' });

  } catch (err) {
    console.error("[Quote Submit Error]", err);
    return res.status(500).json({ error: 'Internal error submitting quote' });
  }
}