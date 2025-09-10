import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePDF } from '../../lib/pdfGenerator';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
// Fix this line to use the correct environment variable name
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.BASE_URL || 'http://localhost:3000';

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
    const { quoteId, leadId } = req.body;
    if (!quoteId || !leadId) {
      return res.status(400).json({ error: 'Missing quoteId or leadId' });
    }

    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Quotes!A:AZ',
    });

    const rows = response.data.values;
    const headers = rows[0];
    const row = rows.find(r =>
      r[headers.indexOf('QuoteID')] === quoteId &&
      r[headers.indexOf('LeadID')] === leadId
    );

    if (!row) {
      return res.status(404).json({ error: 'Quote not found in spreadsheet' });
    }

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(row, headers);

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