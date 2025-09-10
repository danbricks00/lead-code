/**
 * Quote Init API - Initialize Draft Quote
 * POST-only. Creates a new draft quote entry in Google Sheets.
 */

import { getLeadById, upsertQuoteRow, getQuotesByLeadId, getQuoteById } from '../../../utils/sheets.js';
import { buildQuoteRow } from '../../../utils/quotes.js';
import { generateVersionedQuoteId } from '../../../utils/quoteVersioning.js';

export default async function handler(req, res) {
  const requestId = `quote-init-${Date.now()}`;
  
  console.log(JSON.stringify({ 
    tag: 'QUOTE_INIT_REQ_START', 
    route: 'quote-init', 
    method: req.method,
    requestId,
    timestamp: new Date().toISOString()
  }));
  
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { leadId, tradePersonName = '', tradePersonEmail = '', tradePersonPhone = '' } = req.query || {};
  if (!leadId) return res.status(400).json({ error: 'leadId is required' });

  try {
    const lead = await getLeadById(String(leadId).trim());
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Get existing quotes for this lead
    const existingQuotes = await getQuotesByLeadId(String(leadId).trim());
    console.log('[QUOTE-INIT] Existing quotes for lead:', existingQuotes.length);
    
    // Check if any existing quote is not rejected by admin
    const nonRejectedQuotes = existingQuotes.filter(q => 
      q.AdminPersonStatus !== 'Declined' && 
      q.AdminPersonStatus !== 'Rejected' &&
      q.Decison !== 'Rejected' &&
      q.Decison !== 'Declined'
    );
    
    if (nonRejectedQuotes.length > 0) {
      console.log('[QUOTE-INIT] Blocking draft creation - existing non-rejected quotes found:', nonRejectedQuotes.map(q => ({
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

    // Generate versioned quote ID
    const versionedQuoteId = generateVersionedQuoteId(String(leadId).trim(), existingQuotes);
    console.log(`[QUOTE-INIT] Generated versioned quote ID: ${versionedQuoteId} for lead: ${leadId}`);

    const draftRow = buildQuoteRow({
      lead,
      quoteId: versionedQuoteId,
      tradePersonName,
      tradePersonEmail,
      tradePersonPhone,
      mode: 'draft',
    });

    if (draftRow.TradePersonName) {
      await upsertQuoteRow(versionedQuoteId, draftRow, { req, caller: 'quote-init' });
      console.log(JSON.stringify({ tag: 'QUOTE_DRAFT_WRITE', quoteId: versionedQuoteId }));
    } else {
      console.log(JSON.stringify({ tag: 'QUOTE_DRAFT_SKIPPED_NO_TRADESPERSON', quoteId: versionedQuoteId }));
    }

    // Prefill for UI
    const parsedRooms = safeParseRooms(lead.Rooms);
    console.log('[QUOTE-INIT] Raw Rooms data:', lead.Rooms);
    console.log('[QUOTE-INIT] Parsed Rooms data:', parsedRooms);

    const mappedLead = {
      leadId: lead.Lead || '',
      customerName: lead.CustomerName || '',
      customerEmail: lead.CustomerEmail || '',
      customerPhone: lead.CustomerPhone || '',
      serviceType: lead.ServiceType || '',
      rooms: parsedRooms,
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

    // Check for existing quotes to preload data for resubmission
    let existingQuoteData = null;
    if (existingQuotes.length > 0) {
      // Find the most recent rejected quote to preload its data
      const rejectedQuotes = existingQuotes.filter(q => 
        q.AdminPersonStatus === 'Declined' || 
        q.AdminPersonStatus === 'Rejected' ||
        q.Decison === 'Rejected' ||
        q.Decison === 'Declined'
      );
      
      if (rejectedQuotes.length > 0) {
        // Get the most recent rejected quote (assuming they're ordered by timestamp)
        const mostRecentRejected = rejectedQuotes[rejectedQuotes.length - 1];
        existingQuoteData = {
          labourRate: mostRecentRejected.LabourRate || '',
          labourHours: mostRecentRejected.LabourHours || '',
          materialsCost: mostRecentRejected.MaterialsCost || '',
          materialsQuantity: mostRecentRejected.MaterialsQuantity || '',
          travelCost: mostRecentRejected.TravelCost || '',
          travelDistance: mostRecentRejected.TravelDistance || '',
          installationCost: mostRecentRejected.InstallationCost || '',
          notes: mostRecentRejected.Notes || '',
          validUntil: mostRecentRejected.ValidUntil || '',
          tradePersonName: mostRecentRejected.TradePersonName || '',
          tradePersonEmail: mostRecentRejected.TradePersonEmail || '',
          tradePersonPhone: mostRecentRejected.TradePersonPhone || ''
        };
        console.log('[QUOTE-INIT] Preloading data from rejected quote:', existingQuoteData);
      }
    }

    console.log(JSON.stringify({ 
      tag: 'QUOTE_INIT_OK', 
      route: 'quote-init', 
      leadId,
      quoteId: versionedQuoteId,
      requestId,
      timestamp: new Date().toISOString()
    }));
    
    return res.status(200).json({ 
      lead: mappedLead, 
      draft: draftRow,
      existingQuote: existingQuoteData,
      quoteId: versionedQuoteId
    });

  } catch (error) {
    console.error(JSON.stringify({ 
      tag: 'QUOTE_INIT_FAIL', 
      route: 'quote-init', 
      error: error.message,
      requestId,
      timestamp: new Date().toISOString()
    }));
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
