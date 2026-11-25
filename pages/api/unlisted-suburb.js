// pages/api/unlisted-suburb.js - Handle unlisted suburb submissions
import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API unlisted-suburb.js");
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    const { 
      suburbName, 
      additionalInfo, 
      customerName, 
      customerEmail, 
      customerPhone,
      leadId,
      serviceType,
      rooms,
      area,
      budget,
      timeline
    } = req.body;

    // Validate required fields
    if (!suburbName || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: suburbName, customerName, customerEmail'
      });
    }

    console.log(`🚨 UNLISTED SUBURB DETECTED: ${suburbName}`);
    console.log(`📋 Customer: ${customerName} (${customerEmail})`);
    console.log(`📋 Lead ID: ${leadId}`);
    console.log(`📋 Additional Info: ${additionalInfo || 'None provided'}`);

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

    // Try to log to Google Sheets first
    try {
      const sheets = getGoogleSheetsClient();
      const spreadsheetId = getSpreadsheetId();
      
      if (spreadsheetId) {
        console.log("📊 Logging unlisted suburb to Google Sheets...");
        
        // Create or get the "UnlistedSuburbs" sheet
        const unlistedSuburbData = [
          nzTimestamp,                    // A: TimeStamp
          leadId || 'N/A',               // B: LeadID
          suburbName,                    // C: SuburbName
          additionalInfo || '',          // D: AdditionalInfo
          customerName,                  // E: CustomerName
          customerEmail,                 // F: CustomerEmail
          customerPhone || '',           // G: CustomerPhone
          serviceType || 'Underfloor Heating', // H: ServiceType
          area || '',                    // I: Area
          budget || '',                  // J: Budget
          timeline || '',                // K: Timeline
          JSON.stringify(rooms || []),   // L: Rooms
          'Pending Review',              // M: Status
          '',                            // N: AdminNotes
          '',                            // O: Decision
          ''                             // P: DecisionTimestamp
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'UnlistedSuburbs!A:P',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [unlistedSuburbData] }
        });

        console.log("✅ Unlisted suburb logged to Google Sheets");
      }
    } catch (sheetsError) {
      console.error("❌ Failed to log to Google Sheets:", sheetsError.message);
      // Continue with email notification even if Sheets fails
    }

    // Send email notification to admin
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
        to: process.env.ADMIN_EMAIL,
        subject: `🚨 UNLISTED SUBURB: ${suburbName} - Lead from ${customerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">
              🚨 Unlisted Suburb Detected
            </h2>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Suburb Information</h3>
              <p><strong>Suburb Name:</strong> ${suburbName}</p>
              <p><strong>Additional Info:</strong> ${additionalInfo || 'None provided'}</p>
            </div>

            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Customer Details</h3>
              <p><strong>Name:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
              <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
            </div>

            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #0066cc; margin-top: 0;">Project Details</h3>
              <p><strong>Service:</strong> ${serviceType || 'Underfloor Heating'}</p>
              <p><strong>Area:</strong> ${area || 'Not specified'}</p>
              <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
              <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
              <p><strong>Rooms:</strong> ${JSON.stringify(rooms || [], null, 2)}</p>
            </div>

            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #155724; margin-top: 0;">Action Required</h3>
              <p>Please review this unlisted suburb and decide:</p>
              <ul>
                <li>Add to the zones list if it's a valid Auckland suburb</li>
                <li>Reject the lead if it's outside service area</li>
                <li>Contact customer for clarification if needed</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #6c757d; font-size: 12px;">
                Timestamp: ${nzTimestamp}<br>
                This is an automated notification from the Heat.nz lead system.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Admin notification email sent");
    } catch (emailError) {
      console.error("❌ Failed to send admin notification:", emailError.message);
    }

    // Log to Vercel logs for immediate visibility
    console.log("🚨 UNLISTED SUBURB ALERT:");
    console.log(`   Suburb: ${suburbName}`);
    console.log(`   Customer: ${customerName} (${customerEmail})`);
    console.log(`   Lead ID: ${leadId}`);
    console.log(`   Additional Info: ${additionalInfo || 'None'}`);
    console.log(`   Timestamp: ${nzTimestamp}`);

    return res.status(200).json({
      success: true,
      message: 'Unlisted suburb logged and admin notified',
      leadId: leadId,
      suburbName: suburbName,
      timestamp: nzTimestamp
    });

  } catch (error) {
    console.error('❌ Unlisted suburb API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
