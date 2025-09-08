import { generateQuotePDF as originalGenerateQuotePDF } from '../lib/pdfGenerator.js';

// PDF provider configuration - PDFShift first, Adobe disabled
const PDF_PROVIDERS = [
    {
        name: 'PDFShift',
        enabled: true,
        priority: 1
    },
    {
        name: 'API2PDF',
        enabled: true,
        priority: 2
    },
    {
        name: 'Adobe',
        enabled: false, // DISABLED as requested
        priority: 3
    }
];

// Enhanced PDF generation with provider fallback
export async function generateQuotePDF(quoteData, options = {}) {
    const startTime = Date.now();
    console.log(`[PDF] Starting PDF generation for quoteId: ${quoteData.quoteId}`);
    
    // Sort providers by priority (enabled first)
    const enabledProviders = PDF_PROVIDERS
        .filter(provider => provider.enabled)
        .sort((a, b) => a.priority - b.priority);
    
    console.log(`[PDF] Available providers:`, enabledProviders.map(p => p.name));
    
    let lastError = null;
    
    for (const provider of enabledProviders) {
        try {
            console.log(`[PDF] Attempting generation with ${provider.name}...`);
            
            // Use the original PDF generator but with specific provider
            const result = await originalGenerateQuotePDF(quoteData, {
                ...options,
                preferredProvider: provider.name,
                fallbackProviders: enabledProviders.map(p => p.name)
            });
            
            if (result && result.buffer) {
                const processingTime = Date.now() - startTime;
                console.log(`[PDF] Successfully generated PDF with ${provider.name} in ${processingTime}ms`);
                return {
                    success: true,
                    buffer: result.buffer,
                    provider: provider.name,
                    processingTime
                };
            }
            
        } catch (error) {
            console.error(`[PDF] ${provider.name} failed:`, error.message);
            lastError = error;
            
            // Log error but don't throw - continue to next provider
            console.log(`[PDF] Falling back to next provider...`);
        }
    }
    
    // All providers failed
    const processingTime = Date.now() - startTime;
    console.error(`[PDF] All providers failed after ${processingTime}ms. Last error:`, lastError?.message);
    
    return {
        success: false,
        error: lastError?.message || 'All PDF providers failed',
        processingTime
    };
}

// Generate HTML backup quote
export function generateHTMLQuote(quoteData) {
    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const roomRows = (quoteData.rooms || []).map(room => `
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${room.name || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${room.dimensions || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd;">${room.sqm ? formatCurrency(room.sqm) + 'm²' : 'N/A'}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Quote ${quoteData.quoteId}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .totals { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .breakdown { margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #e9ecef; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Kiwi Trade</h1>
        <h2>Quote ${quoteData.quoteId}</h2>
        <p>Valid until: ${formatDate(quoteData.validUntil)}</p>
    </div>

    <div class="section">
        <h3>Customer Details</h3>
        <p><strong>Name:</strong> ${quoteData.customerName}</p>
        <p><strong>Email:</strong> ${quoteData.customerEmail}</p>
        <p><strong>Phone:</strong> ${quoteData.customerPhone}</p>
        <p><strong>Address:</strong> ${quoteData.customerAddress}</p>
        <p><strong>Service:</strong> ${quoteData.serviceType}</p>
    </div>

    <div class="section">
        <h3>Tradesperson Details</h3>
        <p><strong>Name:</strong> ${quoteData.tradespersonName}</p>
        <p><strong>Email:</strong> ${quoteData.tradespersonEmail}</p>
        <p><strong>Phone:</strong> ${quoteData.tradespersonPhone}</p>
        <p><strong>License:</strong> ${quoteData.tradespersonLicense}</p>
    </div>

    ${roomRows ? `
    <div class="section">
        <h3>Room Details</h3>
        <table>
            <thead>
                <tr>
                    <th>Room</th>
                    <th>Dimensions</th>
                    <th>Area</th>
                </tr>
            </thead>
            <tbody>
                ${roomRows}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h3>Cost Breakdown</h3>
        <div class="breakdown">
            <p><strong>Labour:</strong> ${formatCurrency(quoteData.breakdown?.labourTotal || 0)}</p>
            <p><strong>Materials:</strong> ${formatCurrency(quoteData.breakdown?.materialsTotal || 0)}</p>
            <p><strong>Travel:</strong> ${formatCurrency(quoteData.breakdown?.travelTotal || 0)}</p>
            <p><strong>Installation:</strong> ${formatCurrency(quoteData.breakdown?.installationCost || 0)}</p>
        </div>
    </div>

    <div class="section totals">
        <h3>Quote Summary</h3>
        <table>
            <tr>
                <td>Subtotal:</td>
                <td>$${formatCurrency(quoteData.totals?.subtotal || 0)}</td>
            </tr>
            <tr>
                <td>GST (15%):</td>
                <td>$${formatCurrency(quoteData.totals?.gst || 0)}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td><strong>$${formatCurrency(quoteData.totals?.final || 0)}</strong></td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>Terms & Conditions</h3>
        <p>This quote is valid for 30 days from the date of issue.</p>
        <p>Payment terms: 50% deposit required to commence work, balance on completion.</p>
        <p>All work is covered by our comprehensive warranty.</p>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
        <p>Generated on ${formatDate(new Date())} by Kiwi Trade</p>
    </div>
</body>
</html>
    `;
}
