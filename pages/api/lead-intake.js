import nodemailer from "nodemailer";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, phone, service, details, area, suburb } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    // Generate unique quoteId
    const quoteId = crypto.randomBytes(6).toString("hex");

    // Quote link (customer data prefilled via query params)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const quoteLink = `${baseUrl}/quote/${quoteId}?name=${encodeURIComponent(name)}&service=${encodeURIComponent(service)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone || "")}&area=${encodeURIComponent(area || "")}&suburb=${encodeURIComponent(suburb || "")}&details=${encodeURIComponent(details || "")}`;

    console.log("📩 Lead intake:", { name, email, phone, service, area, suburb, details, quoteId });

    // Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 1. Customer confirmation
    await transporter.sendMail({
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "✅ We received your request",
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for reaching out about <b>${service}</b>.</p>
        <p>We've shared your details with one of our trade partners. They'll review your project and send you a detailed quote soon.</p>
        <hr />
        <small>Request ID: ${quoteId}</small>
      `,
    });

    // 2. Tradeperson lead email with quote form link
    await transporter.sendMail({
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "office@kiwitrade.co.nz", // 🔧 later: dynamic zone-based address
      subject: `🔔 New Lead: ${service} (${suburb || area || "Unknown location"})`,
      html: `
        <p>You have a new lead:</p>
        <ul>
          <li><b>Name:</b> ${name}</li>
          <li><b>Email:</b> ${email}</li>
          <li><b>Phone:</b> ${phone || "Not provided"}</li>
          <li><b>Area/Suburb:</b> ${suburb || area || "Not specified"}</li>
          <li><b>Details:</b> ${details || "No extra details"}</li>
        </ul>
        <p><b>Next step:</b> <a href="${quoteLink}">Click here to prepare a quote</a></p>
        <p>This form will be pre-filled with customer details, and you can edit or complete the cost breakdown before submitting.</p>
      `,
    });

    return res.status(200).json({ success: true, quoteId, quoteLink });

  } catch (error) {
    console.error("❌ Lead email failed:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
