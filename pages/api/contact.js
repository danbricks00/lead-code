// pages/api/contact.js - Contact Form API
import { sendEmail } from '../../lib/emailHelper.js';

export default async function handler(req, res) {
  console.log("✅ Loaded API contact.js");
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      console.log("❌ Contact form validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, message"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Contact form validation failed - invalid email format");
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    console.log("📧 Contact form submission received:", { name, email });

    // Environment checks
    console.log("🔧 Environment variables check:", {
      GMAIL_USER: process.env.GMAIL_USER || "MISSING",
      GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING"
    });

    if (!process.env.ADMIN_EMAIL) {
      console.error("❌ ADMIN_EMAIL not configured");
      return res.status(500).json({
        success: false,
        error: "Contact form not configured. Please try again later."
      });
    }

    // Create email content
    const subject = `📧 New Contact Form Submission - ${name}`;
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; margin: 20px 0;">New Contact Form Submission</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</p>
        </div>
      </div>
    `;

    console.log("📧 Built contact form email template");

    // Send email
    try {
      console.log(`📤 Sending contact form email to: ${process.env.ADMIN_EMAIL}`);
      const result = await sendEmail(process.env.ADMIN_EMAIL, subject, html);
      
      if (result.success) {
        console.log(`✅ Contact form email sent successfully, msgId: ${result.messageId}`);
        return res.status(200).json({
          success: true,
          message: "Thank you for your message. We'll get back to you soon!"
        });
      } else {
        console.error(`❌ Contact form email failed: ${result.error}`);
        return res.status(500).json({
          success: false,
          error: "Failed to send message. Please try again later."
        });
      }
    } catch (error) {
      console.error(`❌ Contact form email error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: "Failed to send message. Please try again later."
      });
    }

  } catch (error) {
    console.error("❌ Contact form API error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error. Please try again later."
    });
  }
}
