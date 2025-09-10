import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { upsertQuoteRow } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { getLeadById } from '../../utils/sheets.js';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
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
        
        // Get lead details to create a new row
        const lead = await getLeadById(leadId);
        if (!lead) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Create a new quote row
        const mode = isDraft ? 'draft' : 'submitted';
        const quoteRow = buildQuoteRow({
          lead,
          quoteId,
          tradePersonName: req.body.tradespersonName,
          tradePersonEmail: req.body.tradespersonEmail,
          tradePersonPhone: req.body.tradespersonPhone,
          body: req.body,
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
    const quoteData = {};
    headers.forEach((header, index) => {
      if (index < row.length) {
        quoteData[header] = row[index];
      }
    });

    // Make sure quoteId is properly set
    quoteData.quoteId = quoteId;
    
    // Additional validation before PDF generation
    if (!quoteData.CustomerEmail || !quoteData.TotalQuote) {
      return res.status(400).json({ 
        error: 'Cannot submit final quote: missing required customer or total fields.' 
      });
    }

    // Now pass the properly formatted quoteData object
    const pdfBuffer = await generateQuotePDF(quoteData);

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

    const acceptLink  = `${normalizedBaseUrl}/api/customer-accept?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}`;
    const declineLink = `${normalizedBaseUrl}/api/customer-decline?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}`;
    const viewLink    = `${normalizedBaseUrl}/quote-view?quoteId=${encodeURIComponent(quoteId)}&leadId=${encodeURIComponent(leadId)}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    // Extract all needed values before creating the HTML content
    const labourTotal      = row[headers.indexOf('LabourTotal')] || '0';
    const materialsTotal   = row[headers.indexOf('MaterialsTotal')] || '0';
    const travelTotal      = row[headers.indexOf('TravelTotal')] || '0';
    const installationCost = row[headers.indexOf('InstallationCost')] || '0';
    const subtotal         = row[headers.indexOf('Subtotal')] || '0';
    const gst              = row[headers.indexOf('GST')] || '0';

    // Create HTML content as a separate variable
    const htmlContent = `
      <h2>Dear ${customerName},</h2>
      <p>Thank you for choosing Kiwi Trade. Below is a summary of your quote:</p>
      
      <table style="width:100%; border-collapse:collapse; font-family:sans-serif;">
        <tr><td style="padding:6px; border-bottom:1px solid #ddd;">Labour</td>
            <td style="padding:6px; border-bottom:1px solid #ddd; text-align:right;">$${labourTotal}</td></tr>
        <tr><td style="padding:6px; border-bottom:1px solid #ddd;">Materials</td>
            <td style="padding:6px; border-bottom:1px solid #ddd; text-align:right;">$${materialsTotal}</td></tr>
        <tr><td style="padding:6px; border-bottom:1px solid #ddd;">Travel</td>
            <td style="padding:6px; border-bottom:1px solid #ddd; text-align:right;">$${travelTotal}</td></tr>
        <tr><td style="padding:6px; border-bottom:1px solid #ddd;">Installation</td>
            <td style="padding:6px; border-bottom:1px solid #ddd; text-align:right;">$${installationCost}</td></tr>
        <tr><td style="padding:6px; border-top:2px solid #000; font-weight:bold;">Subtotal</td>
            <td style="padding:6px; border-top:2px solid #000; text-align:right; font-weight:bold;">$${subtotal}</td></tr>
        <tr><td style="padding:6px;">GST (15%)</td>
            <td style="padding:6px; text-align:right;">$${gst}</td></tr>
        <tr><td style="padding:6px; font-size:16px; font-weight:bold; border-top:2px solid #000;">TOTAL</td>
            <td style="padding:6px; font-size:16px; font-weight:bold; text-align:right; border-top:2px solid #000;">$${totalQuote}</td></tr>
      </table>

      <p>You can now respond to this quote:</p>
      <p>
        <a href="${acceptLink}" style="background:#28a745;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">✅ Accept Quote</a>
        <a href="${declineLink}" style="background:#dc3545;color:white;padding:10px 20px;text-decoration:none;border-radius:4px; margin-left:10px;">❌ Decline Quote</a>
      </p>
      <p>Or <a href="${viewLink}">View Quote Online</a></p>
      <p>A detailed PDF is also attached.</p>
    `;

    // Now send the email with the HTML content
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

    console.log(`✅ Customer email with PDF sent to ${customerEmail}`);
    return res.status(200).json({ success: true, message: 'Quote sent to customer' });

  } catch (err) {
    console.error("[Quote Submit Error]", err);
    return res.status(500).json({ error: 'Internal error submitting quote' });
  }
}