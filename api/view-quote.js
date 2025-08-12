import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('🔍 View quote API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { quoteId, quoteNumber } = req.query;
      
      // Try to fetch quote data from Google Sheets
      let quoteData = null;
      
      if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          // Fetch quote data from Google Sheets
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:K',
          });

          const rows = response.data.values || [];
          
          // Find the quote by quoteId or quoteNumber
          const quoteRow = rows.find(row => 
            row[1] === quoteId || row[2] === quoteNumber
          );

          if (quoteRow) {
            quoteData = {
              quoteId: quoteRow[1],
              quoteNumber: quoteRow[2],
              tradesmanName: quoteRow[3],
              tradesmanEmail: quoteRow[4],
              tradesmanPhone: quoteRow[5],
              totalAmount: quoteRow[6],
              itemBreakdown: quoteRow[7],
              validUntil: quoteRow[8],
              additionalNotes: quoteRow[9],
              status: quoteRow[10]
            };
            console.log('✅ Found quote data:', quoteData);
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // Fallback to sample data if no quote found
      if (!quoteData) {
        quoteData = {
          quoteId: quoteId || 'QUOTE-001',
          quoteNumber: quoteNumber || 'QU1001',
          customerName: 'John Smith',
          customerAddress: '123 Main Street, Auckland',
          serviceType: 'Underfloor Heating Installation',
          projectDetails: 'Installation of underfloor heating system in bathroom areas',
          tradesmanName: 'Heat NZ Ltd',
          tradesmanPhone: '+64 9 123 4567',
          tradesmanEmail: 'info@heatnz.co.nz',
          totalAmount: '8,500.00',
          itemBreakdown: `
            • Underfloor heating mats (67 sqm): $4,020.00
            • Thermostat and controls: $850.00
            • Installation labor (16 hours): $2,400.00
            • Materials and fittings: $1,230.00
          `,
          validUntil: '2024-09-10',
          additionalNotes: 'Price includes GST. Installation to be completed within 2 weeks of acceptance.'
        };
        console.log('⚠️ Using sample quote data');
      }

      const currentUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://lead-code.vercel.app';

      // Function to generate breakdown table rows from itemBreakdown text
      const generateBreakdownRows = (itemBreakdown) => {
        if (!itemBreakdown) {
          return '<tr><td colspan="3">No breakdown provided</td></tr>';
        }
        
        // Split by newlines and process each line
        const lines = itemBreakdown.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
          return '<tr><td colspan="3">No breakdown provided</td></tr>';
        }
        
        return lines.map(line => {
          // Try to extract item name and amount from the line
          const trimmedLine = line.trim();
          if (trimmedLine.includes('$')) {
            // If line contains $, try to extract amount
            const parts = trimmedLine.split('$');
            const itemName = parts[0].trim();
            const amount = parts[1] ? '$' + parts[1].trim() : '';
            return `<tr><td>${itemName}</td><td>${itemName}</td><td>${amount}</td></tr>`;
          } else {
            // If no $, treat as item name only
            return `<tr><td>${trimmedLine}</td><td>${trimmedLine}</td><td>$${quoteData.totalAmount}</td></tr>`;
          }
        }).join('');
      };

      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quote ${quoteData.quoteNumber} - ${quoteData.serviceType || 'Underfloor Heating'}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 900px; 
              margin: 0 auto; 
              padding: 20px; 
              line-height: 1.6;
              color: #333;
            }
            .actions {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
            }
            .accept-btn {
              background: #28a745;
              color: white;
              padding: 12px 30px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              margin-right: 10px;
              text-decoration: none;
              display: inline-block;
            }
            .decline-btn {
              background: #dc3545;
              color: white;
              padding: 12px 30px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              text-decoration: none;
              display: inline-block;
            }
            .header { 
              text-align: center; 
              margin-bottom: 25px; 
            }
            .company-name { 
              color: #4a90e2; 
              margin: 0; 
              font-size: 18px; 
              font-weight: normal;
            }
            .quote-title { 
              color: #333; 
              margin: 10px 0 5px 0; 
              font-size: 24px; 
              font-weight: bold;
            }
            .quote-number { 
              color: #333; 
              margin: 5px 0; 
              font-size: 14px; 
              font-weight: bold;
            }
            .quote-dates { 
              color: #333; 
              margin: 5px 0; 
              font-size: 12px; 
            }
            .divider { 
              border-top: 1px solid #333; 
              margin: 15px 0; 
            }
            .details-section { 
              display: flex; 
              margin: 20px 0; 
              gap: 20px;
            }
            .details-column { 
              flex: 1; 
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 4px; 
              border-left: 4px solid #4a90e2; 
            }
            .details-title { 
              color: #333; 
              margin: 0 0 10px 0; 
              font-size: 14px; 
              font-weight: bold;
            }
            .details-content { 
              font-size: 12px; 
              line-height: 1.6;
            }
            .details-content p { 
              margin: 5px 0; 
            }
            .quote-breakdown { 
              margin: 20px 0; 
            }
            .breakdown-title { 
              color: #333; 
              margin: 0 0 10px 0; 
              font-size: 14px; 
              font-weight: bold;
              border-left: 4px solid #4a90e2; 
              padding-left: 10px;
            }
            .breakdown-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0; 
              font-size: 12px;
            }
            .breakdown-table th, .breakdown-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            .breakdown-table th { 
              background: #333; 
              color: white; 
              font-weight: bold; 
            }
            .total-section { 
              text-align: right; 
              margin: 20px 0; 
            }
            .total-amount { 
              font-size: 18px; 
              font-weight: bold; 
              color: #333;
            }
            .notes-section { 
              margin: 20px 0; 
            }
            .notes-title { 
              color: #333; 
              margin: 0 0 10px 0; 
              font-size: 14px; 
              font-weight: bold;
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 15px; 
              border-top: 1px solid #ddd; 
              font-size: 10px; 
              color: #666;
              text-align: center;
            }
            .footer p { 
              margin: 3px 0; 
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <h2>Quote ${quoteData.quoteNumber}</h2>
            <p>Please review the quote below and choose your action:</p>
            <a href="${currentUrl}/api/accept-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
               class="accept-btn">✅ Accept Quote</a>
            <a href="${currentUrl}/api/decline-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
               class="decline-btn">❌ Decline Quote</a>
          </div>

          <div class="header">
            <h1 class="company-name">KIWI UNDERFLOOR HEATING</h1>
            <h2 class="quote-title">QUOTE</h2>
            <p class="quote-number">Quote Number: ${quoteData.quoteNumber}</p>
            <p class="quote-dates">Date: ${new Date().toLocaleDateString('en-GB')}</p>
            <p class="quote-dates">Valid Until: ${quoteData.validUntil ? new Date(quoteData.validUntil).toLocaleDateString('en-GB') : '30 days from date'}</p>
          </div>

          <div class="divider"></div>

          <div class="details-section">
            <div class="details-column">
              <h3 class="details-title">Customer Details</h3>
              <div class="details-content">
                <p><strong>Name:</strong> ${quoteData.customerName || 'Not specified'}</p>
                <p><strong>Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
                <p><strong>Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
                <p><strong>Address:</strong> ${quoteData.location || 'Auckland'}</p>
              </div>
            </div>
            <div class="details-column">
              <h3 class="details-title">Tradesman Details</h3>
              <div class="details-content">
                <p><strong>Company:</strong> ${quoteData.tradesmanName}</p>
                <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
                <p><strong>Phone:</strong> ${quoteData.tradesmanPhone || 'Not specified'}</p>
                <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="quote-breakdown">
            <h3 class="breakdown-title">Quote Breakdown</h3>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${generateBreakdownRows(quoteData.itemBreakdown)}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-amount">Total Amount: $${quoteData.totalAmount}</div>
          </div>

          ${quoteData.additionalNotes ? `
          <div class="notes-section">
            <h3 class="notes-title">Additional Notes</h3>
            <p>${quoteData.additionalNotes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>Kiwi Underfloor Heating</strong></p>
            <p>Professional underfloor heating solutions for your home</p>
            <p>This quote was generated using our automated system</p>
            <p>Thank you for choosing Kiwi Underfloor Heating!</p>
          </div>

          <div class="actions">
            <p><strong>Ready to proceed?</strong></p>
            <a href="${currentUrl}/api/accept-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
               class="accept-btn">✅ Accept Quote</a>
            <a href="${currentUrl}/api/decline-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
               class="decline-btn">❌ Decline Quote</a>
          </div>

          <script>
            // Add confirmation dialogs
            document.querySelectorAll('.accept-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                if (!confirm('Are you sure you want to accept this quote?')) {
                  e.preventDefault();
                }
              });
            });
            
            document.querySelectorAll('.decline-btn').forEach(btn => {
              btn.addEventListener('click', (e) => {
                if (!confirm('Are you sure you want to decline this quote?')) {
                  e.preventDefault();
                }
              });
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('❌ Error viewing quote:', error);
      res.status(500).send('Error loading quote');
    }
  }
} 