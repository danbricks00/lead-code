// pages/api/admin/reject-unlisted-lead.js - Admin endpoint to reject leads from unlisted suburbs
import { getGoogleSheetsClient, getSpreadsheetId } from '../../../lib/googleSheets.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API admin/reject-unlisted-lead.js");
  
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
      suburbName, 
      customerEmail, 
      customerName,
      adminNotes,
      rejectionReason
    } = req.body;

    // Validate required fields
    if (!leadId || !suburbName || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: leadId, suburbName, customerEmail'
      });
    }

    console.log(`🚫 REJECTING UNLISTED SUBURB LEAD: ${leadId}`);
    console.log(`📋 Suburb: ${suburbName}`);
    console.log(`📋 Customer: ${customerName} (${customerEmail})`);
    console.log(`📋 Reason: ${rejectionReason || 'Outside service area'}`);

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

    // Update Google Sheets UnlistedSuburbs tab
    try {
      const sheets = getGoogleSheetsClient();
      const spreadsheetId = getSpreadsheetId();
      
      if (spreadsheetId) {
        console.log("📊 Updating unlisted suburb status in Google Sheets...");
        
        // Find the row with this leadId
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'UnlistedSuburbs!A:P',
        });

        const rows = response.data.values || [];
        const headerRow = rows[0] || [];
        const leadIdIndex = headerRow.findIndex(h => h.toLowerCase().includes('leadid'));
        
        if (leadIdIndex === -1) {
          throw new Error('LeadID column not found in UnlistedSuburbs sheet');
        }

        // Find the row with matching leadId
        let targetRowIndex = -1;
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][leadIdIndex] === leadId) {
            targetRowIndex = i + 1; // +1 because Sheets is 1-indexed
            break;
          }
        }

        if (targetRowIndex === -1) {
          throw new Error(`Lead ID ${leadId} not found in UnlistedSuburbs sheet`);
        }

        // Update the row with rejection status
        const updateData = [
          '', // A: TimeStamp (keep existing)
          '', // B: LeadID (keep existing)
          '', // C: SuburbName (keep existing)
          '', // D: AdditionalInfo (keep existing)
          '', // E: CustomerName (keep existing)
          '', // F: CustomerEmail (keep existing)
          '', // G: CustomerPhone (keep existing)
          '', // H: ServiceType (keep existing)
          '', // I: Area (keep existing)
          '', // J: Budget (keep existing)
          '', // K: Timeline (keep existing)
          '', // L: Rooms (keep existing)
          'Rejected', // M: Status
          adminNotes || rejectionReason || 'Outside service area', // N: AdminNotes
          'Rejected', // O: Decision
          nzTimestamp // P: DecisionTimestamp
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `UnlistedSuburbs!M${targetRowIndex}:P${targetRowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [updateData.slice(12, 16)] } // Only update columns M-P
        });

        console.log("✅ Unlisted suburb status updated in Google Sheets");
      }
    } catch (sheetsError) {
      console.error("❌ Failed to update Google Sheets:", sheetsError.message);
      // Continue with email notification even if Sheets fails
    }

    // Send rejection email to customer
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: customerEmail,
        subject: `Service Area Update - Kiwi Trade`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">
              Kiwi Trade - Service Area Update
            </h2>
            
            <p>Dear ${customerName},</p>
            
            <p>Thank you for your interest in our underfloor heating services.</p>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Service Area Information</h3>
              <p>We currently provide services in the Greater Auckland region. Unfortunately, we are not able to service <strong>${suburbName}</strong> at this time.</p>
              <p><strong>Reason:</strong> ${rejectionReason || 'Outside our current service area'}</p>
            </div>

            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">What's Next?</h3>
              <p>We're constantly expanding our service areas. If you'd like to be notified when we start servicing ${suburbName}, please reply to this email and we'll add you to our notification list.</p>
              <p>You can also check our website regularly for service area updates.</p>
            </div>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Alternative Options</h3>
              <p>If you're planning to move to an area we do service, or if you have any questions about our services, please don't hesitate to contact us.</p>
            </div>

            <p>Thank you for considering Kiwi Trade for your underfloor heating needs.</p>
            
            <p>Best regards,<br>
            The Kiwi Trade Team</p>

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
      console.log("✅ Rejection email sent to customer");
    } catch (emailError) {
      console.error("❌ Failed to send rejection email:", emailError.message);
    }

    // Log to Vercel logs
    console.log("🚫 UNLISTED SUBURB LEAD REJECTED:");
    console.log(`   Lead ID: ${leadId}`);
    console.log(`   Suburb: ${suburbName}`);
    console.log(`   Customer: ${customerName} (${customerEmail})`);
    console.log(`   Reason: ${rejectionReason || 'Outside service area'}`);
    console.log(`   Timestamp: ${nzTimestamp}`);

    return res.status(200).json({
      success: true,
      message: 'Lead rejected and customer notified',
      leadId: leadId,
      suburbName: suburbName,
      customerEmail: customerEmail,
      timestamp: nzTimestamp
    });

  } catch (error) {
    console.error('❌ Reject unlisted lead API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
