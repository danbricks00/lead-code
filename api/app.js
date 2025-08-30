import { google } from "googleapis";
import nodemailer from "nodemailer";

// Import existing email helper
import { sendEmailViaGmailAPI } from "../src/server/integrations/google/gmail-api-helper.js";

export default async function handler(req, res) {
  const { action } = req.query;

  if (!action) {
    return res.status(400).json({ ok: false, error: "Missing action parameter" });
  }

  try {
    //
    // 🔹 Test Action (GET method for debugging)
    //
    if (action === "test") {
      return res.status(200).json({
        ok: true,
        message: "API is working! Use POST /api/app?action=chatbot for chatbot functionality",
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }

    //
    // 🔹 Zones Action (GET method for chatbot area/suburb selection)
    //
    if (action === "zones") {
      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const sheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (!sheetId) {
        return res.status(500).json({ ok: false, error: "GOOGLE_SPREADSHEET_ID not configured" });
      }

      const range = "Zone!A:C";
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, error: "No data found in Zone sheet" });
      }

      // Skip header row and organize data
      const dataRows = rows.slice(1);
      const zonesData = {};

      dataRows.forEach(row => {
        const suburb = row[0];
        const area = row[1];
        const postcode = row[2];

        if (suburb && area) {
          if (!zonesData[area]) {
            zonesData[area] = [];
          }
          zonesData[area].push({
            suburb: suburb,
            postcode: postcode || ""
          });
        }
      });

      // Sort areas alphabetically and suburbs within each area
      const sortedAreas = Object.keys(zonesData).sort();
      const organizedData = {};

      sortedAreas.forEach(area => {
        organizedData[area] = zonesData[area].sort((a, b) => a.suburb.localeCompare(b.suburb));
      });

      return res.status(200).json({
        ok: true,
        areas: sortedAreas,
        groupedData: organizedData
      });
    }

    //
    // 🔹 Zone Lookup Action
    //
    if (action === "zone") {
      const { address } = req.query;
      if (!address) {
        return res.status(400).json({ ok: false, error: "Missing address parameter" });
      }

      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const sheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (!sheetId) {
        return res.status(500).json({ ok: false, error: "GOOGLE_SPREADSHEET_ID not configured" });
      }

      const range = "Zone!A:C";
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ ok: false, error: "No data found in sheet" });
      }

      const suburbRow = rows.find(
        (row) => row[0]?.toLowerCase() === address.toLowerCase()
      );

      if (!suburbRow) {
        return res.status(404).json({ ok: false, error: "No matching suburb found" });
      }

      return res.status(200).json({
        ok: true,
        suburb: suburbRow[0],
        area: suburbRow[1],
        postcode: suburbRow[2],
      });
    }

    //
    // 🔹 Contact Form Action
    //
    if (action === "contact") {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ 
          ok: false, 
          error: `Method ${req.method} Not Allowed for Contact Form. Use POST method.` 
        });
      }

      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ ok: false, error: "Missing required fields: name, email, message" });
      }

      const transporter = nodemailer.createTransporter({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: process.env.CONTACT_TO,
        subject: "New Contact Form Submission",
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `<p><b>Name:</b> ${name}</p>
               <p><b>Email:</b> ${email}</p>
               <p><b>Message:</b><br/>${message.replace(/\n/g, "<br/>")}</p>`,
      });

      return res.status(200).json({
        ok: true,
        message: "Message sent successfully",
      });
    }

    //
    // 🔹 Chatbot Action
    //
    if (action === "chatbot") {
      if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).json({ 
          ok: false, 
          error: `Method ${req.method} Not Allowed for Chatbot. Use POST method.` 
        });
      }

      const { 
        name, customerName, customerEmail, customerPhone, serviceType, 
        rooms, budget, timeline, location, specificDetails 
      } = req.body;

      if (!customerName || !customerEmail || !serviceType || !rooms || !Array.isArray(rooms)) {
        return res.status(400).json({ 
          ok: false, 
          error: "Missing required fields: customerName, customerEmail, serviceType, rooms (must be array)" 
        });
      }

      // Format rooms array into readable string
      const roomsString = rooms.map(room => 
        `${room.roomName} (${room.dimensions})`
      ).join(", ");

      // Calculate total project size
      const totalRooms = rooms.length;

      // Initialize Google Sheets API
      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        ["https://www.googleapis.com/auth/spreadsheets"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const sheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (!sheetId) {
        return res.status(500).json({ ok: false, error: "GOOGLE_SPREADSHEET_ID not configured" });
      }

      // Append lead data to Google Sheets
      const leadRow = [
        new Date().toISOString(), // Date
        name || "",
        customerName,
        customerEmail,
        customerPhone || "",
        serviceType,
        `${serviceType} - ${totalRooms} room(s): ${roomsString}`, // Project Details
        roomsString, // Project Size
        budget || "",
        timeline || "",
        location || "",
        specificDetails || "",
        "" // Empty column for future use
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Leads!A:M",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [leadRow]
        }
      });

      // Format rooms for email
      const roomsEmailList = rooms.map(room => 
        `<li><strong>${room.roomName}:</strong> ${room.dimensions}</li>`
      ).join("");

      // Send team notification email
      const teamSubject = `🆕 New Lead: ${serviceType} - ${customerName} (${totalRooms} rooms)`;
      const teamHtml = `
        <h2>New Lead Received</h2>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${customerEmail}</p>
        <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
        <p><strong>Service:</strong> ${serviceType}</p>
        <p><strong>Number of Rooms:</strong> ${totalRooms}</p>
        <p><strong>Room Details:</strong></p>
        <ul>${roomsEmailList}</ul>
        <p><strong>Location:</strong> ${location || 'Not specified'}</p>
        <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
        <p><strong>Additional Details:</strong> ${specificDetails || 'None'}</p>
      `;

      await sendEmailViaGmailAPI(process.env.CONTACT_TO, teamSubject, teamHtml);

      // Send confirmation email to customer
      const customerSubject = `Thank you for your ${serviceType} enquiry`;
      const customerHtml = `
        <h2>Thank you for your enquiry!</h2>
        <p>Hi ${customerName},</p>
        <p>We've received your ${serviceType} enquiry for ${totalRooms} room(s) and will be in touch within 24 hours.</p>
        <p><strong>Your enquiry details:</strong></p>
        <ul>
          <li><strong>Service:</strong> ${serviceType}</li>
          <li><strong>Rooms:</strong> ${roomsString}</li>
          <li><strong>Location:</strong> ${location || 'Not specified'}</li>
        </ul>
        <p>Best regards,<br>The Kiwi Trade Team</p>
      `;

      await sendEmailViaGmailAPI(customerEmail, customerSubject, customerHtml);

      return res.status(200).json({
        ok: true,
        message: "Lead logged successfully and emails sent",
        leadId: new Date().toISOString(),
        roomsProcessed: totalRooms
      });
    }

    //
    // 🔹 Unknown Action
    //
    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
