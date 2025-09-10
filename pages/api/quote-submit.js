/**
 * Quote Submit API - Submitted Write + PDF/Email
 * POST-only. Merges Lead + body financials; overwrites same QuoteID row; triggers PDF/email only for Submitted.
 */

import { getLeadById, upsertQuoteRow, getQuoteById, getQuotesByLeadId } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { generateQuotePDF } from '../../lib/pdfGenerator.js';
import { sendEmail } from '../../lib/emailHelper.js';

/**
 * Generate next available version ID for quote resubmissions
 * @param {string} baseId - Original quote ID (e.g., "26e807wig")
 * @param {Array} existingQuotes - All quotes from getQuotesByLeadId
 * @returns {string} - Next version ID (e.g., "26e807wig-A", "26e807wig-B")
 */
function getNextVersionId(baseId, existingQuotes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let suffix = 0;
  
  while (suffix < alphabet.length) {
    const versionId = `${baseId}-${alphabet[suffix]}`;
    
    // Check if this version already exists
    const exists = existingQuotes.some(quote => 
      quote.QuoteID && quote.QuoteID.toString().trim() === versionId
    );
    
    if (!exists) {
      return versionId;
    }
    
    suffix++;
  }
  
  // Fallback if we somehow exhaust A-Z (very unlikely)
  return `${baseId}-${Date.now()}`;
}

export default async function handler(req, res) {
  const requestId = `quote-submit-${Date.now()}`;
  
  console.log(JSON.stringify({ 
    tag: 'ROUTE_REQ_START', 
    route: 'quote-submit', 
    method: req.method,
    requestId,
    timestamp: new Date().toISOString()
  }));
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('[QUOTE-SUBMIT] Request received:', req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let { quoteId, leadId } = body || {};
    console.log('[QUOTE-SUBMIT] Parsed body:', { quoteId, leadId, bodyKeys: Object.keys(body) });
    
    if (!quoteId || !leadId) return res.status(400).json({ error: 'quoteId and leadId are required' });

    const lead = await getLeadById(String(leadId).trim());
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Check for existing quotes for this lead
    const existingQuotes = await getQuotesByLeadId(String(leadId).trim());
    console.log('[QUOTE-SUBMIT] Existing quotes for lead:', existingQuotes.length);
    
    // Filter out the current quote being submitted (if it's an update)
    const otherQuotes = existingQuotes.filter(q => q.QuoteID !== quoteId);
    
    if (otherQuotes.length > 0) {
      // Check if any existing quote is not rejected by admin
      const nonRejectedQuotes = otherQuotes.filter(q => 
        q.AdminPersonStatus !== 'Declined' && 
        q.AdminPersonStatus !== 'Rejected' &&
        q.Decison !== 'Rejected' &&
        q.Decison !== 'Declined'
      );
      
      if (nonRejectedQuotes.length > 0) {
        console.log('[QUOTE-SUBMIT] Blocking submission - existing non-rejected quotes found:', nonRejectedQuotes.map(q => ({
          quoteId: q.QuoteID,
          adminStatus: q.AdminPersonStatus,
          decision: q.Decison
        })));
        
        return res.status(400).json({ 
          error: 'Quote already exists for this lead. Only one quote per lead is allowed unless the previous quote was rejected by admin.',
          existingQuoteId: nonRejectedQuotes[0].QuoteID,
          existingStatus: nonRejectedQuotes[0].AdminPersonStatus
        });
      }
    }

    // Compute totals if missing
    const Subtotal = num(body.subtotal) ?? sum([
      num(body.labourTotal),
      num(body.materialsTotal),
      num(body.travelTotal),
      num(body.installationCost),
    ]);
    const GST = num(body.gst) ?? round2((Subtotal ?? 0) * 0.15);
    const TotalQuote = num(body.totalQuote) ?? round2((Subtotal ?? 0) + (GST ?? 0));

    // Helper function for consistent NZT timestamp formatting
    function formatDateTimeNZT(date) {
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Pacific/Auckland'
        };
        return new Intl.DateTimeFormat('en-NZ', options).format(new Date(date));
    }

    const fullRow = buildQuoteRow({
      lead,
      quoteId,
      tradePersonName: body.tradespersonName || body.tradePersonName || '',
      tradePersonEmail: body.tradespersonEmail || body.tradePersonEmail || '',
      tradePersonPhone: body.tradespersonPhone || body.tradePersonPhone || '',
      body: {
        ...body,
        subtotal: Subtotal ?? '',
        gst: GST ?? '',
        totalQuote: TotalQuote ?? '',
      },
      mode: 'submitted',
    });

    // Update timestamp to use NZT format
    fullRow.TimeStamp = formatDateTimeNZT(new Date());

    // Smart guard: Check for existing quotes and handle resubmissions
    const existingQuote = existingQuotes.find(q => q.QuoteID === quoteId);
    
    if (existingQuote) {
        console.log('[QUOTE-SUBMIT] Existing quote found:', { 
      quoteId,
            existingTimestamp: existingQuote.TimeStamp,
            existingStatus: existingQuote.CustomerStatus,
            adminDecision: existingQuote.AdminDecision
        });
        
        // Check if admin has declined this quote
        if (existingQuote.AdminDecision === 'Declined') {
            console.log('[QUOTE-SUBMIT] Admin declined quote - allowing resubmission with versioning');
            
            // Generate new version ID using helper function
            const newQuoteId = getNextVersionId(quoteId, existingQuotes);
            
            console.log(`🔄 Creating new quote version: ${quoteId} → ${newQuoteId}`);
            
            // Update the quoteId for the new submission
            quoteId = newQuoteId;
            fullRow.QuoteID = newQuoteId;
            
            console.log(JSON.stringify({
                tag: 'QUOTE_RESUBMITTED',
                newQuoteId: newQuoteId,
                fromQuoteId: existingQuote.QuoteID
            }));
            
        } else {
            // Quote exists but not declined - block duplicate submission
            console.log('[QUOTE-SUBMIT] Duplicate submission blocked - quote not declined:', {
                quoteId,
                adminDecision: existingQuote.AdminDecision
            });
            
            console.log(JSON.stringify({
                tag: 'QUOTE_ALREADY_SUBMITTED',
                quoteId,
                submittedAt: existingQuote.TimeStamp
            }));
            
            return res.status(400).json({
                tag: "QUOTE_ALREADY_SUBMITTED",
                quoteId,
                submittedAt: formatDateTimeNZT(existingQuote.TimeStamp),
                message: "This quote has already been submitted. Please check your email for confirmation."
            });
        }
    } else {
        console.log('[QUOTE-SUBMIT] First-time submission for quote ID:', quoteId);
    }

    console.log('[QUOTE-SUBMIT] About to write to Google Sheets:', { quoteId, fullRowKeys: Object.keys(fullRow) });
    const result = await upsertQuoteRow(quoteId, fullRow, { req, caller: 'quote-submit' });
    console.log('[QUOTE-SUBMIT] Google Sheets write result:', result);
    console.log(JSON.stringify({ tag: 'QUOTE_SUBMIT_WRITE', quoteId, action: result?.action, rowIndex: result?.rowIndex }));

    // PDF/email only for Submitted and not Declined
    console.log('[QUOTE-SUBMIT] PDF/Email check:', {
      customerStatus: fullRow.CustomerStatus,
      tradePersonStatus: fullRow.TradePersonStatus,
      enablePdfEmails: process.env.ENABLE_PDF_EMAILS,
      shouldSend: fullRow.CustomerStatus === 'Submitted' && fullRow.TradePersonStatus !== 'Declined' && (process.env.ENABLE_PDF_EMAILS !== 'false')
    });
    
    try {
      if (fullRow.CustomerStatus === 'Submitted' && fullRow.TradePersonStatus !== 'Declined' && (process.env.ENABLE_PDF_EMAILS !== 'false')) {
        const html = renderQuoteHtml(fullRow);
        
        // Create properly formatted data for PDF generation
        const pdfData = {
          quoteId: quoteId,
          quoteDate: fullRow.TimeStamp,
          validUntil: fullRow.ValidUntil,
          customerName: fullRow.CustomerName,
          customerEmail: fullRow.CustomerEmail,
          customerPhone: fullRow.CustomerPhone,
          customerAddress: `${fullRow.Area || ''}, ${fullRow.Suburb || ''}`.trim(),
          serviceType: fullRow.ServiceType,
          tradespersonName: fullRow.TradePersonName,
          tradespersonEmail: fullRow.TradePersonEmail,
          tradespersonPhone: fullRow.TradePersonPhone,
          tradespersonLicense: '',
          rooms: fullRow.Rooms ? JSON.parse(fullRow.Rooms) : [],
            breakdown: {
            labourRate: parseFloat(fullRow.LabourRate || 0),
            labourHours: parseFloat(fullRow.LabourHours || 0),
            labourTotal: parseFloat(fullRow.LabourTotal || 0),
            materialsCost: parseFloat(fullRow.MaterialsCost || 0),
            materialsQuantity: parseFloat(fullRow.MaterialsQuantity || 0),
            materialsTotal: parseFloat(fullRow.MaterialsTotal || 0),
            travelCost: parseFloat(fullRow.TravelCost || 0),
            travelDistance: parseFloat(fullRow.TravelDistance || 0),
            travelTotal: parseFloat(fullRow.TravelTotal || 0),
            installationCost: parseFloat(fullRow.InstallationCost || 0),
            totalSqm: fullRow.Rooms ? JSON.parse(fullRow.Rooms).reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0) : 0
            },
            totals: {
            labour: parseFloat(fullRow.LabourTotal || 0),
            materials: parseFloat(fullRow.MaterialsTotal || 0),
            travel: parseFloat(fullRow.TravelTotal || 0),
            installation: parseFloat(fullRow.InstallationCost || 0),
            subtotal: parseFloat(fullRow.Subtotal || 0),
            gst: parseFloat(fullRow.GST || 0),
            final: parseFloat(fullRow.TotalQuote || 0)
          },
          html: html
        };
        
        const pdfBuffer = await generateQuotePDF(pdfData);
        
        // Only send admin and tradesperson emails on submission
        // Customer email will be sent after admin approval
        await safeSend(sendAdminQuoteEmail, process.env.ADMIN_EMAIL, pdfBuffer, fullRow, 'EMAIL_ADMIN');
        await safeSend(sendTradesQuoteEmail, fullRow.TradePersonEmail, pdfBuffer, fullRow, 'EMAIL_TRADES');
        console.log(JSON.stringify({ tag: 'QUOTE_PDF_EMAIL_OK', quoteId }));
      } else {
        console.log(JSON.stringify({ tag: 'QUOTE_PDF_EMAIL_SKIPPED', quoteId, reason: 'status/env' }));
      }
    } catch (e) {
      console.error(JSON.stringify({ tag: 'QUOTE_PDF_EMAIL_FAIL', quoteId, msg: String(e?.message || e) }));
    }

    // Determine response based on whether this was a resubmission
    const isResubmission = quoteId.includes('-');
    const responseTag = isResubmission ? 'QUOTE_RESUBMITTED' : 'QUOTE_SUBMITTED';
    const responseMessage = isResubmission ? 'Quote resubmitted successfully' : 'Quote submitted successfully';
    
    console.log(JSON.stringify({ 
      tag: responseTag, 
      route: 'quote-submit', 
            quoteId,
      leadId,
      requestId,
      timestamp: new Date().toISOString()
    }));
    
    const responseData = { 
      tag: responseTag,
      ok: true, 
      quoteId,
      message: responseMessage,
      quote: (await getQuoteById(quoteId)) || fullRow 
    };
    
    // Add resubmission details if applicable
    if (isResubmission) {
      const baseQuoteId = quoteId.split('-')[0];
      responseData.fromQuoteId = baseQuoteId;
      responseData.newQuoteId = quoteId;
    }
    
    return res.status(200).json(responseData);

  } catch (error) {
    console.error(JSON.stringify({ 
      tag: 'ROUTE_REQ_FAIL', 
      route: 'quote-submit', 
      error: error.message,
      requestId,
      timestamp: new Date().toISOString()
    }));
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function round2(n) { return Math.round(n * 100) / 100; }
function sum(arr) { return arr.filter(x => typeof x === 'number').reduce((a, b) => a + b, 0) || null; }

// Minimal HTML renderer
function renderQuoteHtml(q) {
  const money = (n) => (n === '' || n == null ? '' : Number(n).toFixed(2));
  return `
    <html><head><meta charset="utf-8"><style>
    body{font-family:Arial,sans-serif;font-size:12px;margin:24px;color:#111}
    h1{font-size:18px;margin:0 0 8px}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #ddd;padding:6px;font-size:12px}
    .r{text-align:right}
    </style></head><body>
    <h1>Quote #${q.QuoteID}</h1>
    <p><strong>${q.CustomerName}</strong> — ${q.CustomerEmail} — ${q.CustomerPhone}</p>
    <p>Service: ${q.ServiceType} | Location: ${q.Suburb || q.Area} | Timeline: ${q.Timelline}</p>
    <table>
      <tr><th>Item</th><th class="r">Amount</th></tr>
      <tr><td>Labour</td><td class="r">$${money(q.LabourTotal)}</td></tr>
      <tr><td>Materials</td><td class="r">$${money(q.MaterialsTotal)}</td></tr>
      <tr><td>Travel</td><td class="r">$${money(q.TravelTotal)}</td></tr>
      <tr><td>Installation</td><td class="r">$${money(q.InstallationCost)}</td></tr>
      <tr><td><strong>Subtotal</strong></td><td class="r"><strong>$${money(q.Subtotal)}</strong></td></tr>
      <tr><td>GST</td><td class="r">$${money(q.GST)}</td></tr>
      <tr><td><strong>Total</strong></td><td class="r"><strong>$${money(q.TotalQuote)}</strong></td></tr>
                    </table>
    </body></html>
  `;
}

async function safeSend(fn, to, pdf, row, tag) {
  try { 
    if (to && typeof fn === 'function') { 
      await fn(to, pdf, row); 
    } else {
      console.log(JSON.stringify({ tag: `${tag}_SKIP` })); 
    } 
  } catch (e) { 
    console.error(JSON.stringify({ tag: `${tag}_FAIL`, msg: String(e?.message || e) })); 
  }
}

// Email functions using existing email system
async function sendCustomerQuoteEmail(to, pdf, row) {
  const subject = `Your Underfloor Heating Quote #${row.QuoteID}`;
  const html = `
    <h1>Your Quote is Ready!</h1>
    <p>Hi ${row.CustomerName},</p>
    <p>Your underfloor heating quote has been prepared and is attached to this email.</p>
    <p><strong>Quote Details:</strong></p>
    <ul>
      <li>Quote ID: ${row.QuoteID}</li>
      <li>Service: ${row.ServiceType}</li>
      <li>Location: ${row.Suburb || row.Area}</li>
      <li>Total: $${row.TotalQuote}</li>
    </ul>
    <p>Please review the attached quote and let us know if you have any questions.</p>
  `;
  
  await sendEmail({
    to,
    subject,
    html,
    attachments: [{
      filename: `quote-${row.QuoteID}.pdf`,
      content: pdf,
                contentType: 'application/pdf'
    }]
  });
}

async function sendAdminQuoteEmail(to, pdf, row) {
  const subject = `New Quote #${row.QuoteID} for ${row.CustomerName} - Waiting for Approval`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Calculate individual totals
  const labourTotal = parseFloat(row.LabourRate || 0) * parseFloat(row.LabourHours || 0);
  const materialsTotal = parseFloat(row.MaterialsCost || 0) * parseFloat(row.MaterialsQuantity || 0);
  const travelTotal = parseFloat(row.TravelCost || 0) * parseFloat(row.TravelDistance || 0);
  const installationTotal = parseFloat(row.InstallationCost || 0);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1>📄 New Quote Submitted for Review</h1>
        <p>A new quote has been submitted and requires your review.</p>
                </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2>📋 Quote Details</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p><strong>Quote ID:</strong> ${row.QuoteID}</p>
          <p><strong>Customer:</strong> ${row.CustomerName}</p>
          <p><strong>Email:</strong> ${row.CustomerEmail}</p>
          <p><strong>Phone:</strong> ${row.CustomerPhone}</p>
          <p><strong>Service:</strong> ${row.ServiceType}</p>
          <p><strong>Location:</strong> ${row.Suburb || row.Area}</p>
          <p><strong>Tradesperson:</strong> ${row.TradePersonName}</p>
          <p><strong>Valid Until:</strong> ${row.ValidUntil}</p>
        </div>
        
        <h3>💰 Cost Breakdown</h3>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;"><strong>Labour:</strong></td>
              <td style="padding: 8px 0; text-align: right;">$${labourTotal.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;"><strong>Materials:</strong></td>
              <td style="padding: 8px 0; text-align: right;">$${materialsTotal.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;"><strong>Travel:</strong></td>
              <td style="padding: 8px 0; text-align: right;">$${travelTotal.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0;"><strong>Installation:</strong></td>
              <td style="padding: 8px 0; text-align: right;">$${installationTotal.toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #333;">
              <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
              <td style="padding: 8px 0; text-align: right;"><strong>$${row.Subtotal}</strong></td>
            </tr>
            <tr style="border-bottom: 2px solid #333;">
              <td style="padding: 8px 0;"><strong>GST (15%):</strong></td>
              <td style="padding: 8px 0; text-align: right;"><strong>$${row.GST}</strong></td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px 0;"><strong>Total Quote:</strong></td>
              <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #28a745;"><strong>$${row.TotalQuote}</strong></td>
            </tr>
                        </table>
                    </div>
                    
        <div style="text-align: center; margin: 30px 0;">
          <h3>🎯 Admin Actions Required</h3>
          <p>Please review the attached quote and take action:</p>
          
          <div style="margin: 20px 0;">
            <a href="${baseUrl}/api/admin-accept?quoteId=${row.QuoteID}&leadId=${row.LeadID}" 
               style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 10px; font-weight: bold; box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);">
              ✅ Approve Quote
            </a>
            
            <a href="${baseUrl}/api/admin-decline?quoteId=${row.QuoteID}&leadId=${row.LeadID}" 
               style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 10px; font-weight: bold; box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);">
              ❌ Decline Quote
            </a>
          </div>
                    </div>
                    
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4>⚠️ Important</h4>
          <p><strong>Please review the attached PDF quote before making your decision.</strong></p>
          <p>Once approved, the customer will receive the quote and can accept or decline it.</p>
                    </div>
                    
        <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
                </div>
            </div>
        `;

  await sendEmail({
    to,
    subject,
    html,
    attachments: [{
      filename: `quote-${row.QuoteID}.pdf`,
      content: pdf,
                contentType: 'application/pdf'
    }]
  });
}

async function sendTradesQuoteEmail(to, pdf, row) {
  const subject = `Quote Submitted Successfully - Quote #${row.QuoteID}`;
  const html = `
    <h1>Quote Submitted Successfully</h1>
    <p>Hi ${row.TradePersonName},</p>
    <p>Your quote has been submitted successfully and is now under review.</p>
    <p><strong>Quote Details:</strong></p>
    <ul>
      <li>Quote ID: ${row.QuoteID}</li>
      <li>Customer: ${row.CustomerName}</li>
      <li>Service: ${row.ServiceType}</li>
      <li>Location: ${row.Suburb || row.Area}</li>
      <li>Total: $${row.TotalQuote}</li>
    </ul>
    <p>The customer will be notified once the quote is approved.</p>
  `;
  
  await sendEmail({
    to,
    subject,
    html,
    attachments: [{
      filename: `quote-${row.QuoteID}.pdf`,
      content: pdf,
      contentType: 'application/pdf'
    }]
  });
}
