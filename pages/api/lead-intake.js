import nodemailer from "nodemailer";
import crypto from "crypto";

// Helper: generate unique IDs
function generateId() {
  return `lead-${crypto.randomBytes(6).toString("hex")}`;
}

// Helper: sign tokens for secure links
function generateSignedQuoteLink(leadData) {
  const secret = process.env.QUOTE_LINK_SECRET;
  if (!secret) {
    console.error("❌ QUOTE_LINK_SECRET is not set. Cannot generate secure link.");
    // In production, you might want to throw an error or handle this differently
    return null;
  }

  const payload = JSON.stringify(leadData);
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  // The link points to a frontend page where the tradesperson will fill out the quote
  return `${baseUrl}/submit-quote?payload=${encodeURIComponent(payload)}&sig=${signature}`;
}


// Helper: create a robust email transporter
async function createTransporter() {
  // This helper remains the same as before
  console.log("🔧 Creating email transporter...");
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    console.log("✅ Email transporter created successfully.");
    return transporter;
  } catch (error) {
    console.error("❌ Failed to create email transporter:", error);
    throw new Error("Failed to create email transporter.");
  }
}

// Helper: send email with logging
async function sendEmail(transporter, mailOptions) {
  // This helper remains the same as before
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}: ${info.response}`);
    return { success: true };
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
    const {
      name,
      email,
      phone,
      service,
      details,
      area,
      suburb,
    } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const leadId = generateId();
    console.log("📩 [Stage 1] Lead Intake Received:", { leadId, name, email, service });

    const leadData = { leadId, name, email, phone, service, details, area, suburb };

    // Generate the unique, secure link for the tradesperson
    const quoteLink = generateSignedQuoteLink(leadData);
    if (!quoteLink) {
        throw new Error("Could not generate a secure quote link. Check server logs for QUOTE_LINK_SECRET.");
    }
    console.log("🔗 [Stage 1] Generated secure quote link for tradesperson.");


    const transporter = await createTransporter();

    // --- Stage 1 Email Contents ---
    const customerMail = {
      from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "✅ We've received your service request!",
      html: `<p>Hi ${name},</p>
             <p>Thanks for reaching out about <b>${service}</b>. We are assigning a trade professional who will prepare a quote for you shortly.</p>
             <p>Your Request ID is: <b>${leadId}</b></p>`,
    };

    const tradepersonMail = {
      from: `"Kiwi Trade Leads" <${process.env.GMAIL_USER}>`,
      to: "quangbui0600@gmail.com", // This would typically be dynamic
      subject: `🔔 New Lead: ${service} in ${suburb || area || "Unknown location"}`,
      html: `<p>You have a new lead:</p>
             <ul>
               <li><b>Lead ID:</b> ${leadId}</li>
               <li><b>Name:</b> ${name}</li>
               <li><b>Email:</b> ${email}</li>
               <li><b>Phone:</b> ${phone || "Not provided"}</li>
               <li><b>Area/Suburb:</b> ${suburb || area || "Not specified"}</li>
               <li><b>Details:</b> ${details || "No extra details"}</li>
             </ul>
             <hr>
             <p><b>Next Step:</b> Please prepare a quote for the customer by clicking the link below. This link is unique and secure.</p>
             <p><a href="${quoteLink}" style="font-size: 16px; font-weight: bold; padding: 10px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Prepare Quote Now</a></p>`,
    };

    const adminMail = {
      from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
      to: "danbricks18@gmail.com",
      subject: `[Stage 1] New Lead Recorded: #${leadId}`,
      text: `A new lead has been recorded:\n\nLead ID: ${leadId}\nName: ${name}\nEmail: ${email}\nService: ${service}\nLocation: ${suburb || area || "N/A"}`,
    };

    // --- Send Stage 1 Emails ---
    console.log("📧 [Stage 1] Sending initial lead notifications...");
    await sendEmail(transporter, customerMail);
    await sendEmail(transporter, tradepersonMail);
    await sendEmail(transporter, adminMail);
    console.log("✅ [Stage 1] All lead intake emails sent successfully.");

    return res.status(200).json({ success: true, leadId });

  } catch (error) {
    console.error("❌ [Stage 1] A critical error occurred:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process lead intake. Please check server logs.",
      details: error.message,
    });
  }
}
