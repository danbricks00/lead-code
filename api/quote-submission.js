import { google } from 'googleapis';
import puppeteer from 'puppeteer';

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
              // Clean phone number - just trim whitespace
              data.tradesmanPhone = data.tradesmanPhone.trim();
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

      // 4. Create PDF and send to customer directly
      let pdfEmailSent = false;
      try {
        // Format date as DD/MM/YYYY
        const formatDate = (date) => {
          const d = new Date(date);
          return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
        };

        // Create professional HTML for PDF generation
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote ${quoteData.quoteNumber}</title>
              <style>
                @page { 
                    margin: 0.3in; 
                    size: A4 landscape;
                }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 0; 
                    padding: 15px; 
                    color: #333;
                    line-height: 1.4;
                    font-size: 11px;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #2c3e50; 
                    padding-bottom: 10px; 
                    margin-bottom: 15px; 
                }
                .header h1 { 
                    color: #2c3e50; 
                    margin: 0; 
                    font-size: 20px; 
                }
                .header h2 { 
                    color: #34495e; 
                    margin: 5px 0; 
                    font-size: 14px; 
                }
                .section { margin: 12px 0; }
                .section h3 { 
                    font-size: 12px; 
                    margin: 8px 0 5px 0; 
                    color: #2c3e50; 
                }
                .section p { 
                    font-size: 9px; 
                    margin: 3px 0; 
                }
                .info-grid { 
                    display: table; 
                    width: 100%; 
                    margin: 10px 0; 
                }
                .info-box { 
                    display: table-cell; 
                    width: 48%; 
                    background: #f8f9fa; 
                    padding: 8px; 
                    border-radius: 4px; 
                    border-left: 3px solid #3498db; 
                    vertical-align: top;
                    font-size: 9px;
                }
                .info-box:first-child { margin-right: 2%; }
                .info-box h3 { 
                    color: #2c3e50; 
                    margin-top: 0; 
                    font-size: 11px; 
                    margin-bottom: 5px;
                }
                .quote-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0; 
                    font-size: 9px;
                }
                .quote-table th, .quote-table td { 
                    border: 1px solid #ddd; 
                    padding: 6px; 
                    text-align: left; 
                }
                .quote-table th { 
                    background: #f8f9fa; 
                    font-weight: bold; 
                }
                .total-row { 
                    background: #e8f5e8; 
                    font-weight: bold; 
                    font-size: 11px;
                }
                .footer { 
                    margin-top: 20px; 
                    padding-top: 10px; 
                    border-top: 1px solid #ddd; 
                    font-size: 9px; 
                    color: #666;
                }
              </style>
          </head>
          <body>
              <div class="header">
                  <h1>QUOTE</h1>
                  <h2>Quote Number: ${quoteData.quoteNumber}</h2>
                  <p>Date: ${formatDate(new Date())} | Valid Until: ${formatDate(quoteData.validUntil)}</p>
              </div>

              <div class="info-grid">
                  <div class="info-box">
                      <h3>CUSTOMER DETAILS:</h3>
                      <p><strong>Name:</strong> ${quoteData.customerName || 'Not specified'}</p>
                      <p><strong>Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
                      <p><strong>Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
                      <p><strong>Location:</strong> ${quoteData.location || 'Auckland'}</p>
                  </div>
                  <div class="info-box">
                      <h3>TRADESMAN DETAILS:</h3>
                      <p><strong>Name:</strong> ${quoteData.tradesmanName}</p>
                      <p><strong>Phone:</strong> ${quoteData.tradesmanPhone || 'Not specified'}</p>
                      <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
                  </div>
              </div>

              <div class="section">
                  <h3>SERVICE:</h3>
                  <p><strong>${quoteData.serviceType || 'Underfloor Heating Installation'}</strong></p>
                  ${quoteData.projectDetails ? `<p><strong>Project Details:</strong> ${quoteData.projectDetails}</p>` : ''}
              </div>

              <div class="section">
                  <h3>ITEM BREAKDOWN:</h3>
                  <div style="white-space: pre-line; font-size: 9px;">${quoteData.itemBreakdown || 'No breakdown provided'}</div>
              </div>

              <div class="section">
                  <h3>TOTAL AMOUNT:</h3>
                  <div style="background: #e8f5e8; padding: 10px; border-radius: 4px; text-align: center; font-size: 16px; font-weight: bold; color: #155724;">
                      $${quoteData.totalAmount}
                  </div>
              </div>

              ${quoteData.additionalNotes ? `
              <div class="section">
                  <h3>ADDITIONAL NOTES:</h3>
                  <p>${quoteData.additionalNotes}</p>
              </div>
              ` : ''}

              <div class="footer">
                  <p><strong>Terms & Conditions:</strong></p>
                  <p>• This quote is valid until ${formatDate(quoteData.validUntil)}</p>
                  <p>• Payment terms to be discussed upon acceptance</p>
                  <p>• All work to be completed to industry standards</p>
              </div>
          </body>
          </html>
        `;

        // Try to generate PDF with Puppeteer
        let pdfBuffer = null;
        try {
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          });
          
          const page = await browser.newPage();
          await page.setContent(htmlContent);
          
          pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            margin: { top: '0.3in', right: '0.3in', bottom: '0.3in', left: '0.3in' }
          });
          
          await browser.close();
          console.log('✅ PDF generated successfully with Puppeteer');
        } catch (puppeteerError) {
          console.log('⚠️ Puppeteer failed, using HTML fallback:', puppeteerError.message);
        }

        // Send email to customer with PDF or HTML attachment
        const customerMailOptions = {
          from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
          to: quoteData.customerEmail || 'danbricks18@gmail.com',
          subject: `Professional Quote ${quoteData.quoteNumber} - ${quoteData.serviceType || 'Your Project'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Your Professional Quote is Ready!</h2>
              <p>Hi ${quoteData.customerName || 'there'},</p>
              <p>Please find attached your professional quote for <strong>${quoteData.serviceType || 'your project'}</strong>.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Valid Until:</strong> ${formatDate(quoteData.validUntil)}</p>
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
              
              ${pdfBuffer ? 
                '<p>Please find your professional PDF quote attached to this email.</p>' :
                '<p><strong>Note:</strong> The attached HTML file can be opened in any web browser and printed as a PDF for a professional look.</p>'
              }
              <p>You can view the quote online and accept/decline it using the links above.</p>
              <p>Please review the attached quote and let us know if you have any questions.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.tradesmanName}</strong></p>
            </div>
          `,
          attachments: [{
            filename: pdfBuffer ? `Quote-${quoteData.quoteNumber}.pdf` : `Quote-${quoteData.quoteNumber}.html`,
            content: pdfBuffer ? pdfBuffer.toString('base64') : Buffer.from(htmlContent, 'utf8').toString('base64'),
            encoding: 'base64',
            contentType: pdfBuffer ? 'application/pdf' : 'text/html'
          }]
        };

        await transporter.sendMail(customerMailOptions);
        console.log('✅ Customer email sent with quote attachment');
        pdfEmailSent = true;

        // Send copy to tradesman
        const tradesmanCopyMailOptions = {
          from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
          to: quoteData.tradesmanEmail,
          subject: `Quote ${quoteData.quoteNumber} - Copy for ${quoteData.customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Quote Copy</h2>
              <p>Here's a copy of the quote you submitted for ${quoteData.customerName}.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Customer:</strong> ${quoteData.customerName}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Service:</strong> ${quoteData.serviceType}</p>
              </div>
              
              <p>The customer has been notified and can view the quote online.</p>
            </div>
          `,
          attachments: [{
            filename: pdfBuffer ? `Quote-${quoteData.quoteNumber}.pdf` : `Quote-${quoteData.quoteNumber}.html`,
            content: pdfBuffer ? pdfBuffer.toString('base64') : Buffer.from(htmlContent, 'utf8').toString('base64'),
            encoding: 'base64',
            contentType: pdfBuffer ? 'application/pdf' : 'text/html'
          }]
        };

        await transporter.sendMail(tradesmanCopyMailOptions);
        console.log('✅ Tradesman copy sent');

      } catch (emailError) {
        console.error('❌ Customer email error:', emailError.message);
      }

      // Return success response
      const response = {
        success: true,
        message: pdfEmailSent ? 'Quote submitted successfully! Professional PDF has been created and sent to all parties.' : 'Quote submitted successfully! PDF generation is in progress.',
        data: quoteData,
        quoteNumber: quoteData.quoteNumber,
        timestamp: new Date().toISOString(),
        status: {
          sheetsUpdated,
          tradesmanEmailSent,
          customerEmailSent: pdfEmailSent, // Only true if PDF was created successfully
          pdfCreated: pdfEmailSent
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