import { google } from "googleapis";

// Import existing email helper
import { sendEmailViaGmailAPI } from "../src/server/integrations/google/gmail-api-helper.js";

// Fallback zone data function
function getFallbackZoneData() {
  return {
    ok: true,
    areas: ["Central Auckland", "North Shore", "West Auckland", "South Auckland"],
    groupedData: {
      "Central Auckland": [
        { suburb: "Auckland CBD", postcode: "1010" },
        { suburb: "Grey Lynn", postcode: "1021" },
        { suburb: "Ponsonby", postcode: "1021" }
      ],
      "North Shore": [
        { suburb: "Takapuna", postcode: "0622" },
        { suburb: "Devonport", postcode: "0624" },
        { suburb: "Milford", postcode: "0620" }
      ],
      "West Auckland": [
        { suburb: "Henderson", postcode: "0610" },
        { suburb: "New Lynn", postcode: "0600" },
        { suburb: "Glen Eden", postcode: "0602" }
      ],
      "South Auckland": [
        { suburb: "Manukau", postcode: "2104" },
        { suburb: "Papatoetoe", postcode: "2025" },
        { suburb: "Otahuhu", postcode: "1640" }
      ]
    }
  };
}

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
      try {
        // Try to fetch from Google Sheets first
        console.log("Zones API called - attempting Google Sheets fetch");
        
        // Handle private key properly
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (!privateKey) {
          console.log("No GOOGLE_PRIVATE_KEY, using fallback data");
          return res.status(200).json(getFallbackZoneData());
        }

        // Clean up private key - handle both formats
        const cleanPrivateKey = privateKey.includes('\\n') 
          ? privateKey.replace(/\\n/g, '\n')
          : privateKey;

        const auth = new google.auth.JWT(
          process.env.GOOGLE_CLIENT,
          null,
          cleanPrivateKey,
          ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        );

        const sheets = google.sheets({ version: "v4", auth });

        const sheetId = process.env.GOOGLE_SPREADSHEET;
        if (!sheetId) {
          console.log("No GOOGLE_SPREADSHEET_ID, using fallback data");
          return res.status(200).json(getFallbackZoneData());
        }

        const range = "Zone!A:C";
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
          console.log("No data found in Zone sheet, using fallback data");
          return res.status(200).json(getFallbackZoneData());
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

        console.log("Successfully fetched zone data from Google Sheets");
        return res.status(200).json({
          ok: true,
          areas: sortedAreas,
          groupedData: organizedData
        });
             } catch (zoneError) {
         console.error("Zone data error:", zoneError);
         console.log("Falling back to hardcoded data");
         return res.status(200).json(getFallbackZoneData());
       }
     }

    //
    // 🔹 Zone Lookup Action
    //
    if (action === "zone") {
      try {
        const { address } = req.query;
        if (!address) {
          return res.status(400).json({ ok: false, error: "Missing address parameter" });
        }

        // Handle private key properly
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        if (!privateKey) {
          return res.status(500).json({ ok: false, error: "GOOGLE_PRIVATE_KEY not configured" });
        }

        // Clean up private key - handle both formats
        const cleanPrivateKey = privateKey.includes('\\n') 
          ? privateKey.replace(/\\n/g, '\n')
          : privateKey;

        const auth = new google.auth.JWT(
          process.env.GOOGLE_CLIENT,
          null,
          cleanPrivateKey,
          ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        );
        const sheets = google.sheets({ version: "v4", auth });

        const sheetId = process.env.GOOGLE_SPREADSHEET;
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

        // Skip header row and search for suburb match
        const dataRows = rows.slice(1);
        const suburbRow = dataRows.find(
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
      } catch (zoneError) {
        console.error("Zone lookup error:", zoneError);
        return res.status(500).json({ 
          ok: false, 
          error: `Zone lookup error: ${zoneError.message}` 
        });
      }
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

      const { name, email, message, subject } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ ok: false, error: "Missing required fields: name, email, message" });
      }

      try {
        // Import nodemailer dynamically
        const nodemailer = await import('nodemailer');
        
        // Create transporter with Gmail SMTP
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
        });

        // Send email
        await transporter.sendMail({
          from: `"${name}" <${email}>`,
          to: process.env.ADMIN_EMAIL,
          subject: subject ? `Contact Form: ${subject}` : "New Contact Form Submission",
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br/>")}</p>
          `,
        });

        return res.status(200).json({
          ok: true,
          message: "Message sent successfully",
        });
      } catch (emailError) {
        console.error('❌ Contact form email error:', emailError);
        return res.status(500).json({
          ok: false,
          error: "Failed to send email. Please try again or contact us directly.",
        });
      }
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
        rooms, budget, timeline, area, suburb, specificDetails 
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

      // Initialize Google Sheets API with proper private key handling
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      if (!privateKey) {
        return res.status(500).json({ ok: false, error: "GOOGLE_PRIVATE_KEY not configured" });
      }

      // Clean up private key - handle both formats
      const cleanPrivateKey = privateKey.includes('\\n') 
        ? privateKey.replace(/\\n/g, '\n')
        : privateKey;

      const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT,
        null,
        cleanPrivateKey,
        ["https://www.googleapis.com/auth/spreadsheets"]
      );
      const sheets = google.sheets({ version: "v4", auth });

      const sheetId = process.env.GOOGLE_SPREADSHEET;
      if (!sheetId) {
        return res.status(500).json({ ok: false, error: "GOOGLE_SPREADSHEET_ID not configured" });
      }

      // Use area and suburb from POST body (no lookup needed)
      const areaValue = area || "";
      const suburbValue = suburb || "";

      // Append lead data to Google Sheets with Area and Suburb
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
        areaValue, // Area
        suburbValue, // Suburb
        "New" // Status
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Leads!A:O", // Updated range to include Area and Suburb
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
       `;

      await sendEmailViaGmailAPI(process.env.ADMIN_EMAIL, teamSubject, teamHtml);

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
           <li><strong>Area:</strong> ${areaValue || 'Not specified'}</li>
           <li><strong>Suburb:</strong> ${suburbValue || 'Not specified'}</li>
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
