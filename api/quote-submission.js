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
            <input type="text" id="totalAmount" name="totalAmount" placeholder="e.g., 5000.00" required>
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
          <input type="hidden" id="serviceType" name="serviceType" value="${serviceType || 'Underfloor Heating'}">
          <input type="hidden" id="projectDetails" name="projectDetails" value="${projectDetails || ''}">
          <input type="hidden" id="projectSize" name="projectSize" value="${projectSize || ''}">
          <input type="hidden" id="budget" name="budget" value="${budget || ''}">
          <input type="hidden" id="timeline" name="timeline" value="${timeline || ''}">
          <input type="hidden" id="location" name="location" value="${location || 'Auckland'}">
          <input type="hidden" id="leadId" name="leadId" value="${leadId || ''}">

          <button type="submit">Submit Quote</button>
        </form>

      <script>
          document.getElementById('quoteForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.quoteId = '${leadId || quoteId}';
            
            // Clean and validate data
            if (data.totalAmount) {
              // Remove any non-numeric characters except decimal point
              data.totalAmount = data.totalAmount.replace(/[^0-9.]/g, '');
            }
            
            if (data.tradesmanPhone) {
              // Clean phone number - remove spaces and special characters
              data.tradesmanPhone = data.tradesmanPhone.replace(/[^0-9+\-()]/g, '');
            }
            
            // Ensure required fields are present
            if (!data.tradesmanName || !data.tradesmanEmail || !data.totalAmount) {
              alert('Please fill in all required fields: Name, Email, and Total Amount');
              return;
            }
          
          try {
            const response = await fetch('/api/quote-submission', {
              method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ Quote submitted successfully! The customer will receive your professional quote with PDF attachment.');
                window.close();
            } else {
                alert('❌ Error: ' + result.error);
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

      // Basic validation
      if (!quoteData.tradesmanName || !quoteData.tradesmanEmail || !quoteData.totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: tradesmanName, tradesmanEmail, totalAmount'
        });
      }

      // Clean and validate data
      quoteData.tradesmanName = quoteData.tradesmanName.trim();
      quoteData.tradesmanEmail = quoteData.tradesmanEmail.trim();
      quoteData.totalAmount = quoteData.totalAmount.toString().replace(/[^0-9.]/g, '');
      quoteData.tradesmanPhone = quoteData.tradesmanPhone ? quoteData.tradesmanPhone.trim() : '';
      quoteData.itemBreakdown = quoteData.itemBreakdown ? quoteData.itemBreakdown.trim() : '';
      quoteData.additionalNotes = quoteData.additionalNotes ? quoteData.additionalNotes.trim() : '';

      // Fetch customer data from Google Sheets if missing
      if ((!quoteData.customerName || !quoteData.customerEmail || !quoteData.customerPhone) && quoteData.leadId && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          // Fetch lead data from Google Sheets
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:K',
          });

          const rows = response.data.values || [];
          
          // Find the lead by leadId
          const leadRow = rows.find(row => row[13] === quoteData.leadId); // Assuming leadId is in column N

          if (leadRow) {
            // Update quote data with customer information from Google Sheets
            quoteData.customerName = quoteData.customerName || leadRow[1] || '';
            quoteData.customerEmail = quoteData.customerEmail || leadRow[2] || '';
            quoteData.customerPhone = quoteData.customerPhone || leadRow[3] || '';
            quoteData.serviceType = quoteData.serviceType || leadRow[4] || 'Underfloor Heating';
            quoteData.projectDetails = quoteData.projectDetails || leadRow[5] || '';
            quoteData.location = quoteData.location || leadRow[10] || 'Auckland';
            console.log('✅ Customer data fetched from Google Sheets:', {
              customerName: quoteData.customerName,
              customerEmail: quoteData.customerEmail,
              customerPhone: quoteData.customerPhone
            });
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error fetching customer data:', sheetsError.message);
        }
      }

      // Note: Customer email will be sent by the PDF generation endpoint with the actual PDF attachment
      let customerEmailSent = false;

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

      // 3. Send confirmation email to tradesman
      let tradesmanEmailSent = false;
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
          'https://lead-code.vercel.app';

        const tradesmanMailOptions = {
          from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
          to: quoteData.tradesmanEmail,
          subject: `Quote Submitted Successfully - ${quoteData.quoteNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">✅ Quote Submitted Successfully!</h2>
              <p>Dear ${quoteData.tradesmanName},</p>
              <p>Your quote has been successfully submitted and is being processed.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Customer:</strong> ${quoteData.customerName || 'Not specified'}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
                <p><strong>Status:</strong> Submitted and being processed</p>
              </div>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>✅ Quote saved to Google Sheets</li>
                  <li>📄 Professional PDF being generated</li>
                  <li>📧 Customer will receive quote email with PDF attachment</li>
                  <li>📧 You will receive a copy of the customer email</li>
                  <li>📊 Quote status will be updated in dashboard</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Underfloor Heating System</strong></p>
            </div>
          `
        };

        await transporter.sendMail(tradesmanMailOptions);
        console.log('✅ Tradesman confirmation email sent successfully');
        tradesmanEmailSent = true;
      } catch (emailError) {
        console.error('❌ Tradesman email error:', emailError.message);
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

        console.log('📄 PDF Response status:', pdfResponse.status);

        if (pdfResponse.ok) {
          const pdfResult = await pdfResponse.json();
          console.log('📄 PDF Result:', pdfResult);
          if (pdfResult.success) {
            console.log('✅ PDF created and sent successfully');
            pdfCreated = true;
          } else {
            console.error('❌ PDF creation failed:', pdfResult.error);
          }
        } else {
          const errorText = await pdfResponse.text();
          console.error('❌ PDF API call failed:', pdfResponse.status, errorText);
        }
      } catch (pdfError) {
        console.error('❌ PDF creation error:', pdfError.message);
      }

      // Return success response
      const response = {
        success: true,
        message: pdfCreated ? 'Quote submitted successfully! Professional PDF has been created and sent to all parties.' : 'Quote submitted successfully! PDF generation is in progress.',
        data: quoteData,
        quoteNumber: quoteData.quoteNumber,
        timestamp: new Date().toISOString(),
        status: {
          sheetsUpdated,
          tradesmanEmailSent,
          customerEmailSent: pdfCreated, // Only true if PDF was created successfully
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