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

    // Use the unified /api/get-quote endpoint to fetch quote data
    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';
    let quoteData = null;

    try {
      const quoteResponse = await fetch(`${SITE_URL}/api/get-quote?leadId=${leadId || quoteId}`);
      const quoteResult = await quoteResponse.json();
      
      if (quoteResult.ok && quoteResult.quote) {
        quoteData = quoteResult.quote;
        console.log('🌐 Quote data served from unified /api/get-quote');
      } else {
        console.warn('⚠️ Could not fetch quote from unified endpoint, falling back to legacy methods');
        
        // Fallback to legacy methods
        if (quoteId) {
          quoteData = await fetchQuoteData(quoteId);
        }
        
        if (!quoteData) {
          const leadData = await fetchLeadData(leadId);
          if (leadData) {
            quoteData = leadData;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error fetching from unified endpoint, using legacy methods:', error.message);
      
      // Fallback to legacy methods
      if (quoteId) {
        quoteData = await fetchQuoteData(quoteId);
      }
      
      if (!quoteData) {
        const leadData = await fetchLeadData(leadId);
        if (leadData) {
          quoteData = leadData;
        }
      }
    }

    if (!quoteData) {
      return res.status(404).json({ error: 'Quote data not found' });
    }

    // Generate HTML content using the unified function
    const htmlContent = generateQuotePdfContent(quoteData, quoteData);
    
    // Log timeline information
    console.log(`📝 Quote rendered with timeline: ${quoteData.timeline || 'Not specified'}`);

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
