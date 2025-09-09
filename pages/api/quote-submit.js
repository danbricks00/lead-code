/**
 * Quote Submit API - Submitted Write + PDF/Email
 * POST-only. Merges Lead + body financials; overwrites same QuoteID row; triggers PDF/email only for Submitted.
 */

import { getLeadById, upsertQuoteRow, getQuoteById, getQuotesByLeadId } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';
import { generateQuotePDF } from '../../lib/pdfGenerator.js';
import { sendEmail } from '../../lib/emailHelper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('[QUOTE-SUBMIT] Request received:', req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { quoteId, leadId } = body || {};
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
        const pdfBuffer = await generateQuotePDF({ ...fullRow, html, quoteId });
        
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

    return res.status(200).json({ ok: true, quote: (await getQuoteById(quoteId)) || fullRow });

  } catch (error) {
    console.error('Quote submit error:', error);
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
  const subject = `New Quote Submitted - ${row.CustomerName} - Quote #${row.QuoteID}`;
  const html = `
    <h1>New Quote Submitted for Review</h1>
    <p>A new quote has been submitted and requires your review.</p>
    <p><strong>Quote Details:</strong></p>
    <ul>
      <li>Quote ID: ${row.QuoteID}</li>
      <li>Customer: ${row.CustomerName}</li>
      <li>Email: ${row.CustomerEmail}</li>
      <li>Phone: ${row.CustomerPhone}</li>
      <li>Service: ${row.ServiceType}</li>
      <li>Location: ${row.Suburb || row.Area}</li>
      <li>Total: $${row.TotalQuote}</li>
      <li>Tradesperson: ${row.TradePersonName}</li>
    </ul>
    <p>Please review the attached quote and approve or decline as appropriate.</p>
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
