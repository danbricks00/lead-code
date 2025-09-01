import { google } from "googleapis";

// Import existing email helper
import { sendEmailViaGmailAPI } from "../src/server/integrations/google/gmail-api-helper.js";

// Helper function to load fallback zones from HTML file
function loadFallbackZonesFromHTML() {
  try {
    const path = require("path");
    const fs = require("fs");
    const filePath = path.join(process.cwd(), "public", "zone-fallback-dropdown.html");
    const html = fs.readFileSync(filePath, "utf8");
    
    // Parse <option> tags into JSON
    const matches = [...html.matchAll(/<option value="([^"]+)" data-area="([^"]+)">/g)];
    return matches.map(m => ({ suburb: m[1], area: m[2] }));
  } catch (e) {
    console.error("❌ Failed to load fallback HTML file:", e.message);
    return [];
  }
}

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
    // 🔹 Zone List Action (GET method for frontend dropdown)
    //
    if (action === "zone-list") {
      try {
        // Check if Google Sheets environment variables are configured
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
        
        if (!privateKey || !sheetId) {
          throw new Error("Google Sheets not configured - using fallback");
        }

        const auth = new google.auth.JWT(
          process.env.GOOGLE_CLIENT,
          null,
          privateKey.replace(/\\n/g, "\n"),
          ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        );
        
        const sheets = google.sheets({ version: "v4", auth });
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: "Zone!A:C"
        });
        
        const zones = response.data.values.slice(1).map(row => ({
          suburb: row[0],
          area: row[1]
        }));
        
        console.log(`✅ Zone API: Loaded ${zones.length} from Sheets`);
        return res.status(200).json(zones);
        
      } catch (err) {
        console.error("❌ Zone API Google Sheets error:", err.message);
        
        try {
          // Fallback to static HTML file
          const path = require("path");
          const fs = require("fs");
          const filePath = path.join(process.cwd(), "public", "zone-fallback-dropdown.html");
          const html = fs.readFileSync(filePath, "utf8");
          
          // Parse <option> tags into JSON
          const matches = [...html.matchAll(/<option value="([^"]+)" data-area="([^"]+)">/g)];
          const fallbackZones = matches.map(m => ({ suburb: m[1], area: m[2] }));
          
          console.warn(`⚠️ Zone API fallback: Loaded ${fallbackZones.length} from HTML`);
          return res.status(200).json(fallbackZones);
          
        } catch (e) {
          console.error("❌ Zone API failed to load fallback file:", e.message);
          return res.status(500).json({ error: "Zones unavailable" });
        }
      }
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
          const fallbackZones = loadFallbackZonesFromHTML();
          const areas = [...new Set(fallbackZones.map(z => z.area))].sort();
          const groupedData = {};
          areas.forEach(area => {
            groupedData[area] = fallbackZones.filter(z => z.area === area).map(z => ({ suburb: z.suburb }));
          });
          return res.status(200).json({ ok: true, areas, groupedData });
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

                 const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
         if (!sheetId) {
           console.log("No Google Sheet ID configured, using fallback data");
          const fallbackZones = loadFallbackZonesFromHTML();
          const areas = [...new Set(fallbackZones.map(z => z.area))].sort();
          const groupedData = {};
          areas.forEach(area => {
            groupedData[area] = fallbackZones.filter(z => z.area === area).map(z => ({ suburb: z.suburb }));
          });
          return res.status(200).json({ ok: true, areas, groupedData });
        }

        const range = "Zone!A:C";
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
          console.log("No data found in Zone sheet, using fallback data");
          const fallbackZones = loadFallbackZonesFromHTML();
          const areas = [...new Set(fallbackZones.map(z => z.area))].sort();
          const groupedData = {};
          areas.forEach(area => {
            groupedData[area] = fallbackZones.filter(z => z.area === area).map(z => ({ suburb: z.suburb }));
          });
          return res.status(200).json({ ok: true, areas, groupedData });
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
          console.log("Falling back to HTML file data");
          const fallbackZones = loadFallbackZonesFromHTML();
          const areas = [...new Set(fallbackZones.map(z => z.area))].sort();
          const groupedData = {};
          areas.forEach(area => {
            groupedData[area] = fallbackZones.filter(z => z.area === area).map(z => ({ suburb: z.suburb }));
          });
          return res.status(200).json({ ok: true, areas, groupedData });
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

                 const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
         if (!sheetId) {
           return res.status(500).json({ ok: false, error: "Google Sheet ID not configured" });
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

      // Use area and suburb from POST body (no lookup needed)
      const areaValue = area || "";
      const suburbValue = suburb || "";

             // Generate unique lead ID
       const leadId = `LEAD-${Date.now()}-${Math.floor(Math.random()*10000)}`;

       // Try to log to Google Sheets (but don't fail if it doesn't work)
       try {
         const privateKey = process.env.GOOGLE_PRIVATE_KEY;
         const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
         
         if (privateKey && sheetId) {
           const auth = new google.auth.JWT(
             process.env.GOOGLE_CLIENT,
             null,
             privateKey.replace(/\\n/g, "\n"),
             ["https://www.googleapis.com/auth/spreadsheets"]
           );
           const sheets = google.sheets({ version: "v4", auth });

           // Try to append to Leads sheet first
           try {
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
           } catch (leadsError) {
             console.warn(`⚠️ Sheets logging failed for lead ${leadId}:`, leadsError.message);
           }
         }
       } catch (sheetsError) {
         console.warn(`⚠️ Sheets logging failed for lead ${leadId}:`, sheetsError.message);
       }

             // Always send emails regardless of Sheets success
       try {
         // Import nodemailer dynamically
         const nodemailer = await import('nodemailer');
         
         // Create transporter with Gmail SMTP
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

       } catch (emailError) {
         console.error("❌ Email sending failed:", emailError.message);
         return res.status(500).json({ error: "Email send failed" });
       }

       return res.status(200).json({ success: true, leadId });
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
