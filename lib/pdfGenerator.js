// PDF Generation using HTML-to-PDF service
// This replaces the Xero PDF generation with a more reliable solution

export function getQuoteTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote Template</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 20mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .quote-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .company-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .quote-info {
            text-align: right;
            flex: 1;
        }
        
        .quote-title {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .quote-id {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .quote-date {
            font-size: 14px;
            color: #666;
        }
        
        /* Main Content Grid */
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        /* Customer Details */
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 8px;
        }
        
        .detail-label {
            font-weight: bold;
            width: 120px;
            color: #555;
        }
        
        .detail-value {
            flex: 1;
            color: #333;
        }
        
        /* Room Details Table */
        .room-details {
            grid-column: 1 / -1;
            margin-bottom: 20px;
        }
        
        .room-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .room-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .room-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
        }
        
        .room-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .room-table tr:last-child td {
            border-bottom: none;
        }
        
        /* Quote Summary */
        .quote-summary {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .summary-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-label {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-value {
            font-size: 18px;
            font-weight: bold;
        }
        
        .total-value {
            font-size: 24px;
            color: #fff;
        }
        
        /* Terms and Conditions */
        .terms {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }
        
        .terms-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .terms-text {
            font-size: 11px;
            color: #666;
            line-height: 1.5;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #666;
            font-size: 11px;
        }
        
        /* Responsive adjustments for print */
        @media print {
            body {
                font-size: 11px;
            }
            
            .quote-container {
                padding: 0;
            }
            
            .section {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="quote-container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">Kiwi Trade</div>
                <div class="company-tagline">Professional Underfloor Heating Solutions</div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{TRADESPERSON_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{TRADESPERSON_EMAIL}}</div>
                </div>
            </div>
            <div class="quote-info">
                <div class="quote-title">QUOTE</div>
                <div class="quote-id">Quote ID: {{QUOTE_ID}}</div>
                <div class="quote-date">Date: {{QUOTE_DATE}}</div>
                <div class="quote-date">Valid Until: {{VALID_UNTIL}}</div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="content-grid">
            <!-- Customer Details -->
            <div class="section">
                <div class="section-title">Customer Details</div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">{{CUSTOMER_NAME}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{CUSTOMER_EMAIL}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{CUSTOMER_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Address:</div>
                    <div class="detail-value">{{CUSTOMER_ADDRESS}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Service:</div>
                    <div class="detail-value">{{SERVICE_TYPE}}</div>
                </div>
            </div>

            <!-- Tradesperson Details -->
            <div class="section">
                <div class="section-title">Tradesperson Details</div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value">{{TRADESPERSON_NAME}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">{{TRADESPERSON_EMAIL}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Phone:</div>
                    <div class="detail-value">{{TRADESPERSON_PHONE}}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">License:</div>
                    <div class="detail-value">{{TRADESPERSON_LICENSE}}</div>
                </div>
            </div>
        </div>

        <!-- Room Details -->
        <div class="section room-details">
            <div class="section-title">Project Details</div>
            <table class="room-table">
                <thead>
                    <tr>
                        <th>Room Name</th>
                        <th>Dimensions</th>
                        <th>Square Meters</th>
                        <th>Labour Hours</th>
                        <th>Labour Cost</th>
                        <th>Materials</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{ROOM_ROWS}}
                </tbody>
            </table>
        </div>

        <!-- Quote Summary -->
        <div class="quote-summary">
            <div class="summary-title">Quote Summary</div>
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">Labour</div>
                    <div class="summary-value">${{LABOUR_TOTAL}}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Materials</div>
                    <div class="summary-value">${{MATERIALS_TOTAL}}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Travel</div>
                    <div class="summary-value">${{TRAVEL_TOTAL}}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Installation</div>
                    <div class="summary-value">${{INSTALLATION_TOTAL}}</div>
                </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <div class="summary-label">Subtotal (excl. GST)</div>
                <div class="summary-value" style="font-size: 20px;">${{SUBTOTAL}}</div>
            </div>
            <div style="text-align: center;">
                <div class="summary-label">GST (15%)</div>
                <div class="summary-value" style="font-size: 20px;">${{GST}}</div>
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <div class="summary-label">Total (incl. GST)</div>
                <div class="total-value">${{FINAL_TOTAL}}</div>
            </div>
        </div>

        <!-- Terms and Conditions -->
        <div class="terms">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-text">
                • This quote is valid for 14 days from the date of issue.<br>
                • Payment terms: 50% deposit required to commence work, balance due upon completion.<br>
                • All work is covered by our comprehensive warranty.<br>
                • Installation includes all necessary materials and labor unless otherwise specified.<br>
                • Any changes to the scope of work may result in additional charges.<br>
                • We are fully licensed and insured for your peace of mind.
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing Kiwi Trade for your underfloor heating needs.</p>
            <p>For any questions about this quote, please contact us at {{TRADESPERSON_EMAIL}} or {{TRADESPERSON_PHONE}}</p>
        </div>
    </div>
</body>
</html>`;
}

export async function generateQuotePDF(quoteData) {
  try {
    console.log('🔄 Generating PDF for quote:', quoteData.quoteId);
    
    // Get the HTML template directly (embedded)
    const templateHTML = getQuoteTemplate();
    
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
  console.log('🔍 PDF Template Data received:', JSON.stringify(data, null, 2));
  
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
  
  // Financial summary with safe handling
  const safeFormatCurrency = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '$0.00' : formatCurrency(num);
  };
  
  console.log('💰 Totals data:', data.totals);
  
  html = html.replace(/{{LABOUR_TOTAL}}/g, safeFormatCurrency(data.totals?.labour || 0));
  html = html.replace(/{{MATERIALS_TOTAL}}/g, safeFormatCurrency(data.totals?.materials || 0));
  html = html.replace(/{{TRAVEL_TOTAL}}/g, safeFormatCurrency(data.totals?.travel || 0));
  html = html.replace(/{{INSTALLATION_TOTAL}}/g, safeFormatCurrency(data.totals?.installation || 0));
  html = html.replace(/{{SUBTOTAL}}/g, safeFormatCurrency(data.totals?.subtotal || 0));
  html = html.replace(/{{GST}}/g, safeFormatCurrency(data.totals?.gst || 0));
  html = html.replace(/{{FINAL_TOTAL}}/g, safeFormatCurrency(data.totals?.final || 0));
  
  console.log('✅ Template replacement completed');
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
