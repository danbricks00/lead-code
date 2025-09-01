import nodemailer from "nodemailer";
import crypto from "crypto";

// Helper: generate unique IDs
function generateId() {
  return crypto.randomBytes(6).toString("hex");
}

// Helper: send email with logging
async function sendEmail(transporter, mailOptions) {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}: ${info.response}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${mailOptions.to}:`, err);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, phone, service, details, area, suburb } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const quoteId = generateId();

    console.log("📩 Lead intake received:", { name, email, phone, service, area, suburb, quoteId });

    // Setup transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // 1. Customer confirmation email
    await sendEmail(transporter, {
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "✅ We received your request",
      html: `<p>Hi ${name},</p>
             <p>Thanks for reaching out about <b>${service}</b>. We will get back to you shortly.</p>
             <p><small>Request ID: ${quoteId}</small></p>`,
    });

    // 2. Tradeperson lead notification email
    await sendEmail(transporter, {
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "quangbui0600@gmail.com",
      subject: `🔔 New Lead: ${service} (${suburb || area || "Unknown location"})`,
      html: `<p>You have a new lead:</p>
             <ul>
               <li><b>Name:</b> ${name}</li>
               <li><b>Email:</b> ${email}</li>
               <li><b>Phone:</b> ${phone || "Not provided"}</li>
               <li><b>Area/Suburb:</b> ${suburb || area || "Not specified"}</li>
               <li><b>Details:</b> ${details || "No extra details"}</li>
             </ul>`,
    });

    // 3. Admin notification email
    await sendEmail(transporter, {
      from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
      to: "danbricks18@gmail.com",
      subject: `Lead recorded on site: #${quoteId}`,
      text: `Lead recorded:\nName: ${name}\nEmail: ${email}\nService: ${service}\nLocation: ${suburb || area || "N/A"}\nID: ${quoteId}`,
    });

    return res.status(200).json({ success: true, quoteId });
  } catch (error) {
    console.error("❌ Lead email system error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
