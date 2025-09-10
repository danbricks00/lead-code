/**
 * Quote Submit API - Submit Finalized Quote
 * POST-only. Updates draft quote with finalized details and triggers PDF/email.
 */

import { getLeadById, upsertQuoteRow, getQuoteById, getQuotesByLeadId } from '../../../utils/sheets.js';
import { buildQuoteRow } from '../../../utils/quotes.js';
import { generateQuotePDF } from '../../../lib/pdfGenerator.js';
import { sendEmail } from '../../../lib/emailHelper.js';

export default async function handler(req, res) {
  const requestId = `quote-submit-${Date.now()}`;
  
  console.log(JSON.stringify({ 
    tag: 'QUOTE_SUBMIT_REQ_START', 
    route: 'quote-submit', 
    method: req.method,
    requestId,
    timestamp: new Date().toISOString()
  }));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[QUOTE-SUBMIT] Request received:', req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { quoteId, leadId } = body || {};
    console.log('[QUOTE-SUBMIT] Parsed body:', { quoteId, leadId, bodyKeys: Object.keys(body) });
    
    if (!quoteId || !leadId) {
      console.log(JSON.stringify({ 
        tag: 'QUOTE_SUBMIT_FAIL', 
        error: 'Missing quoteId or leadId',
        requestId 
      }));
      return res.status(400).json({ error: 'quoteId and leadId are required' });
    }

    // Get the lead data
    const lead = await getLeadById(String(leadId).trim());
    if (!lead) {
      console.log(JSON.stringify({ 
        tag: 'QUOTE_SUBMIT_FAIL', 
        error: 'Lead not found',
        leadId,
        requestId 
      }));
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check for existing quotes for this lead
    const existingQuotes = await getQuotesByLeadId(String(leadId).trim());
    console.log('[QUOTE-SUBMIT] Existing quotes for lead:', existingQuotes.length);
    
    // Filter out the current quote being submitted (if it's an update)
    const otherQuotes = existingQuotes.filter(q => q.QuoteID !== quoteId);
    
    if (otherQuotes.length > 0) {
      // Check if any existing quote is not rejected by admin
      const nonRejectedQuotes = otherQuotes.filter(q => 
        q.AdminPersonStatus !== 'Declined' && 
        q.AdminPersonStatus !== 'Rejected' &&
        q.Decison !== 'Rejected' &&
        q.Decison !== 'Declined'
      );
      
      if (nonRejectedQuotes.length > 0) {
        console.log('[QUOTE-SUBMIT] Found existing non-rejected quotes:', nonRejectedQuotes.length);
        // This is a resubmission scenario - allow it
      }
    }

    // Extract tradesperson details (handle both field name variations)
    const tradespersonName = body.tradespersonName || body.tradePersonName || '';
    const tradespersonEmail = body.tradespersonEmail || body.tradePersonEmail || '';
    const tradespersonPhone = body.tradespersonPhone || body.tradePersonPhone || '';

    console.log('[QUOTE-SUBMIT] Tradesperson details:', {
      name: tradespersonName,
      email: tradespersonEmail,
      phone: tradespersonPhone
    });

    // Build the finalized quote row
    const fullRow = buildQuoteRow({
      lead,
      quoteId,
      tradePersonName: tradespersonName,
      tradePersonEmail: tradespersonEmail,
      tradePersonPhone: tradespersonPhone,
      body,
      mode: 'submitted'
    });

    console.log('[QUOTE-SUBMIT] About to write to Google Sheets:', {
      quoteId: fullRow.QuoteID,
      fullRowKeys: Object.keys(fullRow)
    });

    // Update the quote in Google Sheets
    const result = await upsertQuoteRow(fullRow, 'quote-submit');
    
    console.log('[QUOTE-SUBMIT] Google Sheets write result:', result);

    // Check if we should send PDF/emails
    const customerStatus = fullRow.CustomerStatus || 'Submitted';
    const tradePersonStatus = fullRow.TradePersonStatus || 'Pending';
    const enablePdfEmails = process.env.ENABLE_APPROVE_DECLINE_EMAILS === 'true';
    const shouldSend = enablePdfEmails && customerStatus === 'Submitted' && tradePersonStatus === 'Pending';

    console.log('[QUOTE-SUBMIT] PDF/Email check:', {
      customerStatus,
      tradePersonStatus,
      enablePdfEmails,
      shouldSend
    });

    if (shouldSend) {
      try {
        console.log('🔄 ULTRA-ROBUST PDF Generation starting for quote:', fullRow.QuoteID);
        
        // Generate PDF
        const pdfBuffer = await generateQuotePDF({ ...fullRow, html: null, quoteId: fullRow.QuoteID });
        
        if (pdfBuffer) {
          console.log('✅ PDF generated successfully, size:', pdfBuffer.length);
          
          // Send admin email with approve/decline buttons
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const approveUrl = `${baseUrl}/api/admin-accept?quoteId=${quoteId}&leadId=${leadId}`;
          const declineUrl = `${baseUrl}/api/admin-decline?quoteId=${quoteId}&leadId=${leadId}`;
          
          await sendEmail({
            to: process.env.ADMIN_EMAIL || 'admin@example.com',
            subject: `New Quote Submitted - ${fullRow.CustomerName} - ${fullRow.ServiceType}`,
            html: `
              <h2>New Quote Submitted</h2>
              <p><strong>Customer:</strong> ${fullRow.CustomerName}</p>
              <p><strong>Email:</strong> ${fullRow.CustomerEmail}</p>
              <p><strong>Phone:</strong> ${fullRow.CustomerPhone}</p>
              <p><strong>Service:</strong> ${fullRow.ServiceType}</p>
              <p><strong>Location:</strong> ${fullRow.Suburb}</p>
              <p><strong>Total Quote:</strong> $${fullRow.TotalQuote}</p>
              <p><strong>Valid Until:</strong> ${fullRow.ValidUntil}</p>
              
              <h3>Actions:</h3>
              <p>
                <a href="${approveUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve Quote</a>
                <a href="${declineUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Decline Quote</a>
              </p>
              
              <p>Quote PDF is attached.</p>
            `,
            attachments: [{
              filename: `quote-${fullRow.QuoteID}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }]
          });

          // Send tradesperson email
          if (tradespersonEmail) {
            await sendEmail({
              to: tradespersonEmail,
              subject: `Quote Submitted - ${fullRow.CustomerName}`,
              html: `
                <h2>Quote Submitted Successfully</h2>
                <p>Your quote for <strong>${fullRow.CustomerName}</strong> has been submitted and is now under review.</p>
                <p><strong>Service:</strong> ${fullRow.ServiceType}</p>
                <p><strong>Total Quote:</strong> $${fullRow.TotalQuote}</p>
                <p><strong>Valid Until:</strong> ${fullRow.ValidUntil}</p>
                <p>You will be notified once the customer makes a decision.</p>
              `
            });
          }

          console.log('✅ Admin and tradesperson emails sent successfully');
        } else {
          console.log('❌ PDF generation returned null/empty buffer');
        }
      } catch (pdfError) {
        console.error('❌ ULTRA-ROBUST PDF generation failed:', pdfError);
        console.error('❌ Comprehensive error details:', {
          message: pdfError.message,
          stack: pdfError.stack,
          quoteId: fullRow.QuoteID,
          dataKeys: Object.keys(fullRow),
          dataStructure: JSON.stringify(fullRow).substring(0, 500),
          timestamp: new Date().toISOString()
        });
        
        // Log the failure but don't fail the entire request
        console.log(JSON.stringify({ 
          tag: 'QUOTE_PDF_EMAIL_FAIL', 
          quoteId: fullRow.QuoteID,
          msg: `Failed to generate PDF: ${pdfError.message}`,
          requestId 
        }));
      }
    }

    console.log(JSON.stringify({ 
      tag: 'QUOTE_SUBMIT_OK', 
      quoteId,
      leadId,
      action: result.action,
      rowIndex: result.rowIndex,
      requestId 
    }));

    return res.status(200).json({ 
      success: true, 
      quoteId,
      leadId,
      action: result.action,
      rowIndex: result.rowIndex
    });

  } catch (error) {
    console.error(JSON.stringify({ 
      tag: 'QUOTE_SUBMIT_FAIL', 
      error: error.message,
      stack: error.stack,
      requestId 
    }));
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
