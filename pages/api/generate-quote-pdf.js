import { generateQuotePDF } from '../../lib/pdfGenerator.js';

export default async function handler(req, res) {
  console.log('📄 PDF Generation API called:', req.method);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      console.log('📊 Quote data received for PDF generation:', {
        quoteId: quoteData.quoteId,
        customerName: quoteData.customerName,
        roomsCount: quoteData.rooms?.length || 0
      });

      // Validate required data
      if (!quoteData.quoteId) {
        return res.status(400).json({
          success: false,
          error: 'Quote ID is required'
        });
      }

      // Generate PDF
      const pdfBuffer = await generateQuotePDF(quoteData);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quote-${quoteData.quoteId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      // Send PDF buffer
      return res.status(200).send(pdfBuffer);

    } catch (error) {
      console.error('❌ PDF generation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF',
        details: error.message
      });
    }
  }

  if (req.method === 'GET') {
    // Return template preview
    try {
      const templateResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/quote-template.html`);
      const templateHTML = await templateResponse.text();
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(templateHTML);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load template'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
