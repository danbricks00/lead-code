import { getQuoteById, updateQuoteStatus } from './quote-database.js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleQuoteForm(req, res);
    } else if (req.method === 'POST') {
      return await handleQuoteSubmission(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Quote submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Quote submission failed',
      details: error.message
    });
  }
}

async function handleQuoteForm(req, res) {
  try {
    const { quoteId } = req.query;
    
    if (!quoteId) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    // Get quote details
    const quote = await getQuoteById(quoteId);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Return HTML form
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submit Quote - ${quote.ServiceType}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .project-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
          input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
          .pricing-info { background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .calculation { background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .total { background: #fff3cd; padding: 15px; border-radius: 8px; font-weight: bold; font-size: 18px; }
          button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
          button:hover { background: #0056b3; }
          .error { color: red; margin-top: 10px; }
          .success { color: green; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Submit Quote</h1>
            <p>Please provide your quote details for this project</p>
          </div>

          <div class="project-details">
            <h3>Project Details</h3>
            <p><strong>Service:</strong> ${quote.ServiceType}</p>
            <p><strong>Customer:</strong> ${quote.CustomerName}</p>
            <p><strong>Project:</strong> ${quote.ProjectDetails}</p>
            <p><strong>Location:</strong> ${quote.Location}</p>
            <p><strong>Budget:</strong> ${quote.Budget}</p>
            <p><strong>Timeline:</strong> ${quote.Timeline}</p>
          </div>

          <div class="pricing-info">
            <h3>Pricing Structure</h3>
            <p><strong>Materials:</strong> $30 per square meter</p>
            <p><strong>Labor:</strong> $50 per hour</p>
            <p><strong>GST:</strong> 15% of subtotal</p>
          </div>

          <form id="quoteForm">
            <input type="hidden" id="quoteId" value="${quoteId}">
            
            <div class="form-group">
              <label for="tradesmanName">Your Name:</label>
              <input type="text" id="tradesmanName" required>
            </div>

            <div class="form-group">
              <label for="tradesmanEmail">Your Email:</label>
              <input type="email" id="tradesmanEmail" required>
            </div>

            <div class="form-group">
              <label for="tradesmanPhone">Your Phone:</label>
              <input type="tel" id="tradesmanPhone" required>
            </div>

            <div class="form-group">
              <label for="squareMeters">Square Meters Required:</label>
              <input type="number" id="squareMeters" min="1" step="0.1" required>
            </div>

            <div class="form-group">
              <label for="laborHours">Estimated Labor Hours:</label>
              <input type="number" id="laborHours" min="1" step="0.5" required>
            </div>

            <div class="form-group">
              <label for="additionalNotes">Additional Notes:</label>
              <textarea id="additionalNotes" rows="4" placeholder="Any additional information, special requirements, or notes..."></textarea>
            </div>

            <div class="calculation">
              <h3>Quote Calculation</h3>
              <p><strong>Materials Cost:</strong> $<span id="materialsCost">0.00</span></p>
              <p><strong>Labor Cost:</strong> $<span id="laborCost">0.00</span></p>
              <p><strong>Subtotal:</strong> $<span id="subtotal">0.00</span></p>
              <p><strong>GST (15%):</strong> $<span id="gst">0.00</span></p>
            </div>

            <div class="total">
              <h3>Total Quote: $<span id="total">0.00</span></h3>
            </div>

            <button type="submit">Submit Quote</button>
          </form>

          <div id="message"></div>
        </div>

        <script>
          // Calculate quote in real-time
          function calculateQuote() {
            const squareMeters = parseFloat(document.getElementById('squareMeters').value) || 0;
            const laborHours = parseFloat(document.getElementById('laborHours').value) || 0;
            
            const materialsCost = squareMeters * 30;
            const laborCost = laborHours * 50;
            const subtotal = materialsCost + laborCost;
            const gst = subtotal * 0.15;
            const total = subtotal + gst;
            
            document.getElementById('materialsCost').textContent = materialsCost.toFixed(2);
            document.getElementById('laborCost').textContent = laborCost.toFixed(2);
            document.getElementById('subtotal').textContent = subtotal.toFixed(2);
            document.getElementById('gst').textContent = gst.toFixed(2);
            document.getElementById('total').textContent = total.toFixed(2);
          }

          // Add event listeners
          document.getElementById('squareMeters').addEventListener('input', calculateQuote);
          document.getElementById('laborHours').addEventListener('input', calculateQuote);

          // Handle form submission
          document.getElementById('quoteForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
              quoteId: document.getElementById('quoteId').value,
              tradesmanName: document.getElementById('tradesmanName').value,
              tradesmanEmail: document.getElementById('tradesmanEmail').value,
              tradesmanPhone: document.getElementById('tradesmanPhone').value,
              squareMeters: parseFloat(document.getElementById('squareMeters').value),
              laborHours: parseFloat(document.getElementById('laborHours').value),
              additionalNotes: document.getElementById('additionalNotes').value
            };

            try {
              const response = await fetch('/api/quote-submission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
              });

              const result = await response.json();
              
              if (result.success) {
                document.getElementById('message').innerHTML = '<div class="success">✅ Quote submitted successfully! The customer will be notified.</div>';
                document.getElementById('quoteForm').style.display = 'none';
              } else {
                document.getElementById('message').innerHTML = '<div class="error">❌ Error: ' + result.error + '</div>';
              }
            } catch (error) {
              document.getElementById('message').innerHTML = '<div class="error">❌ Error submitting quote: ' + error.message + '</div>';
            }
          });
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('❌ Quote form error:', error);
    res.status(500).json({ error: 'Failed to load quote form' });
  }
}

async function handleQuoteSubmission(req, res) {
  try {
    const {
      quoteId,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      squareMeters,
      laborHours,
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!quoteId || !tradesmanName || !tradesmanEmail || !tradesmanPhone || !squareMeters || !laborHours) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Calculate quote
    const materialsCost = squareMeters * 30;
    const laborCost = laborHours * 50;
    const subtotal = materialsCost + laborCost;
    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    // Get original quote
    const originalQuote = await getQuoteById(quoteId);
    if (!originalQuote) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    // Update quote with tradesman details and pricing
    const quoteData = {
      ...originalQuote,
      AssignedTradesman: tradesmanName,
      TradesmanEmail: tradesmanEmail,
      TradesmanPhone: tradesmanPhone,
      SquareMeters: squareMeters,
      LaborHours: laborHours,
      MaterialsCost: materialsCost,
      LaborCost: laborCost,
      Subtotal: subtotal,
      GST: gst,
      TotalAmount: total,
      AdditionalNotes: additionalNotes,
      Status: 'quote_submitted',
      QuoteSubmittedDate: new Date().toISOString()
    };

    await updateQuoteStatus(quoteId, 'quote_submitted', JSON.stringify(quoteData));

    // Save to Google Sheets
    await saveQuoteToSheets(quoteData);

    // Send email to customer with quote details
    await sendCustomerQuoteEmail(quoteData);

    console.log('✅ Quote submitted successfully:', {
      quoteId,
      tradesmanName,
      total: total.toFixed(2)
    });

    res.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: {
        quoteId,
        tradesmanName,
        total: total.toFixed(2),
        materialsCost: materialsCost.toFixed(2),
        laborCost: laborCost.toFixed(2),
        gst: gst.toFixed(2)
      }
    });

  } catch (error) {
    console.error('❌ Quote submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quote',
      details: error.message
    });
  }
}

async function saveQuoteToSheets(quoteData) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.log('⚠️ Google Sheets credentials not configured - skipping sheets update');
      return;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const values = [
      [
        new Date().toISOString(),
        quoteData.QuoteID,
        quoteData.CustomerName,
        quoteData.CustomerEmail,
        quoteData.ServiceType,
        quoteData.ProjectDetails,
        quoteData.AssignedTradesman,
        quoteData.TradesmanEmail,
        quoteData.TradesmanPhone,
        quoteData.SquareMeters,
        quoteData.LaborHours,
        quoteData.MaterialsCost,
        quoteData.LaborCost,
        quoteData.Subtotal,
        quoteData.GST,
        quoteData.TotalAmount,
        quoteData.AdditionalNotes,
        quoteData.Status
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Quotes!A:R',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('✅ Quote saved to Google Sheets');

  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error.message);
  }
}

async function sendCustomerQuoteEmail(quoteData) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured - skipping email');
      return;
    }

    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default || nodemailerModule;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Your Quote is Ready!</h2>
        <p>Dear ${quoteData.CustomerName},</p>
        <p>We have received a quote for your ${quoteData.ServiceType} project.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Quote Details</h3>
          <p><strong>Tradesman:</strong> ${quoteData.AssignedTradesman}</p>
          <p><strong>Contact:</strong> ${quoteData.TradesmanEmail} | ${quoteData.TradesmanPhone}</p>
          <p><strong>Project:</strong> ${quoteData.ProjectDetails}</p>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Quote Breakdown</h3>
          <p><strong>Materials (${quoteData.SquareMeters} sqm × $30):</strong> $${quoteData.MaterialsCost.toFixed(2)}</p>
          <p><strong>Labor (${quoteData.LaborHours} hours × $50):</strong> $${quoteData.LaborCost.toFixed(2)}</p>
          <p><strong>Subtotal:</strong> $${quoteData.Subtotal.toFixed(2)}</p>
          <p><strong>GST (15%):</strong> $${quoteData.GST.toFixed(2)}</p>
          <h3 style="color: #155724;"><strong>Total: $${quoteData.TotalAmount.toFixed(2)}</strong></h3>
        </div>

        ${quoteData.AdditionalNotes ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">Additional Notes</h4>
          <p>${quoteData.AdditionalNotes}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.BASE_URL || 'https://your-domain.vercel.app'}/api/quote-responses?action=accept&quoteId=${quoteData.QuoteID}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
            Accept Quote
          </a>
          <a href="${process.env.BASE_URL || 'https://your-domain.vercel.app'}/api/quote-responses?action=decline&quoteId=${quoteData.QuoteID}" 
             style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Decline Quote
          </a>
        </div>

        <p style="margin-top: 30px;">Best regards,<br><strong>Your Trade Team</strong></p>
      </div>
    `;

    const mailOptions = {
      from: process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`,
      to: quoteData.CustomerEmail,
      subject: `Your Quote is Ready - ${quoteData.ServiceType} Project`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Customer quote email sent successfully');

  } catch (error) {
    console.error('❌ Error sending customer email:', error.message);
  }
} 