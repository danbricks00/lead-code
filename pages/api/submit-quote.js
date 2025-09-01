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
    const payload = `${leadId}|${decision}|${tradespersonEmail}`; // Use a simple payload
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return `${baseUrl}/api/submit-quote?action=decision&payload=${encodeURIComponent(payload)}&sig=${signature}`;
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
    } else if (req.method === 'GET' && action === 'decision') {
      return await handleQuoteDecision(req, res);
    } else {
      res.setHeader("Allow", ["POST", "GET"]);
      return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
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


  // 2. Generate unique Accept/Decline links for the customer
  const acceptLink = generateDecisionLink(leadId, 'accepted', tradespersonEmail);
  const declineLink = generateDecisionLink(leadId, 'declined', tradespersonEmail);

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
  return res.status(200).json({ success: true, message: "Quote submitted and emails sent." });
}

// --- STAGE 3: HANDLE CUSTOMER DECISION ---

async function handleQuoteDecision(req, res) {
  const { payload, sig } = req.query;

  // 1. Security Check: Verify signature
  const secret = process.env.QUOTE_LINK_SECRET;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))) {
      return res.status(403).send("<h1>Invalid Link</h1><p>This decision link is invalid or has been tampered with.</p>");
  }

  const [leadId, decision, tradespersonEmail] = decodeURIComponent(payload).split('|');
  console.log(`📩 [Stage 3] Decision Received: ${decision.toUpperCase()} for lead #${leadId}`);

  // TODO: Implement single-use link logic here
  // This is where you would check a database or Google Sheet to see if a decision for this `leadId` has already been recorded.
  // If it has, you would show a message like "A decision has already been made for this quote." and stop.
  console.warn(`⚠️ [Stage 3] IMPORTANT: Single-use link logic is not implemented. A database is required to prevent link reuse.`);
  
  // 2. Send the 3 "Stage 3" notification emails
  const transporter = await createTransporter();
  console.log("📧 [Stage 3] Sending decision notification emails...");
  const decisionText = decision === 'accepted' ? 'Accepted' : 'Declined';

  // To Customer
  await sendEmail(transporter, {
    from: `"Kiwi Trade" <${process.env.GMAIL_USER}>`,
    to: "customer-email-needs-lookup@example.com", // You would look up the customer's email using the leadId
    subject: `Confirmation: Quote ${decisionText}`,
    html: `<p>Thank you for your decision. We have recorded that you have <b>${decisionText}</b> the quote for lead #${leadId}.</p><p>${decision === 'accepted' ? 'The tradesperson will be in touch shortly to arrange the work.' : 'We hope to assist you in the future.'}</p>`,
  });

  // To Tradesperson
  await sendEmail(transporter, {
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: tradespersonEmail,
    subject: `[Decision] Customer ${decisionText} quote #${leadId}`,
    html: `<p>The customer has <b>${decisionText}</b> your quote for lead #${leadId}.</p><p>${decision === 'accepted' ? 'Please contact them to schedule the work.' : 'No further action is required.'}</p>`,
  });
  
  // To Admin
  await sendEmail(transporter, {
    from: `"Kiwi Trade Alerts" <${process.env.GMAIL_USER}>`,
    to: "danbricks18@gmail.com",
    subject: `[Stage 3] Customer ${decisionText} Quote #${leadId}`,
    text: `The customer has ${decisionText} the quote from ${tradespersonEmail} for lead #${leadId}.`,
  });

  console.log("✅ [Stage 3] All decision emails sent successfully.");
  // 3. Redirect user to a thank you page
  return res.send(`<h1>Thank You!</h1><p>Your decision of <b>${decisionText}</b> has been recorded.</p>`);
}
