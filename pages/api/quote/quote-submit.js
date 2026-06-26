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
    const TradePersonName = body.TradePersonName || body.TradePersonName || '';
    const tradespersonEmail = body.tradespersonEmail || body.tradePersonEmail || '';
    const tradespersonPhone = body.tradespersonPhone || body.tradePersonPhone || '';

    console.log('[QUOTE-SUBMIT] Tradesperson details:', {
      name: TradePersonName,
      email: tradespersonEmail,
      phone: tradespersonPhone
    });

    // Build the finalized quote row
    const fullRow = buildQuoteRow({
      lead,
      quoteId,
      TradePersonName: TradePersonName,
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
          
          // Calculate individual totals
          const labourTotal = parseFloat(fullRow.LabourRate || 0) * parseFloat(fullRow.LabourHours || 0);
          const materialsTotal = parseFloat(fullRow.MaterialsCost || 0) * parseFloat(fullRow.MaterialsQuantity || 0);
          const travelTotal = parseFloat(fullRow.TravelCost || 0) * parseFloat(fullRow.TravelDistance || 0);
          const installationTotal = parseFloat(fullRow.InstallationCost || 0);

          const adminReviewTo = (process.env.ADMIN_EMAIL || process.env.TRADESPERSON_EMAIL || '').trim();
          if (!adminReviewTo) {
            console.warn('⚠️ ADMIN_EMAIL and TRADESPERSON_EMAIL unset — skipping admin review email');
          } else {
            await sendEmail({
            to: adminReviewTo,
            subject: `New Quote #${fullRow.QuoteID} for ${fullRow.CustomerName} - Waiting for Approval`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1>📄 New Quote Submitted for Review</h1>
                  <p>A new quote has been submitted and requires your review.</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                  <h2>📋 Quote Details</h2>
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p><strong>Quote ID:</strong> ${fullRow.QuoteID}</p>
                    <p><strong>Customer:</strong> ${fullRow.CustomerName}</p>
                    <p><strong>Email:</strong> ${fullRow.CustomerEmail}</p>
                    <p><strong>Phone:</strong> ${fullRow.CustomerPhone}</p>
                    <p><strong>Service:</strong> ${fullRow.ServiceType}</p>
                    <p><strong>Location:</strong> ${fullRow.Suburb}</p>
                    <p><strong>Tradesperson:</strong> ${fullRow.TradePersonName}</p>
                    <p><strong>Valid Until:</strong> ${fullRow.ValidUntil}</p>
                  </div>
                  
                  <h3>💰 Cost Breakdown</h3>
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>Labour:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">$${labourTotal.toFixed(2)}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>Materials:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">$${materialsTotal.toFixed(2)}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>Travel:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">$${travelTotal.toFixed(2)}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px 0;"><strong>Installation:</strong></td>
                        <td style="padding: 8px 0; text-align: right;">$${installationTotal.toFixed(2)}</td>
                      </tr>
                      <tr style="border-bottom: 2px solid #333;">
                        <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
                        <td style="padding: 8px 0; text-align: right;"><strong>$${fullRow.Subtotal}</strong></td>
                      </tr>
                      <tr style="border-bottom: 2px solid #333;">
                        <td style="padding: 8px 0;"><strong>GST (15%):</strong></td>
                        <td style="padding: 8px 0; text-align: right;"><strong>$${fullRow.GST}</strong></td>
                      </tr>
                      <tr style="background: #f8f9fa;">
                        <td style="padding: 12px 0;"><strong>Total Quote:</strong></td>
                        <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #28a745;"><strong>$${fullRow.TotalQuote}</strong></td>
                      </tr>
                    </table>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <h3>🎯 Admin Actions Required</h3>
                    <p>Please review the attached quote and take action:</p>
                    
                    <div style="margin: 20px 0;">
                      <a href="${approveUrl}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 10px; font-weight: bold; box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);">
                        ✅ Approve Quote
                      </a>
                      
                      <a href="${declineUrl}" style="background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 10px; font-weight: bold; box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);">
                        ❌ Decline Quote
                      </a>
                    </div>
                  </div>
                  
                  <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404;"><strong>📎 Quote PDF is attached to this email.</strong></p>
                  </div>
                </div>
              </div>
            `,
            attachments: [{
              filename: `quote-${fullRow.QuoteID}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }]
            });
          }

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
