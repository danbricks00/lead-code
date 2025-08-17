// api/quote-decision.js
export const config = { runtime: 'nodejs' };

import { appendRow, getRange, ensureSheetAndHeader } from './_googleSheetsClient.js';
import nodemailer from 'nodemailer';
import { fetchQuoteData, fetchLeadData } from './quote-utils.js';

const DECISIONS_TAB = process.env.SHEETS_DECISIONS_TAB || 'QuoteDecisions';
const DEBUG = process.env.EMAIL_DEBUG === '1';

// Header we expect in the decisions sheet
const HEADER = ['timestamp', 'quoteId', 'leadId', 'status', 'decidedBy'];

// Cold-start: best-effort ensure the sheet + header exists
let ensured = false;
async function ensureOnce() {
  if (ensured) return;
  try {
    await ensureSheetAndHeader({ sheetTitle: DECISIONS_TAB, headerValues: HEADER });
    ensured = true;
  } catch (e) {
    console.warn('quote-decision: ensureSheet failed (continuing):', e?.message || e);
  }
}

function htmlPage(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
  <body style="font-family:Arial,sans-serif;padding:20px;line-height:1.5;color:#111827">
    <h2 style="margin:0 0 12px;">${title}</h2>
    <p>${body}</p>
  </body></html>`;
}

async function findExistingDecision({ quoteId, leadId }) {
  try {
    const rows = await getRange({ range: `${DECISIONS_TAB}!A:E` });
    for (let i = 0; i < rows.length; i++) {
      const [ts, qid, lid, status] = rows[i];
      if (qid === quoteId && lid === leadId && (status === 'ACCEPTED' || status === 'DECLINED')) {
        return { decided: true, status, timestamp: ts };
      }
    }
  } catch (e) {
    console.warn('Decision lookup failed (continuing):', e?.message || e);
  }
  return { decided: false };
}

async function recordDecision({ quoteId, leadId, status, decidedBy }) {
  const values = [new Date().toISOString(), quoteId, leadId, status, decidedBy || ''];
  await appendRow({ range: `${DECISIONS_TAB}!A1`, values });
}

// Send email notifications
async function sendNotifications({ quoteId, leadId, action, quoteData, leadData }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'danbricks18@gmail.com',
        pass: 'ptmcojqgthvjbqom'
      }
    });

    const status = action === 'accept' ? 'Accepted' : 'Declined';

    // 1. Send customer confirmation email
    if (leadData && leadData.customerEmail) {
      const customerSubject = action === 'accept' 
        ? 'Quote Accepted - Thank You!' 
        : 'Quote Decision Recorded';
      
      const customerMessage = action === 'accept'
        ? `Thank you for accepting our quote! Your decision has been recorded and the tradesman has been notified that you want to continue with the job. We will be in touch shortly to discuss next steps and scheduling.`
        : `Thank you for letting us know about your decision. Your quote decline has been recorded. We appreciate you considering our services and hope to work with you in the future.`;

      const customerHtml = `
        <div style="font-family: Arial, sans-serif; color:#1f2937;">
          <h2>${customerSubject}</h2>
          <p>Hi ${leadData.customerName || 'there'},</p>
          <p>${customerMessage}</p>
          
          <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
            <h3 style="margin-top:0;">Quote Details</h3>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Service:</strong> ${quoteData?.serviceType || leadData.selectedService || 'Underfloor Heating'}</p>
            <p><strong>Location:</strong> ${quoteData?.location || leadData.location || 'Not specified'}</p>
            <p><strong>Quote Amount:</strong> $${Number(quoteData?.quoteAmount || 0).toFixed(2)}</p>
            <p><strong>Decision:</strong> ${status}</p>
          </div>
          
          <p style="margin-top:20px;color:#6b7280;">
            If you have any questions, please don't hesitate to contact us at info@kiwitrade.co.nz
          </p>
          
          <p style="margin-top:20px;color:#6b7280;">
            Best regards,<br>
            The Kiwi Trade Team
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: 'Kiwi Trade <danbricks18@gmail.com>',
        to: leadData.customerEmail,
        subject: customerSubject,
        html: customerHtml
      });
      
      console.log('✅ Customer decision email sent successfully');
    }

    // 2. Send tradesman notification email
    const tradesmanEmail = quoteData?.tradesmanEmail || 'quangbui0600@gmail.com';
    const tradesmanSubject = action === 'accept' 
      ? 'Great News! Customer Accepted Your Quote' 
      : 'Customer Decision: Quote Declined';
    
    const tradesmanMessage = action === 'accept'
      ? `Excellent news! The customer has accepted your quote and wants to proceed with the job. Please contact them as soon as possible to discuss scheduling and next steps.`
      : `The customer has declined the quote. While this is disappointing, it's part of the business. Keep up the great work and focus on your next opportunities.`;

    const tradesmanHtml = `
      <div style="font-family: Arial, sans-serif; color:#1f2937;">
        <h2>${tradesmanSubject}</h2>
        <p>Hi ${quoteData?.tradesmanName || 'there'},</p>
        <p>${tradesmanMessage}</p>
        
        <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
          <h3 style="margin-top:0;">Project Details</h3>
          <p><strong>Customer:</strong> ${quoteData?.customerName || leadData?.customerName || 'Not provided'}</p>
          <p><strong>Customer Email:</strong> ${quoteData?.customerEmail || leadData?.customerEmail || 'Not provided'}</p>
          <p><strong>Customer Phone:</strong> ${quoteData?.customerPhone || leadData?.customerPhone || 'Not provided'}</p>
          <p><strong>Service:</strong> ${quoteData?.serviceType || leadData?.selectedService || 'Underfloor Heating'}</p>
          <p><strong>Location:</strong> ${quoteData?.location || leadData?.location || 'Not specified'}</p>
          <p><strong>Quote Amount:</strong> $${Number(quoteData?.quoteAmount || 0).toFixed(2)}</p>
          <p><strong>Quote ID:</strong> ${quoteId}</p>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer Decision:</strong> ${status}</p>
        </div>
        
        ${action === 'accept' ? `
        <div style="background:#d1fae5;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #10b981;">
          <h3 style="margin-top:0;color:#065f46;">Next Steps</h3>
          <p style="color:#065f46;">Please contact the customer within 24 hours to:</p>
          <ul style="color:#065f46;">
            <li>Confirm the acceptance</li>
            <li>Discuss scheduling and timeline</li>
            <li>Arrange site visit if needed</li>
            <li>Discuss payment terms</li>
          </ul>
        </div>
        ` : `
        <div style="background:#fef3c7;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #f59e0b;">
          <h3 style="margin-top:0;color:#92400e;">Counter Quote Opportunity</h3>
          <p style="color:#92400e;">If you'd like to provide a revised quote, you can submit a counter offer:</p>
          <p style="color:#92400e;">
            <a href="${process.env.SITE_URL || 'https://lead-code.vercel.app'}/counter-quote-form.html?quoteId=${quoteId}&leadId=${leadId}" 
               style="background:#f59e0b;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:10px;">
              Submit Counter Quote
            </a>
          </p>
          <p style="color:#92400e;font-size:14px;margin-top:10px;">
            This will allow you to provide a new offer with revised pricing or terms.
          </p>
        </div>
        `}
        
        <p style="margin-top:20px;color:#6b7280;">
          If you need any assistance, please contact the admin team.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: 'Kiwi Trade <danbricks18@gmail.com>',
      to: tradesmanEmail,
      subject: tradesmanSubject,
      html: tradesmanHtml
    });
    
    console.log('✅ Tradesman notification email sent successfully');

    // 3. Send admin notification email
    const adminSubject = `Quote ${status} - ${quoteData?.customerName || leadData?.customerName || 'Unknown Customer'}`;
    
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color:#1f2937;">
        <h2>Quote Decision Notification</h2>
        <p>A customer has made a decision on their quote.</p>
        
        <div style="background:#f3f4f6;padding:15px;border-radius:6px;margin:20px 0;">
          <h3 style="margin-top:0;">Decision Summary</h3>
          <p><strong>Customer:</strong> ${quoteData?.customerName || leadData?.customerName || 'Not provided'}</p>
          <p><strong>Customer Email:</strong> ${quoteData?.customerEmail || leadData?.customerEmail || 'Not provided'}</p>
          <p><strong>Customer Phone:</strong> ${quoteData?.customerPhone || leadData?.customerPhone || 'Not provided'}</p>
          <p><strong>Tradesman:</strong> ${quoteData?.tradesmanName || 'Not provided'}</p>
          <p><strong>Tradesman Email:</strong> ${quoteData?.tradesmanEmail || 'Not provided'}</p>
          <p><strong>Service:</strong> ${quoteData?.serviceType || leadData?.selectedService || 'Underfloor Heating'}</p>
          <p><strong>Location:</strong> ${quoteData?.location || leadData?.location || 'Not specified'}</p>
          <p><strong>Quote Amount:</strong> $${Number(quoteData?.quoteAmount || 0).toFixed(2)}</p>
          <p><strong>Quote ID:</strong> ${quoteId}</p>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Decision:</strong> <span style="color:${action === 'accept' ? '#10b981' : '#ef4444'};font-weight:bold;">${status.toUpperCase()}</span></p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
        </div>
        
        <div style="background:#${action === 'accept' ? 'd1fae5' : 'fee2e2'};padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #${action === 'accept' ? '10b981' : 'ef4444'};">
          <h3 style="margin-top:0;color:#${action === 'accept' ? '065f46' : '991b1b'};">Status</h3>
          <p style="color:#${action === 'accept' ? '065f46' : '991b1b'};">
            ${action === 'accept' 
              ? '✅ Customer accepted the quote. Tradesman has been notified to follow up.' 
              : '❌ Customer declined the quote. No further action required.'}
          </p>
        </div>
        
        <p style="margin-top:20px;color:#6b7280;">
          This is an automated notification from the Kiwi Trade system.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: 'Kiwi Trade <danbricks18@gmail.com>',
      to: 'danbricks18@gmail.com', // Admin email
      subject: adminSubject,
      html: adminHtml
    });
    
    console.log('✅ Admin notification email sent successfully');

  } catch (emailError) {
    console.error('❌ Email sending error:', emailError.message);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await ensureOnce();

    const { quoteId, leadId, token, action, who } = req.query || {};
    if (!quoteId || !leadId || !['accept', 'decline'].includes(action)) {
      return res.status(400).send('Invalid request');
    }

    if (DEBUG && !token) console.warn('quote-decision: missing token', { quoteId, leadId, action });

    // Optional: verify token when your flow is ready
    // await verifyToken({ leadId, token });

    // 1) Check if already decided for this quoteId+leadId
    const existing = await findExistingDecision({ quoteId, leadId });
    if (existing.decided) {
      const page = htmlPage(
        'Decision Already Recorded',
        `We have already recorded your decision for this quote (<strong>${existing.status}</strong>) on ${existing.timestamp || 'a previous visit'}.`
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(page);
    }

    // 2) First click wins: record decision now
    const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
    await recordDecision({ quoteId, leadId, status, decidedBy: who || '' });

    // 3) Send notifications ONCE (guarded)
    try {
      const quoteData = await fetchQuoteData(quoteId);
      const leadData = await fetchLeadData(leadId);
      
      await sendNotifications({ quoteId, leadId, action, quoteData, leadData });
    } catch (e) {
      console.warn('Decision notify failed:', e?.message || e);
    }

    // 4) Confirmation page
    const page = htmlPage(
      status === 'ACCEPTED' ? 'Quote Accepted' : 'Quote Declined',
      status === 'ACCEPTED'
        ? 'Thanks! We have recorded your acceptance. We will be in touch shortly.'
        : 'Thanks for letting us know. We have recorded your decision.'
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(page);
  } catch (e) {
    console.error('quote-decision error:', e);
    return res.status(500).send('Server error');
  }
}
