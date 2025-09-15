import { google } from 'googleapis';

// Function to safely format dates
function formatDate(dateInput) {
  try {
    if (!dateInput) {
      console.log('🔍 No date input provided');
      return null;
    }
    
    console.log('🔍 Formatting date:', dateInput, 'Type:', typeof dateInput);
    
    let date;
    
    // Handle different input types
    if (typeof dateInput === 'number') {
      // Handle Excel serial date (days since 1900-01-01)
      if (dateInput > 25569) { // Excel date (after 1970)
        date = new Date((dateInput - 25569) * 86400 * 1000);
      } else {
        // Google Sheets serial date (days since 1899-12-30)
        date = new Date((dateInput - 2) * 86400 * 1000);
      }
      console.log('🔍 Parsed as serial date:', dateInput, '->', date);
    } else if (typeof dateInput === 'string') {
      // Trim whitespace
      const trimmedDate = dateInput.trim();
      
      // Handle empty or whitespace-only strings
      if (!trimmedDate) {
        console.log('🔍 Empty date string after trimming');
        return null;
      }
      
      // Try different date formats
      if (trimmedDate.includes('/')) {
        // Handle DD/MM/YYYY format
        const parts = trimmedDate.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          date = new Date(year, month, day);
          console.log('🔍 Parsed DD/MM/YYYY:', { day, month: month + 1, year });
        } else {
          date = new Date(trimmedDate);
        }
      } else if (trimmedDate.includes('-')) {
        // Handle YYYY-MM-DD or DD-MM-YYYY format
        date = new Date(trimmedDate);
      } else if (trimmedDate.match(/^\d{8}$/)) {
        // Handle YYYYMMDD format
        const year = trimmedDate.substring(0, 4);
        const month = trimmedDate.substring(4, 6);
        const day = trimmedDate.substring(6, 8);
        date = new Date(year, month - 1, day);
        console.log('🔍 Parsed YYYYMMDD:', { year, month, day });
      } else {
        // Try direct parsing
        date = new Date(trimmedDate);
      }
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.log('❌ Invalid date after parsing:', dateInput);
      return null; // Return null instead of 'Invalid Date' to trigger fallback
    }
    
    const formatted = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    console.log('✅ Date formatted successfully:', dateInput, '->', formatted);
    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error, 'Input:', dateInput);
    return null; // Return null instead of 'Invalid Date' to trigger fallback
  }
}

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
            range: 'Quotes!A:AZ',
          });

          const rows = response.data.values || [];
          
          // Find the quote by quoteId or quoteNumber
          const quoteRow = rows.find(row => 
            row[1] === quoteId || row[2] === quoteNumber
          );

          if (quoteRow) {
            // Get headers to find the correct column for ValidUntil
            const headers = rows[0] || [];
            const validUntilIndex = headers.indexOf('ValidUntil');
            console.log('🔍 Headers found:', headers);
            console.log('🔍 ValidUntil column index:', validUntilIndex);
            console.log('🔍 All column names:', headers.map((h, i) => `${String.fromCharCode(65 + i)}: ${h}`).join(', '));
            
            quoteData = {
              quoteId: quoteRow[1],
              quoteNumber: quoteRow[2],
              tradesmanName: quoteRow[3],
              tradesmanEmail: quoteRow[4],
              tradesmanPhone: quoteRow[5],
              totalAmount: quoteRow[6],
              itemBreakdown: quoteRow[7],
              validUntil: validUntilIndex !== -1 ? quoteRow[validUntilIndex] : quoteRow[8], // Use correct column or fallback
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
            console.log('🔍 ValidUntil raw value:', quoteData.validUntil, 'Type:', typeof quoteData.validUntil);
            console.log('🔍 ValidUntil from column:', validUntilIndex !== -1 ? `Column ${String.fromCharCode(65 + validUntilIndex)}` : 'Column I (fallback)');
            console.log('🔍 Raw quoteRow data:', quoteRow);
            if (validUntilIndex !== -1) {
              console.log('🔍 ValidUntil cell value:', quoteRow[validUntilIndex], 'Length:', quoteRow[validUntilIndex]?.length);
            }
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
              .error-title {
                color: #721c24;
                font-size: 24px;
                margin-bottom: 15px;
              }
              .back-link {
                display: inline-block;
                background: #4a90e2;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h1 class="error-title">Quote Not Found</h1>
              <p>The quote you're looking for could not be found.</p>
              <p>Quote ID: ${quoteId || 'Not provided'}</p>
              <p>Quote Number: ${quoteNumber || 'Not provided'}</p>
              <a href="/" class="back-link">Return to Home</a>
            </div>
          </body>
          </html>
        `);
      }

      const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
                box-sizing: border-box;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.6;
              color: #333;
              background: #fff;
            }
            
            /* Actions Section */
            .actions {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
              border: 2px solid #e9ecef;
            }
            .actions h2 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .actions p {
              margin: 0 0 20px 0;
              color: #666;
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
            <a href="${currentUrl}/api/customer-accept?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
               class="accept-btn">✅ Accept Quote</a>
            <a href="${currentUrl}/api/customer-decline?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
               class="decline-btn">❌ Decline Quote</a>
          </div>

          <div class="header">
            <h1 class="company-name">KIWI TRADE</h1>
            <h2 class="quote-title">QUOTE</h2>
            <div class="quote-info">
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
              <p><strong>Valid Until:</strong> ${formatDate(quoteData.validUntil) || formatDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))}</p>
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
            <a href="${currentUrl}/api/customer-accept?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
               class="accept-btn">✅ Accept Quote</a>
            <a href="${currentUrl}/api/customer-decline?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
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