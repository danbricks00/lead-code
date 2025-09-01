import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  const { action, leadId, adminEmail, adminPassword, rejectionReason } = req.body;
  
  if (!action || !leadId || !adminEmail || !adminPassword) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing required fields: action, leadId, adminEmail, adminPassword" 
    });
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Invalid action. Must be 'approve' or 'reject'" 
    });
  }

  // Admin authentication
  if (adminEmail !== process.env.ADMIN_EMAIL || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ 
      ok: false, 
      error: "Invalid admin credentials" 
    });
  }

  try {
    // Check if Google Sheets environment variables are configured
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
    
    if (!privateKey || !sheetId) {
      return res.status(500).json({ 
        ok: false, 
        error: "Google Sheets not configured" 
      });
    }

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );
    
    const sheets = google.sheets({ version: "v4", auth });
    
    // Fetch the quote from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Quotes!A:Z"
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "No quotes found" 
      });
    }

    // Find the row with matching leadId
    const quoteRowIndex = rows.findIndex(row => row[1] === leadId);
    if (quoteRowIndex === -1) {
      return res.status(404).json({ 
        ok: false, 
        error: `Quote not found for leadId: ${leadId}` 
      });
    }

    const quoteRow = rows[quoteRowIndex];
    const quoteData = {
      leadId: quoteRow[1] || "",
      customerName: quoteRow[2] || "",
      service: quoteRow[3] || "",
      quoteAmount: quoteRow[4] || "",
      details: quoteRow[5] || "",
      status: quoteRow[6] || "Pending",
      timeline: quoteRow[7] || "",
      area: quoteRow[8] || "",
      suburb: quoteRow[9] || "",
      budget: quoteRow[10] || "",
      specificDetails: quoteRow[11] || "",
      tradesmanName: quoteRow[12] || "",
      tradesmanEmail: quoteRow[13] || "",
      tradesmanPhone: quoteRow[14] || "",
      projectSize: quoteRow[15] || "",
      breakdown: quoteRow[16] || "",
      notes: quoteRow[17] || "",
      companyName: quoteRow[19] || "",
      quoteDate: quoteRow[0] || new Date().toISOString()
    };

    if (action === "approve") {
      // Update quote status to "Approved" and send to customer
      const updatedRow = [...quoteRow];
      updatedRow[6] = "Approved"; // Status column
      updatedRow[20] = new Date().toISOString(); // Admin approval timestamp
      updatedRow[21] = adminEmail; // Admin who approved

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Quotes!A${quoteRowIndex + 1}:Z${quoteRowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [updatedRow]
        }
      });

      // Send approved quote to customer
      await sendApprovedQuoteToCustomer(quoteData);

      console.log(`✅ Admin ${adminEmail} approved quote for lead ${leadId}`);

      return res.status(200).json({
        ok: true,
        message: "Quote approved and sent to customer",
        leadId
      });

    } else if (action === "reject") {
      if (!rejectionReason) {
        return res.status(400).json({ 
          ok: false, 
          error: "Rejection reason is required" 
        });
      }

      // Update quote status to "Rejected" and notify tradesperson
      const updatedRow = [...quoteRow];
      updatedRow[6] = "Rejected"; // Status column
      updatedRow[20] = new Date().toISOString(); // Admin rejection timestamp
      updatedRow[21] = adminEmail; // Admin who rejected
      updatedRow[22] = rejectionReason; // Rejection reason

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Quotes!A${quoteRowIndex + 1}:Z${quoteRowIndex + 1}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [updatedRow]
        }
      });

      // Send rejection notification to tradesperson
      await sendRejectionToTradesperson(quoteData, rejectionReason, adminEmail);

      console.log(`❌ Admin ${adminEmail} rejected quote for lead ${leadId}: ${rejectionReason}`);

      return res.status(200).json({
        ok: true,
        message: "Quote rejected and tradesperson notified",
        leadId,
        rejectionReason
      });
    }

  } catch (error) {
    console.error("❌ Admin quote review error:", error.message);
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to process quote review: ${error.message}` 
    });
  }
}

async function sendApprovedQuoteToCustomer(quoteData) {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';
    const quoteViewUrl = `${SITE_URL}/quote-view?leadId=${quoteData.leadId}`;
    const acceptUrl = `${SITE_URL}/api/quote-decision?leadId=${quoteData.leadId}&action=accept`;
    const declineUrl = `${SITE_URL}/api/quote-decision?leadId=${quoteData.leadId}&action=decline`;

    // Gamified status renderer function
    function renderStatus(stage) {
      const baseStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;";
      const checkStyle = "color: #28a745; font-weight: bold;";
      const pendingStyle = "color: #ffc107; font-weight: bold;";
      
      let statusHtml = `<div style="${baseStyle}">`;
      statusHtml += `<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Approved & Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
      statusHtml += `</div>`;
      return statusHtml;
    }

    const customerSubject = `📋 Your Approved Quote for ${quoteData.service} - ${quoteData.leadId}`;
    const customerHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("quote")}
        <h2 style="color: #333; margin: 20px 0;">Your Quote is Ready!</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${quoteData.customerName},</p>
          <p>Your quote for ${quoteData.service} has been reviewed and approved by our team.</p>
          <p><strong>Quote Amount:</strong> $${quoteData.quoteAmount}</p>
          <p><strong>Timeline:</strong> ${quoteData.timeline || 'Not specified'}</p>
          <p><strong>Project Details:</strong> ${quoteData.details}</p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">View Quote</a>
          <a href="${acceptUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Accept Quote</a>
          <a href="${declineUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Decline Quote</a>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: quoteData.customerEmail,
      subject: customerSubject,
      html: customerHtml
    });

    console.log(`📧 Approved quote sent to customer for lead ${quoteData.leadId}`);

  } catch (error) {
    console.error("❌ Error sending approved quote to customer:", error.message);
  }
}

async function sendRejectionToTradesperson(quoteData, rejectionReason, adminEmail) {
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const tradespersonSubject = `❌ Quote Rejected - Action Required - ${quoteData.leadId}`;
    const tradespersonHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545; margin: 20px 0;">Quote Rejected by Admin</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #dc3545;">
          <p><strong>Quote ID:</strong> ${quoteData.leadId}</p>
          <p><strong>Customer:</strong> ${quoteData.customerName}</p>
          <p><strong>Service:</strong> ${quoteData.service}</p>
          <p><strong>Quote Amount:</strong> $${quoteData.quoteAmount}</p>
          <p><strong>Rejection Reason:</strong> ${rejectionReason}</p>
          <p><strong>Rejected by:</strong> ${adminEmail}</p>
        </div>
        <div style="background: #dc3545; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; font-weight: bold;">⚠️ ACTION REQUIRED: Please review and resubmit quote with corrections!</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: quoteData.tradesmanEmail,
      subject: tradespersonSubject,
      html: tradespersonHtml
    });

    console.log(`📧 Rejection notification sent to tradesperson for lead ${quoteData.leadId}`);

  } catch (error) {
    console.error("❌ Error sending rejection to tradesperson:", error.message);
  }
}
