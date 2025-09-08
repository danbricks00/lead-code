import { getGoogleSheetsClient, getSpreadsheetId } from '../../../lib/googleSheets.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { leadId, quoteId } = req.query;

    if (!leadId) {
      return res.status(400).json({ success: false, error: 'Lead ID is required' });
    }

    console.log('🔍 QUOTE-INIT: Fetching data for leadId:', leadId, quoteId ? `and quoteId: ${quoteId}` : '');

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Get lead data from Leads sheet
    const leadsRange = 'Leads!A:Z';
    const leadsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: leadsRange,
    });

    const leadsRows = leadsResponse.data.values || [];
    if (leadsRows.length === 0) {
      return res.status(404).json({ success: false, error: 'No leads found' });
    }

    // Find the lead by ID
    const leadHeaders = leadsRows[0];
    const leadIdIndex = leadHeaders.indexOf('Lead');
    
    if (leadIdIndex === -1) {
      return res.status(500).json({ success: false, error: 'Lead column not found in sheet' });
    }
    
    const leadRow = leadsRows.find(row => row[leadIdIndex] === leadId);

    if (!leadRow) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Map lead data according to exact headers
    const lead = {};
    leadHeaders.forEach((header, index) => {
      if (leadRow[index]) {
        lead[header] = leadRow[index];
      }
    });

    // Get quote data if quoteId is provided
    let quote = null;
    if (quoteId) {
      const quotesRange = 'Quotes!A:Z';
      const quotesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: quotesRange,
      });

      const quotesRows = quotesResponse.data.values || [];
      if (quotesRows.length > 0) {
        const quoteHeaders = quotesRows[0];
        const quoteIdIndex = quoteHeaders.indexOf('QuoteID');
        
        if (quoteIdIndex !== -1) {
          const quoteRow = quotesRows.find(row => row[quoteIdIndex] === quoteId);
          
          if (quoteRow) {
            quote = {};
            quoteHeaders.forEach((header, index) => {
              if (quoteRow[index]) {
                quote[header] = quoteRow[index];
              }
            });
          }
        }
      }
    }

    // Map lead fields to the expected format
    const mappedLead = {
      name: lead.CustomerName || '',
      email: lead.CustomerEmail || '',
      phone: lead.CustomerPhone || '',
      serviceType: lead.ServiceType || '',
      location: lead.Suburb || lead.Area || '',
      budget: lead.Budget || '',
      timeline: lead.Timelline || '', // Note the spelling as specified
      notes: lead['Specfic Details'] || '', // Note the spelling as specified
      meta: { 
        createdAt: lead.Time || '', 
        leadStatus: lead.status || '' 
      }
    };

    // Parse rooms if it's a JSON string
    if (lead.Rooms) {
      try {
        mappedLead.rooms = JSON.parse(lead.Rooms);
      } catch (e) {
        console.log('Could not parse rooms data as JSON, using as-is:', e);
        mappedLead.rooms = lead.Rooms;
      }
    }

    console.log('✅ QUOTE-INIT: Successfully fetched data (READ-ONLY)');
    
    return res.status(200).json({
      success: true,
      lead: mappedLead,
      quote: quote,
      rawLead: lead // Include raw lead data for debugging
    });

  } catch (error) {
    console.error('❌ QUOTE-INIT: Error fetching data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch data',
      details: error.message
    });
  }
}