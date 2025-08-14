import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  console.log('📄 Xero Quote PDF API called:', req.method, req.url);
  
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
      console.log('✅ Quote data received for PDF creation:', quoteData);

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
                @page { margin: 1in; }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    color: #333;
                    line-height: 1.6;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 3px solid #2c3e50; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px; 
                }
                .header h1 { 
                    color: #2c3e50; 
                    margin: 0; 
                    font-size: 28px; 
                }
                .header h2 { 
                    color: #34495e; 
                    margin: 10px 0; 
                    font-size: 20px; 
                }
                .section { margin: 25px 0; }
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 30px; 
                    margin: 20px 0; 
                }
                .info-box { 
                    background: #f8f9fa; 
                    padding: 20px; 
                    border-radius: 8px; 
                    border-left: 4px solid #3498db; 
                }
                .info-box h3 { 
                    color: #2c3e50; 
                    margin-top: 0; 
                    font-size: 18px; 
                }
                .quote-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 20px 0; 
                }
                .quote-table th, .quote-table td { 
                    border: 1px solid #ddd; 
                    padding: 12px; 
                    text-align: left; 
                }
                .quote-table th { 
                    background: #2c3e50; 
                    color: white; 
                    font-weight: bold; 
                }
                .quote-table tr:nth-child(even) { background: #f8f9fa; }
                .total-section { 
                    text-align: right; 
                    margin: 30px 0; 
                    padding: 20px; 
                    background: #ecf0f1; 
                    border-radius: 8px; 
                }
                .total-amount { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #2c3e50; 
                }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    color: #7f8c8d; 
                    font-size: 14px; 
                    border-top: 1px solid #ddd; 
                    padding-top: 20px; 
                }
                .company-logo { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #3498db; 
                    margin-bottom: 10px; 
                }
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

      // Use a different approach for PDF generation that works in serverless
      console.log('🔄 Starting PDF generation...');
      
      // For now, we'll use a simple approach that works in Vercel
      // Convert HTML to base64 and send as attachment
      const htmlBase64 = Buffer.from(htmlContent, 'utf8').toString('base64');

      // Send emails with HTML attachment (can be opened in browser and printed as PDF)
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
              <a href="${currentUrl}/api/accept-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
               Accept Quote
              </a>
              <a href="${currentUrl}/api/decline-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                 style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
               Decline Quote
              </a>
            </div>
            
            <p><strong>Note:</strong> The attached HTML file can be opened in any web browser and printed as a PDF for a professional look.</p>
            <p>You can view the quote online and accept/decline it using the links above.</p>
            <p>Please review the attached quote and let us know if you have any questions.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.tradesmanName}</strong></p>
          </div>
        `,
        attachments: [
          {
            filename: `Quote-${quoteData.quoteNumber}.html`,
            content: htmlBase64,
            encoding: 'base64',
            contentType: 'text/html'
          }
        ]
      };

      await transporter.sendMail(customerMailOptions);
      console.log('✅ Customer email sent with HTML quote');

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
        attachments: [
          {
            filename: `Quote-${quoteData.quoteNumber}-Copy.html`,
            content: htmlBase64,
            encoding: 'base64',
            contentType: 'text/html'
          }
        ]
      };

      await transporter.sendMail(tradesmanMailOptions);
      console.log('✅ Tradesman email sent with HTML quote');

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
        attachments: [
          {
            filename: `Quote-${quoteData.quoteNumber}-Admin.html`,
            content: htmlBase64,
            encoding: 'base64',
            contentType: 'text/html'
          }
        ]
      };

      await transporter.sendMail(adminMailOptions);
      console.log('✅ Admin email sent with HTML quote');

      // Return success response
      const response = {
        success: true,
        message: 'Professional quote created and sent successfully! (HTML format - can be printed as PDF)',
        data: {
          quoteNumber: quoteData.quoteNumber,
          customerName: quoteData.customerName,
          totalAmount: quoteData.totalAmount,
          method: 'Xero PDF (HTML)'
        },
        status: {
          method: 'Xero PDF (HTML)',
          pdfGenerated: false,
          htmlGenerated: true,
          customerEmailSent: true,
          tradesmanEmailSent: true,
          adminEmailSent: true,
          note: 'HTML file can be opened in browser and printed as PDF'
        }
      };

      console.log('📊 Xero PDF Quote Response:', response);
      return res.json(response);

    } catch (error) {
      console.error('❌ Error creating Xero PDF quote:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create Xero PDF quote',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
