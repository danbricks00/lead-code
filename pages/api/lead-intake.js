import { google } from "googleapis";

// Gamified status renderer function
function renderStatus(stage) {
  const baseStyle = "font-family: Arial, Helvetica, sans-serif; font-size: 14px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;";
  const checkStyle = "color: #28a745; font-weight: bold;";
  const pendingStyle = "color: #ffc107; font-weight: bold;";
  const crossStyle = "color: #dc3545; font-weight: bold;";
  
  let statusHtml = `<div style="${baseStyle}">`;
  statusHtml += `<h3 style="margin: 0 0 15px 0; color: #333;">Project Status</h3>`;
  
  switch(stage) {
    case "lead":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Quote</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
      break;
    case "quote":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${pendingStyle}">⏳</span> Awaiting Decision</p>`;
      break;
    case "accepted":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Accepted</p>`;
      break;
    case "declined":
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Lead Received</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${checkStyle}">✔</span> Quote Sent</p>`;
      statusHtml += `<p style="margin: 5px 0;"><span style="${crossStyle}">✘</span> Quote Declined</p>`;
      break;
  }
  
  statusHtml += `</div>`;
  return statusHtml;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed for Lead Intake. Use POST method.` 
    });
  }

  const { 
    name, customerName, customerEmail, customerPhone, serviceType, 
    rooms, budget, timeline, area, suburb, specificDetails 
  } = req.body;

  if (!customerName || !customerEmail || !serviceType || !rooms || !Array.isArray(rooms)) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing required fields: customerName, customerEmail, serviceType, rooms (must be array)" 
    });
  }

  // Generate unique lead ID
  const leadId = `LEAD-${Date.now()}-${Math.floor(Math.random()*10000)}`;

  // Format rooms array into readable string
  const roomsString = rooms.map(room => 
    `${room.roomName} (${room.dimensions})`
  ).join(", ");

  // Calculate total project size
  const totalRooms = rooms.length;

  // Use area and suburb from POST body
  const areaValue = area || "";
  const suburbValue = suburb || "";

  let sheetsSuccess = false;
  let emailSuccess = false;

  // Step 1: Try to log to Google Sheets
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
    
    if (privateKey && sheetId) {
      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        privateKey.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const leadRow = [
        new Date().toISOString(), // Timestamp
        leadId, // Lead ID
        name || "", // Name
        customerEmail, // Email
        customerPhone || "", // Phone
        serviceType, // ServiceType
        areaValue, // Area
        suburbValue, // Suburb
        budget || "", // Budget
        timeline || "", // Timeline
        specificDetails || "", // SpecificDetails
        "New" // Status
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Leads!A:Z",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [leadRow]
        }
      });
      
      console.log(`✅ Lead ${leadId} saved to Sheets`);
      sheetsSuccess = true;
    }
  } catch (sheetsError) {
    console.warn(`⚠️ Sheets logging failed for lead ${leadId}:`, sheetsError.message);
  }

  // Step 2: Always send emails (backup system)
  try {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Build quote form URL with lead ID
    const quoteFormUrl = `${process.env.SITE_URL || "https://lead-code.vercel.app"}/quote-form.html?leadId=${leadId}`;

    // Format rooms for email
    const roomsEmailList = rooms.map(room => 
      `<li><strong>${room.roomName}:</strong> ${room.dimensions}</li>`
    ).join("");

    // Team + Admin email content
    const teamSubject = `📋 New Lead - ${serviceType}`;
    const teamHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("lead")}
        <h2 style="color: #333; margin: 20px 0;">New Lead Received</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer Name:</strong> ${customerName}</p>
          <p><strong>Customer Email:</strong> ${customerEmail}</p>
          <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
          <p><strong>Service Type:</strong> ${serviceType}</p>
          <p><strong>Area:</strong> ${areaValue || 'Not specified'}</p>
          <p><strong>Suburb:</strong> ${suburbValue || 'Not specified'}</p>
          <p><strong>Number of Rooms:</strong> ${totalRooms}</p>
          <p><strong>Room Details:</strong></p>
          <ul>${roomsEmailList}</ul>
          <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
          <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
          <p><strong>Specific Details:</strong> ${specificDetails || 'None'}</p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${quoteFormUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">👉 Create Quote</a>
        </div>
      </div>
    `;

    // Send to team and admin
    if (process.env.TEAM_EMAIL) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.TEAM_EMAIL,
        subject: teamSubject,
        html: teamHtml
      });
    }

    if (process.env.ADMIN_EMAIL) {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: teamSubject,
        html: teamHtml
      });
    }

    // Customer confirmation email
    const customerSubject = `✅ We received your request for ${serviceType}`;
    const customerHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("lead")}
        <h2 style="color: #333; margin: 20px 0;">Thank you for your enquiry!</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${customerName},</p>
          <p>We've received your ${serviceType} enquiry and will be in touch within 24 hours.</p>
          <p><strong>Your enquiry details:</strong></p>
          <ul>
            <li><strong>Service:</strong> ${serviceType}</li>
            <li><strong>Rooms:</strong> ${roomsString}</li>
            <li><strong>Area:</strong> ${areaValue || 'Not specified'}</li>
            <li><strong>Suburb:</strong> ${suburbValue || 'Not specified'}</li>
            <li><strong>Budget:</strong> ${budget || 'Not specified'}</li>
            <li><strong>Timeline:</strong> ${timeline || 'Not specified'}</li>
          </ul>
          <p>Best regards,<br>The Kiwi Trade Team</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: customerSubject,
      html: customerHtml
    });

    console.log(`📧 Stage 1 emails sent for lead ${leadId}`);
    emailSuccess = true;

  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  // Step 3: Determine response based on success/failure
  if (sheetsSuccess && emailSuccess) {
    console.log(`✅ Lead ${leadId} saved to Sheets & email sent`);
    return res.status(200).json({ success: true, leadId });
  } else if (!sheetsSuccess && emailSuccess) {
    console.log(`⚠️ Lead logging failed, fallback email sent for ${leadId}`);
    return res.status(200).json({ success: true, leadId, warning: "Sheets logging failed, but email sent" });
  } else {
    console.log(`❌ Lead submission fully failed for ${leadId}`);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to process lead. Please try again or contact us directly." 
    });
  }
}
