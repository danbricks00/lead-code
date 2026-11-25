// pages/api/admin/reject-lead.js - Admin endpoint to reject leads and disable quote acceptance
import { getGoogleSheetsClient, getSpreadsheetId } from '../../../lib/googleSheets.js';
import quoteLogger from '../../../lib/quoteLogger.js';

export default async function handler(req, res) {
  const requestId = quoteLogger.generateRequestId();
  const startTime = Date.now();
  
  quoteLogger.adminDecline('Request received', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: { 'user-agent': req.headers['user-agent'] }
  }, requestId);
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    const { 
      leadId, 
      quoteId,
      customerEmail, 
      customerName,
      suburbName,
      adminNotes,
      rejectionReason,
      adminUser
    } = req.body;

    // Validate required fields
    if (!leadId || !customerEmail || !customerName) {
      quoteLogger.adminDecline('Missing required fields', {
        leadId,
        customerEmail,
        customerName,
        providedFields: Object.keys(req.body)
      }, requestId);
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: leadId, customerEmail, customerName'
      });
    }

    quoteLogger.adminDecline('Processing lead rejection', {
      leadId,
      quoteId,
      customerName,
      customerEmail,
      suburbName,
      rejectionReason,
      adminUser
    }, requestId);

    // Get NZ timestamp
    const getNZTimestamp = () => {
      const now = new Date();
      const nzTime = new Date(now.toLocaleString("en-US", {timeZone: "Pacific/Auckland"}));
      return nzTime.toLocaleString("en-NZ", {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const nzTimestamp = getNZTimestamp();

    // Update Google Sheets - mark lead as rejected
    try {
      const sheets = getGoogleSheetsClient();
      const spreadsheetId = getSpreadsheetId();
      
      if (spreadsheetId) {
        quoteLogger.sheets('Updating lead status to rejected', {
          leadId,
          sheetName: 'Leads'
        }, requestId);
        
        // Find the lead in the Leads sheet
        const leadsResponse = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Leads!A:P',
        });

        const leadRows = leadsResponse.data.values || [];
        const leadHeaderRow = leadRows[0] || [];
        const leadIdIndex = leadHeaderRow.findIndex(h => h.toLowerCase().includes('leadid'));
        
        if (leadIdIndex === -1) {
          throw new Error('LeadID column not found in Leads sheet');
        }

        // Find the row with matching leadId
        let targetRowIndex = -1;
        for (let i = 1; i < leadRows.length; i++) {
          if (leadRows[i][leadIdIndex] === leadId) {
            targetRowIndex = i + 1; // +1 because Sheets is 1-indexed
            break;
          }
        }

        if (targetRowIndex !== -1) {
          // Update the lead status to rejected
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Leads!Z${targetRowIndex}`, // Assuming Z column is for status
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['Rejected']] }
          });
          
          quoteLogger.sheets('Lead status updated to rejected', {
            leadId,
            rowIndex: targetRowIndex
          }, requestId);
        }

        // If there's a quote, update it as well
        if (quoteId) {
          quoteLogger.sheets('Updating quote status to rejected', {
            quoteId,
            sheetName: 'Quotes'
          }, requestId);
          
          const quotesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Quotes!A:AZ',
          });

          const quoteRows = quotesResponse.data.values || [];
          const quoteHeaderRow = quoteRows[0] || [];
          const quoteIdIndex = quoteHeaderRow.findIndex(h => h.toLowerCase().includes('quoteid'));
          
          if (quoteIdIndex !== -1) {
            // Find the row with matching quoteId
            let quoteTargetRowIndex = -1;
            for (let i = 1; i < quoteRows.length; i++) {
              if (quoteRows[i][quoteIdIndex] === quoteId) {
                quoteTargetRowIndex = i + 1; // +1 because Sheets is 1-indexed
                break;
              }
            }

            if (quoteTargetRowIndex !== -1) {
              // Update the quote status to rejected
              await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Quotes!AJ${quoteTargetRowIndex}`, // Assuming AJ column is for status
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['Rejected']] }
              });
              
              quoteLogger.sheets('Quote status updated to rejected', {
                quoteId,
                rowIndex: quoteTargetRowIndex
              }, requestId);
            }
          }
        }
      }
    } catch (sheetsError) {
      quoteLogger.error('Failed to update Google Sheets', {
        error: sheetsError.message,
        stack: sheetsError.stack
      }, requestId);
      // Continue with email notification even if Sheets fails
    }

    // Send rejection email to customer
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: customerEmail,
        subject: `Service Area Update - Heat.nz`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
              Heat.nz - Service Area Update
            </h2>
            
            <p>Dear ${customerName},</p>
            
            <p>Thank you for your interest in our underfloor heating services.</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Service Area Information</h3>
              <p>We currently provide services in the Greater Auckland region. Unfortunately, we are not able to service <strong>${suburbName || 'your area'}</strong> at this time.</p>
              <p><strong>Reason:</strong> ${rejectionReason || 'Outside our current service area'}</p>
            </div>

            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">What's Next?</h3>
              <p>We're constantly expanding our service areas. If you'd like to be notified when we start servicing your area, please reply to this email and we'll add you to our notification list.</p>
              <p>You can also check our website regularly for service area updates.</p>
            </div>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Alternative Options</h3>
              <p>If you're planning to move to an area we do service, or if you have any questions about our services, please don't hesitate to contact us.</p>
            </div>

            <p>Thank you for considering Heat.nz for your underfloor heating needs.</p>
            
            <p>Best regards,<br>
            The Heat.nz Team</p>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px;">
                This email was sent regarding Lead ID: ${leadId}<br>
                Timestamp: ${nzTimestamp}
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      quoteLogger.email('Rejection email sent to customer', {
        to: customerEmail,
        leadId,
        subject: 'Service Area Update - Heat.nz'
      }, requestId);
    } catch (emailError) {
      quoteLogger.error('Failed to send rejection email', {
        error: emailError.message,
        stack: emailError.stack
      }, requestId);
    }

    // Log to Vercel logs
    quoteLogger.adminDecline('Lead rejected successfully', {
      leadId,
      quoteId,
      customerName,
      customerEmail,
      suburbName,
      rejectionReason,
      processingTime: Date.now() - startTime
    }, requestId);

    quoteLogger.response('Lead rejection completed', {
      leadId,
      statusCode: 200,
      processingTime: Date.now() - startTime
    }, requestId);

    return res.status(200).json({
      success: true,
      message: 'Lead rejected and customer notified',
      leadId: leadId,
      quoteId: quoteId,
      customerEmail: customerEmail,
      timestamp: nzTimestamp
    });

  } catch (error) {
    quoteLogger.error('Lead rejection API error', {
      error: error.message,
      stack: error.stack
    }, requestId);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
