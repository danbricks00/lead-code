import { getLeadById, upsertQuoteRow } from '../../../utils/sheets';
import { buildQuoteRow } from '../../../utils/quotes';
import { sendEmail } from '../../../lib/emailHelper';
import crypto from "crypto";

// --- Helper Functions ---
function verifyToken(id, ts) {
    const secret = process.env.QUOTE_LINK_SECRET || 'fallback-secret';
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateQuoteSubmissionLink(leadId) {
    const ts = Date.now().toString();
    const token = verifyToken(leadId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/quote-submit/${leadId}?ts=${ts}&token=${token}`;
}

async function getQuoteById(quoteId) {
    try {
        const { getGoogleSheetsClient, getSpreadsheetId } = await import("../../../lib/googleSheets.js");
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();
        
        const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values || [];
        
        if (rows.length === 0) return null;
        
        const headers = rows[0];
        const quoteRow = rows.find(row => row[0] === quoteId); // QuoteID is first column
        
        if (!quoteRow) return null;
        
        const quote = {};
        headers.forEach((header, index) => {
            quote[header] = quoteRow[index] || '';
        });
        
        return quote;
    } catch (error) {
        console.error(`[ADMIN-DECLINE] Error getting quote ${quoteId}:`, error);
        return null;
    }
}

// --- Main Handler ---
export default async function handler(req, res) {
    // Enhanced logging for debugging
    console.log('🔍 [ADMIN-DECLINE] Request received:', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
            'user-agent': req.headers['user-agent'],
            'referer': req.headers['referer'],
            'x-forwarded-for': req.headers['x-forwarded-for']
        },
        timestamp: new Date().toISOString()
    });
    
    if (req.method !== 'GET') {
        console.log('🔍 [ADMIN-DECLINE] Invalid method:', req.method);
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { quoteId, ts, token, reason } = req.query;

    // Enhanced token validation debugging
    const expectedToken = verifyToken(quoteId, ts);
    const tokenValid = token === expectedToken;
    
    console.log('🔍 [ADMIN-DECLINE] Token validation:', {
        quoteId,
        ts,
        receivedToken: token,
        expectedToken,
        tokenValid,
        hasSecret: !!process.env.QUOTE_LINK_SECRET
    });

    if (!quoteId || !ts || !token || !tokenValid) {
        console.log('🔍 [ADMIN-DECLINE] Invalid decline link:', {
            quoteId,
            hasToken: !!token,
            hasTs: !!ts,
            tokenValid,
            expectedToken,
            receivedToken: token
        });
        return res.redirect(`/quote-status?status=error&message=Invalid decline link.`);
    }

    try {
        // 1. Get Quote data using new unified system
        const quoteData = await getQuoteById(quoteId);
        if (!quoteData) return res.redirect(`/quote-status?status=error&message=Quote not found.`);
        
        // Check if already declined or approved
        if (quoteData.AdminPersonStatus === 'Declined') {
            return res.redirect(`/quote-status?status=info&message=Quote ${quoteId} has already been declined.`);
        }
        if (quoteData.AdminPersonStatus === 'Approved') {
            return res.redirect(`/quote-status?status=info&message=Quote ${quoteId} has already been approved and cannot be declined.`);
        }

        // If no reason provided, redirect to decline form
        if (!req.query.reason) {
            return res.redirect(`/admin/decline-form?quoteId=${quoteId}&ts=${ts}&token=${token}`);
        }

        // 2. Get Lead data using new unified system
        const lead = await getLeadById(quoteData.LeadID);
        if (!lead) return res.redirect(`/quote-status?status=error&message=Lead data not found.`);

        // 3. Update Quote using new unified system with rejected mode
        const rejectedRow = buildQuoteRow({
            lead,
            quoteId: quoteData.QuoteID,
            tradePersonName: quoteData.TradePersonName || '',
            tradePersonEmail: quoteData.TradePersonEmail || '',
            tradePersonPhone: quoteData.TradePersonPhone || '',
            body: {
                labourRate: quoteData.LabourRate || '',
                labourHours: quoteData.LabourHours || '',
                labourTotal: quoteData.LabourTotal || '',
                materialsCost: quoteData.MaterialsCost || '',
                materialsQuantity: quoteData.MaterialsQuantity || '',
                materialsTotal: quoteData.MaterialsTotal || '',
                travelCost: quoteData.TravelCost || '',
                travelDistance: quoteData.TravelDistance || '',
                travelTotal: quoteData.TravelTotal || '',
                installationCost: quoteData.InstallationCost || '',
                subtotal: quoteData.Subtotal || '',
                gst: quoteData.GST || '',
                totalQuote: quoteData.TotalQuote || '',
                notes: quoteData.Notes || '',
                validUntil: quoteData.ValidUntil || ''
            },
            mode: 'rejected'
        });

        // Override with decline-specific status
        rejectedRow.AdminPersonStatus = 'Declined';
        rejectedRow.TradePersonStatus = 'Needs Revision';
        rejectedRow.ResubmissionAllowed = 'Yes';

        const result = await upsertQuoteRow(quoteData.QuoteID, rejectedRow, { req, caller: 'admin-decline' });
        console.log(`[ADMIN-DECLINE] Quote ${quoteId} declined, result:`, result);

        // 3. Send decline notification emails (if enabled)
        if (process.env.ENABLE_APPROVE_DECLINE_EMAILS === 'true') {
            try {
                // Send customer decline email
                const customerDeclineEmail = {
                    to: lead.CustomerEmail,
                    subject: `⚠️ Quote Declined - ${lead.ServiceType} for ${lead.CustomerName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">⚠️ Quote Declined</h1>
                                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Your quote was declined by our admin team</p>
                                </div>
                                <div style="background-color: #fdf2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Quote Details</h3>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Quote ID:</strong> ${quoteData.QuoteID}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${lead.ServiceType}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Total:</strong> $${quoteData.TotalQuote}</p>
                                </div>
                                <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h4 style="color: #856404; margin: 0 0 10px 0;">💡 What's Next?</h4>
                                    <p style="margin: 5px 0; color: #495057;">The tradesperson will be notified and may resubmit a revised quote. You'll receive an email if a new quote is submitted.</p>
                                </div>
                                <div style="text-align: center; margin-top: 30px;">
                                    <p style="color: #6c757d; font-size: 16px;">Thank you for considering our services</p>
                                </div>
                            </div>
                        </div>
                    `
                };
                await sendEmail(customerDeclineEmail);

                // Send tradesperson decline notification email with reason
                const declineReason = req.query.reason || 'No specific reason provided';
                const tradespersonDeclineEmail = {
                    to: quoteData.TradePersonEmail,
                    subject: `⚠️ Quote Declined - ${lead.ServiceType} for ${lead.CustomerName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">⚠️ Quote Declined</h1>
                                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin has declined your quote</p>
                                </div>
                                <div style="background-color: #fdf2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Customer Details</h3>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Name:</strong> ${lead.CustomerName}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Email:</strong> ${lead.CustomerEmail}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Phone:</strong> ${lead.CustomerPhone}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${lead.ServiceType}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Quote Total:</strong> $${quoteData.TotalQuote}</p>
                                </div>
                                <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h4 style="color: #856404; margin: 0 0 10px 0;">📝 Admin Feedback</h4>
                                    <p style="margin: 5px 0; color: #495057; font-style: italic;">"${declineReason}"</p>
                                </div>
                                <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h4 style="color: #27ae60; margin: 0 0 10px 0;">🔄 Next Steps</h4>
                                    <p style="margin: 5px 0; color: #495057;">Please review the feedback above and resubmit a revised quote addressing the concerns mentioned.</p>
                                    <p style="margin: 10px 0 0 0;">
                                        <a href="${generateQuoteSubmissionLink(quoteData.LeadID)}" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">📝 Resubmit Quote</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    `
                };
                await sendEmail(tradespersonDeclineEmail);

                // Send admin confirmation email
                const adminConfirmationEmail = {
                    to: process.env.ADMIN_EMAIL,
                    subject: `⚠️ Quote ${quoteData.QuoteID} Declined - Confirmation`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                            <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">⚠️ Quote Declined</h1>
                                    <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin decline confirmation</p>
                                </div>
                                <div style="background-color: #fdf2f2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                    <h3 style="color: #e74c3c; margin: 0 0 10px 0;">Quote Details</h3>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Quote ID:</strong> ${quoteData.QuoteID}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Customer:</strong> ${lead.CustomerName}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Service:</strong> ${lead.ServiceType}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Tradesperson:</strong> ${quoteData.TradePersonName}</p>
                                    <p style="margin: 5px 0; color: #495057;"><strong>Total:</strong> $${quoteData.TotalQuote}</p>
                                </div>
                                <div style="text-align: center; margin-top: 30px;">
                                    <p style="color: #e74c3c; font-size: 16px; font-weight: bold;">⚠️ Decline emails sent to customer and tradesperson</p>
                                </div>
                            </div>
                        </div>
                    `
                };
                await sendEmail(adminConfirmationEmail);

                console.log(JSON.stringify({ tag: 'QUOTE_REJECTED_EMAILS_SENT', quoteId: quoteData.QuoteID }));
            } catch (emailError) {
                console.error(JSON.stringify({ tag: 'QUOTE_REJECTED_EMAILS_FAIL', quoteId: quoteData.QuoteID, error: String(emailError?.message || emailError) }));
            }
        } else {
            console.log(JSON.stringify({ tag: 'QUOTE_REJECTED_EMAILS_SKIPPED', quoteId: quoteData.QuoteID, reason: 'env flag off' }));
        }

        // 4. Generate resubmission link
        const resubmissionLink = generateQuoteSubmissionLink(quoteData.LeadID);

        // 4. Send notification email to tradesperson
        const tradespersonEmailOptions = {
          to: quoteData.TradePersonEmail,
          subject: `⚠️ Quote Revision Required - ${lead.ServiceType} for ${lead.CustomerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
              <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #e74c3c; margin: 0; font-size: 28px;">⚠️ Quote Needs Revision</h1>
                  <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Admin review required changes</p>
                </div>

                <!-- Quote Details -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 18px;">📋 Quote Details</h3>
                  <p style="margin: 5px 0; color: #856404;"><strong>Customer:</strong> ${lead.CustomerName}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Service:</strong> ${lead.ServiceType}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Quote ID:</strong> ${quoteId}</p>
                  <p style="margin: 5px 0; color: #856404;"><strong>Status:</strong> Declined - Revision Required</p>
                </div>

                <!-- Reason for Decline -->
                ${reason ? `
                <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #721c24; margin: 0 0 15px 0; font-size: 18px;">📝 Reason for Decline</h3>
                  <p style="color: #721c24; margin: 0;">${decodeURIComponent(reason)}</p>
                </div>
                ` : ''}

                <!-- Next Steps -->
                <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
                  <h3 style="color: #0c5460; margin: 0 0 15px 0; font-size: 18px;">🔄 Next Steps</h3>
                  <p style="color: #0c5460; margin: 0 0 15px 0;">
                    Your quote has been declined by the admin and needs revision. You can:
                  </p>
                  <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                    <li>Review and edit the quote details</li>
                    <li>Update pricing, timeline, or other information</li>
                    <li>Resubmit for admin approval</li>
                  </ul>
                </div>

                <!-- Resubmission Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resubmissionLink}" style="display: inline-block; background-color: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">🔄 Revise & Resubmit Quote</a>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                  <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                    Questions about the required changes? Reply to this email.<br>
                    <strong>Kiwi Trade Team</strong>
                  </p>
                </div>

              </div>
            </div>
          `
        };

        await sendEmail(tradespersonEmailOptions);
        console.log(`✅ Quote decline notification sent to ${quoteData.TradePersonEmail}`);

        // 5. Send notification to admin
        const adminEmailOptions = {
          to: process.env.ADMIN_EMAIL,
          subject: `Quote Declined - ${lead.ServiceType} for ${lead.CustomerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">Quote Declined Successfully</h2>
              <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                <p><strong>Quote ID:</strong> ${quoteId}</p>
                <p><strong>Customer:</strong> ${lead.CustomerName}</p>
                <p><strong>Service:</strong> ${lead.ServiceType}</p>
                <p><strong>Tradesperson:</strong> ${quoteData.TradePersonName}</p>
                <p><strong>Status:</strong> Declined - Tradesperson notified for revision</p>
                ${reason ? `<p><strong>Decline Reason:</strong> ${decodeURIComponent(reason)}</p>` : ''}
                <p>The tradesperson has been notified and can resubmit the quote after making revisions.</p>
              </div>
            </div>
          `
        };

        await sendEmail(adminEmailOptions);
        
        return res.redirect(`/quote-status?status=success&message=Quote declined successfully. Tradesperson has been notified and can resubmit.`);

    } catch (error) {
        console.error("Quote Decline Error:", error);
        return res.redirect(`/quote-status?status=error&message=An error occurred while declining the quote.`);
    }
}