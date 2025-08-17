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
            range: 'Quotes!A:Z',
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
              status: quoteRow[10],
              customerName: quoteRow[11],
              customerEmail: quoteRow[12],
              customerPhone: quoteRow[13],
              serviceType: quoteRow[14],
              location: quoteRow[15],
              projectDetails: quoteRow[16],
              projectSize: quoteRow[17],
              budget: quoteRow[18],
              timeline: quoteRow[19]
            };
            console.log('✅ Found quote data:', quoteData);
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // If no quote found, return error
      if (!quoteData) {
        console.log('❌ Quote not found');
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Quote Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                text-align: center;
                color: #333;
              }
              .error-box {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 8px;
                padding: 30px;
                margin: 20px 0;
              }
              .button {
                background: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin: 10px;
              }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h1>❌ Quote Not Found</h1>
              <p>The quote you're looking for could not be found.</p>
              <p>Please check the link or contact us for assistance.</p>
            </div>
            <a href="https://lead-code.vercel.app/" class="button">Back to Home</a>
          </body>
          </html>
        `);
      }

      // Generate breakdown table rows
      function generateBreakdownRows(itemBreakdown) {
        if (!itemBreakdown) {
          return `
            <tr>
              <td>Underfloor Heating Installation</td>
              <td>Professional installation service</td>
              <td>$${parseFloat(quoteData.totalAmount).toFixed(2)}</td>
            </tr>
          `;
        }

        const rows = [];
        const breakdownLines = itemBreakdown.split('\n').filter(line => line.trim());
        
        breakdownLines.forEach(line => {
          if (line.includes(':')) {
            const [item, description] = line.split(':');
            const amountMatch = description.match(/\\$([0-9.]+)/);
            const amount = amountMatch ? amountMatch[1] : '0.00';
            rows.push(`
              <tr>
                <td>${item.trim()}</td>
                <td>${description.replace(/\\$[0-9.]+/, '').trim()}</td>
                <td>$${amount}</td>
              </tr>
            `);
          }
        });

        return rows.length > 0 ? rows.join('') : `
          <tr>
            <td>Underfloor Heating Installation</td>
            <td>Professional installation service</td>
            <td>$${parseFloat(quoteData.totalAmount).toFixed(2)}</td>
          </tr>
        `;
      }

      const currentUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://lead-code.vercel.app';

      // Return the quote view page
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Quote ${quoteData.quoteNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .actions {
              background: #fff3cd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              border: 1px solid #ffeaa7;
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
              transition: background-color 0.3s;
            }
            .accept-btn:hover {
              background: #218838;
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
              transition: background-color 0.3s;
            }
            .decline-btn:hover {
              background: #c82333;
            }
            
            /* Header Section */
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding: 20px 0;
              border-bottom: 3px solid #4a90e2;
            }
            .company-name { 
              color: #4a90e2; 
              margin: 0 0 10px 0; 
              font-size: 32px; 
              font-weight: bold;
              text-transform: uppercase;
            }
            .quote-title { 
              color: #333; 
              margin: 10px 0; 
              font-size: 36px; 
              font-weight: bold;
            }
            .quote-info {
              display: flex;
              justify-content: space-around;
              flex-wrap: wrap;
              margin: 20px 0;
              gap: 20px;
            }
            .quote-info p {
              margin: 5px 0;
              font-size: 14px;
              font-weight: 600;
            }
            
            /* Details Section */
            .details-section {
              display: flex;
              gap: 20px;
              margin: 30px 0;
              flex-wrap: wrap;
            }
            .details-column {
              flex: 1;
              min-width: 300px;
              background: #f8f9fa;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .details-title {
              color: #333;
              margin: 0 0 15px 0;
              font-size: 18px;
              font-weight: bold;
              border-bottom: 2px solid #4a90e2;
              padding-bottom: 8px;
            }
            .details-content {
              font-size: 14px;
              line-height: 1.6;
            }
            .details-content p {
              margin: 8px 0;
            }
            .details-content strong {
              color: #4a90e2;
            }
            
            /* Breakdown Section */
            .quote-breakdown {
              margin: 30px 0;
            }
            .breakdown-title {
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 15px 0;
              color: #333;
              text-align: center;
            }
            .breakdown-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .breakdown-table th {
              background: #333;
              color: white;
              font-weight: bold;
              padding: 12px 8px;
              text-align: left;
              font-size: 14px;
            }
            .breakdown-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
              font-size: 14px;
            }
            .breakdown-table tr:nth-child(even) {
              background: #f8f9fa;
            }
            
            /* Total Section */
            .total-section {
              text-align: right;
              margin: 30px 0;
              padding: 20px;
              background: #e8f5e8;
              border: 2px solid #28a745;
              border-radius: 8px;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #155724;
              margin: 0;
            }
            
            /* Notes Section */
            .notes-section {
              margin: 30px 0;
              padding: 20px;
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 8px;
            }
            .notes-title {
              color: #856404;
              margin: 0 0 10px 0;
              font-size: 16px;
              font-weight: bold;
            }
            
            /* Footer */
            .footer {
              margin-top: 40px;
              padding: 20px;
              border-top: 2px solid #ddd;
              text-align: center;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .footer p {
              margin: 5px 0;
              font-size: 12px;
              color: #666;
            }
            .footer strong {
              color: #4a90e2;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
              body {
                padding: 10px;
              }
              .company-name {
                font-size: 24px;
              }
              .quote-title {
                font-size: 28px;
              }
              .details-section {
                flex-direction: column;
              }
              .details-column {
                min-width: auto;
              }
              .quote-info {
                flex-direction: column;
                text-align: center;
              }
              .breakdown-table {
                font-size: 12px;
              }
              .breakdown-table th,
              .breakdown-table td {
                padding: 8px 4px;
                font-size: 12px;
              }
              .total-amount {
                font-size: 20px;
              }
              .actions {
                padding: 15px;
              }
              .accept-btn,
              .decline-btn {
                display: block;
                margin: 10px auto;
                width: 200px;
              }
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
            <h1 class="company-name">KIWI TRADE</h1>
            <h2 class="quote-title">QUOTE</h2>
            <div class="quote-info">
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil ? new Date(quoteData.validUntil).toLocaleDateString('en-GB') : '30 days from date'}</p>
            </div>
          </div>

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
            <p><strong>Kiwi Trade</strong></p>
            <p>Professional underfloor heating solutions for your home</p>
            <p>This quote was generated using our automated system</p>
            <p>Thank you for choosing Kiwi Trade!</p>
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
