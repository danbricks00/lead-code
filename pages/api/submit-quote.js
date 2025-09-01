import nodemailer from "nodemailer";
import crypto from "crypto";

// --- SECURITY HELPERS ---

// Verify the payload from a tradesperson's quote submission link
function verifySignedPayload(payload, signature) {
  const secret = process.env.QUOTE_LINK_SECRET;
  if (!secret) {
    console.error("❌ QUOTE_LINK_SECRET is not set. Cannot verify payload.");
    return false;
  }
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// Generate a secure, single-use link for customer decisions (Accept/Decline)
function generateDecisionLink(leadId, decision, tradespersonEmail) {
    const secret = process.env.QUOTE_LINK_SECRET;
    const ts = Date.now();
    const payload = `${leadId}|${ts}|${tradespersonEmail}`; // Include tradesperson email for notifications
    const token = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Point to the new, separate endpoints
    return `${baseUrl}/api/quote-decision/${decision}?quoteId=${leadId}&ts=${ts}&token=${token}`;
}

// --- EMAIL HELPERS ---

async function createTransporter() {
  // Same transporter logic as lead-intake
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendEmail(transporter, mailOptions) {
  // Same sendEmail logic as lead-intake
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${mailOptions.to}: ${info.response}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${mailOptions.to}:`, err);
    throw err;
  }
}

// --- API HANDLER ---

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    if (req.method === 'POST' && action === 'submit') {
      return await handleQuoteSubmission(req, res);
    } else {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed for this action` });
    }
  } catch (error) {
    console.error(`❌ A critical error occurred in submit-quote API for action "${action}":`, error);
    return res.status(500).json({ success: false, error: "An internal server error occurred.", details: error.message });
  }
}

// --- STAGE 2: HANDLE QUOTE SUBMISSION ---

async function handleQuoteSubmission(req, res) {
  const { payload, sig, quoteDetails } = req.body;

  // 1. Security Check: Verify the signature
  if (!verifySignedPayload(payload, sig)) {
    return res.status(403).json({ success: false, error: "Invalid or tampered signature." });
  }

  const leadData = JSON.parse(payload);
  const { leadId, name, email, service } = leadData;
  const { tradespersonName, tradespersonEmail } = quoteDetails;
  console.log("📩 [Stage 2] Quote Submission Received:", { leadId, tradespersonName });


  // 2. Generate unique Accept/Decline links for the customer, pointing to the new endpoints
  const acceptLink = generateDecisionLink(leadId, 'accept', tradespersonEmail);
  const declineLink = generateDecisionLink(leadId, 'decline', tradespersonEmail);

  // 3. Create the HTML quote to be emailed
  const htmlQuote = `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 600px;">
      <h2>Quote for: ${service}</h2>
      <p><b>Lead ID:</b> ${leadId}</p>
      <p><b>Prepared for:</b> ${name}</p>
      <p><b>Prepared by:</b> ${tradespersonName} (${tradespersonEmail})</p>
      <hr>
      <h3>Quote Details:</h3>
      <p>${quoteDetails.notes || "No additional details provided."}</p>
      <h3>Total Price: $${quoteDetails.totalPrice || 'N/A'}</h3>
      <hr>
      <p style="text-align: center;">
        <a href="${acceptLink}" style="display: inline-block; margin: 10px; padding: 12px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Quote</a>
        <a href="${declineLink}" style="display: inline-block; margin: 10px; padding: 12px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Decline Quote</a>
      </p>
    </div>
  `;

  // 4. Send the 3 "Stage 2" emails
  const transporter = await createTransporter();
  console.log("📧 [Stage 2] Sending quote emails...");

  // To Customer
  await sendEmail(transporter, {
    from: `"Your Quote from Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Your Quote for ${service} is Ready! (#${leadId})`,
    html: htmlQuote,
  });

  // To Tradesperson (confirmation)
  await sendEmail(transporter, {
    from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: tradespersonEmail,
    subject: `[Confirmation] You submitted a quote for #${leadId}`,
    html: `<p>This is a confirmation that your quote has been sent to the customer.</p>${htmlQuote}`,
  });

  // To Admin
  await sendEmail(transporter, {
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: "danbricks18@gmail.com",
    subject: `[Stage 2] Quote Submitted for #${leadId}`,
    html: `<p>A quote was submitted by ${tradespersonName} for lead #${leadId}.</p>${htmlQuote}`,
  });
  
  console.log("✅ [Stage 2] All quote emails sent successfully.");

  // TODO: Save the quote data, including customer email, to Google Sheets here.
  // This step is critical for the decision endpoints to be able to look up the necessary info.
  console.warn(`⚠️ [Stage 2] IMPORTANT: Google Sheets logging is not implemented in this step. The decision links will not work without it.`);


  return res.status(200).json({ success: true, message: "Quote submitted and emails sent." });
}

// --- STAGE 3: HANDLE CUSTOMER DECISION ---
// This logic is now being moved to /pages/api/quote-decision/accept.js and decline.js
// The handler for this has been removed from the main export.
