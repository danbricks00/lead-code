import { 
  fetchQuoteData, 
  fetchLeadData, 
  generateQuotePdfContent, 
  generateQuotePdfBuffer 
} from './quote-utils.js';

// Re-export the generateQuotePdfBuffer function for backward compatibility
export { generateQuotePdfBuffer };

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { leadId, quoteId, token, download } = req.query;

    if (!leadId && !quoteId) {
      return res.status(400).json({ error: 'Either Lead ID or Quote ID is required' });
    }

    console.log('🔍 Generating quote document for:', { leadId, quoteId });

    let quoteData = null;
    let leadData = null;

    // First, try to get the actual quote data if quoteId is provided
    if (quoteId) {
      console.log('🔍 Fetching quote data for quote ID:', quoteId);
      quoteData = await fetchQuoteData(quoteId);
      console.log('📋 Quote data result:', quoteData ? 'Found' : 'Not found');
    }

    // If no quote data found, or no quoteId provided, get lead data
    if (!quoteData) {
      console.log('🔍 Fetching lead data for lead ID:', leadId);
      leadData = await fetchLeadData(leadId);
      console.log('📋 Lead data result:', leadData ? 'Found' : 'Not found');
    }

    if (!quoteData && !leadData) {
      return res.status(404).json({ error: 'Neither quote nor lead data found' });
    }

    // Generate HTML content using the unified function
    const htmlContent = generateQuotePdfContent(leadData || quoteData, quoteData);

    if (download === '1') {
      // Set headers for file download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="quote-${quoteId || leadId}.html"`);
    } else {
      // Set headers for inline viewing
      res.setHeader('Content-Type', 'text/html');
    }

    // Send the HTML content
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('❌ Error generating quote document:', error);
    return res.status(500).json({
      error: 'Failed to generate quote document',
      details: error.message
    });
  }
}
