import { getQuoteById, updateQuoteStatus } from './quote-database.js';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';

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
      return await handleQuoteView(req, res);
    } else if (req.method === 'POST') {
      return await handleQuoteGeneration(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Quote generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Quote generation failed',
      details: error.message
    });
  }
}

async function handleQuoteView(req, res) {
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

         // Generate the quote HTML (with action buttons for web view)
     const quoteHtml = generateQuoteHTML(quote, true);
    
    // Return the quote as HTML
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(quoteHtml);
  } catch (error) {
    console.error('❌ Error handling quote view:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleQuoteGeneration(req, res) {
  try {
    const {
      quoteId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceType,
      projectDetails,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      companyName = 'Kiwi Underfloor Heating',
      companyAddress = 'Auckland, New Zealand',
      gstNumber = '120-681-729',
      items = []
    } = req.body;

    console.log('📝 Generating quote:', { quoteId, customerName, serviceType });

    // Validate required fields
    if (!quoteId || !customerName || !customerEmail || !serviceType) {
      return res.status(400).json({
        success: false,
        error: 'Quote ID, customer name, email, and service type are required'
      });
    }

    // Generate quote number
    const quoteNumber = `QU-${Date.now().toString().slice(-4)}`;
    
    // Set expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map(item => {
      const amount = parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0);
      subtotal += amount;
      return {
        ...item,
        amount: amount.toFixed(2)
      };
    });

    const gst = subtotal * 0.15;
    const total = subtotal + gst;

    // Create quote data
    const quoteData = {
      quoteId,
      quoteNumber,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      serviceType,
      projectDetails,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      companyName,
      companyAddress,
      gstNumber,
      items: processedItems,
      subtotal: subtotal.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      date: new Date().toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      status: 'generated'
    };

    // Save quote to database (you can implement this)
    // await saveQuoteToDatabase(quoteData);

    // Send email to customer with quote
    await sendQuoteEmail(quoteData, req);

    // Send admin copy for tracking and commission purposes
    await sendAdminQuoteEmail(quoteData, req);

    // Save quote to database for dashboard tracking
    await saveQuoteToDatabase(quoteData);

    console.log('✅ Quote generated successfully:', { quoteNumber, total });

    res.json({
      success: true,
      message: 'Quote generated and sent successfully',
      quote: {
        quoteId,
        quoteNumber,
        total: total.toFixed(2),
        customerName,
        customerEmail
      }
    });

  } catch (error) {
    console.error('❌ Quote generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quote',
      details: error.message
    });
  }
}

 function generateQuoteHTML(quote, includeActions = true) {
   const currentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
   
   const actionsSection = includeActions ? `
     <div class="actions">
       <a href="${currentUrl}/api/quote-responses?action=accept&quoteId=${quote.quoteId}" class="action-btn accept-btn">
         ✅ Accept Quote
       </a>
       <a href="${currentUrl}/api/quote-responses?action=decline&quoteId=${quote.quoteId}" class="action-btn decline-btn">
         ❌ Decline Quote
       </a>
     </div>
   ` : '';
   
   return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote ${quote.quoteNumber} - ${quote.companyName}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #f5f5f5;
                padding: 20px;
            }
            
            .quote-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
            }
            
            .logo-section {
                flex: 1;
            }
            
            .logo {
                font-size: 2.5rem;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .logo-subtitle {
                font-size: 1.2rem;
                color: #7f8c8d;
                font-weight: 300;
            }
            
            .quote-title {
                font-size: 3rem;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .customer-name {
                font-size: 1.5rem;
                color: #34495e;
                font-weight: 600;
            }
            
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            
            .quote-details, .company-details {
                flex: 1;
            }
            
            .info-item {
                margin-bottom: 8px;
                font-size: 0.9rem;
            }
            
            .info-label {
                font-weight: bold;
                color: #7f8c8d;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .items-table th {
                background: #f8f9fa;
                padding: 15px 10px;
                text-align: left;
                border-bottom: 2px solid #dee2e6;
                font-weight: 600;
                color: #495057;
            }
            
            .items-table td {
                padding: 15px 10px;
                border-bottom: 1px solid #dee2e6;
            }
            
            .items-table th:last-child,
            .items-table td:last-child {
                text-align: right;
            }
            
            .items-table th:nth-child(2),
            .items-table th:nth-child(3),
            .items-table td:nth-child(2),
            .items-table td:nth-child(3) {
                text-align: right;
            }
            
            .summary {
                margin-left: auto;
                width: 300px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 0.9rem;
            }
            
            .summary-row.total {
                font-size: 1.2rem;
                font-weight: bold;
                border-top: 2px solid #dee2e6;
                padding-top: 10px;
                margin-top: 10px;
            }
            
                         .actions {
                 text-align: center;
                 margin-bottom: 40px;
                 padding-bottom: 30px;
                 border-bottom: 2px solid #eee;
             }
            
            .action-btn {
                display: inline-block;
                padding: 15px 30px;
                margin: 0 10px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1rem;
                transition: all 0.3s;
            }
            
            .accept-btn {
                background: #27ae60;
                color: white;
            }
            
            .accept-btn:hover {
                background: #229954;
                transform: translateY(-2px);
            }
            
            .decline-btn {
                background: #e74c3c;
                color: white;
            }
            
            .decline-btn:hover {
                background: #c0392b;
                transform: translateY(-2px);
            }
            
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #7f8c8d;
                font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
                .quote-container {
                    padding: 20px;
                }
                
                .header {
                    flex-direction: column;
                    text-align: center;
                }
                
                .info-section {
                    flex-direction: column;
                }
                
                .summary {
                    width: 100%;
                    margin-top: 20px;
                }
                
                .action-btn {
                    display: block;
                    margin: 10px 0;
                }
            }
        </style>
    </head>
         <body>
         <div class="quote-container">
             ${actionsSection}
             
             <div class="header">
                 <div class="logo-section">
                     <div class="logo">${quote.companyName}</div>
                     <div class="logo-subtitle">Professional Underfloor Heating Solutions</div>
                 </div>
                 <div class="quote-info">
                     <div class="quote-title">QUOTE</div>
                     <div class="customer-name">${quote.customerName}</div>
                 </div>
             </div>
            
            <div class="info-section">
                <div class="quote-details">
                    <div class="info-item">
                        <span class="info-label">Date:</span> ${formatDate(quote.date)}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Expiry:</span> ${formatDate(quote.expiryDate)}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Quote Number:</span> ${quote.quoteNumber}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Reference:</span> ${quote.customerAddress || 'Project Address'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">GST Number:</span> ${quote.gstNumber}
                    </div>
                </div>
                <div class="company-details">
                    <div class="info-item">
                        <span class="info-label">Company Name:</span> ${quote.companyName}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Address:</span> ${quote.companyAddress}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone:</span> ${quote.tradesmanPhone || '+64 9 123 4567'}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span> ${quote.tradesmanEmail || 'info@kiwiunderfloor.com'}
                    </div>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount NZD</th>
                    </tr>
                </thead>
                <tbody>
                    ${quote.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
                            <td>$${item.amount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${quote.subtotal}</span>
                </div>
                <div class="summary-row">
                    <span>TOTAL GST 15%:</span>
                    <span>$${quote.gst}</span>
                </div>
                <div class="summary-row total">
                    <span>TOTAL NZD:</span>
                    <span>$${quote.total}</span>
                </div>
                         </div>
             
             <div class="footer">
                <p>This quote is valid until ${formatDate(quote.expiryDate)}</p>
                <p>For any questions, please contact us at ${quote.tradesmanEmail || 'info@kiwiunderfloor.com'}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

 async function generatePDF(quoteData, req) {
   try {
     const browser = await puppeteer.launch({
       headless: true,
       args: ['--no-sandbox', '--disable-setuid-sandbox']
     });
     
     const page = await browser.newPage();
     
     // Generate the quote HTML (without action buttons for PDF)
     const quoteHtml = generateQuoteHTML(quoteData, false);
     
     await page.setContent(quoteHtml, { waitUntil: 'networkidle0' });
     
     // Generate PDF
     const pdfBuffer = await page.pdf({
       format: 'A4',
       printBackground: true,
       margin: {
         top: '20mm',
         right: '20mm',
         bottom: '20mm',
         left: '20mm'
       }
     });
     
     await browser.close();
     
     return pdfBuffer;
   } catch (error) {
     console.error('❌ Error generating PDF:', error.message);
     return null;
   }
 }

 async function sendQuoteEmail(quoteData, req) {
   try {
     if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
       console.log('⚠️ Gmail credentials not configured - skipping email');
       return;
     }

     const transporter = nodemailer.createTransport({
       service: 'gmail',
       auth: {
         user: process.env.GMAIL_USER,
         pass: process.env.GMAIL_APP_PASSWORD
       }
     });

     const currentUrl = req.headers.host ? 
       `https://${req.headers.host}` : 
       'https://lead-code-aoupwojcg-dan-buis-projects-e44a173c.vercel.app';

     // Generate PDF
     const pdfBuffer = await generatePDF(quoteData, req);

     const emailContent = `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <p>Hi,</p>
         
         <p>Thank you for your enquiry.</p>
         
         <p>Here's quote ${quoteData.quoteNumber} for NZD ${quoteData.total}.</p>
         
         <p>Please find your quote attached as a PDF document.</p>
         
         <p>You can also view your quote online:</p>
         <p><a href="${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}" style="color: #6f42c1;">${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}</a></p>
         
         <p>From your online quote you can accept, decline, comment or print.</p>
         
         <p>If you have any questions, please let us know.</p>
         
         <p>Thanks,<br>${quoteData.companyName}</p>
         
         <p style="margin-top: 30px; font-size: 12px; color: #666;">Terms</p>
       </div>
     `;

     const mailOptions = {
       from: process.env.MAIL_FROM || `${quoteData.companyName} <${process.env.GMAIL_USER}>`,
       to: quoteData.customerEmail,
       subject: `Quote ${quoteData.quoteNumber} - ${quoteData.serviceType}`,
       html: emailContent,
       attachments: pdfBuffer ? [{
         filename: `Quote-${quoteData.quoteNumber}.pdf`,
         content: pdfBuffer,
         contentType: 'application/pdf'
       }] : []
     };

     await transporter.sendMail(mailOptions);
     console.log('✅ Quote email with PDF sent successfully');

   } catch (error) {
     console.error('❌ Error sending quote email:', error.message);
   }
 }

async function sendAdminQuoteEmail(quoteData, req) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log('⚠️ Gmail credentials not configured - skipping admin email');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const currentUrl = req.headers.host ? 
      `https://${req.headers.host}` : 
      'https://lead-code-aoupwojcg-dan-buis-projects-e44a173c.vercel.app';

    // Calculate potential commission (example: 10% of total)
    const commissionRate = 0.10; // 10% commission
    const potentialCommission = parseFloat(quoteData.total) * commissionRate;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📊 New Quote Generated - Admin Copy</h2>
        <p>Hello Admin,</p>
        <p>A new quote has been generated and sent to the customer. Here are the details for tracking and commission purposes:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Quote Details</h3>
          <p><strong>Quote ID:</strong> ${quoteData.quoteId}</p>
          <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
          <p><strong>Customer:</strong> ${quoteData.customerName}</p>
          <p><strong>Customer Email:</strong> ${quoteData.customerEmail}</p>
          <p><strong>Customer Phone:</strong> ${quoteData.customerPhone || 'Not provided'}</p>
          <p><strong>Customer Address:</strong> ${quoteData.customerAddress || 'Not provided'}</p>
          <p><strong>Service Type:</strong> ${quoteData.serviceType}</p>
          <p><strong>Project Details:</strong> ${quoteData.projectDetails || 'Not provided'}</p>
        </div>

        <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Financial Details</h3>
          <p><strong>Total Quote Amount:</strong> $${quoteData.total}</p>
          <p><strong>Subtotal:</strong> $${quoteData.subtotal}</p>
          <p><strong>GST (15%):</strong> $${quoteData.gst}</p>
          <p><strong>Potential Commission (10%):</strong> $${potentialCommission.toFixed(2)}</p>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Tradesman Information</h3>
          <p><strong>Name:</strong> ${quoteData.tradesmanName || 'Not assigned'}</p>
          <p><strong>Email:</strong> ${quoteData.tradesmanEmail || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${quoteData.tradesmanPhone || 'Not provided'}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}" 
             style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
            View Full Quote
          </a>
          <a href="${currentUrl}/admin.html" 
             style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Admin Dashboard
          </a>
        </div>

        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #2c3e50; margin-top: 0;">Commission Tracking</h4>
          <p><strong>Status:</strong> Pending Customer Response</p>
          <p><strong>Commission Earned:</strong> $0.00 (Will be calculated when quote is accepted)</p>
          <p><strong>Commission Rate:</strong> 10% of total quote value</p>
        </div>

        <p style="margin-top: 30px;">This quote has been automatically tracked in the system for commission purposes.</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Underfloor Heating System</strong></p>
      </div>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
    const mailOptions = {
      from: process.env.MAIL_FROM || `Trade Quotes <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `📊 New Quote Generated - ${quoteData.quoteNumber} - $${quoteData.total}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Admin quote email sent successfully');

  } catch (error) {
    console.error('❌ Error sending admin email:', error.message);
  }
}

async function saveQuoteToDatabase(quoteData) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.log('⚠️ Google Sheets credentials not configured - skipping database save');
      return;
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Prepare data for Google Sheets
    const values = [
      [
        new Date().toISOString(), // Timestamp
        quoteData.quoteId,
        quoteData.quoteNumber,
        quoteData.customerName,
        quoteData.customerEmail,
        quoteData.customerPhone || '',
        quoteData.customerAddress || '',
        quoteData.serviceType,
        quoteData.projectDetails || '',
        quoteData.tradesmanName || '',
        quoteData.tradesmanEmail || '',
        quoteData.tradesmanPhone || '',
        quoteData.companyName,
        quoteData.subtotal,
        quoteData.gst,
        quoteData.total,
        quoteData.date,
        quoteData.expiryDate,
        'generated', // Status
        '', // Customer Response
        '', // Response Date
        '', // Commission Earned
        JSON.stringify(quoteData.items) // Items as JSON
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Quotes!A:V', // Extended range for new fields
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('✅ Quote saved to database for dashboard tracking');

  } catch (error) {
    console.error('❌ Error saving quote to database:', error.message);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
} 