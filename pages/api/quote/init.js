/**
 * Quote Init API - Draft Write Only
 * GET-only endpoint. Reads from Leads; creates/updates a Draft row in Quotes only if TradePersonName present.
 * No PDF/email here.
 */

import { getLeadById, upsertQuoteRow } from '../../../utils/sheets.js';
import { buildQuoteRow } from '../../../utils/quotes.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { leadId, quoteId, tradePersonName = '', tradePersonEmail = '', tradePersonPhone = '' } = req.query || {};
  if (!leadId || !quoteId) return res.status(400).json({ error: 'leadId and quoteId are required' });

  try {
    const lead = await getLeadById(String(leadId).trim());
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const draftRow = buildQuoteRow({
      lead,
      quoteId,
      tradePersonName,
      tradePersonEmail,
      tradePersonPhone,
      mode: 'draft',
    });

    if (draftRow.TradePersonName) {
      await upsertQuoteRow(quoteId, draftRow, { req, caller: 'quote-init' });
      console.log(JSON.stringify({ tag: 'QUOTE_DRAFT_WRITE', quoteId }));
    } else {
      console.log(JSON.stringify({ tag: 'QUOTE_DRAFT_SKIPPED_NO_TRADESPERSON', quoteId }));
    }

    // Prefill for UI
    const mappedLead = {
      leadId: lead.Lead || '',
      customerName: lead.CustomerName || '',
      customerEmail: lead.CustomerEmail || '',
      customerPhone: lead.CustomerPhone || '',
      serviceType: lead.ServiceType || '',
      rooms: safeParseRooms(lead.Rooms),
      sqm: lead.Sqm || '',
      area: lead.Area || '',
      suburb: lead.Suburb || '',
      location: lead.Suburb || lead.Area || '',
      budget: lead.Budget || '',
      timeline: lead.Timelline || '',
      details: lead['Specfic Details'] || '',
      createdAt: lead.Time || '',
      status: lead.status || ''
    };

    return res.status(200).json({ lead: mappedLead, draft: draftRow });

  } catch (error) {
    console.error('Quote init error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function safeParseRooms(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { 
    const p = JSON.parse(val); 
    return Array.isArray(p) ? p : [p]; 
  } catch { 
    return [String(val)]; 
  }
}