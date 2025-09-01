import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Helper function to determine ops email based on area/suburb
function lookupOpsEmail(area, suburb) {
  try {
    const zonesPath = path.join(process.cwd(), "data", "zones.json");
    const zonesData = JSON.parse(fs.readFileSync(zonesPath, "utf-8"));

    // Find matching zone entry
    const match = zonesData.find(zone =>
      zone.area?.toLowerCase().includes(area?.toLowerCase()) ||
      zone.suburb?.toLowerCase().includes(suburb?.toLowerCase())
    );

    if (match) {
      // Map areas to specific ops emails
      const areaLower = match.area?.toLowerCase() || "";
      if (areaLower.includes("auckland")) return "auckland@kiwitrade.co.nz";
      if (areaLower.includes("wellington")) return "wellington@kiwitrade.co.nz";
      if (areaLower.includes("christchurch")) return "christchurch@kiwitrade.co.nz";
    }

    // Default fallback
    return "leads@kiwitrade.co.nz";
  } catch (error) {
    console.error("Zone lookup failed, using default:", error.message);
    return "leads@kiwitrade.co.nz";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, phone, service, details, area, suburb } = req.body;

    console.log("📩 Lead intake request:", { name, email, phone, service, details, area, suburb });

    // Validate required fields
    if (!name || !email || !service) {
      return res.status(400).json({ success: false, error: "Missing required fields: name, email, service" });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    console.log("🔧 Transporter created, attempting 3 emails...");

    // 1. Internal notification email
    const adminEmail = {
      from: `"Kiwi Trade Lead Bot" <${process.env.GMAIL_USER}>`,
      to: "office@kiwitrade.co.nz", // Your admin inbox
      subject: `🔔 New Lead: ${service}`,
      text: `
NEW LEAD RECEIVED:

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Service: ${service}
Area: ${area || "Not specified"}
Suburb: ${suburb || "Not specified"}
Details: ${details || "No additional details"}

Timestamp: ${new Date().toISOString()}
      `.trim(),
    };

    const adminResult = await transporter.sendMail(adminEmail);
    console.log("✅ Admin email sent:", adminResult.response);

    // 2. Customer confirmation email
    const customerEmail = {
      from: `"Kiwi Trade Team" <${process.env.GMAIL_USER}>`,
      to: email, // Customer's email
      subject: "✅ Thanks for your inquiry!",
      text: `
Hi ${name},

Thanks for reaching out to Kiwi Trade about ${service}!

We've received your request and one of our team members will contact you within 24 hours to discuss your project.

Your details:
- Service: ${service}
- Location: ${area ? `${suburb}, ${area}` : suburb || "Not specified"}
- Phone: ${phone || "Not provided"}

Best regards,
The Kiwi Trade Team
      `.trim(),
    };

    const customerResult = await transporter.sendMail(customerEmail);
    console.log("✅ Customer email sent:", customerResult.response);

    // 3. Zone-based ops email
    const opsEmail = lookupOpsEmail(area, suburb);
    const zoneEmail = {
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: opsEmail,
      subject: `📍 Zone Lead: ${service} (${area || suburb || "Unknown area"})`,
      text: `
ZONE-BASED LEAD FORWARDED:

Customer: ${name}
Contact: ${email} | ${phone || "No phone"}
Service: ${service}
Location: ${area ? `${suburb}, ${area}` : suburb || "Location not specified"}

Project Details:
${details || "No additional details provided"}

Please follow up within 24 hours.
      `.trim(),
    };

    const zoneResult = await transporter.sendMail(zoneEmail);
    console.log("✅ Zone email sent to", opsEmail, ":", zoneResult.response);

    return res.status(200).json({
      success: true,
      emailsSent: 3,
      opsEmail: opsEmail
    });

  } catch (error) {
    console.error("❌ Lead email system failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
