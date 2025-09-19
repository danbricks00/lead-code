// lib/emailHelper.js
import { renderStatus } from './renderStatus.js';

let transporter = null;

export async function getTransporter() {
  if (!transporter) {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  return transporter;
}

export async function sendEmail(options) {
  try {
    const emailTransporter = await getTransporter();
    
    // Handle both old signature sendEmail(to, subject, html) and new signature sendEmail(options)
    let emailOptions;
    if (typeof options === 'string') {
      // Old signature: sendEmail(to, subject, html)
      const [to, subject, html] = arguments;
      emailOptions = {
        from: process.env.GMAIL_USER,
        to,
        subject,
        html
      };
    } else {
      // New signature: sendEmail(options)
      emailOptions = {
        from: process.env.GMAIL_USER,
        ...options // Spread the options object (to, subject, html, attachments, etc.)
      };
    }

    const result = await emailTransporter.sendMail(emailOptions);
    const recipients = Array.isArray(emailOptions.to) ? emailOptions.to.join(', ') : emailOptions.to;
    console.log(`✅ Email sent to ${recipients}, msgId: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const recipients = typeof options === 'string' ? options : (Array.isArray(options?.to) ? options.to.join(', ') : options?.to);
    console.error(`❌ Email failed to ${recipients}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Stage 1: Lead Intake Email Templates
export function createLeadIntakeEmails(leadData) {
  const {
    leadId, customerName, customerEmail, customerPhone, serviceType,
    timeline, budget, suburbValue, roomsString, totalRooms, roomsEmailList,
    specificDetails, quoteFormUrl
  } = leadData;

  // Customer confirmation email
  const customerSubject = `✅ We've received your request – ${serviceType || 'Not specified'}`;
  const customerHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus("lead")}
      <h2 style="color: #333; margin: 20px 0;">Thank you for your enquiry!</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p>Hi ${customerName || 'there'},</p>
        <p>We've received your ${serviceType || 'project'} enquiry and will be in touch within 24 hours.</p>
        <p><strong>Your enquiry details:</strong></p>
        <ul>
          <li><strong>Service:</strong> ${serviceType || 'Not specified'}</li>
          <li><strong>Timeline:</strong> ${timeline || 'Not specified'}</li>
          <li><strong>Budget:</strong> ${budget || 'Not specified'}</li>
          <li><strong>Suburb:</strong> ${suburbValue || 'Not specified'}</li>
          <li><strong>Rooms:</strong> ${roomsString || 'Not specified'}</li>
        </ul>
        <p>Best regards,<br>The Heat.nz Team</p>
      </div>
    </div>
  `;

  // Admin notification email
  const adminSubject = `🆕 New Lead Submitted – ${serviceType || 'Not specified'}`;
  const adminHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus("lead")}
      <h2 style="color: #333; margin: 20px 0;">New Lead Received</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
        <p><strong>Customer Name:</strong> ${customerName || 'Customer'}</p>
        <p><strong>Customer Email:</strong> ${customerEmail || 'N/A'}</p>
        <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
        <p><strong>Service Type:</strong> ${serviceType || 'Not specified'}</p>
        <p><strong>Suburb:</strong> ${suburbValue || 'Not specified'}</p>
        <p><strong>Number of Rooms:</strong> ${totalRooms || '0'}</p>
        <p><strong>Room Details:</strong></p>
        <ul>${roomsEmailList || '<li>No room details provided</li>'}</ul>
        <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
        <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        <p><strong>Specific Details:</strong> ${specificDetails || 'None'}</p>
      </div>
    </div>
  `;

  // Tradesperson notification email
  const tradespersonSubject = `🆕 New Lead Available – ${serviceType || 'Not specified'} in ${suburbValue || 'your area'}`;
  const tradespersonHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus("lead")}
      <h2 style="color: #333; margin: 20px 0;">New Lead Available</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
        <p><strong>Customer Name:</strong> ${customerName || 'Customer'}</p>
        <p><strong>Customer Email:</strong> ${customerEmail || 'N/A'}</p>
        <p><strong>Customer Phone:</strong> ${customerPhone || 'Not provided'}</p>
        <p><strong>Service Type:</strong> ${serviceType || 'Not specified'}</p>
        <p><strong>Suburb:</strong> ${suburbValue || 'Not specified'}</p>
        <p><strong>Number of Rooms:</strong> ${totalRooms || '0'}</p>
        <p><strong>Room Details:</strong></p>
        <ul>${roomsEmailList || '<li>No room details provided</li>'}</ul>
        <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
        <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        <p><strong>Specific Details:</strong> ${specificDetails || 'None'}</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${quoteFormUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">👉 Create Quote</a>
      </div>
    </div>
  `;

  return {
    customer: { subject: customerSubject, html: customerHtml },
    admin: { subject: adminSubject, html: adminHtml },
    tradesperson: { subject: tradespersonSubject, html: tradespersonHtml }
  };
}

// Stage 2: Quote Submission Email Templates
export function createQuoteSubmissionEmails(quoteData) {
  const {
    leadId, customerName, customerEmail, serviceType, quoteAmount,
    timeline, projectDetails, budget, tradesmanName, tradesmanEmail,
    quoteViewUrl, acceptUrl, declineUrl, pdfBuffer
  } = quoteData;

  // Customer email with web link and PDF
  const customerSubject = `📋 Your Quote for ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
  const customerHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus("quote")}
      <h2 style="color: #333; margin: 20px 0;">Your Quote is Ready!</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p>Hi ${customerName || 'there'},</p>
        <p>Your quote for ${serviceType || 'your project'} is ready for review.</p>
        <p><strong>Quote Amount:</strong> $${quoteAmount || '0'}</p>
        <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        <p><strong>Project Details:</strong> ${projectDetails || 'Not provided'}</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">View Quote</a>
        <a href="${acceptUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Accept Quote</a>
        <a href="${declineUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px;">Decline Quote</a>
      </div>
    </div>
  `;

  // Admin notification email
  const adminSubject = `📋 Quote Submitted - ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
  const adminHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus("quote")}
      <h2 style="color: #333; margin: 20px 0;">Quote Submitted Successfully</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
        <p><strong>Customer:</strong> ${customerName || 'Customer'}</p>
        <p><strong>Service:</strong> ${serviceType || 'Not specified'}</p>
        <p><strong>Quote Amount:</strong> $${quoteAmount || '0'}</p>
        <p><strong>Tradesman:</strong> ${tradesmanName || 'Tradesperson'}</p>
        <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
      </div>
    </div>
  `;

  // Tradesperson confirmation email
  const tradespersonSubject = `📋 Quote Sent Successfully - ${serviceType || 'Not specified'} - ${leadId || 'N/A'}`;
  const tradespersonHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus("quote")}
      <h2 style="color: #333; margin: 20px 0;">Your Quote Has Been Sent</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p>Hi ${tradesmanName || 'there'},</p>
        <p>Your quote for ${customerName || 'the customer'}'s ${serviceType || 'project'} has been sent successfully.</p>
        <p><strong>Quote Details:</strong></p>
        <ul>
          <li><strong>Lead ID:</strong> ${leadId || 'N/A'}</li>
          <li><strong>Customer:</strong> ${customerName || 'Customer'}</li>
          <li><strong>Service:</strong> ${serviceType || 'Not specified'}</li>
          <li><strong>Quote Amount:</strong> $${quoteAmount || '0'}</li>
          <li><strong>Timeline:</strong> ${timeline || 'Not specified'}</li>
        </ul>
        <p>The customer will receive an email with your quote and can accept or decline it.</p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${quoteViewUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Quote</a>
      </div>
    </div>
  `;

  return {
    customer: { subject: customerSubject, html: customerHtml, attachments: pdfBuffer ? [{
      filename: `quote-${leadId}.pdf`,
      content: pdfBuffer
    }] : undefined },
    admin: { subject: adminSubject, html: adminHtml },
    tradesperson: { subject: tradespersonSubject, html: tradespersonHtml }
  };
}

// Stage 3: Quote Decision Email Templates
export function createQuoteDecisionEmails(decisionData) {
  const {
    action, leadId, quoteId, customerName, customerEmail, serviceType,
    quoteAmount, timeline, fullQuoteData, leadData, quoteData
  } = decisionData;

  const status = action === 'accept' ? 'Accepted' : 'Declined';

  // Customer confirmation email
  let customerSubject, customerHtml;
  if (action === 'accept') {
    customerSubject = '🎉 Quote Accepted - Project Confirmed!';
    customerHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("accepted")}
        <h2 style="color: #333; margin: 20px 0;">Congratulations! Your Quote Has Been Accepted</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${customerName || 'there'},</p>
          <p>Great news! Your quote for ${serviceType || 'your project'} has been accepted.</p>
          <p><strong>Project Details:</strong></p>
          <ul>
            <li><strong>Service:</strong> ${serviceType || 'N/A'}</li>
            <li><strong>Quote Amount:</strong> $${quoteAmount || 'N/A'}</li>
            <li><strong>Timeline:</strong> ${timeline || 'To be confirmed'}</li>
          </ul>
        </div>`;

    // Add tradesperson details if available
    if (fullQuoteData?.tradesmanName) {
      customerHtml += `
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-top: 20px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Your Tradesperson Details</h3>
          <p><strong>Name:</strong> ${fullQuoteData.tradesmanName || 'Tradesperson'}</p>
          ${fullQuoteData.companyName ? `<p><strong>Company:</strong> ${fullQuoteData.companyName || 'Unknown Company'}</p>` : ''}
          ${fullQuoteData.tradesmanPhone ? `<p><strong>Phone:</strong> ${fullQuoteData.tradesmanPhone || 'N/A'}</p>` : ''}
          <p><strong>Email:</strong> ${fullQuoteData.tradesmanEmail || 'N/A'}</p>
        </div>`;
    }

    customerHtml += `
        <p style="margin-top: 20px;">Your tradesperson will be in touch within 24 hours to schedule your project.</p>
        <p>Best regards,<br>The Heat.nz Team</p>
      </div>`;
  } else {
    customerSubject = 'Quote Decision - Thank You';
    customerHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("declined")}
        <h2 style="color: #333; margin: 20px 0;">Thank You for Your Consideration</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${customerName || 'there'},</p>
          <p>Thank you for considering our quote for ${serviceType || 'your project'}.</p>
          <p>We hope to work with you in the future.</p>
          <p>Best regards,<br>The Heat.nz Team</p>
        </div>
      </div>`;
  }

  // Admin notification email
  const adminSubject = `Quote ${status}: ${quoteId || 'N/A'} - ${leadId || 'N/A'}`;
  let adminHtml = `
    <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
      ${renderStatus(action === 'accept' ? "accepted" : "declined")}
      <h2 style="color: #333; margin: 20px 0;">Quote ${status}</h2>
      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
        <p><strong>Quote ID:</strong> ${quoteId || 'N/A'}</p>
        <p><strong>Lead ID:</strong> ${leadId || 'N/A'}</p>
        <p><strong>Customer:</strong> ${customerName || 'N/A'}</p>
        <p><strong>Service:</strong> ${serviceType || 'N/A'}</p>
        <p><strong>Amount:</strong> $${quoteAmount || 'N/A'}</p>`;

  if (action === 'accept' && fullQuoteData?.tradesmanName) {
    adminHtml += `
        <p><strong>Tradesperson Assigned:</strong> ${fullQuoteData.tradesmanName || 'Tradesperson'}</p>
        ${fullQuoteData.companyName ? `<p><strong>Company:</strong> ${fullQuoteData.companyName || 'Unknown Company'}</p>` : ''}
        ${fullQuoteData.tradesmanPhone ? `<p><strong>Phone:</strong> ${fullQuoteData.tradesmanPhone || 'N/A'}</p>` : ''}`;
  }

  adminHtml += `
      </div>
    </div>`;

  // Tradesperson notification email
  let tradespersonSubject, tradespersonHtml;
  if (action === 'accept' && fullQuoteData?.tradesmanEmail) {
    tradespersonSubject = `🎉 CUSTOMER ACCEPTED - FOLLOW UP REQUIRED - ${leadId || 'N/A'}`;
    tradespersonHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("accepted")}
        <h2 style="color: #333; margin: 20px 0;">Customer Accepted Your Quote!</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p><strong>Customer Accepted – FOLLOW UP</strong></p>
          <p><strong>Customer Name:</strong> ${customerName || 'N/A'}</p>
          <p><strong>Customer Email:</strong> ${customerEmail || 'N/A'}</p>
          <p><strong>Customer Phone:</strong> ${leadData?.customerPhone || 'N/A'}</p>
          <p><strong>Service:</strong> ${serviceType || 'N/A'}</p>
          <p><strong>Quote Amount:</strong> $${quoteAmount || 'N/A'}</p>
          <p><strong>Project Details:</strong> ${quoteData?.details || 'N/A'}</p>
          <p><strong>Timeline:</strong> ${timeline || 'N/A'}</p>
        </div>
        <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
          <p style="margin: 0; font-weight: bold;">⚠️ ACTION REQUIRED: Contact customer within 24 hours to schedule project!</p>
        </div>
      </div>`;
  } else if (action === 'decline' && fullQuoteData?.tradesmanEmail) {
    tradespersonSubject = `Quote Declined - ${leadId || 'N/A'}`;
    tradespersonHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
        ${renderStatus("declined")}
        <h2 style="color: #333; margin: 20px 0;">Quote Declined</h2>
        <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
          <p>Hi ${fullQuoteData.tradesmanName || 'there'},</p>
          <p>Your quote for ${customerName || 'the customer'}'s ${serviceType || 'project'} has been declined.</p>
          <p><strong>Quote Details:</strong></p>
          <ul>
            <li><strong>Lead ID:</strong> ${leadId || 'N/A'}</li>
            <li><strong>Customer:</strong> ${customerName || 'N/A'}</li>
            <li><strong>Service:</strong> ${serviceType || 'N/A'}</li>
            <li><strong>Quote Amount:</strong> $${quoteAmount || 'N/A'}</li>
          </ul>
          <p>Consider politely following up with the customer if appropriate.</p>
        </div>
      </div>`;
  }

  return {
    customer: { subject: customerSubject, html: customerHtml },
    admin: { subject: adminSubject, html: adminHtml },
    tradesperson: tradespersonSubject && tradespersonHtml ? { subject: tradespersonSubject, html: tradespersonHtml } : null
  };
}
