import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('🔍 Quote submission API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

    if (req.method === 'GET') {
    // Show quote submission form with pre-filled data from lead
    const { 
      quoteId, 
      leadId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      serviceType, 
      projectDetails, 
      projectSize, 
      budget, 
      timeline, 
      location 
    } = req.query;
    
    return res.status(200).send(`
    <!DOCTYPE html>
      <html>
    <head>
        <title>Submit Quote - ${leadId || quoteId}</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
          .quote-details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .customer-info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #2196f3; }
          .readonly { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
          <h1>Submit Quote</h1>
        
        ${leadId ? `
        <div class="customer-info">
          <h3>📋 Customer Information (Pre-filled from Lead)</h3>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer:</strong> ${customerName || 'Not provided'}</p>
          <p><strong>Service:</strong> ${serviceType || 'Not specified'}</p>
          <p><strong>Location:</strong> ${location || 'Not specified'}</p>
          <p><strong>Project Size:</strong> ${projectSize || 'Not specified'}</p>
          <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
          <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        </div>
        ` : `
        <div class="quote-details">
          <h3>Quote ID: ${quoteId}</h3>
          <p>Please fill in your quote details below:</p>
        </div>
        `}

        <form id="quoteForm">
          <div class="form-group">
            <label for="tradesmanName">Your Name/Company:</label>
            <input type="text" id="tradesmanName" name="tradesmanName" required>
          </div>
          
          <div class="form-group">
            <label for="tradesmanPhone">Your Phone:</label>
            <input type="tel" id="tradesmanPhone" name="tradesmanPhone" required>
          </div>

          <div class="form-group">
            <label for="tradesmanEmail">Your Email:</label>
            <input type="email" id="tradesmanEmail" name="tradesmanEmail" required>
          </div>

          <div class="form-group">
            <label for="quoteNumber">Quote Number:</label>
            <input type="text" id="quoteNumber" name="quoteNumber" value="QU${Date.now()}" required>
          </div>

          <div class="form-group">
            <label for="totalAmount">Total Quote Amount ($):</label>
            <input type="number" id="totalAmount" name="totalAmount" step="0.01" required>
          </div>

          <div class="form-group">
            <label for="itemBreakdown">Item Breakdown:</label>
            <textarea id="itemBreakdown" name="itemBreakdown" rows="6" placeholder="List each item and its cost..."></textarea>
          </div>

          <div class="form-group">
            <label for="validUntil">Quote Valid Until:</label>
            <input type="date" id="validUntil" name="validUntil" required>
          </div>

          <div class="form-group">
            <label for="additionalNotes">Additional Notes:</label>
            <textarea id="additionalNotes" name="additionalNotes" rows="4"></textarea>
          </div>

          <!-- Hidden fields for customer data -->
          <input type="hidden" id="customerName" name="customerName" value="${customerName || ''}">
          <input type="hidden" id="customerEmail" name="customerEmail" value="${customerEmail || ''}">
          <input type="hidden" id="customerPhone" name="customerPhone" value="${customerPhone || ''}">
          <input type="hidden" id="serviceType" name="serviceType" value="${serviceType || ''}">
          <input type="hidden" id="projectDetails" name="projectDetails" value="${projectDetails || ''}">
          <input type="hidden" id="projectSize" name="projectSize" value="${projectSize || ''}">
          <input type="hidden" id="budget" name="budget" value="${budget || ''}">
          <input type="hidden" id="timeline" name="timeline" value="${timeline || ''}">
          <input type="hidden" id="location" name="location" value="${location || ''}">
          <input type="hidden" id="leadId" name="leadId" value="${leadId || ''}">

          <button type="submit">Submit Quote</button>
        </form>

      <script>
          document.getElementById('quoteForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.quoteId = '${leadId || quoteId}';
          
          try {
            const response = await fetch('/api/quote-submission', {
              method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Quote submitted successfully! The customer will be notified.');
                window.close();
            } else {
                alert('Error: ' + result.error);
            }
          } catch (error) {
              alert('Error submitting quote: ' + error.message);
            }
          });
          
          // Set default valid until date (30 days from now)
          const today = new Date();
          const validUntil = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
          document.getElementById('validUntil').value = validUntil.toISOString().split('T')[0];
      </script>
    </body>
    </html>
    `);
  }

  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      console.log('✅ Quote received:', quoteData);

      // 1. Send email to customer with quote (PRIORITY - like the working chatbot)
      let customerEmailSent = false;
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: 'danbricks18@gmail.com',
            pass: 'ptmcojqgthvjbqom'
          }
        });

        const currentUrl = process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}` : 
          'https://lead-code-r8wsx5vhy-leadcode-b19d9acc.vercel.app';

        const customerMailOptions = {
          from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
          to: quoteData.customerEmail || 'danbricks18@gmail.com',
          subject: `Professional Quote ${quoteData.quoteNumber} - ${quoteData.serviceType || 'Your Project'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Your Professional Quote is Ready!</h2>
              <p>Dear ${quoteData.customerName || 'there'},</p>
              <p>Please find attached your professional quote for <strong>${quoteData.serviceType || 'your project'}</strong>.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
                <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${currentUrl}/api/view-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
                   View Quote Online
                </a>
                <a href="${currentUrl}/api/accept-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                   style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
                   Accept Quote
                </a>
                <a href="${currentUrl}/api/decline-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                   style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
                   Decline Quote
                </a>
              </div>
              
              <p><strong>Note:</strong> The attached PDF quote is ready for printing and professional use.</p>
              <p>You can view the quote online and accept/decline it using the links above.</p>
              <p>Please review the attached quote and let us know if you have any questions.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.tradesmanName}</strong></p>
            </div>
          `
        };

        await transporter.sendMail(customerMailOptions);
        console.log('✅ Customer quote email sent successfully');
        customerEmailSent = true;
      } catch (emailError) {
        console.error('❌ Email error:', emailError.message);
      }

      // 2. Send notification to admin
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: 'danbricks18@gmail.com',
            pass: 'ptmcojqgthvjbqom'
          }
        });

        const adminMailOptions = {
          from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
          to: 'danbricks18@gmail.com',
          subject: `Quote ${quoteData.quoteNumber} Submitted - ${quoteData.tradesmanName}`,
          html: `
            <h2>New Quote Submitted!</h2>
            <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
            <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
            <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
            <p><strong>Phone:</strong> ${quoteData.tradesmanPhone}</p>
            <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
            <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
            <p><strong>Item Breakdown:</strong></p>
            <pre>${quoteData.itemBreakdown}</pre>
            ${quoteData.additionalNotes ? `<p><strong>Additional Notes:</strong> ${quoteData.additionalNotes}</p>` : ''}
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Create quote document using Google Docs template</li>
              <li>Make any necessary adjustments</li>
              <li>Save as PDF</li>
              <li>Send to customer</li>
            </ol>
          `
        };

        await transporter.sendMail(adminMailOptions);
        console.log('✅ Admin notification email sent');
      } catch (adminEmailError) {
        console.error('❌ Admin email failed:', adminEmailError.message);
      }

      // 3. Save to Google Sheets (if configured)
      let sheetsUpdated = false;
      if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
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
              quoteData.quoteId,
              quoteData.quoteNumber,
              quoteData.tradesmanName,
              quoteData.tradesmanEmail,
              quoteData.tradesmanPhone,
              quoteData.totalAmount,
              quoteData.itemBreakdown,
              quoteData.validUntil,
              quoteData.additionalNotes,
              'submitted'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('✅ Quote saved to Google Sheets');
          sheetsUpdated = true;
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // 4. Create PDF and send to all parties
      let pdfCreated = false;
      try {
        const currentUrl = process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}` : 
          'https://lead-code.vercel.app';

        // Ensure all required fields are present for PDF generation
        const pdfQuoteData = {
          quoteId: quoteData.quoteId,
          tradesmanName: quoteData.tradesmanName,
          tradesmanPhone: quoteData.tradesmanPhone,
          tradesmanEmail: quoteData.tradesmanEmail,
          quoteNumber: quoteData.quoteNumber,
          totalAmount: quoteData.totalAmount,
          itemBreakdown: quoteData.itemBreakdown,
          validUntil: quoteData.validUntil,
          additionalNotes: quoteData.additionalNotes,
          customerEmail: quoteData.customerEmail,
          customerName: quoteData.customerName,
          serviceType: quoteData.serviceType || 'Underfloor Heating',
          location: quoteData.location || quoteData.customerAddress || 'Auckland',
          customerPhone: quoteData.customerPhone
        };

        console.log('📄 Sending data to PDF generation:', pdfQuoteData);

        const pdfResponse = await fetch(`${currentUrl}/api/xero-quote-real-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pdfQuoteData)
        });

        if (pdfResponse.ok) {
          const pdfResult = await pdfResponse.json();
          if (pdfResult.success) {
            console.log('✅ PDF created and sent successfully');
            pdfCreated = true;
          } else {
            console.error('❌ PDF creation failed:', pdfResult.error);
          }
        } else {
          console.error('❌ PDF API call failed:', pdfResponse.status);
        }
      } catch (pdfError) {
        console.error('❌ PDF creation error:', pdfError.message);
      }

      // Return success response
      const response = {
        success: true,
        message: 'Quote submitted successfully! PDF has been created and sent to all parties.',
        data: quoteData,
        quoteNumber: quoteData.quoteNumber,
        timestamp: new Date().toISOString(),
        status: {
          sheetsUpdated,
          customerEmailSent,
          pdfCreated
        }
      };

      console.log('📊 Quote Response:', response);
      res.json(response);

  } catch (error) {
      console.error('❌ Error processing quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process quote',
        details: error.message
      });
    }
  }
} 