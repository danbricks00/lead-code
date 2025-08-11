import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('📄 Create Quote PDF API called:', req.method, req.url);
  
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

      // Initialize Google Auth
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ],
      });

      const docs = google.docs({ version: 'v1', auth });
      const drive = google.drive({ version: 'v3', auth });

      // Get the template ID from environment variable
      const templateId = process.env.GOOGLE_DOCS_TEMPLATE_ID;
      if (!templateId) {
        throw new Error('GOOGLE_DOCS_TEMPLATE_ID environment variable not set');
      }

      console.log('📋 Using template ID:', templateId);

      // Copy the template to create a new document
      const copyResponse = await drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: `Quote ${quoteData.quoteNumber} - ${quoteData.customerName}`,
        },
      });

      const documentId = copyResponse.data.id;
      console.log('✅ Template copied, new document ID:', documentId);

      // Get the document content to find placeholders
      const document = await docs.documents.get({ documentId });
      const content = document.data.body.content;

      // Prepare replacement data
      const replacements = {
        '{{QUOTE_NUMBER}}': quoteData.quoteNumber || 'N/A',
        '{{DATE}}': new Date().toLocaleDateString(),
        '{{VALID_UNTIL}}': quoteData.validUntil || 'N/A',
        '{{CUSTOMER_NAME}}': quoteData.customerName || 'N/A',
        '{{CUSTOMER_EMAIL}}': quoteData.customerEmail || 'N/A',
        '{{CUSTOMER_PHONE}}': quoteData.customerPhone || 'N/A',
        '{{CUSTOMER_ADDRESS}}': quoteData.location || 'N/A',
        '{{SERVICE_TYPE}}': quoteData.serviceType || 'N/A',
        '{{TRADESMAN_NAME}}': quoteData.tradesmanName || 'N/A',
        '{{TRADESMAN_EMAIL}}': quoteData.tradesmanEmail || 'N/A',
        '{{TRADESMAN_PHONE}}': quoteData.tradesmanPhone || 'N/A',
        '{{ITEM_BREAKDOWN}}': quoteData.itemBreakdown || 'N/A',
        '{{TOTAL_AMOUNT}}': quoteData.totalAmount || 'N/A',
        '{{ADDITIONAL_NOTES}}': quoteData.additionalNotes || 'N/A'
      };

      // Find and replace placeholders in the document
      const requests = [];
      
      // Search for each placeholder and replace it
      for (const [placeholder, value] of Object.entries(replacements)) {
        try {
          // Find the placeholder text in the document
          const searchResponse = await docs.documents.batchUpdate({
            documentId: documentId,
            requestBody: {
              requests: [
                {
                  replaceAllText: {
                    containsText: {
                      text: placeholder,
                      matchCase: true
                    },
                    replaceText: value
                  }
                }
              ]
            }
          });
          
          console.log(`✅ Replaced ${placeholder} with ${value}`);
        } catch (error) {
          console.log(`⚠️ Could not find placeholder ${placeholder}:`, error.message);
        }
      }

      console.log('✅ Document populated with quote data');

      // Export as PDF
      const pdfResponse = await drive.files.export({
        fileId: documentId,
        mimeType: 'application/pdf',
      }, {
        responseType: 'arraybuffer',
      });

      // Convert to base64 for email attachment
      const pdfBuffer = Buffer.from(pdfResponse.data);
      const pdfBase64 = pdfBuffer.toString('base64');

      console.log('✅ PDF generated successfully');

      // Send emails with PDF attachment
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
        'https://lead-code-kh766ffsc-leadcode-b19d9acc.vercel.app';

      // Send to customer
      const customerMailOptions = {
        from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
        to: quoteData.customerEmail || 'danbricks18@gmail.com',
        subject: `Quote ${quoteData.quoteNumber} - ${quoteData.serviceType || 'Your Project'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Your Quote is Ready!</h2>
            <p>Dear ${quoteData.customerName || 'there'},</p>
            <p>Please find attached your quote for <strong>${quoteData.serviceType || 'your project'}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
              <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
              <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
              <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
              <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${currentUrl}/api/view-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                 View Quote Online
              </a>
            </div>
            
            <p>You can also view the quote online and accept/reject it using the link above.</p>
            <p>Please review the quote and let us know if you have any questions.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.tradesmanName}</strong></p>
          </div>
        `,
        attachments: [
          {
            filename: `Quote-${quoteData.quoteNumber}.pdf`,
            content: pdfBase64,
            encoding: 'base64',
            contentType: 'application/pdf'
          }
        ]
      };

      await transporter.sendMail(customerMailOptions);
      console.log('✅ Customer email sent with PDF');

      // Send to tradesman
      const tradesmanMailOptions = {
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
        attachments: [
          {
            filename: `Quote-${quoteData.quoteNumber}-Copy.pdf`,
            content: pdfBase64,
            encoding: 'base64',
            contentType: 'application/pdf'
          }
        ]
      };

      await transporter.sendMail(tradesmanMailOptions);
      console.log('✅ Tradesman email sent with PDF');

      // Send to admin
      const adminMailOptions = {
        from: 'Kiwi Underfloor Heating <danbricks18@gmail.com>',
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
            
            <p>All parties have been notified and received PDF copies.</p>
          </div>
        `,
        attachments: [
          {
            filename: `Quote-${quoteData.quoteNumber}-Admin.pdf`,
            content: pdfBase64,
            encoding: 'base64',
            contentType: 'application/pdf'
          }
        ]
      };

      await transporter.sendMail(adminMailOptions);
      console.log('✅ Admin email sent with PDF');

      // Return success response
      const response = {
        success: true,
        message: 'Quote PDF created and sent successfully!',
        data: {
          documentId,
          quoteNumber: quoteData.quoteNumber,
          customerName: quoteData.customerName,
          totalAmount: quoteData.totalAmount
        },
        status: {
          pdfGenerated: true,
          customerEmailSent: true,
          tradesmanEmailSent: true,
          adminEmailSent: true
        }
      };

      console.log('📊 Quote PDF Response:', response);
      res.json(response);

    } catch (error) {
      console.error('❌ Error creating quote PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create quote PDF',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
