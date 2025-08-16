import nodemailer from 'nodemailer';
import { 
  fetchQuoteData, 
  fetchLeadData, 
  checkQuoteDecisionState, 
  updateQuoteStatus 
} from './quote-utils.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { quoteId, leadId, token, action } = req.query;
    if (!quoteId || !leadId || !['accept','decline'].includes(action)) {
      return res.status(400).send('Invalid request');
    }

    if (!token) {
      console.warn('quote-decision: missing token', { quoteId, leadId, action });
      // For now, we'll allow the request to continue but log the warning
      // TODO: Implement proper token validation when ready
    }

    console.log(`🔍 Quote decision received: ${action} for quote ${quoteId}, lead ${leadId}`);

    // Check quote decision state using unified function (keyed by quoteId + leadId)
    console.log('🔍 Checking quote decision state...');
    const decisionState = await checkQuoteDecisionState(quoteId, leadId);
    console.log('📋 Decision state result:', decisionState);
    
    if (!decisionState.found) {
      console.error('❌ Quote not found or does not match lead:', quoteId, leadId);
      return res.status(404).send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Quote Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .error { background: #fee2e2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }
            .debug { background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px; font-family: monospace; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">KIWI UNDERFLOOR HEATING</div>
          </div>
          <div class="error">
            <h2>Quote Not Found</h2>
            <p>The quote you're trying to access could not be found in our system.</p>
            <p><strong>Quote ID:</strong> ${quoteId}</p>
            <p><strong>Lead ID:</strong> ${leadId}</p>
            <p><strong>Action:</strong> ${action}</p>
            <p><strong>Error:</strong> ${decisionState.message}</p>
          </div>
          <div class="debug">
            <strong>Debug Information:</strong><br>
            Quote ID: ${quoteId}<br>
            Lead ID: ${leadId}<br>
            Action: ${action}<br>
            <br>
            <a href="/debug-quote-decision.html" target="_blank">Click here to debug this issue</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check if a decision has already been made
    if (decisionState.isDecided) {
      console.log(`⚠️ Quote ${quoteId} already has a decision: ${decisionState.status}`);
      
      const originalDecision = decisionState.status === 'Accepted' ? 'accept' : 'decline';
      const title = decisionState.status === 'Accepted' ? 'Quote Already Accepted' : 'Quote Already Declined';
      const msg = decisionState.status === 'Accepted' 
        ? 'This quote has already been accepted. No further action is needed.'
        : 'This quote has already been declined. No further action is needed.';

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(`
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
            .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #${originalDecision === 'accept' ? '#10b981' : '#ef4444'}; }
            .status { text-align: center; margin-top: 20px; padding: 15px; background: #${originalDecision === 'accept' ? 'd1fae5' : 'fee2e2'}; border-radius: 6px; color: #${originalDecision === 'accept' ? '065f46' : '991b1b'}; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">KIWI UNDERFLOOR HEATING</div>
          </div>
          <div class="warning">
            <strong>⚠️ Decision Already Made</strong><br>
            This quote has already been ${decisionState.status.toLowerCase()}. Decisions are final and cannot be changed.
          </div>
          <div class="message">
            <h2>${title}</h2>
            <p>${msg}</p>
          </div>
          <div class="status">
            <strong>Status:</strong> ${decisionState.status === 'Accepted' ? '✅ Already Accepted' : '❌ Already Declined'}
          </div>
          <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            Thank you for using Kiwi Trade services.
          </p>
        </body>
        </html>
      `);
      return;
    }

    // Fetch quote and lead data for email sending
    console.log('🔍 Fetching quote data for:', quoteId);
    const quoteData = await fetchQuoteData(quoteId);
    console.log('📋 Quote data result:', quoteData ? 'Found' : 'Not found');
    
    console.log('🔍 Fetching lead data for:', leadId);
    const leadData = await fetchLeadData(leadId);
    console.log('📋 Lead data result:', leadData ? 'Found' : 'Not found');

    let customerEmailSent = false;
    let tradesmanEmailSent = false;
    let adminEmailSent = false;
    let statusUpdated = false;

    // Update quote status in Google Sheets using unified function
    try {
      const updateSuccess = await updateQuoteStatus(quoteId, action === 'accept' ? 'Accepted' : 'Declined');
      if (updateSuccess) {
        statusUpdated = true;
        console.log('✅ Quote status updated in Google Sheets');
      } else {
        console.error('❌ Failed to update quote status');
      }
    } catch (updateError) {
      console.error('❌ Failed to update quote status:', updateError.message);
    }

    // Send emails based on the decision
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'danbricks18@gmail.com',
          pass: 'ptmcojqgthvjbqom'
        }
      });

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
              <p><strong>Decision:</strong> ${action === 'accept' ? 'Accepted' : 'Declined'}</p>
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
        customerEmailSent = true;
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
            <p><strong>Customer Decision:</strong> ${action === 'accept' ? 'Accepted' : 'Declined'}</p>
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
              <a href="${process.env.SITE_URL || 'https://lead-code.vercel.app'}/counter-quote-form.html?quoteId=${quoteId}&leadId=${leadId}&token=${token}" 
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
      tradesmanEmailSent = true;

      // 3. Send admin notification email
      const adminSubject = `Quote ${action === 'accept' ? 'Accepted' : 'Declined'} - ${quoteData?.customerName || leadData?.customerName || 'Unknown Customer'}`;
      
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
            <p><strong>Decision:</strong> <span style="color:${action === 'accept' ? '#10b981' : '#ef4444'};font-weight:bold;">${action === 'accept' ? 'ACCEPTED' : 'DECLINED'}</span></p>
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
      adminEmailSent = true;

    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
    }

    const title = action === 'accept' ? 'Quote Accepted' : 'Quote Declined';
    const msg = action === 'accept'
      ? 'Thanks! We have recorded your acceptance. We will be in touch shortly.'
      : 'Thanks for letting us know. We have recorded your decision.';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
          .message { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #${action === 'accept' ? '10b981' : 'ef4444'}; }
          .status { text-align: center; margin-top: 20px; padding: 15px; background: #${action === 'accept' ? 'd1fae5' : 'fee2e2'}; border-radius: 6px; color: #${action === 'accept' ? '065f46' : '991b1b'}; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">KIWI UNDERFLOOR HEATING</div>
        </div>
        <div class="message">
          <h2>${title}</h2>
          <p>${msg}</p>
        </div>
        <div class="status">
          <strong>Status:</strong> ${action === 'accept' ? '✅ Accepted' : '❌ Declined'}
        </div>
        <p style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
          Thank you for using Kiwi Trade services.
        </p>
      </body>
      </html>
    `);

  } catch (e) {
    console.error('❌ Quote decision error:', e);
    res.status(500).send('Server error');
  }
}
