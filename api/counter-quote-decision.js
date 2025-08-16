import nodemailer from 'nodemailer';
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { counterQuoteId, originalQuoteId, leadId, token, action } = req.query;
    if (!counterQuoteId || !originalQuoteId || !leadId || !['accept','decline'].includes(action)) {
      return res.status(400).send('Invalid request');
    }

    console.log(`🔍 Counter quote decision received: ${action} for counter quote ${counterQuoteId}`);

    // Fetch counter quote data
    const counterQuoteData = await fetchCounterQuoteData(counterQuoteId);
    if (!counterQuoteData) {
      return res.status(404).send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Counter Quote Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .error { background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">KIWI UNDERFLOOR HEATING</div>
          </div>
          <div class="error">
            <h2>Counter Quote Not Found</h2>
            <p>The counter quote you're trying to access could not be found.</p>
            <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
          </div>
        </body>
        </html>
      `);
    }

    // Check if counter quote already has a decision
    const currentStatus = counterQuoteData.status || 'Pending';
    if (currentStatus === 'Accepted' || currentStatus === 'Declined') {
      const title = currentStatus === 'Accepted' ? 'Counter Quote Already Accepted' : 'Counter Quote Already Declined';
      const msg = currentStatus === 'Accepted' 
        ? 'This counter quote has already been accepted. No further action is needed.'
        : 'This counter quote has already been declined. No further action is needed.';

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #${currentStatus === 'Accepted' ? '10b981' : 'ef4444'}; }
            .status { text-align: center; margin-top: 20px; padding: 15px; background: #${currentStatus === 'Accepted' ? 'd1fae5' : 'fee2e2'}; border-radius: 6px; color: #${currentStatus === 'Accepted' ? '065f46' : '991b1b'}; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">KIWI UNDERFLOOR HEATING</div>
          </div>
          <div class="message">
            <h2>${title}</h2>
            <p>${msg}</p>
          </div>
          <div class="status">
            <strong>Status:</strong> ${currentStatus === 'Accepted' ? '✅ Already Accepted' : '❌ Already Declined'}
          </div>
        </body>
        </html>
      `);
      return;
    }

    // Update counter quote status
    await updateCounterQuoteStatus(counterQuoteId, action === 'accept' ? 'Accepted' : 'Declined');

    // Send emails to all parties
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

      // Get lead data
      const leadData = await fetchLeadData(leadId);

      // 1. Send customer confirmation email
      if (leadData && leadData.customerEmail) {
        const customerSubject = action === 'accept' 
          ? 'Counter Quote Accepted - Thank You!' 
          : 'Counter Quote Decision Recorded';
        
        const customerMessage = action === 'accept'
          ? `Thank you for accepting the counter quote! Your decision has been recorded and the tradesman has been notified. They will contact you shortly to discuss next steps and scheduling.`
          : `Thank you for letting us know about your decision. Your counter quote decline has been recorded. We appreciate you considering our services.`;

        const customerHtml = `
          <div style="font-family: Arial, sans-serif; color:#1f2937;">
            <h2>${customerSubject}</h2>
            <p>Hi ${leadData.customerName || 'there'},</p>
            <p>${customerMessage}</p>
            
            <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
              <h3 style="margin-top:0;">Counter Quote Details</h3>
              <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
              <p><strong>Original Quote ID:</strong> ${originalQuoteId}</p>
              <p><strong>Tradesman:</strong> ${counterQuoteData.tradesmanName || 'Not provided'}</p>
              <p><strong>New Quote Amount:</strong> $${Number(counterQuoteData.counterQuoteAmount || 0).toFixed(2)}</p>
              <p><strong>Decision:</strong> ${action === 'accept' ? 'Accepted' : 'Declined'}</p>
            </div>
            
            <p style="margin-top:20px;color:#6b7280;">
              If you have any questions, please don't hesitate to contact us at info@kiwitrade.co.nz
            </p>
            
            <p style="margin-top:20px;color:#6b7280;">
              Best regards,<br>
              The Kiwi Trade Team
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: leadData.customerEmail,
          subject: customerSubject,
          html: customerHtml
        });
      }

      // 2. Send tradesman notification email
      if (counterQuoteData.tradesmanEmail) {
        const tradesmanSubject = action === 'accept' 
          ? 'Great News! Customer Accepted Your Counter Quote' 
          : 'Customer Decision: Counter Quote Declined';
        
        const tradesmanMessage = action === 'accept'
          ? `Excellent news! The customer has accepted your counter quote and wants to proceed with the job. Please contact them as soon as possible to discuss scheduling and next steps.`
          : `The customer has declined your counter quote. While this is disappointing, it's part of the business. Keep up the great work and focus on your next opportunities.`;

        const tradesmanHtml = `
          <div style="font-family: Arial, sans-serif; color:#1f2937;">
            <h2>${tradesmanSubject}</h2>
            <p>Hi ${counterQuoteData.tradesmanName || 'there'},</p>
            <p>${tradesmanMessage}</p>
            
            <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
              <h3 style="margin-top:0;">Counter Quote Details</h3>
              <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
              <p><strong>Original Quote ID:</strong> ${originalQuoteId}</p>
              <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
              <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
              <p><strong>Counter Quote Amount:</strong> $${Number(counterQuoteData.counterQuoteAmount || 0).toFixed(2)}</p>
              <p><strong>Customer Decision:</strong> ${action === 'accept' ? 'Accepted' : 'Declined'}</p>
            </div>
            
            ${action === 'accept' ? `
            <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
              <h3 style="margin-top:0;color:#065f46;">Next Steps</h3>
              <p style="color:#065f46;">Please contact the customer within 24 hours to:</p>
              <ul style="color:#065f46;">
                <li>Confirm the acceptance</li>
                <li>Discuss scheduling and timeline</li>
                <li>Arrange site visit if needed</li>
                <li>Discuss payment terms</li>
              </ul>
            </div>
            ` : ''}
            
            <p style="margin-top:20px;color:#6b7280;">
              If you need any assistance, please contact the admin team.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: counterQuoteData.tradesmanEmail,
          subject: tradesmanSubject,
          html: tradesmanHtml
        });
      }

      // 3. Send admin notification email
      const adminSubject = `Counter Quote ${action === 'accept' ? 'Accepted' : 'Declined'} - ${leadData?.customerName || 'Unknown Customer'}`;
      
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>Counter Quote Decision Notification</h2>
          <p>A customer has made a decision on a counter quote.</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Decision Summary</h3>
            <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
            <p><strong>Customer Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
            <p><strong>Tradesman:</strong> ${counterQuoteData.tradesmanName || 'Not provided'}</p>
            <p><strong>Tradesman Email:</strong> ${counterQuoteData.tradesmanEmail || 'Not provided'}</p>
            <p><strong>Counter Quote ID:</strong> ${counterQuoteId}</p>
            <p><strong>Original Quote ID:</strong> ${originalQuoteId}</p>
            <p><strong>Counter Quote Amount:</strong> $${Number(counterQuoteData.counterQuoteAmount || 0).toFixed(2)}</p>
            <p><strong>Decision:</strong> <span style="color:${action === 'accept' ? '#10b981' : '#ef4444'};font-weight:bold;">${action === 'accept' ? 'ACCEPTED' : 'DECLINED'}</span></p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
          </div>
          
          <div style="background:#${action === 'accept' ? 'd1fae5' : 'fee2e2'};padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #${action === 'accept' ? '10b981' : 'ef4444'};">
            <h3 style="margin-top:0;color:#${action === 'accept' ? '065f46' : '991b1b'};">Status</h3>
            <p style="color:#${action === 'accept' ? '065f46' : '991b1b'};">
              ${action === 'accept' 
                ? '✅ Customer accepted the counter quote. Tradesman has been notified to follow up.' 
                : '❌ Customer declined the counter quote. No further action required.'}
            </p>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            This is an automated notification from the Kiwi Trade system.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: 'danbricks18@gmail.com', // Admin email
        subject: adminSubject,
        html: adminHtml
      });

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
    }

    // Return success page
    const title = action === 'accept' ? 'Counter Quote Accepted' : 'Counter Quote Decision Recorded';
    const message = action === 'accept' 
      ? 'Thank you for accepting the counter quote! The tradesman has been notified and will contact you shortly.'
      : 'Thank you for letting us know about your decision. Your counter quote decline has been recorded.';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
          .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #${action === 'accept' ? '10b981' : '6b7280'}; }
          .status { text-align: center; margin-top: 20px; padding: 15px; background: #${action === 'accept' ? 'd1fae5' : 'f3f4f6'}; border-radius: 6px; color: #${action === 'accept' ? '065f46' : '374151'}; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">KIWI UNDERFLOOR HEATING</div>
        </div>
        <div class="message">
          <h2>${title}</h2>
          <p>${message}</p>
        </div>
        <div class="status">
          <strong>Status:</strong> ${action === 'accept' ? '✅ Counter Quote Accepted' : '❌ Counter Quote Declined'}
        </div>
        <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          Thank you for using Kiwi Trade services.
        </p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Counter quote decision error:', error);
    res.status(500).send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
          .error { background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">KIWI UNDERFLOOR HEATING</div>
        </div>
        <div class="error">
          <h2>Error Processing Request</h2>
          <p>An error occurred while processing your counter quote decision. Please try again or contact support.</p>
        </div>
      </body>
      </html>
    `);
  }
}

async function fetchCounterQuoteData(counterQuoteId) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    let targetSheet = 'Counter Quotes';
    if (!availableSheets.includes('Counter Quotes')) {
      return null;
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowCounterQuoteId = row[1]; // Counter Quote ID is in column B
      
      if (rowCounterQuoteId === counterQuoteId) {
        return {
          timestamp: row[0] || '',
          counterQuoteId: row[1] || '',
          originalQuoteId: row[2] || '',
          leadId: row[3] || '',
          tradesmanName: row[4] || '',
          tradesmanEmail: row[5] || '',
          tradesmanPhone: row[6] || '',
          counterQuoteAmount: row[7] || '',
          labourRate: row[8] || '',
          labourHours: row[9] || '',
          labourSubtotal: row[10] || '',
          materialRate: row[11] || '',
          materialSQM: row[12] || '',
          materialSubtotal: row[13] || '',
          installationAmount: row[14] || '',
          installationSubtotal: row[15] || '',
          breakdown: row[16] || '',
          notes: row[17] || '',
          validUntil: row[18] || '',
          reasonForCounter: row[19] || '',
          status: row[20] || 'Pending'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching counter quote data:', error);
    return null;
  }
}

async function updateCounterQuoteStatus(counterQuoteId, status) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      throw new Error('Google Sheets credentials not found');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Counter Quotes!A:Z',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in Counter Quotes sheet');
    }

    // Find the row with the counter quote ID
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowCounterQuoteId = row[1]; // Counter Quote ID is in column B
      
      if (rowCounterQuoteId === counterQuoteId) {
        // Update the status in column U (index 20)
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: `Counter Quotes!U${i + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[status]]
          }
        });
        
        console.log(`✅ Counter quote status updated to: ${status}`);
        return;
      }
    }

    throw new Error('Counter quote not found');
  } catch (error) {
    console.error('Error updating counter quote status:', error);
    throw error;
  }
}

async function fetchLeadData(leadId) {
  try {
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    let targetSheet = 'Sheet1';
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    const leadIdIndex = 1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowLeadId = row[leadIdIndex];
      
      if (rowLeadId === leadId) {
        return {
          timestamp: row[0] || '',
          leadId: row[1] || '',
          customerName: row[2] || '',
          customerEmail: row[3] || '',
          customerPhone: row[4] || '',
          selectedService: row[5] || '',
          projectDetails: row[6] || '',
          projectSize: row[7] || '',
          budget: row[8] || '',
          timeline: row[9] || '',
          location: row[10] || '',
          specificDetails: row[11] || '',
          status: row[14] || 'New'
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching lead data:', error);
    return null;
  }
}
