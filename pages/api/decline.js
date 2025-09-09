/**
 * Decline API - State Update Only
 * POST-only. Update same QuoteID row using buildQuoteRow with mode rejected.
 * No PDF here.
 */

import { getLeadById, upsertQuoteRow } from '../../utils/sheets.js';
import { buildQuoteRow } from '../../utils/quotes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { quoteId, leadId, tradePersonName = '', tradePersonEmail = '', tradePersonPhone = '' } = body || {};
    if (!quoteId || !leadId) return res.status(400).json({ error: 'quoteId and leadId required' });

    const lead = await getLeadById(String(leadId).trim());
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const rejectedRow = buildQuoteRow({ 
      lead, 
      quoteId, 
      tradePersonName, 
      tradePersonEmail, 
      tradePersonPhone, 
      mode: 'rejected' 
    });
    
    const result = await upsertQuoteRow(quoteId, rejectedRow, { req, caller: 'decline' });
    console.log(JSON.stringify({ tag: 'QUOTE_REJECTED', quoteId, action: result?.action }));
    
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Decline error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
