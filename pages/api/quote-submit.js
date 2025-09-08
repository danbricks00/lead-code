js
Copy
// pages/api/quote-submit.js
// NEW, CLEAN IMPLEMENTATION

// Utilities you should already have (adjust paths if needed)
import { upsertQuoteRow, getLeadById, getQuoteById } from '../../../utils/sheets';
import { generateQuotePDF } from '../../../lib/pdfGenerator';
import { sendEmail } from '../../../lib/emailHelper';

// Simple in-memory lock to avoid concurrent double-writes per QuoteID
const locks = new Map();

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse and validate body
    const body = parseBody(req.body);
    const {
      quoteId,
      leadId,

      // Trades fields
      tradePersonName,
      tradePersonEmail,
      tradePersonPhone,

      // Pricing fields (numbers as strings or numbers)
      labourRate,
      labourHours,
      labourTotal,
      materialsCost,
      materialsQuantity,
      materialsTotal,
      travelCost,
      travelDistance,
      travelTotal,
      installationCost,

      // Totals
      subtotal,
      gst,
      totalQuote,

      // Other
      notes,
      validUntil,
      resubmissionAllowed = 'Yes',
      breakdown, // object/array; will be JSON.stringify'd
    } = body;

    if (!quoteId || !leadId) {
      return res.status(400).json({ error: 'quoteId and leadId are required' });
    }

    // Prevent overlapping writes for the same quoteId
    if (locks.get(quoteId)) {
      return res.status(429).json({ error: 'Quote submit already in progress for this QuoteID' });
    }
    locks.set(quoteId, true);

    // Read-only: fetch lead to prefill customer fields
    const lead = await getLeadById(String(leadId).trim());
    if (!lead) {
      locks.delete(quoteId);
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Build canonical values from lead (Leads schema exact headers)
    // Lead, CustomerName, CustomerEmail, CustomerPhone, ServiceType, Rooms, Area, Suburb, Budget, Timelline, Specfic Details, Time, status
    const customerName = safeStr(lead.CustomerName);
    const customerEmail = safeStr(lead.CustomerEmail);
    const customerPhone = safeStr(lead.CustomerPhone);
    const serviceType = safeStr(lead.ServiceType);
    const location = safeStr(lead.Suburb) || safeStr(lead.Area);
    const timeline = safeStr(lead.Timelline); // exact header spelling
    const budget = safeStr(lead.Budget);
    const rooms = stringifyRooms(lead.Rooms);
    const specificDetails = safeStr(lead['Specfic Details']);

    // Compute numeric fields (only if not provided)
    const LabourRate = toNumberOrNull(labourRate);
    const LabourHours = toNumberOrNull(labourHours);
    const LabourTotal = toNumberOrNull(labourTotal) ?? computeIfNumbers(LabourRate, LabourHours);

    const MaterialsCost = toNumberOrNull(materialsCost);
    const MaterialsQuantity = toNumberOrNull(materialsQuantity);
    const MaterialsTotal = toNumberOrNull(materialsTotal) ?? computeIfNumbers(MaterialsCost, MaterialsQuantity);

    const TravelCost = toNumberOrNull(travelCost);
    const TravelDistance = toNumberOrNull(travelDistance);
    const TravelTotal = toNumberOrNull(travelTotal) ?? null; // often rate*distance, if you have logic add it here

    const InstallationCost = toNumberOrNull(installationCost);

    let Subtotal = toNumberOrNull(subtotal);
    let GST = toNumberOrNull(gst);
    let TotalQuote = toNumberOrNull(totalQuote);

    // Compute totals if missing and enough inputs exist
    if (Subtotal == null) {
      const parts = [LabourTotal, MaterialsTotal, TravelTotal, InstallationCost].filter((n) => typeof n === 'number');
      Subtotal = parts.length ? round2(parts.reduce((a, b) => a + b, 0)) : null;
    }
    if (GST == null && typeof Subtotal === 'number') {
      GST = round2(Subtotal * 0.15);
    }
    if (TotalQuote == null && typeof Subtotal === 'number') {
      TotalQuote = round2(Subtotal + (GST ?? 0));
    }

    // Build a single object keyed by Quotes headers
    // Quotes schema (exact headers):
    // TimeStamp, QuoteID, LeadID, TradePersonName, TradePersonEmail, TradePersonPhone,
    // CustomerStatus, TradePersonStatus, AdminPersonStatus,
    // LabourRate, LabourHours, LabourTotal, MaterialsCost, MaterialsQuantity, MaterialsTotal,
    // TravelCost, TravelDistance, TravelTotal, InstallationCost,
    // Subtotal, GST, TotalQuote, Notes, ValidUntil, ResubmissionAllowed,
    // Decision, DecisionTimestamp,
    // CustomerName, CustomerEmail, CustomerPhone, ServiceType, Location, Timeline, Budget, Rooms, BreakDown
    const rowData = {
      TimeStamp: new Date().toISOString(),
      QuoteID: quoteId,
      LeadID: leadId,
      TradePersonName: safeStr(tradePersonName),
      TradePersonEmail: safeStr(tradePersonEmail),
      TradePersonPhone: safeStr(tradePersonPhone),

      CustomerStatus: 'Submitted',
      TradePersonStatus: 'Pending',
      AdminPersonStatus: 'Pending',

      LabourRate: LabourRate ?? '',
      LabourHours: LabourHours ?? '',
      LabourTotal: LabourTotal ?? '',

      MaterialsCost: MaterialsCost ?? '',
      MaterialsQuantity: MaterialsQuantity ?? '',
      MaterialsTotal: MaterialsTotal ?? '',

      TravelCost: TravelCost ?? '',
      TravelDistance: TravelDistance ?? '',
      TravelTotal: TravelTotal ?? '',

      InstallationCost: InstallationCost ?? '',

      Subtotal: Subtotal ?? '',
      GST: GST ?? '',
      TotalQuote: TotalQuote ?? '',

      Notes: safeStr(notes) || specificDetails,
      ValidUntil: safeStr(validUntil),
      ResubmissionAllowed: resubmissionAllowed ? String(resubmissionAllowed) : 'Yes',

      Decision: '',
      DecisionTimestamp: '',

      CustomerName: customerName,
      CustomerEmail: customerEmail,
      CustomerPhone: customerPhone,
      ServiceType: serviceType,
      Location: location,
      Timeline: timeline,
      Budget: budget,
      Rooms: rooms,
      BreakDown: stringifyJSON(breakdown),
    };

    // Optional: write guard (enable if you added the utility)
    // assertWriteAllowed({ req, caller: 'quote-submit' });

    // Single upsert
    console.log(JSON.stringify({ tag: 'QUOTE_SUBMIT_UPSERT_ONLY', quoteId }));
    const result = await upsertQuoteRow(quoteId, rowData, { req, caller: 'quote-submit' }); // { action, rowIndex }
    console.log(JSON.stringify({ tag: 'SHEETS_UPSERT', quoteId, action: result?.action, rowIndex: result?.rowIndex }));

    // Read back canonical row (or rely on rowData if your upsert is consistent immediately)
    const canonical = (await getQuoteById(quoteId)) || rowData;

    // Generate PDF and send emails
    await generateAndSendQuote(canonical);

    locks.delete(quoteId);
    return res.status(200).json({
      ok: true,
      action: result?.action || null,
      rowIndex: result?.rowIndex || null,
      quote: canonical,
    });
  } catch (err) {
    console.error('[QUOTE-SUBMIT] Error:', err);
    // Ensure lock is released on error
    try {
      const maybeId = getBodyQuoteId(req);
      if (maybeId) locks.delete(maybeId);
    } catch {}
    return res.status(500).json({ error: 'Internal server error', details: String(err?.message || err) });
  }
}

/* ---------------------- helpers ---------------------- */

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
}

function getBodyQuoteId(req) {
  const b = parseBody(req.body);
  return b?.quoteId || null;
}

function safeStr(v) {
  if (v == null) return '';
  return String(v).trim();
}

function toNumberOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeIfNumbers(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return round2(a * b);
  return null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function stringifyRooms(roomsValue) {
  if (!roomsValue) return '[]';
  if (Array.isArray(roomsValue)) return JSON.stringify(roomsValue);
  if (typeof roomsValue === 'string') {
    try {
      const parsed = JSON.parse(roomsValue);
      return JSON.stringify(parsed);
    } catch {
      // treat as single string room
      return JSON.stringify([roomsValue]);
    }
  }
  return JSON.stringify([String(roomsValue)]);
}

function stringifyJSON(v) {
  if (!v) return '';
  try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return ''; }
}

// Generate PDF and send emails
async function generateAndSendQuote(quoteRow) {
  try {
    console.log(`[QUOTE-SUBMIT] Generating PDF and sending emails for quote ${quoteRow.QuoteID}`);
    
    // Prepare quote data for PDF generation
    const quoteData = {
      quoteId: quoteRow.QuoteID,
      quoteDate: new Date().toLocaleString("en-NZ", { timeZone: "Pacific/Auckland" }),
      validUntil: quoteRow.ValidUntil,
      customerName: quoteRow.CustomerName,
      customerEmail: quoteRow.CustomerEmail,
      customerPhone: quoteRow.CustomerPhone,
      customerAddress: quoteRow.Location,
      serviceType: quoteRow.ServiceType,
      tradespersonName: quoteRow.TradePersonName,
      tradespersonEmail: quoteRow.TradePersonEmail,
      tradespersonPhone: quoteRow.TradePersonPhone,
      tradespersonLicense: "Licensed Tradesperson",
      rooms: JSON.parse(quoteRow.Rooms || '[]'),
      breakdown: JSON.parse(quoteRow.BreakDown || '{}'),
      totals: {
        labour: parseFloat(quoteRow.LabourTotal) || 0,
        materials: parseFloat(quoteRow.MaterialsTotal) || 0,
        travel: parseFloat(quoteRow.TravelTotal) || 0,
        installation: parseFloat(quoteRow.InstallationCost) || 0,
        subtotal: parseFloat(quoteRow.Subtotal) || 0,
        gst: parseFloat(quoteRow.GST) || 0,
        final: parseFloat(quoteRow.TotalQuote) || 0
      },
      subtotal: parseFloat(quoteRow.Subtotal) || 0,
      gst: parseFloat(quoteRow.GST) || 0,
      total: parseFloat(quoteRow.TotalQuote) || 0,
      totalQuote: parseFloat(quoteRow.TotalQuote) || 0
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePDF(quoteData);
    console.log(`✅ PDF generated successfully for Quote ${quoteRow.QuoteID}`);

    // Send emails
    await sendQuoteEmails(quoteRow, pdfBuffer);

    console.log(JSON.stringify({ 
      tag: 'QUOTE_PDF_EMAIL_OK', 
      quoteId: quoteRow.QuoteID, 
      size: pdfBuffer?.length || 0 
    }));
  } catch (e) {
    console.error(JSON.stringify({ 
      tag: 'QUOTE_PDF_EMAIL_FAIL', 
      quoteId: quoteRow?.QuoteID, 
      msg: String(e?.message || e) 
    }));
    // Don't throw - continue with quote submission even if PDF/email fails
  }
}

// Send quote emails to admin and tradesperson
async function sendQuoteEmails(quoteRow, pdfBuffer) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'danbricks18@gmail.com';
    const tradespersonEmail = quoteRow.TradePersonEmail;
    
    // Email to admin and tradesperson for review
    const reviewEmailHtml = `
      <h2>New Quote Submitted for Review</h2>
      <p><strong>Quote ID:</strong> ${quoteRow.QuoteID}</p>
      <p><strong>Customer:</strong> ${quoteRow.CustomerName} (${quoteRow.CustomerEmail})</p>
      <p><strong>Service:</strong> ${quoteRow.ServiceType}</p>
      <p><strong>Location:</strong> ${quoteRow.Location}</p>
      <p><strong>Total Quote:</strong> $${quoteRow.TotalQuote}</p>
      <p><strong>Valid Until:</strong> ${quoteRow.ValidUntil}</p>
      <p><strong>Tradesperson:</strong> ${quoteRow.TradePersonName} (${quoteRow.TradePersonEmail})</p>
      
      <p>Please review and approve this quote before it's sent to the customer.</p>
    `;

    await sendEmail({
      to: [adminEmail, tradespersonEmail],
      subject: `Quote Review Required - ${quoteRow.QuoteID}`,
      html: reviewEmailHtml,
      attachments: [{
        filename: `quote-${quoteRow.QuoteID}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
      }]
    });

    console.log(`✅ Quote review email sent to ${adminEmail}, ${tradespersonEmail}`);

    // Confirmation email to tradesperson
    const confirmationEmailHtml = `
      <h2>Quote Submitted Successfully</h2>
      <p>Your quote ${quoteRow.QuoteID} has been submitted and is pending admin approval.</p>
      <p><strong>Customer:</strong> ${quoteRow.CustomerName}</p>
      <p><strong>Service:</strong> ${quoteRow.ServiceType}</p>
      <p><strong>Total Quote:</strong> $${quoteRow.TotalQuote}</p>
      <p>You will be notified once the quote is approved and sent to the customer.</p>
    `;

    await sendEmail({
      to: tradespersonEmail,
      subject: `Quote Submitted - ${quoteRow.QuoteID}`,
      html: confirmationEmailHtml
    });

    console.log(`✅ Confirmation email sent to ${tradespersonEmail}`);

        } catch (emailError) {
    console.error('❌ Error sending quote emails:', emailError);
    // Don't throw - continue with quote submission
  }
}
