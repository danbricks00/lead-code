import { google } from 'googleapis';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, ImageRun } from 'docx';

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

      // Generate DOCX using the docx library for better formatting
      const docxBuffer = await generateDocxQuote(quoteData);

              // Generate breakdown rows function for PDF
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

        // Create HTML content for PDF - Using simple format that matches DOCX
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
              table { 
                  border-collapse: collapse; 
                  width: 100%; 
                  margin: 10px 0; 
              }
              th, td { 
                  border: 1px solid #333; 
                  padding: 8px; 
                  text-align: left; 
              }
              th { 
                  background: #333; 
                  color: white; 
                  font-weight: bold; 
              }
              .header { 
                  text-align: center; 
                  margin-bottom: 20px; 
              }
              .company-name { 
                  color: #4a90e2; 
                  font-size: 24px; 
                  font-weight: bold;
                  margin: 0;
              }
              .quote-title { 
                  font-size: 28px; 
                  font-weight: bold;
                  margin: 10px 0;
              }
              .divider { 
                  border-top: 2px solid #333; 
                  margin: 15px 0; 
              }
              .total { 
                  text-align: right; 
                  font-size: 18px; 
                  font-weight: bold; 
                  margin: 20px 0;
              }
              .footer { 
                  margin-top: 30px; 
                  padding-top: 15px; 
                  border-top: 1px solid #ddd; 
                  text-align: center; 
                  font-size: 12px; 
                  color: #666;
              }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="company-name">KIWI TRADE</h1>
                <h2 class="quote-title">QUOTE</h2>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Date:</strong> ${formatDate(new Date())}</p>
                <p><strong>Valid Until:</strong> ${formatDate(quoteData.validUntil)}</p>
            </div>

            <div class="divider"></div>

            <table>
                <tr>
                    <td style="width: 50%; background: #f8f9fa; padding: 15px; border: 1px solid #ddd;">
                        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Customer Details</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${quoteData.customerName || 'Not specified'}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
                        <p style="margin: 5px 0;"><strong>Address:</strong> ${quoteData.location || 'Auckland'}</p>
                    </td>
                    <td style="width: 50%; background: #f8f9fa; padding: 15px; border: 1px solid #ddd;">
                        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Tradesman Details</h3>
                        <p style="margin: 5px 0;"><strong>Company:</strong> ${quoteData.tradesmanName}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${quoteData.tradesmanPhone || 'Not specified'}</p>
                        <p style="margin: 5px 0;"><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
                    </td>
                </tr>
            </table>

            <div class="divider"></div>

            <h3 style="margin: 20px 0 10px 0; font-size: 18px;">Quote Breakdown</h3>
            <table>
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

            <div class="total">
                Total Amount: $${quoteData.totalAmount}
            </div>

            ${quoteData.additionalNotes ? `
            <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px;">Additional Notes</h3>
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

      // Generate DOCX directly (more reliable than PDF in serverless environment)
      try {
        const docxBuffer = await generateDocxQuote(quoteData);
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

        console.log('📧 Attempting to send customer email...');
        console.log('📧 Customer email:', quoteData.customerEmail);
        console.log('📧 Attachment type:', attachmentType);
        console.log('📧 Attachment size:', quoteAttachment ? quoteAttachment.length : 'No attachment');
        
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

        console.log('📧 Attempting to send tradesman copy...');
        console.log('📧 Tradesman email:', quoteData.tradesmanEmail);
        
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

async function generateDocxQuote(quoteData) {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            width: 11906, // A4 landscape width in twips
            height: 8420, // A4 landscape height in twips
          },
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: [
        // Header
        new Paragraph({
          children: [
            new TextRun({
              text: "KIWI TRADE",
              size: 48, // 24pt
              bold: true,
              color: "4A90E2",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "QUOTE",
              size: 56, // 28pt
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        
        // Quote Info
        new Paragraph({
          children: [
            new TextRun({
              text: `Quote Number: ${quoteData.quoteNumber}`,
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${formatDate(new Date())}`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Valid Until: ${formatDate(quoteData.validUntil)}`,
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),

        // Divider
        new Paragraph({
          children: [
            new TextRun({
              text: "________________________________________________________________________________",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        }),

        // Customer and Tradesman Details Table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Customer Details",
                          size: 32, // 16pt
                          bold: true,
                        }),
                      ],
                      spacing: { after: 200 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Name: ${quoteData.customerName || 'Not specified'}`,
                          size: 28, // 14pt
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Email: ${quoteData.customerEmail || 'Not specified'}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Phone: ${quoteData.customerPhone || 'Not specified'}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Address: ${quoteData.location || 'Auckland'}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  shading: {
                    fill: "F8F9FA",
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Tradesman Details",
                          size: 32,
                          bold: true,
                        }),
                      ],
                      spacing: { after: 200 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Company: ${quoteData.tradesmanName}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Email: ${quoteData.tradesmanEmail}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Phone: ${quoteData.tradesmanPhone || 'Not specified'}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Service: ${quoteData.serviceType || 'Underfloor Heating'}`,
                          size: 28,
                        }),
                      ],
                      spacing: { after: 100 },
                    }),
                  ],
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  shading: {
                    fill: "F8F9FA",
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { after: 600 },
        }),

        // Divider
        new Paragraph({
          children: [
            new TextRun({
              text: "________________________________________________________________________________",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Quote Breakdown Title
        new Paragraph({
          children: [
            new TextRun({
              text: "Quote Breakdown",
              size: 36, // 18pt
              bold: true,
            }),
          ],
          spacing: { after: 400 },
        }),

        // Quote Breakdown Table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Item",
                          size: 28,
                          bold: true,
                          color: "FFFFFF",
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: {
                    fill: "333333",
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Description",
                          size: 28,
                          bold: true,
                          color: "FFFFFF",
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: {
                    fill: "333333",
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "Amount",
                          size: 28,
                          bold: true,
                          color: "FFFFFF",
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  shading: {
                    fill: "333333",
                  },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 },
                  },
                }),
              ],
            }),
            // Data rows
            ...generateDocxBreakdownRows(quoteData),
          ],
        }),

        new Paragraph({
          spacing: { after: 600 },
        }),

        // Total Amount
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Amount: $${quoteData.totalAmount}`,
              size: 36, // 18pt
              bold: true,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 600 },
        }),

        // Additional Notes
        ...(quoteData.additionalNotes ? [
          new Paragraph({
            children: [
              new TextRun({
                text: "Additional Notes",
                size: 32,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: quoteData.additionalNotes,
                size: 28,
              }),
            ],
            spacing: { after: 600 },
          }),
        ] : []),

        // Footer
        new Paragraph({
          children: [
            new TextRun({
              text: "Kiwi Trade",
              size: 24,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Professional underfloor heating solutions for your home",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "This quote was generated using our automated system",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Thank you for choosing Kiwi Trade!",
              size: 24,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}

function generateDocxBreakdownRows(quoteData) {
  const rows = [];
  
  // Generate breakdown from the quote data
  if (quoteData.labourSubtotal && parseFloat(quoteData.labourSubtotal) > 0) {
    const labourRate = parseFloat(quoteData.labourRate) || 0;
    const labourHours = parseFloat(quoteData.labourHours) || 0;
    const labourSubtotal = parseFloat(quoteData.labourSubtotal) || 0;
    
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Labour",
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${labourRate.toFixed(2)}/hour × ${labourHours} hours`,
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${labourSubtotal.toFixed(2)}`,
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }
  
  if (quoteData.materialSubtotal && parseFloat(quoteData.materialSubtotal) > 0) {
    const materialRate = parseFloat(quoteData.materialRate) || 0;
    const materialSQM = parseFloat(quoteData.materialSQM) || 0;
    const materialSubtotal = parseFloat(quoteData.materialSubtotal) || 0;
    
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Materials",
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${materialRate.toFixed(2)}/sqm × ${materialSQM} sqm`,
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${materialSubtotal.toFixed(2)}`,
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }
  
  if (quoteData.installationSubtotal && parseFloat(quoteData.installationSubtotal) > 0) {
    const installationSubtotal = parseFloat(quoteData.installationSubtotal) || 0;
    
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Installation",
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Installation services",
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${installationSubtotal.toFixed(2)}`,
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }
  
  // If no breakdown items, add a default row
  if (rows.length === 0) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Underfloor Heating Installation",
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Complete underfloor heating system installation including materials and labor",
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${quoteData.totalAmount}`,
                    size: 28,
                  }),
                ],
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );
  }
  
  return rows;
} 