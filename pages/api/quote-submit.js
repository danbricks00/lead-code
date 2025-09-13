import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { upsertQuoteRow, getLeadById } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { safeParseRooms, sumRoomsSqm, toNum, computeLineTotals, generateLineItemsHtml } from '../../utils/quoteHelpers.js';

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
  if (process.env.STAGING === 'true') {
    console.log('quote-submit req.body:', req.body);
  }

  try {
    // --- 1. Normalize incoming data ---
    const body = req.body;
    const normalizedData = {
      ...body,
      quoteId: body.quoteId,
      leadId: body.leadId,
      isDraft: body.isDraft || false,
      // Normalize tradesperson fields
      TradePersonName: body.TradePersonName || body.TradePersonName || body.trade_name,
      tradePersonEmail: body.tradePersonEmail || body.tradespersonEmail || body.trade_email,
      tradePersonPhone: body.tradePersonPhone || body.tradespersonPhone || body.trade_phone,
      // Normalize and coerce numbers
      labourTotal: toNum(body.labourTotal),
      materialsTotal: toNum(body.materialsTotal),
      travelTotal: toNum(body.travelTotal),
      installationCost: toNum(body.installationCost),
      subtotal: toNum(body.subtotal),
      gst: toNum(body.gst),
      totalQuote: toNum(body.totalQuote),
    };

    const { quoteId, leadId, isDraft } = normalizedData;

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

    // --- 2. Parse rooms and compute totals ---
    const rooms = safeParseRooms(body.rooms);
    const { itemsWithTotals, grandTotal } = computeLineTotals(rooms);
    const totalSqmFromForm = toNum(body.totalSqm);
    const totalSqmFromRooms = sumRoomsSqm(rooms);
    const finalTotalSqm = totalSqmFromForm > 0 ? totalSqmFromForm : totalSqmFromRooms;

    if (process.env.STAGING === 'true') {
      console.log('parsedRooms:', itemsWithTotals);
    }

    // --- 3. Construct Address and Authoritative Data ---    
    const addressParts = [
      body.address, 
      body.street, 
      body.suburb, 
      body.city, 
      body.region, 
      body.postcode
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : lead.address;

    // --- 3. Create a single source of truth for all quote data ---
    console.log('🔍 Items with totals:', JSON.stringify(itemsWithTotals, null, 2));
    
    const getLineTotal = (itemName) => {
      const item = itemsWithTotals.find(it => it.name.toLowerCase().includes(itemName.toLowerCase()));
      console.log(`🔍 Looking for "${itemName}", found:`, item ? `${item.name}: ${item.lineTotal}` : 'Not found');
      return item ? toNum(item.lineTotal) : 0;
    };

    const labourTotal = getLineTotal('labour');
    const materialsTotal = getLineTotal('materials');
    const travelTotal = getLineTotal('travel');
    const installationCost = getLineTotal('setup') || getLineTotal('installation');
    
    console.log('💰 Calculated totals:', {
      labourTotal,
      materialsTotal,
      travelTotal,
      installationCost
    });

    const subtotal = labourTotal + materialsTotal + travelTotal + installationCost;
    const gst = subtotal * 0.15;
    const totalQuote = subtotal * 1.15;

    // Use validUntil from request body (set by tradesman in Google Sheet form)
    // If not provided, default to 14 days from now
    let validUntilDate;
    let validUntilStr;
    
    if (body.validUntil) {
      // Parse the date from the form (usually in YYYY-MM-DD format)
      validUntilDate = new Date(body.validUntil);
      validUntilStr = validUntilDate.toLocaleDateString('en-NZ');
      console.log('📅 Using tradesman-set valid until date:', validUntilStr);
    } else {
      // Fallback to 14 days if not provided
      validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 14);
      validUntilStr = validUntilDate.toLocaleDateString('en-NZ');
      console.log('📅 Using default valid until date (14 days):', validUntilStr);
    }

    const finalQuoteData = {
      ...lead,
      ...normalizedData,

      // --- Data for Google Sheets (flat structure) ---
      quoteId: quoteId,
      leadId: leadId, // Ensure leadId is explicitly passed
      address: fullAddress,
      rooms: JSON.stringify(itemsWithTotals.map(item => ({ name: item.name, sqm: item.sqm || item.qty, dimensions: item.dimensions || 'N/A' }))),
      totalSqm: finalTotalSqm.toFixed(2),
      TotalSQM: finalTotalSqm.toFixed(2), // Ensure TotalSQM is also present for buildQuoteRow
      labourTotal: labourTotal.toFixed(2),
      materialsTotal: materialsTotal.toFixed(2),
      travelTotal: travelTotal.toFixed(2),
      installationCost: installationCost.toFixed(2),
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      totalQuote: totalQuote.toFixed(2),
      validUntil: validUntilStr,

      // Pass customer and tradesperson details for PDF
      customerName: normalizedData.customerName || lead.customerName,
      customerEmail: normalizedData.customerEmail || lead.customerEmail,
      customerPhone: normalizedData.customerPhone || lead.customerPhone,
      TradePersonName: normalizedData.TradePersonName,
      tradePersonEmail: normalizedData.tradePersonEmail,
      tradePersonPhone: normalizedData.tradePersonPhone,

      // --- Data for PDF (nested structure) ---
      pdfData: {
        quoteId: quoteId,
        date: new Date().toLocaleDateString('en-NZ'),
        validUntil: validUntilStr,
        customer: {
          name: normalizedData.customerName || lead.customerName,
          email: normalizedData.customerEmail || lead.customerEmail,
          phone: normalizedData.customerPhone || lead.customerPhone,
          address: fullAddress,
        },
        tradesperson: {
          name: normalizedData.TradePersonName || 'N/A',
          email: normalizedData.tradePersonEmail || 'N/A',
          phone: normalizedData.tradePersonPhone || 'N/A',
          license: 'N/A',
        },
        project: {
          details: itemsWithTotals.map(item => ({
            name: item.name,
            dimensions: item.dimensions || 'N/A',
            sqm: (item.sqm || item.qty || 0).toString(),
          })),
          totalSqm: finalTotalSqm.toFixed(2),
          TOTAL_SQM: finalTotalSqm.toFixed(2), // For PDF placeholder
        },
        cost: {
          breakdown: itemsWithTotals.map(item => ({
            service: item.name,
            rate: toNum(item.unitPrice).toFixed(2),
            quantity: item.qty,
            calculation: `${toNum(item.unitPrice).toFixed(2)} × ${item.qty}`,
            total: toNum(item.lineTotal).toFixed(2),
          })),
          subtotal: subtotal.toFixed(2),
          gst: gst.toFixed(2),
          total: totalQuote.toFixed(2),
        },
      },
    };

    const quoteRow = buildQuoteRow({
      lead: lead,
      quoteId: quoteId,
      body: finalQuoteData, // Use the new unified data object
      mode: isDraft ? 'draft' : 'submitted',
    });

    if (process.env.STAGING === 'true') {
      console.log('quoteRow to write:', quoteRow);
    }
    
    // Debug: Log the financial data being written to Google Sheets
    console.log('💰 Financial data being written to Google Sheets:', {
      labourTotal: quoteRow.LabourTotal,
      materialsTotal: quoteRow.MaterialsTotal,
      travelTotal: quoteRow.TravelTotal,
      installationCost: quoteRow.InstallationCost,
      subtotal: quoteRow.Subtotal,
      gst: quoteRow.GST,
      totalQuote: quoteRow.TotalQuote
    });

    // --- 4. Persist quote number and data before PDF/email ---
    await upsertQuoteRow(quoteId, quoteRow, { req, caller: 'quote-submit-update' });

    if (isDraft) {
      console.log(`✅ Quote saved as draft: ${quoteId}`);
      return res.status(200).json({ success: true, message: 'Quote saved as draft' });
    }

    // --- 5. Generate PDF and send emails ---
    const pdfBuffer = await generateQuotePDF(finalQuoteData.pdfData);

    // Get variables for email content from our single source of truth
    const {
        customerEmail, customerName, serviceType,
        TradePersonName, tradePersonEmail, tradePersonPhone
    } = finalQuoteData;

    const acceptLink  = `${normalizedBaseUrl}/api/customer-accept?quoteId=${quoteId}`;
    const declineLink = `${normalizedBaseUrl}/api/customer-decline?quoteId=${quoteId}`;
    const viewLink    = `${normalizedBaseUrl}/quote/view/${quoteId}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    // --- Customer Email (No CC) ---
    const lineItems = [
      { label: 'Labour', value: labourTotal },
      { label: 'Materials', value: materialsTotal },
      { label: 'Travel', value: travelTotal },
      { label: 'Installation', value: installationCost },
    ];
    const lineItemsHtml = generateLineItemsHtml(lineItems);

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
            ${lineItemsHtml}
            <tr class="total-row"><td>Subtotal (excl. GST)</td><td style="text-align: right;">$${subtotal.toFixed(2)}</td></tr>
            <tr><td>GST (15%)</td><td style="text-align: right;">$${gst.toFixed(2)}</td></tr>
            <tr class="total-row"><td><strong>TOTAL (incl. GST)</strong></td><td style="text-align: right;"><strong>$${totalQuote.toFixed(2)}</strong></td></tr>
          </table>
          
          <div class="tradesperson">
            <h4>Your Tradesperson:</h4>
            <p>
              <strong>Name:</strong> ${TradePersonName}<br>
              <strong>Email:</strong> ${tradePersonEmail}<br>
              <strong>Phone:</strong> ${tradePersonPhone}
            </p>
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
      to: customerEmail, // Send only to customer
      subject: `📄 Your Kiwi Trade Quote #${quoteId} - ${serviceType}`,
      html: customerHtmlContent,
      attachments: [{
        filename: `KiwiTrade_Quote_${quoteId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    console.log(`✅ Quote email sent to customer: ${customerEmail}`);

    // --- Internal Team Email (No decision buttons, new text) ---
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
    const internalRecipients = [tradePersonEmail, adminEmail].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

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