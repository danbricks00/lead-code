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
        'https://lead-code-673tprb9r-leadcode-b19d9acc.vercel.app';

      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quote ${sampleQuote.quoteNumber} - ${sampleQuote.serviceType}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
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
            .quote-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #007bff;
              padding-bottom: 20px;
            }
            .quote-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .customer-info, .project-info, .pricing-info {
              margin-bottom: 25px;
            }
            .total-amount {
              background: #e8f5e8;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #155724;
              margin: 20px 0;
            }
            .tradesman-info {
              background: #fff3cd;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .item-breakdown {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
              white-space: pre-line;
            }
            .valid-until {
              text-align: center;
              color: #6c757d;
              font-style: italic;
              margin: 20px 0;
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

          <div class="quote-header">
            <h1>QUOTE</h1>
            <h2>Quote Number: ${quoteData.quoteNumber}</h2>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="quote-details">
            <div class="project-info">
              <h3>SERVICE:</h3>
              <p><strong>Underfloor Heating Installation</strong></p>
            </div>

            <div class="pricing-info">
              <h3>ITEM BREAKDOWN:</h3>
              <div class="item-breakdown">${quoteData.itemBreakdown}</div>
            </div>

            <div class="total-amount">
              TOTAL: $${quoteData.totalAmount}
            </div>

            <div class="valid-until">
              <strong>Valid until: ${quoteData.validUntil}</strong>
            </div>

            ${quoteData.additionalNotes ? `
            <div class="additional-notes">
              <h3>Additional Notes:</h3>
              <p>${quoteData.additionalNotes}</p>
            </div>
            ` : ''}

            <div class="tradesman-info">
              <h3>TRADESMAN DETAILS:</h3>
              <p><strong>${quoteData.tradesmanName}</strong><br>
              Phone: ${quoteData.tradesmanPhone}<br>
              Email: ${quoteData.tradesmanEmail}</p>
            </div>
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