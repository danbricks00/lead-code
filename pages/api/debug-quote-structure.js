import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { quoteId } = req.query;

    console.log('🔍 Debug: Fetching quote structure for:', quoteId);

    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    // Get Quotes sheet headers and sample data
    const quotesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Quotes!A1:Z10',
    });

    const quotesRows = quotesResponse.data.values || [];
    const quotesHeaders = quotesRows[0] || [];

    // Get Leads sheet headers and sample data
    const leadsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Leads!A1:Z10',
    });

    const leadsRows = leadsResponse.data.values || [];
    const leadsHeaders = leadsRows[0] || [];

    // Find specific quote if quoteId provided
    let specificQuote = null;
    if (quoteId && quotesRows.length > 1) {
      const quoteRow = quotesRows.find(row => row[0] === quoteId);
      if (quoteRow) {
        specificQuote = {};
        quotesHeaders.forEach((header, index) => {
          specificQuote[header] = quoteRow[index] || '';
        });
      }
    }

    return res.status(200).json({
      success: true,
      debug: {
        quotesHeaders,
        leadsHeaders,
        quotesSample: quotesRows.slice(0, 3),
        leadsSample: leadsRows.slice(0, 3),
        specificQuote,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: error.message
    });
  }
}
