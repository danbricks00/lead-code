import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { generateQuotePDF } from '../../lib/pdfGenerator';
import { upsertQuoteRow, getLeadById } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { safeParseRooms, sumRoomsSqm, toNum, computeLineTotals, generateLineItemsHtml } from '../../utils/quoteHelpers.js';
import { 
  formatDateDDMMYYYY, 
  formatDateTimeDDMMYYYY, 
  parseAndFormatDate, 
  getCurrentNZTimestamp,
  getDefaultQuoteExpiry 
} from '../../utils/dateUtils.js';

// GA4 Conversion Tracking Function
async function trackQuoteSubmission(quoteData, quoteId, isDraft = false) {
  try {
    if (!process.env.GA_MEASUREMENT_ID || !process.env.GA_API_SECRET) {
      console.log('GA4 tracking not configured - skipping conversion tracking');
      return;
    }

    const measurementId = process.env.GA_MEASUREMENT_ID;
    const apiSecret = process.env.GA_API_SECRET;
    
    const eventData = {
      client_id: quoteId, // Use quoteId as client_id for server-side tracking
      events: [{
        name: isDraft ? 'quote_draft_saved' : 'quote_submitted',
        params: {
          quote_id: quoteId,
          customer_email: quoteData.customerEmail || 'unknown',
          total_rooms: quoteData.rooms ? JSON.parse(quoteData.rooms).length : 0,
          total_sqm: quoteData.totalSqm || 0,
          system_type: quoteData.systemType || 'unknown',
          location: 'Auckland',
          currency: 'NZD',
          value: quoteData.totalPrice || 0
        }
      }]
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      }
    );

    if (response.ok) {
      console.log(`✅ GA4 conversion tracked: ${isDraft ? 'quote_draft_saved' : 'quote_submitted'}`);
    } else {
      console.error('GA4 tracking failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error tracking GA4 conversion:', error.message);
  }
}

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
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
    
    // Check if we have items from rooms computation, otherwise use form data directly
    let labourTotal, materialsTotal, travelTotal, installationCost;
    
    if (itemsWithTotals && itemsWithTotals.length > 0) {
      // Use computed totals from rooms
      const getLineTotal = (itemName) => {
        const item = itemsWithTotals.find(it => it.name.toLowerCase().includes(itemName.toLowerCase()));
        console.log(`🔍 Looking for "${itemName}", found:`, item ? `${item.name}: ${item.lineTotal}` : 'Not found');
        return item ? toNum(item.lineTotal) : 0;
      };

      labourTotal = getLineTotal('labour');
      materialsTotal = getLineTotal('materials');
      travelTotal = getLineTotal('travel');
      installationCost = getLineTotal('setup') || getLineTotal('installation');
    } else {
      // Use form data directly (from quote form)
      console.log('🔍 No items from rooms computation, using form data directly');
      
      // First try to use pre-calculated subtotals
      labourTotal = toNum(body.labourSubtotal) || toNum(body.labourTotal) || 0;
      materialsTotal = toNum(body.materialSubtotal) || toNum(body.materialsTotal) || 0;
      travelTotal = toNum(body.travelSubtotal) || toNum(body.travelTotal) || 0;
      installationCost = toNum(body.installationSubtotal) || toNum(body.installationCost) || 0;
      
      // If subtotals are 0, calculate from individual components
      if (labourTotal === 0) {
        const labourRate = toNum(body.labourRate) || 0;
        const labourHours = toNum(body.labourHours) || 0;
        labourTotal = labourRate * labourHours;
        console.log(`🔢 Calculated labour: ${labourRate} × ${labourHours} = ${labourTotal}`);
      }
      
      if (materialsTotal === 0) {
        const materialRate = toNum(body.materialRate) || toNum(body.materialsCost) || toNum(body.MaterialsCost) || 0;
        const materialQuantity = toNum(body.materialSQM) || toNum(body.materialQuantity) || toNum(body.materialsQuantity) || toNum(body.MaterialsQuantity) || 0;
        materialsTotal = materialRate * materialQuantity;
        console.log(`🔢 Calculated materials: ${materialRate} × ${materialQuantity} = ${materialsTotal}`);
      }
      
      if (travelTotal === 0) {
        const travelRate = toNum(body.travelCost) || toNum(body.travelRate) || 0;
        const travelDistance = toNum(body.travelDistance) || 0;
        travelTotal = travelRate * travelDistance;
        console.log(`🔢 Calculated travel: ${travelRate} × ${travelDistance} = ${travelTotal}`);
      }
      
      if (installationCost === 0) {
        installationCost = toNum(body.installationAmount) || toNum(body.installationCost) || 0;
        console.log(`🔢 Installation cost: ${installationCost}`);
      }
      
      console.log('🔍 Using form data:', {
        labourSubtotal: body.labourSubtotal,
        materialSubtotal: body.materialSubtotal,
        travelSubtotal: body.travelSubtotal,
        installationSubtotal: body.installationSubtotal,
        labourRate: body.labourRate,
        labourHours: body.labourHours,
        materialRate: body.materialRate,
        materialSQM: body.materialSQM,
        travelCost: body.travelCost,
        travelDistance: body.travelDistance,
        installationAmount: body.installationAmount
      });
    }
    
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
      validUntilStr = formatDateDDMMYYYY(validUntilDate);
      console.log('📅 Using tradesman-set valid until date:', validUntilStr);
    } else {
      // Fallback to 14 days if not provided
      validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + 14);
      validUntilStr = formatDateDDMMYYYY(validUntilDate);
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
      customerAddress: fullAddress, // Add customer address for PDF
      TradePersonName: normalizedData.TradePersonName,
      tradePersonEmail: normalizedData.tradePersonEmail,
      tradePersonPhone: normalizedData.tradePersonPhone,
      
      // Pass rate and hour data for PDF line item calculations
      labourRate: toNum(body.labourRate) || 25.00,
      labourHours: toNum(body.labourHours) || 8,
      materialRate: toNum(body.materialRate) || 0.00,
      materialSQM: toNum(body.materialSQM) || toNum(body.materialQuantity) || 1,
      travelCost: toNum(body.travelCost) || toNum(body.travelRate) || 0.00,
      travelDistance: toNum(body.travelDistance) || 10,

      // --- Data for PDF (nested structure) ---
      pdfData: {
        quoteId: quoteId,
        date: getCurrentNZDate(),
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
      // Track draft save in GA4
      await trackQuoteSubmission(req.body, quoteId, true);
      return res.status(200).json({ success: true, message: 'Quote saved as draft' });
    }

    // --- 5. Generate PDF and send emails ---
    const pdfBuffer = await generateQuotePDF(finalQuoteData);

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
      { label: 'Labour', value: parseFloat(labourTotal.toFixed(2)) },
      { label: 'Materials', value: parseFloat(materialsTotal.toFixed(2)) },
      { label: 'Travel', value: parseFloat(travelTotal.toFixed(2)) },
      { label: 'Installation', value: parseFloat(installationCost.toFixed(2)) },
    ];
    const lineItemsHtml = generateLineItemsHtml(lineItems);

    const customerHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Your Heat.nz Quote</title>
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
        <div class="header"><h1>Heat.nz Quote #${quoteId}</h1></div>
        <div class="content">
          <h2>Dear ${customerName},</h2>
          <p>Thank you for choosing Heat.nz. Here is your quote for the ${serviceType} project:</p>
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
      from: `"Heat.nz" <${GMAIL_USER}>`,
      to: customerEmail, // Send only to customer
      subject: `📄 Your Heat.nz Quote #${quoteId} - ${serviceType}`,
      html: customerHtmlContent,
      attachments: [{
        filename: `_Quote_${quoteId}.pdf`,
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
          <p><strong>Total:</strong> $${totalQuote.toFixed(2)}</p>
          <a href="${viewLink}">View Quote Details Online</a>
        </div>
      </body></html>`;

    const adminEmail = process.env.ADMIN_EMAIL || '';
    const internalRecipients = [tradePersonEmail, adminEmail].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

    if (internalRecipients.length > 0) {
      await transporter.sendMail({
        from: `"Heat.nz" <${GMAIL_USER}>`,
        to: internalRecipients.join(','),
        subject: `[Internal] Quote #${quoteId} Sent to ${customerName}`,
        html: internalHtmlContent,
        attachments: [{
          filename: `heat-nz_Quote_${quoteId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });
      console.log(`✅ Internal notification sent to: ${internalRecipients.join(', ')}`);
    }
    
    // Track quote submission in GA4
    await trackQuoteSubmission(req.body, quoteId, false);
    
    return res.status(200).json({ success: true, message: 'Quote sent to customer' });

  } catch (err) {
    console.error("[Quote Submit Error]", err);
    return res.status(500).json({ error: 'Internal error submitting quote' });
  }
}