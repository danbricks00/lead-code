// PDF Generation using HTML-to-PDF service
// This replaces the Xero PDF generation with a more reliable solution

export async function generateQuotePDF(quoteData) {
  try {
    console.log('🔄 Generating PDF for quote:', quoteData.quoteId);
    
    // Load the HTML template
    const templateResponse = await fetch('/quote-template.html');
    const templateHTML = await templateResponse.text();
    
    // Replace placeholders with actual data
    const filledHTML = fillTemplate(templateHTML, quoteData);
    
    // Generate PDF using HTML-to-PDF service
    const pdfBuffer = await convertHTMLToPDF(filledHTML);
    
    console.log('✅ PDF generated successfully');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

function fillTemplate(template, data) {
  let html = template;
  
  // Basic quote information
  html = html.replace(/{{QUOTE_ID}}/g, data.quoteId || 'N/A');
  html = html.replace(/{{QUOTE_DATE}}/g, formatDate(data.quoteDate || new Date()));
  html = html.replace(/{{VALID_UNTIL}}/g, formatDate(data.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
  
  // Customer details
  html = html.replace(/{{CUSTOMER_NAME}}/g, data.customerName || 'N/A');
  html = html.replace(/{{CUSTOMER_EMAIL}}/g, data.customerEmail || 'N/A');
  html = html.replace(/{{CUSTOMER_PHONE}}/g, data.customerPhone || 'N/A');
  html = html.replace(/{{CUSTOMER_ADDRESS}}/g, data.customerAddress || 'N/A');
  html = html.replace(/{{SERVICE_TYPE}}/g, data.serviceType || 'Underfloor Heating');
  
  // Tradesperson details
  html = html.replace(/{{TRADESPERSON_NAME}}/g, data.tradespersonName || 'N/A');
  html = html.replace(/{{TRADESPERSON_EMAIL}}/g, data.tradespersonEmail || 'N/A');
  html = html.replace(/{{TRADESPERSON_PHONE}}/g, data.tradespersonPhone || 'N/A');
  html = html.replace(/{{TRADESPERSON_LICENSE}}/g, data.tradespersonLicense || 'N/A');
  
  // Room details
  html = html.replace(/{{ROOM_ROWS}}/g, generateRoomRows(data.rooms || []));
  
  // Financial summary
  html = html.replace(/{{LABOUR_TOTAL}}/g, formatCurrency(data.totals?.labour || 0));
  html = html.replace(/{{MATERIALS_TOTAL}}/g, formatCurrency(data.totals?.materials || 0));
  html = html.replace(/{{TRAVEL_TOTAL}}/g, formatCurrency(data.totals?.travel || 0));
  html = html.replace(/{{INSTALLATION_TOTAL}}/g, formatCurrency(data.totals?.installation || 0));
  html = html.replace(/{{SUBTOTAL}}/g, formatCurrency(data.totals?.subtotal || 0));
  html = html.replace(/{{GST}}/g, formatCurrency(data.totals?.gst || 0));
  html = html.replace(/{{FINAL_TOTAL}}/g, formatCurrency(data.totals?.final || 0));
  
  return html;
}

function generateRoomRows(rooms) {
  if (!rooms || rooms.length === 0) {
    return `
      <tr>
        <td colspan="7" style="text-align: center; color: #666; font-style: italic;">
          No room details available
        </td>
      </tr>
    `;
  }
  
  return rooms.map(room => `
    <tr>
      <td>${room.name || 'N/A'}</td>
      <td>${room.dimensions || 'N/A'}</td>
      <td>${room.sqm ? `${room.sqm}m²` : 'N/A'}</td>
      <td>${room.labourHours || 'N/A'}</td>
      <td>${formatCurrency(room.labourCost || 0)}</td>
      <td>${formatCurrency(room.materialsCost || 0)}</td>
      <td>${formatCurrency((room.labourCost || 0) + (room.materialsCost || 0))}</td>
    </tr>
  `).join('');
}

async function convertHTMLToPDF(html) {
  // Option 1: Use PDFShift (recommended)
  if (process.env.PDFSHIFT_API_KEY) {
    return await convertWithPDFShift(html);
  }
  
  // Option 2: Use HTML/CSS to PDF API
  if (process.env.HTMLCSSTOPDF_API_KEY) {
    return await convertWithHTMLCSSTOPDF(html);
  }
  
  // Fallback: Return HTML for client-side conversion
  console.log('⚠️ No PDF service API key found, returning HTML for client-side conversion');
  return Buffer.from(html, 'utf8');
}

async function convertWithPDFShift(html) {
  const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: html,
      format: 'A4',
      margin: '20mm',
      landscape: true,
      print_background: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`PDFShift API error: ${response.status} ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

async function convertWithHTMLCSSTOPDF(html) {
  const response = await fetch('https://htmlcsstoimage.com/demo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HTMLCSSTOPDF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html: html,
      format: 'pdf',
      landscape: true,
      margin: '20mm'
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTML/CSS to PDF API error: ${response.status} ${response.statusText}`);
  }
  
  return Buffer.from(await response.arrayBuffer());
}

function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatCurrency(amount) {
  if (typeof amount !== 'number') return '0.00';
  return amount.toFixed(2);
}

// Client-side PDF generation using jsPDF (fallback)
export function generateClientSidePDF(quoteData) {
  // This would be used if no server-side PDF service is available
  // Implementation would use jsPDF library
  console.log('Client-side PDF generation not implemented yet');
  throw new Error('Client-side PDF generation not implemented');
}
