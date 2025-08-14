import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('🔍 Create quote doc API called:', req.method, req.url);
  
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
      console.log('✅ Creating quote document for:', quoteData.quoteNumber);

      // Validate required data
      if (!quoteData.quoteNumber || !quoteData.customerName || !quoteData.totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required quote data (quoteNumber, customerName, totalAmount)'
        });
      }

      // Check if Google credentials are available
      if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
        return res.status(500).json({
          success: false,
          error: 'Google credentials not configured'
        });
      }

      // Initialize Google Docs API
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/drive'
        ],
      });

      const docs = google.docs({ version: 'v1', auth });
      const drive = google.drive({ version: 'v3', auth });

      // Get the template document ID
      const templateId = process.env.GOOGLE_DOCS_TEMPLATE_ID || '1jmcEgI6o8XS1KAgOyoWrx2xtuzU9v7y5';

      // 1. Copy the template to create a new document
      console.log('📋 Copying template document...');
      const copyResponse = await drive.files.copy({
        fileId: templateId,
        requestBody: {
          name: `Quote ${quoteData.quoteNumber}`,
          parents: ['root'] // Place in root folder
        }
      });

      const newDocId = copyResponse.data.id;
      console.log('✅ New document created with ID:', newDocId);

      // 2. Prepare the replacement data based on your template structure
      const replacements = {
        // Quote details
        '{{QUOTE_NUMBER}}': quoteData.quoteNumber || 'QU1001',
        '{{DATE}}': new Date().toLocaleDateString('en-NZ'),
        '{{EXPIRY_DATE}}': quoteData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NZ'),
        
        // Customer details
        '{{CUSTOMER_NAME}}': quoteData.customerName || 'Customer Name',
        '{{CUSTOMER_EMAIL}}': quoteData.customerEmail || 'Not specified',
        '{{CUSTOMER_PHONE}}': quoteData.customerPhone || 'Not specified',
        '{{CUSTOMER_ADDRESS}}': quoteData.location || 'Auckland',
        
        // Service details
        '{{SERVICE_TYPE}}': quoteData.serviceType || 'Underfloor Heating',
        '{{PROJECT_DETAILS}}': quoteData.projectDetails || 'Project Details',
        
        // Tradesman details
        '{{TRADESMAN_NAME}}': quoteData.tradesmanName || 'Kiwi Trade',
        '{{TRADESMAN_PHONE}}': quoteData.tradesmanPhone || 'Not specified',
        '{{TRADESMAN_EMAIL}}': quoteData.tradesmanEmail || 'info@kiwitrade.co.nz',
        
        // Pricing details
        '{{TOTAL_AMOUNT}}': quoteData.totalAmount || '0.00',
        '{{ITEM_BREAKDOWN}}': quoteData.itemBreakdown || 'Item breakdown not provided',
        '{{ADDITIONAL_NOTES}}': quoteData.additionalNotes || '',
        
        // Company details (from your template)
        '{{COMPANY_NAME}}': 'Kiwi Trade',
        '{{COMPANY_ADDRESS}}': 'Auckland, New Zealand',
        '{{GST_NUMBER}}': '120-681-729',
        '{{REFERENCE}}': quoteData.location || 'Auckland'
      };

      // 3. Get the document content
      const document = await docs.documents.get({ documentId: newDocId });
      const content = document.data.body.content;

      // 4. Find and replace all placeholders
      const requests = [];
      let currentIndex = 0;

      // Process each paragraph and table cell
      for (const element of content) {
        if (element.paragraph) {
          const paragraph = element.paragraph;
          
          // Check each text run in the paragraph
          for (const textRun of paragraph.elements || []) {
            if (textRun.textRun && textRun.textRun.content) {
              const text = textRun.textRun.content;
              
              // Check for each placeholder
              for (const [placeholder, replacement] of Object.entries(replacements)) {
                if (text.includes(placeholder)) {
                  const startIndex = currentIndex + text.indexOf(placeholder);
                  const endIndex = startIndex + placeholder.length;
                  
                  requests.push({
                    replaceAllText: {
                      containsText: {
                        text: placeholder,
                        matchCase: true
                      },
                      replaceText: replacement
                    }
                  });
                }
              }
            }
            currentIndex += (textRun.textRun?.content?.length || 0);
          }
        }
      }

      // 5. Apply the replacements
      if (requests.length > 0) {
        console.log('🔄 Applying', requests.length, 'replacements...');
        await docs.documents.batchUpdate({
          documentId: newDocId,
          requestBody: {
            requests: requests
          }
        });
        console.log('✅ All replacements applied successfully');
      }

      // 6. Get the final document URL
      const documentUrl = `https://docs.google.com/document/d/${newDocId}/edit`;
      const shareUrl = `https://docs.google.com/document/d/${newDocId}/edit?usp=sharing`;

      // 7. Make the document accessible to anyone with the link (optional)
      try {
        await drive.permissions.create({
          fileId: newDocId,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
        console.log('✅ Document made publicly readable');
      } catch (permissionError) {
        console.log('⚠️ Could not set public permissions:', permissionError.message);
      }

      // 8. Send notification email to admin with the new document link
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
            pass: process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom'
          }
        });

        const adminMailOptions = {
          from: `Kiwi Trade <${process.env.GMAIL_USER || 'danbricks18@gmail.com'}>`,
          to: 'danbricks18@gmail.com',
          subject: `Quote ${quoteData.quoteNumber} Document Created - ${quoteData.tradesmanName}`,
          html: `
            <h2>Quote Document Created Successfully!</h2>
            <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
            <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
            <p><strong>Customer:</strong> ${quoteData.customerName}</p>
            <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
            <p><strong>Document Name:</strong> Quote ${quoteData.quoteNumber}</p>
            
            <div style="margin: 20px 0;">
              <a href="${documentUrl}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                 📄 Open Quote Document
              </a>
            </div>
            
            <p><strong>Document URL:</strong> <a href="${documentUrl}">${documentUrl}</a></p>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Review the generated quote document</li>
              <li>Make any necessary adjustments</li>
              <li>Save as PDF</li>
              <li>Send to customer</li>
            </ol>
            
            <p><strong>⚠️ IMPORTANT:</strong> This document is automatically generated. Please review and customize as needed before sending to the customer.</p>
          `
        };

        await transporter.sendMail(adminMailOptions);
        console.log('✅ Admin notification email sent');
      } catch (emailError) {
        console.error('❌ Admin email failed:', emailError.message);
      }

      // Return success response
      const response = {
        success: true,
        message: `Quote document "Quote ${quoteData.quoteNumber}" created successfully!`,
        data: {
          documentId: newDocId,
          documentName: `Quote ${quoteData.quoteNumber}`,
          documentUrl: documentUrl,
          shareUrl: shareUrl,
          quoteNumber: quoteData.quoteNumber,
          customerName: quoteData.customerName,
          totalAmount: quoteData.totalAmount,
          tradesmanName: quoteData.tradesmanName
        },
        timestamp: new Date().toISOString()
      };

      console.log('📊 Quote Document Response:', response);
      res.json(response);

    } catch (error) {
      console.error('❌ Error creating quote document:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create quote document',
        details: error.message
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
