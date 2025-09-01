import nodemailer from "nodemailer";
import crypto from "crypto";

// Helper: generate unique IDs
function generateId() {
  return crypto.randomBytes(6).toString("hex");
}

// Helper: sign tokens for secure links
function signToken(id, ts) {
  const secret = process.env.QUOTE_LINK_SECRET || "";
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${id}.${ts}`);
  return hmac.digest("hex");
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
    const { step, data } = req.body;

    // Setup transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    if (step === 1) {
      // Step 1: Lead Intake
      const { name, email, phone, service, details, area, suburb } = data;

      if (!name || !email || !service) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const quoteId = generateId();
      const issuedAt = Date.now().toString();
      const token = signToken(quoteId, issuedAt);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const query = new URLSearchParams({
        name,
        service,
        email,
        phone: phone || "",
        area: area || "",
        suburb: suburb || "",
        details: details || "",
        token,
        ts: issuedAt,
      }).toString();

      const quoteLink = `${baseUrl}/quote/${quoteId}?${query}`;

      console.log("📩 Step 1 Lead Intake:", { name, email, phone, service, area, suburb, quoteId });

      // 3 emails for Step 1

      // 1. Customer confirmation email
      await sendEmail(transporter, {
        from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "✅ We received your request",
        html: `<p>Hi ${name},</p>
               <p>Thanks for reaching out about <b>${service}</b>. A trade professional will prepare a quote.</p>
               <p><small>Request ID: ${quoteId}</small></p>`,
      });

      // 2. Tradeperson lead notification with unique signed quote link
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
               </ul>
               <p><b>Next step:</b> <a href="${quoteLink}">Click here to prepare a quote</a></p>
               <p>This link is unique and signed; no login required.</p>`,
      });

      // 3. Admin notification
      await sendEmail(transporter, {
        from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
        to: "danbricks18@gmail.com",
        subject: `Lead recorded on site: #${quoteId}`,
        text: `Lead recorded:\nName: ${name}\nEmail: ${email}\nService: ${service}\nLocation: ${suburb || area || "N/A"}\nID: ${quoteId}\nLink: ${quoteLink}`,
      });

      return res.status(200).json({ success: true, quoteId, quoteLink, token, issuedAt });
    }

    else if (step === 2) {
      // Step 2: Quote Submission
      const {
        quoteId,
        token,
        issuedAt,
        name,
        email,
        phone,
        service,
        area,
        suburb,
        details,
        materialsCostPerSqm,
        materialsSqm,
        labourRatePerHour,
        labourHours,
        travelRatePerKm,
        travelKm,
        installationCost,
        tradieName,
        tradieEmail,
        tradiePhone,
        notes,
      } = data;

      if (!quoteId || !token || !issuedAt) {
        return res.status(400).json({ success: false, error: "Missing quote security tokens" });
      }

      if (signToken(quoteId, issuedAt) !== token) {
        return res.status(403).json({ success: false, error: "Invalid or expired token" });
      }

      const materialsTotal = (parseFloat(materialsCostPerSqm) || 0) * (parseFloat(materialsSqm) || 0);
      const labourTotal = (parseFloat(labourRatePerHour) || 0) * (parseFloat(labourHours) || 0);
      const travelTotal = (parseFloat(travelRatePerKm) || 0) * (parseFloat(travelKm) || 0);
      const installationTotal = parseFloat(installationCost) || 0;
      const grandTotal = materialsTotal + labourTotal + travelTotal + installationTotal;

      const htmlQuote = `
        <h2>Quote #${quoteId}</h2>
        <p><b>Service:</b> ${service}</p>
        <p><b>Customer:</b> ${name} (${email}${phone ? ", " + phone : ""})</p>
        <p><b>Location:</b> ${[suburb, area].filter(Boolean).join(", ") || "N/A"}</p>
        ${details ? `<p><b>Project details:</b> ${details}</p>` : ""}
        <h3>Cost Breakdown</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <tr><th>Item</th><th>Rate</th><th>Quantity</th><th>Total</th></tr>
          <tr><td>Materials</td><td>$${materialsCostPerSqm || 0}/sqm</td><td>${materialsSqm || 0}</td><td>$${materialsTotal.toFixed(2)}</td></tr>
          <tr><td>Labour</td><td>$${labourRatePerHour || 0}/hr</td><td>${labourHours || 0}</td><td>$${labourTotal.toFixed(2)}</td></tr>
          <tr><td>Travel</td><td>$${travelRatePerKm || 0}/km</td><td>${travelKm || 0}</td><td>$${travelTotal.toFixed(2)}</td></tr>
          <tr><td>Installation</td><td>—</td><td>—</td><td>$${installationTotal.toFixed(2)}</td></tr>
          <tr><td colspan="3"><b>Grand Total</b></td><td><b>$${grandTotal.toFixed(2)}</b></td></tr>
        </table>
        <h3>Tradeperson</h3>
        <p>${tradieName} (${tradieEmail}${tradiePhone ? ", " + tradiePhone : ""})</p>
        ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ""}
        <hr />
        <p>Please <a href="${process.env.NEXT_PUBLIC_BASE_URL}/accept/${quoteId}?token=${token}">Accept</a> or <a href="${process.env.NEXT_PUBLIC_BASE_URL}/decline/${quoteId}?token=${token}">Decline</a> this quote.</p>
      `;

      console.log("📩 Step 2 Quote Submission:", { quoteId, name, email, tradieEmail });

      // 3 emails for Step 2

      // 1. Customer receives quote email with accept/decline buttons
      await sendEmail(transporter, {
        from: `"Kiwi Trade Quotes" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Your Quote #${quoteId}`,
        html: htmlQuote,
      });

      // 2. Tradeperson receives confirmation copy
      await sendEmail(transporter, {
        from: `"Kiwi Trade Quotes" <${process.env.GMAIL_USER}>`,
        to: tradieEmail,
        subject: `Submitted Quote #${quoteId} (copy)`,
        html: htmlQuote,
      });

      // 3. Admin receives notification
      await sendEmail(transporter, {
        from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
        to: "danbricks18@gmail.com",
        subject: `Quote submitted #${quoteId}`,
        text: `Quote #${quoteId} was submitted for lead ${name} (${email}).`,
      });

      return res.status(200).json({ success: true });
    }

    else if (step === 3) {
      // Step 3: Acceptance / Next Action
      const { quoteId, token, issuedAt, decision, name, email, tradieName, tradieEmail } = data;

      if (!quoteId || !token || !issuedAt || !decision) {
        return res.status(400).json({ success: false, error: "Missing decision data" });
      }

      if (signToken(quoteId, issuedAt) !== token) {
        return res.status(403).json({ success: false, error: "Invalid or expired token" });
      }

      console.log(`📩 Step 3 Decision: ${decision} for quote ${quoteId}`);

      const subjectBase = `Project ${decision === "accept" ? "Start" : "Decline"} Notification for Quote #${quoteId}`;
      const textBase = `The customer has ${decision === "accept" ? "accepted" : "declined"} the quote.\n\nQuote ID: ${quoteId}\nCustomer: ${name} (${email})\nTradeperson: ${tradieName} (${tradieEmail})`;

      // 3 emails for Step 3

      // 1. Customer confirmation or decline acknowledgment
      await sendEmail(transporter, {
        from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: subjectBase,
        text: `Hi ${name},\n\nThank you for your decision to ${decision} the quote.\n\nWe will proceed accordingly.\n\nBest regards,\nKiwi Trade Team`,
      });

      // 2. Tradeperson notification
      await sendEmail(transporter, {
        from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
        to: tradieEmail,
        subject: subjectBase,
        text: textBase,
      });

      // 3. Admin notification
      await sendEmail(transporter, {
        from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
        to: "danbricks18@gmail.com",
        subject: subjectBase,
        text: textBase,
      });

      return res.status(200).json({ success: true });
    }

    else {
      return res.status(400).json({ success: false, error: "Invalid step parameter" });
    }
  } catch (error) {
    console.error("❌ Email system error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
