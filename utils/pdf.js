import { generateQuotePDF as originalGenerateQuotePDF } from '../lib/pdfGenerator.js';

/**
 * Generate a PDF quote with fallback options
 * @param {Object} quoteData - The quote data
 * @param {Object} options - Options for PDF generation
 * @returns {Promise<Buffer>} - The PDF buffer
 */
export async function generateQuotePDF(quoteData, options = {}) {
  console.log(`[DEBUG] generateQuotePDF: Generating PDF for quoteId=${quoteData.quoteId}`);
  
  // Updated provider list with Adobe enabled and in correct priority order
  const providers = [
    { name: 'Adobe', enabled: true },     // Adobe first (500/month)
    { name: 'PDFShift', enabled: true },  // PDFShift second (50/month)
    { name: 'API2PDF', enabled: true }     // API2PDF last (paid fallback)
  ];
  
  let lastError = null;
  const startTime = Date.now();
  let attempts = [];
  
  for (const provider of providers) {
    if (!provider.enabled) continue;
    
    try {
      console.log(`[DEBUG] generateQuotePDF: Attempting to generate PDF with ${provider.name}`);
      attempts.push({ provider: provider.name, status: 'attempting' });
      
      const result = await originalGenerateQuotePDF(quoteData, {
        ...options,
        preferredProvider: provider.name
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[PDF] Successfully generated PDF with ${provider.name} in ${processingTime}ms`);
      attempts[attempts.length - 1].status = 'success';
      attempts[attempts.length - 1].time = processingTime;
      
      // Log all attempts for debugging
      console.log(`[PDF] Provider attempts: ${JSON.stringify(attempts)}`);
      
      return result;
    } catch (error) {
      console.error(`[DEBUG] generateQuotePDF: Failed with ${provider.name}:`, error.message);
      attempts[attempts.length - 1].status = 'failed';
      attempts[attempts.length - 1].error = error.message;
      lastError = error;
    }
  }
  
  // Log all attempts for debugging
  console.log(`[PDF] All providers failed. Attempts: ${JSON.stringify(attempts)}`);
  
  // If all providers failed, throw the last error
  throw lastError || new Error('All PDF providers failed');
}

/**
 * Generate HTML backup quote
 * @param {Object} quoteData - The quote data
 * @returns {string} - The HTML quote
 */
export function generateHTMLQuote(quoteData) {
  console.log(`[DEBUG] generateHTMLQuote: Generating HTML backup for quoteId=${quoteData.quoteId}`);
  
  // Basic HTML template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Quote #${quoteData.quoteId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .section-title { border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .total-section { margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }
        .total-row { display: flex; justify-content: space-between; }
        .final-total { font-weight: bold; font-size: 1.2em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quote #${quoteData.quoteId}</h1>
          <p>Professional Underfloor Heating Solutions</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">Quote Information</h2>
          <div class="info-grid">
            <div><strong>Quote ID:</strong> ${quoteData.quoteId}</div>
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-NZ')}</div>
            <div><strong>Valid Until:</strong> ${quoteData.validUntil ? new Date(quoteData.validUntil).toLocaleDateString('en-NZ') : 'N/A'}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Customer Details</h2>
          <div class="info-grid">
            <div><strong>Name:</strong> ${quoteData.customerName || 'N/A'}</div>
            <div><strong>Email:</strong> ${quoteData.customerEmail || 'N/A'}</div>
            <div><strong>Phone:</strong> ${quoteData.customerPhone || 'N/A'}</div>
            <div><strong>Address:</strong> ${quoteData.customerAddress || 'N/A'}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Tradesperson Details</h2>
          <div class="info-grid">
            <div><strong>Name:</strong> ${quoteData.tradespersonName || 'N/A'}</div>
            <div><strong>Email:</strong> ${quoteData.tradespersonEmail || 'N/A'}</div>
            <div><strong>Phone:</strong> ${quoteData.tradespersonPhone || 'N/A'}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Quote Summary</h2>
          <div class="total-section">
            <div class="total-row">
              <span>Labour:</span>
              <span>$${(quoteData.labourRate * quoteData.labourHours || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Materials:</span>
              <span>$${(quoteData.materialsCost * quoteData.materialsQuantity || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Travel:</span>
              <span>$${(quoteData.travelCost * quoteData.travelDistance || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Installation:</span>
              <span>$${(quoteData.installationCost || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${(quoteData.subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>GST (15%):</span>
              <span>$${(quoteData.gst || 0).toFixed(2)}</span>
            </div>
            <div class="total-row final-total">
              <span>Total (incl. GST):</span>
              <span>$${(quoteData.totalQuote || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">Notes</h2>
          <p>${quoteData.notes || 'No additional notes.'}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
