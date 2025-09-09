import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  console.log('📄 Xero Quote Real PDF API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      console.log('✅ Quote data received for real PDF creation:', quoteData);

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
                     margin: 0.5in; 
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
                     padding: 4px; 
                     text-align: left; 
                 }
                 .quote-table th { 
                     background: #2c3e50; 
                     color: white; 
                     font-weight: bold; 
                     font-size: 9px;
                 }
                 .quote-table tr:nth-child(even) { background: #f8f9fa; }
                 .total-section { 
                     text-align: right; 
                     margin: 15px 0; 
                     padding: 10px; 
                     background: #ecf0f1; 
                     border-radius: 4px; 
                 }
                 .total-amount { 
                     font-size: 16px; 
                     font-weight: bold; 
                     color: #2c3e50; 
                 }
                                 .footer { 
                     margin-top: 15px; 
                     text-align: center; 
                     color: #7f8c8d; 
                     font-size: 8px; 
                     border-top: 1px solid #ddd; 
                     padding-top: 8px; 
                 }
                 .footer p { 
                     margin: 2px 0; 
                     font-size: 8px; 
                 }
                 .company-logo { 
                     font-size: 16px; 
                     font-weight: bold; 
                     color: #3498db; 
                     margin-bottom: 5px; 
                 }
                .page-break { page-break-before: always; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-logo">KIWI TRADE</div>
                <h1>QUOTE</h1>
                <h2>Quote Number: ${quoteData.quoteNumber}</h2>
                <p><strong>Date:</strong> ${formatDate(new Date())}</p>
                <p><strong>Valid Until:</strong> ${quoteData.validUntil ? formatDate(quoteData.validUntil) : '30 days from date'}</p>
            </div>
            
            <div class="section">
                <div class="info-grid">
                    <div class="info-box">
                        <h3>Customer Details</h3>
                        <p><strong>Name:</strong> ${quoteData.customerName}</p>
                        <p><strong>Email:</strong> ${quoteData.customerEmail}</p>
                        <p><strong>Phone:</strong> ${quoteData.customerPhone}</p>
                        <p><strong>Address:</strong> ${quoteData.location}</p>
                    </div>
                    <div class="info-box">
                        <h3>Tradesman Details</h3>
                        <p><strong>Company:</strong> ${quoteData.tradesmanName}</p>
                        <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
                        <p><strong>Phone:</strong> ${quoteData.tradesmanPhone}</p>
                        <p><strong>Service:</strong> ${quoteData.serviceType}</p>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3>Quote Breakdown</h3>
                <table class="quote-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quoteData.itemBreakdown.split('\n').map(line => {
                            const parts = line.split(':');
                            if (parts.length >= 2) {
                                return `<tr><td>${parts[0].trim()}</td><td>${parts.slice(1).join(':').trim()}</td><td>$${parts[parts.length-1].replace(/[^0-9]/g, '')}</td></tr>`;
                            }
                            return `<tr><td colspan="3">${line}</td></tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <h2>Total Amount: <span class="total-amount">$${quoteData.totalAmount}</span></h2>
            </div>
            
            <div class="section">
                <h3>Additional Notes</h3>
                <p>${quoteData.additionalNotes || 'No additional notes'}</p>
            </div>
            
            <div class="footer">
                <p><strong>Kiwi Trade</strong></p>
                <p>Professional underfloor heating solutions for your home</p>
                <p>This quote was generated using our automated system</p>
                <p>Thank you for choosing Kiwi Trade!</p>
            </div>
        </body>
        </html>
      `;

      // Try to generate PDF using Puppeteer with serverless-friendly settings
      console.log('🔄 Starting real PDF generation...');
      let pdfBuffer;
      
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-extensions'
          ]
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
                 pdfBuffer = await page.pdf({
           format: 'A4',
           landscape: true,
           margin: { top: '0.3in', right: '0.3in', bottom: '0.3in', left: '0.3in' },
           printBackground: true
         });
        
        await browser.close();
        console.log('✅ Real PDF generated successfully');
      } catch (pdfError) {
        console.log('⚠️ PDF generation failed, falling back to HTML:', pdfError.message);
        // Fallback to HTML if PDF generation fails
        pdfBuffer = null;
      }

      // Send emails with PDF or HTML attachment
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

      // Prepare attachment
      const attachment = pdfBuffer ? {
        filename: `Quote-${quoteData.quoteNumber}.pdf`,
        content: pdfBuffer.toString('base64'),
        encoding: 'base64',
        contentType: 'application/pdf'
      } : {
        filename: `Quote-${quoteData.quoteNumber}.html`,
        content: Buffer.from(htmlContent, 'utf8').toString('base64'),
        encoding: 'base64',
        contentType: 'text/html'
      };

      // Send to customer
      const customerMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: quoteData.customerEmail || 'danbricks18@gmail.com',
        subject: `Quote ${quoteData.quoteNumber} - ${quoteData.serviceType || 'Your Project'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Your Professional Quote is Ready!</h2>
            <p>Dear ${quoteData.customerName || 'there'},</p>
            <p>Please find attached your professional quote for <strong>${quoteData.serviceType || 'your project'}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil ? formatDate(quoteData.validUntil) : '30 days from date'}</p>
              <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${currentUrl}/api/view-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
               View Quote Online
              </a>
              <a href="${currentUrl}/api/customer-accept?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
               Accept Quote
              </a>
              <a href="${currentUrl}/api/customer-decline?quoteId=${quoteData.quoteId}&leadId=${quoteData.leadId}" 
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
        attachments: [attachment]
      };

      await transporter.sendMail(customerMailOptions);
      console.log(`✅ Customer email sent with ${pdfBuffer ? 'PDF' : 'HTML'} quote`);

      // Send to tradesman
      const tradesmanMailOptions = {
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
            </div>
            
            <p>The customer has been notified and can view the quote online.</p>
          </div>
        `,
        attachments: [{
          filename: pdfBuffer ? `Quote-${quoteData.quoteNumber}-Copy.pdf` : `Quote-${quoteData.quoteNumber}-Copy.html`,
          content: pdfBuffer ? pdfBuffer.toString('base64') : Buffer.from(htmlContent, 'utf8').toString('base64'),
          encoding: 'base64',
          contentType: pdfBuffer ? 'application/pdf' : 'text/html'
        }]
      };

      await transporter.sendMail(tradesmanMailOptions);
      console.log(`✅ Tradesman email sent with ${pdfBuffer ? 'PDF' : 'HTML'} quote`);

      // Send to admin
      const adminMailOptions = {
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com',
        subject: `Quote ${quoteData.quoteNumber} - Admin Copy`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Quote Generated</h2>
            <p>A new quote has been generated and sent to the customer.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
              <p><strong>Customer:</strong> ${quoteData.customerName}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Service:</strong> ${quoteData.serviceType}</p>
            </div>
            
            <p>All parties have been notified and received quote copies.</p>
          </div>
        `,
        attachments: [{
          filename: pdfBuffer ? `Quote-${quoteData.quoteNumber}-Admin.pdf` : `Quote-${quoteData.quoteNumber}-Admin.html`,
          content: pdfBuffer ? pdfBuffer.toString('base64') : Buffer.from(htmlContent, 'utf8').toString('base64'),
          encoding: 'base64',
          contentType: pdfBuffer ? 'application/pdf' : 'text/html'
        }]
      };

      await transporter.sendMail(adminMailOptions);
      console.log(`✅ Admin email sent with ${pdfBuffer ? 'PDF' : 'HTML'} quote`);

      // Return success response
      const response = {
        success: true,
        message: pdfBuffer ? 'Professional PDF quote created and sent successfully!' : 'Professional quote created and sent successfully! (HTML format - can be printed as PDF)',
        data: {
          quoteNumber: quoteData.quoteNumber,
          customerName: quoteData.customerName,
          totalAmount: quoteData.totalAmount,
          method: pdfBuffer ? 'Xero Real PDF' : 'Xero Real PDF (HTML Fallback)'
        },
        status: {
          method: pdfBuffer ? 'Xero Real PDF' : 'Xero Real PDF (HTML Fallback)',
          pdfGenerated: !!pdfBuffer,
          htmlGenerated: !pdfBuffer,
          customerEmailSent: true,
          tradesmanEmailSent: true,
          adminEmailSent: true,
          note: pdfBuffer ? 'Real PDF generated successfully' : 'HTML file can be opened in browser and printed as PDF'
        }
      };

      console.log('📊 Xero Real PDF Quote Response:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ Error creating Xero real PDF quote:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create Xero real PDF quote',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
