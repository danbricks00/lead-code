import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const {
    quoteId,
    customerName,
    customerEmail,
    customerPhone,
    serviceType,
    rooms,
    area,
    suburb,
    budget,
    timeline,
    specificDetails,
    quoteAmount,
    quoteNotes,
  } = req.body;

  if (!quoteId || !customerEmail) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL is not defined");
      return res.status(500).json({ success: false, error: "Server configuration error: base URL not set" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Gamification status HTML for step 2
    const gamifyStatusCustomer = `
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>✅ Quote Sent</li>
        <li>⚪ Decision Pending</li>
      </ul>
    `;

    const gamifyStatusTradesperson = `
      <p><strong>Status:</strong></p>
      <ul>
        <li>✅ Lead Received</li>
        <li>✅ Quote Sent</li>
        <li>⚪ Decision Pending</li>
      </ul>
    `;

    // Customer email with quote details
    const customerMailOptions = {
      from: process.env.GMAIL_USER,
      to: customerEmail,
      subject: "Your Quote Has Been Submitted",
      html: `
        <p>Hi ${customerName},</p>
        <p>Your quote has been submitted successfully.</p>
        <p><strong>Quote Amount:</strong> ${quoteAmount}</p>
        <p><strong>Notes:</strong> ${quoteNotes}</p>
        ${gamifyStatusCustomer}
      `,
    };

    // Tradesperson email confirmation
    const tradespersonMailOptions = {
      from: process.env.GMAIL_USER,
      to: "quangbui0600@gmail.com",
      subject: `Quote Submitted for Lead: ${customerName}`,
      html: `
        <p>The following quote has been submitted:</p>
        <ul>
          <li><strong>Customer Name:</strong> ${customerName}</li>
          <li><strong>Quote Amount:</strong> ${quoteAmount}</li>
          <li><strong>Notes:</strong> ${quoteNotes}</li>
        </ul>
        ${gamifyStatusTradesperson}
      `,
    };

    await transporter.sendMail(customerMailOptions);
    await transporter.sendMail(tradespersonMailOptions);

    return res.status(200).json({ success: true, message: "Quote submitted successfully" });
  } catch (error) {
    console.error("Quote submission error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}