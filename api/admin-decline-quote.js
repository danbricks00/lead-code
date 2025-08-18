import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Helper function to format timestamp in NZT
function formatNZTTime(timestamp) {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown time';
  }
}

export default async function handler(req, res) {
  console.log('🚫 Admin Decline Quote API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { quoteId, leadId, reason, notes } = req.body;
      
      console.log('🚫 Admin decline request:', { quoteId, leadId, reason, notes });

      if (!quoteId || !leadId || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: quoteId, leadId, reason'
        });
      }

      // Validate reason
      const validReasons = ['pricing_error', 'missing_details', 'other'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid decline reason'
        });
      }

      // Validate notes for 'other' reason
      if (reason === 'other' && (!notes || !notes.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Notes are required when reason is "other"'
        });
      }

      // Check if Google Sheets is configured
      if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
        console.error('❌ Missing Google Sheets configuration');
        return res.status(500).json({
          success: false,
          error: 'System configuration error'
        });
      }

      let quoteData = null;
      let quoteRowIndex = -1;

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
          range: 'Quotes!A:T',
        });

        const rows = response.data.values || [];
        const quoteRow = rows.find((row, index) => {
          if (row[1] === quoteId) {
            quoteRowIndex = index + 1; // +1 because sheets are 1-indexed
            return true;
          }
          return false;
        });
        
        if (!quoteRow) {
          return res.status(404).json({
            success: false,
            error: 'Quote not found'
          });
        }

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

        console.log('📊 Found quote data:', quoteData);

        // Check if quote is already declined
        if (quoteData.status === 'declined') {
          return res.status(400).json({
            success: false,
            error: 'Quote is already declined'
          });
        }

        // Update quote status to declined
        const updateRange = `Quotes!K${quoteRowIndex}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: updateRange,
          valueInputOption: 'RAW',
          resource: {
            values: [['declined']]
          }
        });

        // Add decline reason and notes
        const declineDataRange = `Quotes!L${quoteRowIndex}:M${quoteRowIndex}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: declineDataRange,
          valueInputOption: 'RAW',
          resource: {
            values: [[reason, notes || '']]
          }
        });

        // Add decline timestamp
        const timestampRange = `Quotes!N${quoteRowIndex}`;
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: timestampRange,
          valueInputOption: 'RAW',
          resource: {
            values: [[new Date().toISOString()]]
          }
        });

        console.log('✅ Quote status updated to declined');

        // Send notification emails
        await sendDeclineNotifications(quoteData, reason, notes);

        return res.json({
          success: true,
          message: 'Quote declined successfully',
          canResubmit: reason === 'pricing_error' || reason === 'missing_details'
        });

      } catch (sheetsError) {
        console.error('❌ Google Sheets error:', sheetsError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to update quote status'
        });
      }

    } catch (error) {
      console.error('❌ Error in admin decline quote:', error);
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

// Send decline notifications to tradesperson and customer
async function sendDeclineNotifications(quoteData, reason, notes) {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'danbricks18@gmail.com',
        pass: 'ptmcojqgthvjbqom'
      }
    });

    const declineTime = formatNZTTime(new Date());
    const canResubmit = reason === 'pricing_error' || reason === 'missing_details';

    // 1. Send tradesperson notification
    const tradesmanSubject = `Quote Declined - ${quoteData.customerName}`;
    const tradesmanHtml = `
      <div style="font-family: Arial, sans-serif; color:#1f2937;">
        <h2>Quote Declined</h2>
        <p>Hi ${quoteData.tradesmanName},</p>
        <p>Your quote for lead ${quoteData.quoteId} has been declined by the admin team.</p>
        
        <div style="background:#fee2e2;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ef4444;">
          <h3 style="margin-top:0;color:#991b1b;">Decline Details</h3>
          <p><strong>Reason:</strong> ${getReasonDisplay(reason)}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p><strong>Declined on:</strong> ${declineTime}</p>
        </div>
        
        <div style="background:#${canResubmit ? 'd1fae5' : 'f3f4f6'};padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #${canResubmit ? '10b981' : '6b7280'};">
          <h3 style="margin-top:0;color:#${canResubmit ? '065f46' : '374151'};">Next Steps</h3>
          ${canResubmit 
            ? '<p>✅ You may resubmit your quote once with the requested corrections.</p>'
            : '<p>❌ No resubmission allowed for this reason.</p>'
          }
        </div>
        
        <p style="margin-top:20px;color:#6b7280;">
          If you have any questions, please contact the admin team.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: 'Kiwi Trade <danbricks18@gmail.com>',
      to: quoteData.tradesmanEmail,
      subject: tradesmanSubject,
      html: tradesmanHtml
    });
    
    console.log('✅ Tradesperson decline notification sent');

    // 2. Send customer notification
    const customerSubject = `Quote Update - ${quoteData.serviceType}`;
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; color:#1f2937;">
        <h2>Quote Update</h2>
        <p>Hi ${quoteData.customerName},</p>
        <p>The quote for your ${quoteData.serviceType} project has been declined by our admin team.</p>
        
        <div style="background:#fee2e2;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ef4444;">
          <h3 style="margin-top:0;color:#991b1b;">Decline Details</h3>
          <p><strong>Reason:</strong> ${getReasonDisplay(reason)}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          <p><strong>Declined on:</strong> ${declineTime}</p>
        </div>
        
        <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #6b7280;">
          <h3 style="margin-top:0;color:#374151;">What happens next?</h3>
          ${canResubmit 
            ? '<p>✅ The tradesperson may resubmit a corrected quote.</p>'
            : '<p>❌ A new quote will need to be generated.</p>'
          }
        </div>
        
        <p style="margin-top:20px;color:#6b7280;">
          We will keep you updated on any new quotes for your project.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: 'Kiwi Trade <danbricks18@gmail.com>',
      to: quoteData.customerEmail,
      subject: customerSubject,
      html: customerHtml
    });
    
    console.log('✅ Customer decline notification sent');

  } catch (emailError) {
    console.error('❌ Email sending error:', emailError.message);
  }
}

// Helper function to get display text for decline reason
function getReasonDisplay(reason) {
  switch (reason) {
    case 'pricing_error':
      return 'Pricing Error';
    case 'missing_details':
      return 'Missing/Incorrect Details';
    case 'other':
      return 'Other';
    default:
      return reason;
  }
}
