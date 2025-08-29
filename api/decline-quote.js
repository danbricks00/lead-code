// Helper function to format timestamp in NZT
function formatNZTTime(timestamp) {
  try {
    // Handle different timestamp formats
    let date;
    if (typeof timestamp === 'string') {
      // If it's already a formatted string, try to parse it
      if (timestamp.includes('NZT')) {
        return timestamp; // Already formatted
      }
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp:', timestamp);
      return 'Unknown time';
    }
    
    return date.toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' NZT';
  } catch (error) {
    console.error('Error formatting timestamp:', error, 'Original timestamp:', timestamp);
    return 'Unknown time';
  }
}

export default async function handler(req, res) {
  console.log('❌ Decline Quote API called:', req.method, req.url);
  
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
      
      console.log('❌ Quote decline request:', { quoteId, quoteNumber });

      let quoteData = null;
      let currentStatus = 'unknown';

      // 1. Check current quote status in Google Sheets
      if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          // Use dynamic import for googleapis
          const { google } = await import('googleapis');
          
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
            range: 'Quotes!A:T',
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
        // Get the timestamp when the quote was accepted
        let acceptedTime = 'Unknown time';
        if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
          try {
            // Use dynamic import for googleapis
            const { google } = await import('googleapis');
            
            const auth = new google.auth.GoogleAuth({
              credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              },
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const sheets = google.sheets({ version: 'v4', auth });
            
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
              range: 'Quotes!A:T',
            });

            const rows = response.data.values || [];
            const quoteRow = rows.find(row => row[1] === quoteId || row[2] === quoteNumber);
            
                                                   if (quoteRow && quoteRow[11]) {
                // Use the acceptance timestamp from column L (index 11)
                const timestamp = quoteRow[11];
                console.log('📅 Retrieved acceptance timestamp:', timestamp);
                acceptedTime = formatNZTTime(timestamp);
              } else if (quoteRow && quoteRow[0]) {
                // Fallback to the first column (timestamp) if column L is empty
                const timestamp = quoteRow[0];
                console.log('📅 Using fallback timestamp from column A:', timestamp);
                acceptedTime = formatNZTTime(timestamp);
              } else {
                console.log('📅 No timestamp found, using current time');
                acceptedTime = formatNZTTime(new Date());
              }
          } catch (error) {
            console.error('Error getting acceptance timestamp:', error);
          }
        }

        const alreadyAcceptedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote Already Accepted</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                  <p><strong>Quote decision recorded on:</strong> ${acceptedTime}</p>
                  <p>We're processing your request and will be in touch soon.</p>
                  <p>If you have any questions, please contact us directly.</p>
              </div>
              
              <a href="https://lead-code.vercel.app/" class="button">Back to Home</a>
          </body>
          </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(alreadyAcceptedHtml);
      }

      if (currentStatus === 'declined') {
        // Get the timestamp when the quote was declined
        let declinedTime = 'Unknown time';
        if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
          try {
            // Use dynamic import for googleapis
            const { google } = await import('googleapis');
            
            const auth = new google.auth.GoogleAuth({
              credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              },
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const sheets = google.sheets({ version: 'v4', auth });
            
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
              range: 'Quotes!A:T',
            });

            const rows = response.data.values || [];
            const quoteRow = rows.find(row => row[1] === quoteId || row[2] === quoteNumber);
            
                                                   if (quoteRow && quoteRow[11]) {
                // Use the decline timestamp from column L (index 11)
                const timestamp = quoteRow[11];
                console.log('📅 Retrieved decline timestamp:', timestamp);
                declinedTime = formatNZTTime(timestamp);
              } else if (quoteRow && quoteRow[0]) {
                // Fallback to the first column (timestamp) if column L is empty
                const timestamp = quoteRow[0];
                console.log('📅 Using fallback timestamp from column A:', timestamp);
                declinedTime = formatNZTTime(timestamp);
              } else {
                console.log('📅 No timestamp found, using current time');
                declinedTime = formatNZTTime(new Date());
              }
          } catch (error) {
            console.error('Error getting decline timestamp:', error);
          }
        }

        const alreadyDeclinedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote Already Declined</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                  <p><strong>Quote decision recorded on:</strong> ${declinedTime}</p>
                  <p>If you'd like to discuss alternative options, please contact us directly.</p>
              </div>
              
              <a href="https://lead-code.vercel.app/" class="button">Back to Home</a>
          </body>
          </html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(alreadyDeclinedHtml);
      }

      // 3. Update quote status to 'declined' in Google Sheets
      if (quoteData && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          // Use dynamic import for googleapis
          const { google } = await import('googleapis');
          
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
            range: 'Quotes!A:T',
          });

          const rows = response.data.values || [];
          const quoteRowIndex = rows.findIndex(row => row[1] === quoteId || row[2] === quoteNumber);
          
                     if (quoteRowIndex !== -1) {
             const currentTime = new Date().toISOString();
             await sheets.spreadsheets.values.update({
               spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
               range: `Quotes!K${quoteRowIndex + 1}:L${quoteRowIndex + 1}`,
               valueInputOption: 'RAW',
               resource: { values: [['declined', currentTime]] }
             });
             console.log('✅ Quote status updated to declined with timestamp');
           }
        } catch (sheetsError) {
          console.error('❌ Google Sheets update error:', sheetsError.message);
        }
      }

      // 4. Send notification email to tradesman
      if (quoteData && quoteData.tradesmanEmail) {
        try {
          // Use dynamic import for nodemailer
          const { nodemailer } = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
              pass: process.env.GMAIL_PASS || 'ptmcojqgthvjbqom'
            }
          });

          const tradesmanMailOptions = {
            from: process.env.MAIL_FROM || 'Kiwi Trade <danbricks18@gmail.com>',
            to: quoteData.tradesmanEmail,
            subject: `❌ Quote ${quoteNumber} DECLINED by Customer`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">❌ Quote Declined</h2>
                <p>The customer has declined your quote.</p>
                
                <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #721c24; margin-top: 0;">Quote Details:</h3>
                  <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                  <p><strong>Customer:</strong> ${quoteData.customerName || 'Not specified'}</p>
                  <p><strong>Customer Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
                  <p><strong>Customer Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
                  <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                  <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
                  <p><strong>Location:</strong> ${quoteData.location || 'Auckland'}</p>
                </div>

                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #856404; margin-top: 0;">Next Steps:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>📞 Consider contacting the customer to understand their concerns</li>
                    <li>💰 Review pricing strategy if needed</li>
                    <li>📋 Update your quote records</li>
                    <li>🎯 Focus on other active leads</li>
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

      // 5. Return decline confirmation page
      const currentTime = formatNZTTime(new Date());
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Quote Declined</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
                .decline { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; border: 1px solid #f5c6cb; }
                .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
            </style>
        </head>
        <body>
            <div class="decline">
                <h1>❌ Quote Declined</h1>
                <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                <p><strong>Declined on:</strong> ${currentTime}</p>
                <p>Thank you for your response. We understand that this quote didn't meet your requirements.</p>
            </div>
            
            <div class="info">
                <h3>What happens next?</h3>
                <ul style="text-align: left;">
                    <li>We'll update our records accordingly</li>
                    <li>If you change your mind, feel free to contact us</li>
                    <li>We're always happy to discuss alternative options</li>
                    <li>Thank you for considering our services</li>
                </ul>
            </div>
            
            <a href="https://lead-code.vercel.app/" class="button">Back to Home</a>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);

    } catch (error) {
      console.error('❌ Error declining quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to decline quote',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
