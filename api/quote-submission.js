import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('🔍 Quote submission API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
    
    const queryParams = new URLSearchParams();
    if (leadId) queryParams.append('leadId', leadId);
    if (quoteId) queryParams.append('quoteId', quoteId);
    if (customerName) queryParams.append('customerName', customerName);
    if (customerEmail) queryParams.append('customerEmail', customerEmail);
    if (customerPhone) queryParams.append('customerPhone', customerPhone);
    if (serviceType) queryParams.append('serviceType', serviceType);
    if (projectDetails) queryParams.append('projectDetails', projectDetails);
    if (projectSize) queryParams.append('projectSize', projectSize);
    if (budget) queryParams.append('budget', budget);
    if (timeline) queryParams.append('timeline', timeline);
    if (location) queryParams.append('location', location);
    
    const queryString = queryParams.toString();
    const redirectUrl = `/quote-form.html${queryString ? '?' + queryString : ''}`;
    
    return res.redirect(redirectUrl);
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
          
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:K',
          });

          const rows = response.data.values || [];
          const leadRow = rows.find(row => row[13] === quoteData.leadId);

          if (leadRow) {
            quoteData.customerName = quoteData.customerName || leadRow[1] || '';
            quoteData.customerEmail = quoteData.customerEmail || leadRow[2] || '';
            quoteData.customerPhone = quoteData.customerPhone || leadRow[3] || '';
            quoteData.serviceType = quoteData.serviceType || leadRow[4] || 'Underfloor Heating';
            quoteData.projectDetails = quoteData.projectDetails || leadRow[5] || '';
            quoteData.location = quoteData.location || leadRow[10] || 'Auckland';
            console.log('✅ Customer data fetched from Google Sheets');
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error fetching customer data:', sheetsError.message);
        }
      }

      let sheetsUpdated = false;
      let tradesmanEmailSent = false;
      let customerEmailSent = false;

      // 1. Save to Google Sheets
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
              'submitted',
              quoteData.customerName,
              quoteData.customerEmail,
              quoteData.customerPhone,
              quoteData.serviceType,
              quoteData.location,
              quoteData.projectDetails,
              quoteData.projectSize,
              quoteData.budget,
              quoteData.timeline
            ]
          ];

          await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:T',
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

      // 2. Send admin notification
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
          from: 'Kiwi Trade <danbricks18@gmail.com>',
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

      // 3. Send confirmation email to tradesman
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
          from: 'Kiwi Trade <danbricks18@gmail.com>',
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
                  <li>📄 Professional PDF being generated</li>
                  <li>📧 Customer will receive quote email with PDF attachment</li>
                  <li>📧 You will receive a copy of the customer email</li>
                  <li>📊 Quote status will be updated in dashboard</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
            </div>
          `
        };

        await transporter.sendMail(tradesmanMailOptions);
        console.log('✅ Tradesman confirmation email sent successfully');
        tradesmanEmailSent = true;
      } catch (emailError) {
        console.error('❌ Tradesman email error:', emailError.message);
      }

      // 4. Generate quote document and send to customer
      let quoteAttachment = null;
      let attachmentType = 'none';
      let attachmentFilename = '';

      // Format date function
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-GB');
      };

      // Generate breakdown rows function
      const generateBreakdownRows = (quoteData) => {
        const rows = [];
        
        if (quoteData.labourSubtotal && parseFloat(quoteData.labourSubtotal) > 0) {
          const labourRate = parseFloat(quoteData.labourRate) || 0;
          const labourHours = parseFloat(quoteData.labourHours) || 0;
          const labourSubtotal = parseFloat(quoteData.labourSubtotal) || 0;
          rows.push(`<tr><td>Labour</td><td>$${labourRate.toFixed(2)}/hour × ${labourHours} hours</td><td>$${labourSubtotal.toFixed(2)}</td></tr>`);
        }
        
        if (quoteData.materialSubtotal && parseFloat(quoteData.materialSubtotal) > 0) {
          const materialRate = parseFloat(quoteData.materialRate) || 0;
          const materialSQM = parseFloat(quoteData.materialSQM) || 0;
          const materialSubtotal = parseFloat(quoteData.materialSubtotal) || 0;
          rows.push(`<tr><td>Materials</td><td>$${materialRate.toFixed(2)}/sqm × ${materialSQM} sqm</td><td>$${materialSubtotal.toFixed(2)}</td></tr>`);
        }
        
        if (quoteData.installationSubtotal && parseFloat(quoteData.installationSubtotal) > 0) {
          const installationSubtotal = parseFloat(quoteData.installationSubtotal) || 0;
          rows.push(`<tr><td>Installation</td><td>Installation services</td><td>$${installationSubtotal.toFixed(2)}</td></tr>`);
        }
        
        if (rows.length === 0) {
          return '<tr><td colspan="3">No breakdown provided</td></tr>';
        }
        
        return rows.join('');
      };

      // Create DOCX document function - HTML to DOCX conversion
      const createDocxQuote = async (quoteData) => {
        const htmlToDocx = await import('html-to-docx');
        
        // Use a simplified HTML template that works better with DOCX conversion
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote ${quoteData.quoteNumber}</title>
              <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    color: #333;
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                .company-name { 
                    color: #4a90e2; 
                    margin: 0; 
                    font-size: 24px; 
                    font-weight: bold;
                }
                .quote-title { 
                    color: #333; 
                    margin: 10px 0; 
                    font-size: 28px; 
                    font-weight: bold;
                }
                .quote-info { 
                    margin: 10px 0; 
                    font-size: 14px; 
                }
                .divider { 
                    border-top: 2px solid #333; 
                    margin: 20px 0; 
                }
                .details-container { 
                    margin: 20px 0; 
                }
                .details-row { 
                    display: flex; 
                    margin-bottom: 20px; 
                }
                .details-column { 
                    flex: 1; 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border: 1px solid #ddd; 
                    margin: 0 10px; 
                }
                .details-title { 
                    color: #333; 
                    margin: 0 0 10px 0; 
                    font-size: 16px; 
                    font-weight: bold;
                }
                .details-content { 
                    font-size: 14px; 
                    line-height: 1.6; 
                }
                .details-content p { 
                    margin: 5px 0; 
                }
                .breakdown-section { 
                    margin: 30px 0; 
                }
                .breakdown-title { 
                    color: #333; 
                    margin: 0 0 15px 0; 
                    font-size: 18px; 
                    font-weight: bold;
                }
                .breakdown-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0; 
                    font-size: 14px;
                }
                .breakdown-table th, .breakdown-table td { 
                    border: 1px solid #333; 
                    padding: 10px; 
                    text-align: left; 
                }
                .breakdown-table th { 
                    background: #333; 
                    color: white; 
                    font-weight: bold; 
                }
                .total-section { 
                    text-align: right; 
                    margin: 30px 0; 
                }
                .total-amount { 
                    font-size: 20px; 
                    font-weight: bold; 
                    color: #333;
                }
                .notes-section { 
                    margin: 20px 0; 
                }
                .notes-title { 
                    color: #333; 
                    margin: 0 0 10px 0; 
                    font-size: 16px; 
                    font-weight: bold;
                }
                .footer { 
                    margin-top: 40px; 
                    padding-top: 20px; 
                    border-top: 1px solid #ddd; 
                    text-align: center; 
                }
                .footer p { 
                    margin: 5px 0; 
                    font-size: 12px; 
                    color: #666;
                }
              </style>
          </head>
          <body>
              <div class="header">
                  <h1 class="company-name">KIWI TRADE</h1>
                  <h2 class="quote-title">QUOTE</h2>
                  <p class="quote-info"><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                  <p class="quote-info"><strong>Date:</strong> ${formatDate(new Date())}</p>
                  <p class="quote-info"><strong>Valid Until:</strong> ${formatDate(quoteData.validUntil)}</p>
              </div>

              <div class="divider"></div>

              <div class="details-container">
                  <div class="details-row">
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
              </div>

              <div class="divider"></div>

              <div class="breakdown-section">
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
                          ${generateBreakdownRows(quoteData)}
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
          </body>
          </html>
        `;
        
        // Convert HTML to DOCX with proper options
        const docxBuffer = await htmlToDocx.default(htmlContent, {
          table: { row: { cantSplit: true } },
          header: false,
          footer: false,
          pageNumber: false,
          margins: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        });
        
        return docxBuffer;
      };

      // Create HTML content for PDF - Updated to match DOCX format
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote ${quoteData.quoteNumber}</title>
            <style>
              @page { 
                  margin: 0.5in; 
                  size: A4 landscape;
              }
              body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  color: #333;
                  line-height: 1.4;
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
              }
              .company-name { 
                  color: #4a90e2; 
                  margin: 0; 
                  font-size: 24px; 
                  font-weight: bold;
              }
              .quote-title { 
                  color: #333; 
                  margin: 10px 0; 
                  font-size: 28px; 
                  font-weight: bold;
              }
              .quote-info { 
                  margin: 10px 0; 
                  font-size: 14px; 
              }
              .divider { 
                  border-top: 2px solid #333; 
                  margin: 20px 0; 
              }
              .details-container { 
                  margin: 20px 0; 
              }
              .details-row { 
                  display: flex; 
                  margin-bottom: 20px; 
              }
              .details-column { 
                  flex: 1; 
                  background: #f8f9fa; 
                  padding: 15px; 
                  border: 1px solid #ddd; 
                  margin: 0 10px; 
              }
              .details-title { 
                  color: #333; 
                  margin: 0 0 10px 0; 
                  font-size: 16px; 
                  font-weight: bold;
              }
              .details-content { 
                  font-size: 14px; 
                  line-height: 1.6; 
              }
              .details-content p { 
                  margin: 5px 0; 
              }
              .breakdown-section { 
                  margin: 30px 0; 
              }
              .breakdown-title { 
                  color: #333; 
                  margin: 0 0 15px 0; 
                  font-size: 18px; 
                  font-weight: bold;
              }
              .breakdown-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 15px 0; 
                  font-size: 14px;
              }
              .breakdown-table th, .breakdown-table td { 
                  border: 1px solid #333; 
                  padding: 10px; 
                  text-align: left; 
              }
              .breakdown-table th { 
                  background: #333; 
                  color: white; 
                  font-weight: bold; 
              }
              .total-section { 
                  text-align: right; 
                  margin: 30px 0; 
              }
              .total-amount { 
                  font-size: 20px; 
                  font-weight: bold; 
                  color: #333;
              }
              .notes-section { 
                  margin: 20px 0; 
              }
              .notes-title { 
                  color: #333; 
                  margin: 0 0 10px 0; 
                  font-size: 16px; 
                  font-weight: bold;
              }
              .footer { 
                  margin-top: 40px; 
                  padding-top: 20px; 
                  border-top: 1px solid #ddd; 
                  text-align: center; 
              }
              .footer p { 
                  margin: 5px 0; 
                  font-size: 12px; 
                  color: #666;
              }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="company-name">KIWI TRADE</h1>
                <h2 class="quote-title">QUOTE</h2>
                <p class="quote-info"><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p class="quote-info"><strong>Date:</strong> ${formatDate(new Date())}</p>
                <p class="quote-info"><strong>Valid Until:</strong> ${formatDate(quoteData.validUntil)}</p>
            </div>

            <div class="divider"></div>

            <div class="details-container">
                <div class="details-row">
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
            </div>

            <div class="divider"></div>

            <div class="breakdown-section">
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
                        ${generateBreakdownRows(quoteData)}
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
        </body>
        </html>
      `;

      // Try to generate PDF, fallback to DOCX, then HTML
      try {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          landscape: true,
          printBackground: true,
          margin: { top: '0.3in', right: '0.3in', bottom: '0.3in', left: '0.3in' }
        });
        await browser.close();
        
        quoteAttachment = pdfBuffer;
        attachmentType = 'pdf';
        attachmentFilename = `Quote-${quoteData.quoteNumber}.pdf`;
        console.log('✅ PDF generated successfully');
      } catch (pdfError) {
        console.log('⚠️ PDF generation failed, trying DOCX...');
        
        try {
          const docxBuffer = await createDocxQuote(quoteData);
          quoteAttachment = docxBuffer;
          attachmentType = 'docx';
          attachmentFilename = `Quote-${quoteData.quoteNumber}.docx`;
          console.log('✅ DOCX generated successfully');
        } catch (docxError) {
          console.log('⚠️ DOCX generation failed, using HTML fallback...');
          quoteAttachment = Buffer.from(htmlContent, 'utf8');
          attachmentType = 'html';
          attachmentFilename = `Quote-${quoteData.quoteNumber}.html`;
          console.log('✅ HTML fallback ready');
        }
      }

      // Send email to customer
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

        const getAttachmentInfo = () => {
          switch (attachmentType) {
            case 'pdf':
              return {
                contentType: 'application/pdf',
                message: 'Please find your professional PDF quote attached to this email.',
                note: ''
              };
            case 'docx':
              return {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                message: 'Please find your professional DOCX quote attached to this email.',
                note: 'You can open this file with Microsoft Word, Google Docs, or any compatible word processor.'
              };
            case 'html':
              return {
                contentType: 'text/html',
                message: 'Please find your quote attached as an HTML file.',
                note: 'The attached HTML file can be opened in any web browser and printed as a PDF for a professional look.'
              };
            default:
              return {
                contentType: 'text/plain',
                message: 'Quote details are included in this email.',
                note: 'No attachment was generated due to technical limitations.'
              };
          }
        };

        const attachmentInfo = getAttachmentInfo();

        const customerMailOptions = {
          from: 'Kiwi Trade <danbricks18@gmail.com>',
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
                <p><strong>Format:</strong> ${attachmentType.toUpperCase()}</p>
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

              <p>${attachmentInfo.message}</p>
              ${attachmentInfo.note ? `<p><strong>Note:</strong> ${attachmentInfo.note}</p>` : ''}
              <p>You can view the quote online and accept/decline it using the links above.</p>
              <p>Please review the attached quote and let us know if you have any questions.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.tradesmanName}</strong></p>
            </div>
          `,
          attachments: quoteAttachment ? [{
            filename: attachmentFilename,
            content: quoteAttachment.toString('base64'),
            encoding: 'base64',
            contentType: attachmentInfo.contentType
          }] : []
        };

        await transporter.sendMail(customerMailOptions);
        console.log(`✅ Customer email sent with ${attachmentType.toUpperCase()} attachment`);
        customerEmailSent = true;

        // Send copy to tradesman
        const tradesmanCopyMailOptions = {
          from: 'Kiwi Trade <danbricks18@gmail.com>',
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
                <p><strong>Format:</strong> ${attachmentType.toUpperCase()}</p>
              </div>
              
              <p>The customer has been notified and can view the quote online.</p>
              <p>Your quote was generated in ${attachmentType.toUpperCase()} format and sent to the customer.</p>
            </div>
          `,
          attachments: quoteAttachment ? [{
            filename: attachmentFilename,
            content: quoteAttachment.toString('base64'),
            encoding: 'base64',
            contentType: attachmentInfo.contentType
          }] : []
        };

        await transporter.sendMail(tradesmanCopyMailOptions);
        console.log('✅ Tradesman copy sent');
      } catch (emailError) {
        console.error('❌ Customer email error:', emailError.message);
      }

      // Return success response
      const response = {
        success: true,
        message: customerEmailSent ? 'Quote submitted successfully! Professional quote has been created and sent to all parties.' : 'Quote submitted successfully! Quote generation is in progress.',
        data: quoteData,
        quoteNumber: quoteData.quoteNumber,
        timestamp: new Date().toISOString(),
        status: {
          sheetsUpdated,
          tradesmanEmailSent,
          customerEmailSent,
          attachmentType
        }
      };

      console.log('📊 Quote Response:', response);
      res.json(response);

    } catch (error) {
      console.error('❌ Error processing quote:', error);
      
      // Check if we have partial success
      if (sheetsUpdated || tradesmanEmailSent) {
        res.json({
          success: true,
          message: 'Quote submitted successfully! Some notifications may be delayed.',
          data: quoteData,
          quoteNumber: quoteData.quoteNumber,
          timestamp: new Date().toISOString(),
          status: {
            sheetsUpdated,
            tradesmanEmailSent,
            customerEmailSent: false,
            error: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to process quote',
          details: error.message
        });
      }
    }
  }
} 