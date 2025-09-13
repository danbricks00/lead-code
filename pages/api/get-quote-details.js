import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { quoteId } = req.query;

    if (!quoteId) {
      return res.status(400).json({ success: false, error: 'Quote ID is required' });
    }

    console.log('🔍 Fetching quote details for:', quoteId);

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Get quote data from Quotes sheet
    const quotesRange = 'Quotes!A:AL';
    const quotesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: quotesRange,
    });

    const quotesRows = quotesResponse.data.values || [];
    if (quotesRows.length === 0) {
      return res.status(404).json({ success: false, error: 'No quotes found' });
    }

    // Find the quote by ID
    const headers = quotesRows[0];
    const quoteRow = quotesRows.find(row => row[0] === quoteId);

    if (!quoteRow) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    // Map quote data
    const quoteData = {};
    headers.forEach((header, index) => {
      if (quoteRow[index]) {
        quoteData[header] = quoteRow[index];
      }
    });

    // Get lead data from Leads sheet
    const leadsRange = 'Leads!A:L';
    const leadsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: leadsRange,
    });

    const leadsRows = leadsResponse.data.values || [];
    let leadData = {};

    if (leadsRows.length > 0) {
      const leadHeaders = leadsRows[0];
      const leadRow = leadsRows.find(row => row[0] === quoteData.LeadId);

      if (leadRow) {
        leadHeaders.forEach((header, index) => {
          if (leadRow[index]) {
            leadData[header] = leadRow[index];
          }
        });
      }
    }

    // Parse rooms data if available (check both Quotes and Leads tabs)
    let rooms = [];
    if (quoteData.Rooms) {
      try {
        rooms = JSON.parse(quoteData.Rooms);
        console.log('✅ Found room data in Quotes tab:', rooms);
      } catch (e) {
        console.log('Could not parse rooms data from Quotes tab:', e);
      }
    } else if (leadData.Rooms) {
      try {
        rooms = JSON.parse(leadData.Rooms);
        console.log('✅ Found room data in Leads tab:', rooms);
      } catch (e) {
        console.log('Could not parse rooms data from Leads tab:', e);
      }
    }

    // Calculate totals - handle both column name formats
    const labourRate = parseFloat(quoteData.LabourRate || quoteData['Labour Cost']) || 0;
    const labourHours = parseFloat(quoteData.LabourHours || quoteData['Labour Hour']) || 0;
    const materialsCost = parseFloat(quoteData.MaterialsCost || quoteData['Materials Cost']) || 0;
    const materialsQuantity = parseFloat(quoteData.MaterialsQuantity || quoteData['Materials Quanitity']) || 0;
    const travelCost = parseFloat(quoteData.TravelCost || quoteData['Travel Cost']) || 0;
    const travelDistance = parseFloat(quoteData.TravelDistance || quoteData['Travel Distance']) || 0;
    const installationCost = parseFloat(quoteData.InstallationCost || quoteData['Installation Cost']) || 0;

    const labourTotal = labourRate * labourHours;
    const materialsTotal = materialsCost * materialsQuantity;
    const travelTotal = travelCost * travelDistance;
    const subtotal = labourTotal + materialsTotal + travelTotal + installationCost;
    const gst = subtotal * 0.15;
    const finalTotal = subtotal + gst;

    // Prepare response data
    const responseData = {
      quoteId: quoteData.QuoteId || quoteId,
      quoteDate: quoteData.QuoteDate || new Date().toISOString(),
      validUntil: quoteData.ValidUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      customerName: leadData.CustomerName || 'N/A',
      customerEmail: leadData.CustomerEmail || 'N/A',
      customerPhone: leadData.CustomerPhone || 'N/A',
      customerAddress: leadData.Location || 'N/A',
      serviceType: leadData.ServiceType || 'Underfloor Heating',
      TradePersonName: quoteData.TradePersonName || 'N/A',
      tradespersonEmail: quoteData.TradespersonEmail || 'N/A',
      tradespersonPhone: quoteData.TradespersonPhone || 'N/A',
      tradespersonLicense: 'Licensed Tradesperson',
      rooms: rooms.map(room => ({
        name: room.name,
        dimensions: room.dimensions || room.originalInput,
        sqm: room.sqm,
        labourHours: labourHours,
        labourCost: labourTotal / (rooms.length || 1),
        materialsCost: materialsTotal / (rooms.length || 1)
      })),
      totals: {
        labour: labourTotal,
        materials: materialsTotal,
        travel: travelTotal,
        installation: installationCost,
        subtotal: subtotal,
        gst: gst,
        final: finalTotal
      }
    };

    console.log('✅ Quote details retrieved successfully');

    return res.status(200).json({
      success: true,
      quote: quoteData, // Raw quote data from sheets
      lead: leadData,   // Raw lead data from sheets
      quoteData: responseData // Formatted data for PDF generation
    });

  } catch (error) {
    console.error('❌ Error fetching quote details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quote details',
      details: error.message
    });
  }
}