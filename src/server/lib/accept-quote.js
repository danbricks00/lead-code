import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('✅ Accept Quote API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { quoteId, quoteNumber } = req.query;
      
      console.log('✅ Quote accept request:', { quoteId, quoteNumber });

      let quoteData = null;
      let currentStatus = 'unknown';

      // 1. Check current quote status in Google Sheets
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
          
          // Find the quote in the Quotes sheet
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:AL',
          });

          const rows = response.data.values || [];
          const quoteRow = rows.find(row => row[1] === quoteId || row[2] === quoteNumber);
          
          if (quoteRow) {
            quoteData = {
              quoteId: quoteRow[1],
              quoteNumber: quoteRow[2],
              tradesmanName: quoteRow[3],
              tradesmanEmail: quoteRow[4],
              tradesmanPhone: quoteRow[5],
              totalAmount: quoteRow[6],
              customerName: quoteRow[11],
              customerEmail: quoteRow[12],
              customerPhone: quoteRow[13],
              serviceType: quoteRow[14],
              location: quoteRow[15],
              status: quoteRow[10] || 'submitted'
            };
            currentStatus = quoteData.status;
            console.log('📊 Current quote status:', currentStatus);
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // 2. Check if quote was already processed
      if (currentStatus === 'accepted') {
        const alreadyAcceptedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote Already Accepted</title>
              <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                  .info { background: #f8f9fa; color: #0c5460; padding: 20px; border-radius: 8px; border: 1px solid #bee5eb; }
                  .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
              </style>
          </head>
          <body>
              <div class="info">
                  <h1>📋 Quote Already Accepted</h1>
                  <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                  <p>This quote has already been accepted. We're processing your request and will be in touch soon.</p>
                  <p>If you have any questions, please contact us directly.</p>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/" class="button">Back to Home</a>
          </body>
          </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(alreadyAcceptedHtml);
      }

      if (currentStatus === 'declined') {
        const alreadyDeclinedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote Already Declined</title>
              <style>
                  body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                  .info { background: #f8f9fa; color: #0c5460; padding: 20px; border-radius: 8px; border: 1px solid #bee5eb; }
                  .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
              </style>
          </head>
          <body>
              <div class="info">
                  <h1>📋 Quote Already Declined</h1>
                  <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                  <p>This quote has already been declined. If you'd like to discuss alternative options, please contact us directly.</p>
              </div>
              
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/" class="button">Back to Home</a>
          </body>
          </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(alreadyDeclinedHtml);
      }

      // 3. Update quote status to 'accepted' in Google Sheets
      if (quoteData && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          // Find the row index and update status
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:AL',
          });

          const rows = response.data.values || [];
          const quoteRowIndex = rows.findIndex(row => row[1] === quoteId || row[2] === quoteNumber);
          
          if (quoteRowIndex !== -1) {
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
              range: `Quotes!K${quoteRowIndex + 1}`,
              valueInputOption: 'RAW',
              resource: { values: [['accepted']] }
            });
            console.log('✅ Quote status updated to accepted');
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets update error:', sheetsError.message);
        }
      }

      // 4. Send notification email to tradesman
      if (quoteData && quoteData.tradesmanEmail) {
        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
              user: 'danbricks18@gmail.com',
              pass: 'ptmcojqgthvjbqom'
            }
          });

          const tradesmanMailOptions = {
            from: 'Kiwi Trade <danbricks18@gmail.com>',
            to: quoteData.tradesmanEmail,
            subject: `🎉 Quote ${quoteNumber} ACCEPTED by Customer!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #28a745;">🎉 Quote Accepted!</h2>
                <p>Great news! Your quote has been accepted by the customer.</p>
                
                <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #155724; margin-top: 0;">Quote Details:</h3>
                  <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                  <p><strong>Customer:</strong> ${quoteData.customerName || 'Not specified'}</p>
                  <p><strong>Customer Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
                  <p><strong>Customer Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
                  <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                  <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
                  <p><strong>Location:</strong> ${quoteData.location || 'Auckland'}</p>
                </div>

                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #27ae60; margin-top: 0;">Next Steps:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>📞 Contact the customer to confirm details</li>
                    <li>📅 Schedule the work at their convenience</li>
                    <li>📋 Prepare any necessary documentation</li>
                    <li>💰 Arrange payment terms</li>
                  </ul>
                </div>

                <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
              </div>
            `
          };

          await transporter.sendMail(tradesmanMailOptions);
          console.log('✅ Tradesman notification email sent');
        } catch (emailError) {
          console.error('❌ Tradesman email error:', emailError.message);
        }
      }

      // 5. Return success page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote Accepted</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; border: 1px solid #c3e6cb; }
                .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="success">
                <h1>🎉 Quote Accepted!</h1>
                <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                <p>Thank you for accepting this quote. We'll be in touch soon to proceed with your project.</p>
            </div>
            
            <div class="info">
                <h3>What happens next?</h3>
                <ul style="text-align: left;">
                    <li>We'll contact you to confirm the details</li>
                    <li>Schedule the work at your convenience</li>
                    <li>Begin the installation process</li>
                    <li>Keep you updated throughout the project</li>
                </ul>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/" class="button">Back to Home</a>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);

    } catch (error) {
      console.error('❌ Error accepting quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept quote',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
