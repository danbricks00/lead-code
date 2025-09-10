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

    console.log('🔍 Looking up quote:', quoteId);

    // Get quote details from database
    const quote = await getQuoteById(quoteId);
    
    if (!quote) {
      console.log('❌ Quote not found in database, trying alternative lookup...');
      
      // Try to find quote in the main spreadsheet as fallback
      const fallbackQuote = await findQuoteInSpreadsheet(quoteId);
      if (!fallbackQuote) {
        return res.status(404).json({ error: 'Quote not found' });
      }
      
      console.log('✅ Found quote in fallback lookup');
      const quoteHtml = generateQuoteHTML(fallbackQuote, true);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(quoteHtml);
    }

    console.log('✅ Quote found in database');
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
             status: 'quote_sent'
    };

    // Save quote to database (you can implement this)
    // await saveQuoteToDatabase(quoteData);

    // Send email to customer with quote
    await sendQuoteEmail(quoteData, req);

    // Send admin copy for tracking and commission purposes
    await sendAdminQuoteEmail(quoteData, req);

    // Save quote to database for dashboard tracking
    await saveQuoteToDatabase(quoteData);
    
    // Also save to the quote database for lookup
    await saveQuoteToQuoteDatabase(quoteData);

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
   const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
   
   const actionsSection = includeActions ? `
     <div class="actions">
       <a href="${currentUrl}/api/customer-accept?quoteId=${quote.quoteId}&leadId=${quote.leadId}" class="action-btn accept-btn">
         ✅ Accept Quote
       </a>
       <a href="${currentUrl}/api/customer-decline?quoteId=${quote.quoteId}&leadId=${quote.leadId}" class="action-btn decline-btn">
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
                line-height: 1.4;
                color: #000;
                background: white;
                padding: 40px;
            }
            
            .quote-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
            }
            
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
            }
            
            .logo-section {
                flex: 1;
            }
            
            .logo {
                font-size: 2.2rem;
                font-weight: bold;
                color: #000;
                margin-bottom: 5px;
            }
            
            .quote-info {
                text-align: right;
            }
            
            .quote-title {
                font-size: 2.5rem;
                font-weight: bold;
                color: #000;
                margin-bottom: 5px;
            }
            
            .customer-name {
                font-size: 1.3rem;
                color: #000;
                font-weight: 600;
            }
            
            .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .quote-details, .company-details {
                flex: 1;
            }
            
            .info-item {
                margin-bottom: 6px;
                font-size: 0.9rem;
            }
            
            .info-label {
                font-weight: bold;
                color: #000;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .items-table th {
                background: #f8f9fa;
                padding: 12px 10px;
                text-align: left;
                border-bottom: 2px solid #dee2e6;
                font-weight: 600;
                color: #000;
            }
            
            .items-table td {
                padding: 12px 10px;
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
                        <span class="info-label">${quote.companyName}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${quote.companyAddress}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${quote.tradesmanPhone || '+64 9 123 4567'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">${quote.tradesmanEmail || 'info@kiwiunderfloor.com'}</span>
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
     console.log('🔄 Starting PDF generation...');
     
     // For Vercel, we'll use a simpler approach that's more compatible
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
         '--disable-extensions',
         '--disable-plugins',
         '--disable-images',
         '--disable-javascript'
       ]
     });
     
     console.log('🌐 Browser launched, creating page...');
     const page = await browser.newPage();
     
     // Generate the quote HTML (without action buttons for PDF)
     const quoteHtml = generateQuoteHTML(quoteData, false);
     
     console.log('📄 Setting page content...');
     await page.setContent(quoteHtml, { 
       waitUntil: 'domcontentloaded',
       timeout: 30000 
     });
     
     // Wait a bit for any dynamic content to render
     await page.waitForTimeout(1000);
     
     console.log('📊 Generating PDF...');
     // Generate PDF
     const pdfBuffer = await page.pdf({
       format: 'A4',
       printBackground: true,
       margin: {
         top: '20mm',
         right: '20mm',
         bottom: '20mm',
         left: '20mm'
       },
       timeout: 30000
     });
     
     console.log('🔒 Closing browser...');
     await browser.close();
     
     console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
     return pdfBuffer;
   } catch (error) {
     console.error('❌ Error generating PDF:', error.message);
     console.error('❌ Error stack:', error.stack);
     
     // Fallback: return null if PDF generation fails
     console.log('⚠️ PDF generation failed, continuing without PDF attachment');
     return null;
   }
 }

 async function sendQuoteEmail(quoteData, req) {
  try {
    // Use fallback credentials like the contact form
    const gmailUser = process.env.GMAIL_USER || 'danbricks18@gmail.com';
    const gmailPass = process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom';

    console.log('📧 Using Gmail credentials for quote email:', { user: gmailUser, pass: gmailPass ? '***' : 'missing' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

     const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

     // Generate PDF
     const pdfBuffer = await generatePDF(quoteData, req);
     
     console.log('📄 PDF generated:', pdfBuffer ? `Size: ${pdfBuffer.length} bytes` : 'Failed to generate');

     const emailContent = `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
         <p>Hi ${quoteData.customerName},</p>
         
         <p>Thank you for your enquiry.</p>
         
         <p>Here's quote ${quoteData.quoteNumber} for NZD ${quoteData.total}.</p>
         
         ${pdfBuffer ? '<p>Please find your quote attached as a PDF document.</p>' : ''}
         
         <p>You can view your quote online:</p>
         <p><a href="${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}" style="color: #6f42c1;">${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}</a></p>
         
         <p>From your online quote you can accept, decline, comment or print.</p>
         
         <p>If you have any questions, please let us know.</p>
         
         <p>Thanks,<br>${quoteData.companyName}</p>
       </div>
     `;

     const attachments = [];
     if (pdfBuffer) {
       attachments.push({
         filename: `Quote-${quoteData.quoteNumber}.pdf`,
         content: pdfBuffer,
         contentType: 'application/pdf'
       });
       console.log('✅ PDF attachment added to email');
     } else {
       console.log('❌ No PDF buffer available for attachment');
     }

     const mailOptions = {
       from: process.env.MAIL_FROM || `${quoteData.companyName} <${gmailUser}>`,
       to: quoteData.customerEmail,
       subject: `Quote ${quoteData.quoteNumber} - ${quoteData.serviceType}`,
       html: emailContent,
       attachments: attachments
     };

     await transporter.sendMail(mailOptions);
     console.log('✅ Quote email sent successfully');

   } catch (error) {
     console.error('❌ Error sending quote email:', error.message);
   }
 }

async function sendAdminQuoteEmail(quoteData, req) {
  try {
    // Use fallback credentials like the contact form
    const gmailUser = process.env.GMAIL_USER || 'danbricks18@gmail.com';
    const gmailPass = process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom';

    console.log('📧 Using Gmail credentials for admin quote email:', { user: gmailUser, pass: gmailPass ? '***' : 'missing' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });

    const currentUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

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

    const adminEmail = process.env.ADMIN_EMAIL || gmailUser;
    const mailOptions = {
      from: process.env.MAIL_FROM || `Trade Quotes <${gmailUser}>`,
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
        quoteData.status || 'quote_sent', // Status
        '', // Customer Response
        '', // Response Date
        '', // Commission Earned
        JSON.stringify(quoteData.items) // Items as JSON
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Quotes!A:AL', // Extended range for new fields
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('✅ Quote saved to database for dashboard tracking');

  } catch (error) {
    console.error('❌ Error saving quote to database:', error.message);
  }
}

async function saveQuoteToQuoteDatabase(quoteData) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.log('⚠️ Google Sheets credentials not configured - skipping quote database save');
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
    
    // Prepare data for quote database (different format for lookup)
    const values = [
      [
        quoteData.quoteId, // QuoteID
        quoteData.quoteId, // LeadID (same as quoteId for now)
        quoteData.customerEmail, // CustomerEmail
        quoteData.customerName, // CustomerName
        quoteData.serviceType, // ServiceType
        quoteData.projectDetails || '', // ProjectDetails
        quoteData.total, // QuoteAmount
        quoteData.status || 'quote_sent', // Status
        new Date().toISOString(), // CreatedDate
        quoteData.expiryDate, // ExpiryDate
        quoteData.tradesmanEmail || '', // AssignedTradesman
        '', // CustomerResponse
        '', // TradesmanResponse
        'active' // FinalStatus
      ]
    ];

    // Try to append to the Quotes sheet in the quote database format
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: 'Quotes!A:AL', // Use the quote database format
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });
      console.log('✅ Quote saved to quote database for lookup');
    } catch (error) {
      console.log('⚠️ Could not save to quote database, may already exist:', error.message);
    }

  } catch (error) {
    console.error('❌ Error saving quote to quote database:', error.message);
  }
}

async function findQuoteInSpreadsheet(quoteId) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.log('⚠️ Google Sheets credentials not configured - skipping fallback lookup');
      return null;
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
    
    // Try to find the quote in the main spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'Quotes!A:AL',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No quotes found in spreadsheet');
      return null;
    }

    // Find the quote by ID (column B contains quoteId)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[1] === quoteId) { // Column B (index 1) contains quoteId
        console.log('✅ Found quote in spreadsheet at row:', i + 1);
        
        // Convert spreadsheet row to quote object
        return {
          quoteId: row[1],
          quoteNumber: row[2],
          customerName: row[3],
          customerEmail: row[4],
          customerPhone: row[5],
          customerAddress: row[6],
          serviceType: row[7],
          projectDetails: row[8],
          tradesmanName: row[9],
          tradesmanEmail: row[10],
          tradesmanPhone: row[11],
          companyName: row[12],
          subtotal: row[13],
          gst: row[14],
          total: row[15],
          date: row[16],
          expiryDate: row[17],
          status: row[18],
          items: row[22] ? JSON.parse(row[22]) : []
        };
      }
    }

    console.log('❌ Quote not found in spreadsheet');
    return null;

  } catch (error) {
    console.error('❌ Error in fallback quote lookup:', error.message);
    return null;
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