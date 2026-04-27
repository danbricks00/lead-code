// pages/api/quote-enquiry.js - Quote Enquiry API for Contact Page
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { validateAndCorrectEmail } from '../../utils/emailValidator';
import { calculateSpamScore } from '../../utils/spamValidator';
import { checkSubmissionRateLimit } from '../../utils/rateLimiter';

const quoteEnquiryRateLimitStore = new Map();
const QUOTE_ENQUIRY_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

// Google Sheets client setup
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Helper function to append row to sheet
async function appendRowToSheet(sheets, tab, row) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: { values: [row] }
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const lastRequestAt = quoteEnquiryRateLimitStore.get(clientIp) || 0;

    if (now - lastRequestAt < QUOTE_ENQUIRY_RATE_LIMIT_WINDOW_MS) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again in a minute.'
      });
    }

    quoteEnquiryRateLimitStore.set(clientIp, now);
    for (const [ip, timestamp] of quoteEnquiryRateLimitStore.entries()) {
      if (now - timestamp >= QUOTE_ENQUIRY_RATE_LIMIT_WINDOW_MS) {
        quoteEnquiryRateLimitStore.delete(ip);
      }
    }

    const {
      firstName,
      lastName,
      name, // Fallback for backward compatibility
      email,
      phone,
      projectType,
      roomCount,
      location,
      timeline,
      message,
      zoneInfo,
      isAucklandArea,
      website, // Honeypot field
      timeOnPage // Form submission timing
    } = req.body;

    // Rate limiting check (before processing)
    const rateLimitCheck = checkSubmissionRateLimit(req, email, 5, 3);
    if (!rateLimitCheck.allowed) {
      console.log(`🚫 Rate limit exceeded (${rateLimitCheck.type}) for quote enquiry:`, {
        email: email ? email.substring(0, 10) + '...' : 'no email',
        reason: rateLimitCheck.reason
      });
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason || 'Too many submissions. Please try again later.'
      });
    }

    // Combine firstName/lastName or use name field for spam validation
    const formDataForValidation = {
      firstName,
      lastName,
      name: name || (firstName && lastName ? `${firstName} ${lastName}` : ''),
      email,
      message,
      phone,
      website, // Honeypot field
      timeOnPage // Form submission timing
    };

    // Server-side spam validation and scoring
    const spamCheck = calculateSpamScore(formDataForValidation, 15, { timeOnPage });
    
    if (spamCheck.isSpam) {
      // Silently drop spam submissions - return success to client but don't process
      console.log(`🚫 Spam quote enquiry blocked (score: ${spamCheck.score}/${spamCheck.threshold}):`, {
        issues: spamCheck.issues,
        email: email ? email.substring(0, 10) + '...' : 'no email',
        name: spamCheck.nameData.originalName.substring(0, 20) + '...'
      });
      return res.status(200).json({
        success: true,
        message: "Quote enquiry submitted successfully! We'll get back to you soon.",
        leadId: 'SPAM-BLOCKED',
        quoteId: 'SPAM-BLOCKED'
      });
    }

    // Use validated name data (split from full name if needed)
    const finalName = (firstName && lastName) 
      ? `${firstName} ${lastName}` 
      : (name || spamCheck.nameData.originalName);

    // Validation
    if (!finalName || !email || !projectType || !roomCount || !location || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, email, projectType, roomCount, location, message"
      });
    }

    // Smart email validation with autocorrect
    const emailValidation = await validateAndCorrectEmail(email, true);
    
    if (!emailValidation.isValid) {
      if (emailValidation.isDisposable) {
        console.log(`🚫 Quote enquiry blocked disposable email: ${email}`);
      } else {
        console.log("❌ Quote enquiry validation failed - invalid email format");
      }
      return res.status(400).json({
        success: false,
        error: emailValidation.error
      });
    }
    
    const finalEmail = emailValidation.correctedEmail || email;
    
    // Log if email was corrected
    if (emailValidation.needsCorrection) {
      console.log(`📧 Email autocorrected: ${email} → ${finalEmail}`);
    }

    // Generate unique lead ID and quote ID with INQ prefix
    const leadId = crypto.randomBytes(6).toString("hex");
    const quoteId = `INQ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    
    console.log(`📋 Processing quote enquiry: Lead ${leadId}, Quote ${quoteId}`, {
      name: finalName,
      email: finalEmail,
      spamScore: spamCheck.score,
      phone: phone || 'not provided'
    });

    const sheets = getGoogleSheetsClient();
    
    // Create rooms data structure (simplified for large projects)
    const rooms = [{
      name: `${roomCount} Rooms Project`,
      dimensions: 'Large Project',
      sqm: parseInt(roomCount) * 10, // Estimate 10 sqm per room
      parsedDimensions: null,
      format: 'large_project'
    }];

    // Construct address from location
    const fullAddress = location;

    // Create lead row for Leads tab (same structure as chatbot leads)
    const leadRow = [
      leadId,                                    // A: Lead ID
      finalName,                                 // B: CustomerName
      finalEmail,                                // C: CustomerEmail
      phone || "",                               // D: CustomerPhone
      projectType,                               // E: ServiceType
      JSON.stringify(rooms),                     // F: Rooms
      zoneInfo ? zoneInfo.area : "Contact Page", // G: Area (Zone) - use zone area if available
      location,                                  // H: Suburb
      "0",                                       // I: Budget (removed from chatbot, always 0)
      timeline || "",                            // J: Timeline
      message,                                   // K: Specific Details
      new Date().toLocaleString('en-NZ', {       // L: Time
        timeZone: 'Pacific/Auckland',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      "",                                        // M: (Empty)
      "New Lead",                                // N: Status
      "",                                        // O: Street Address (removed from chatbot)
      fullAddress,                               // P: Address
    ];

    // Write to Leads tab
    await appendRowToSheet(sheets, "Leads", leadRow);
    console.log(`[LEADS] Quote enquiry ${leadId} written to Leads tab`);

    // Create quote row for Quotes tab (same structure as chatbot quotes)
    const quoteRow = [
      quoteId,                                   // A: QuoteID
      leadId,                                    // B: LeadID
      finalName,                                 // C: CustomerName
      finalEmail,                                // D: CustomerEmail
      phone || "",                               // E: CustomerPhone
      projectType,                               // F: ServiceType
      JSON.stringify(rooms),                     // G: Rooms
      zoneInfo ? zoneInfo.area : "Contact Page", // H: Area - use zone area if available
      location,                                  // I: Suburb
      "0",                                       // J: Budget
      timeline || "",                            // K: Timeline
      message,                                   // L: Specific Details
      new Date().toLocaleString('en-NZ', {       // M: Time
        timeZone: 'Pacific/Auckland',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      "",                                        // N: (Empty)
      "New Lead",                                // O: Status
      "",                                        // P: Street Address
      fullAddress,                               // Q: Address
      "0.00",                                    // R: TotalSQM
      "0.00",                                    // S: LabourTotal
      "0.00",                                    // T: MaterialsTotal
      "0.00",                                    // U: TravelTotal
      "0.00",                                    // V: InstallationCost
      "0.00",                                    // W: Subtotal
      "0.00",                                    // X: GST
      "0.00",                                    // Y: TotalQuote
      "",                                        // Z: TradePersonName
      "",                                        // AA: TradePersonEmail
      "",                                        // AB: TradePersonPhone
      "",                                        // AC: ValidUntil
      "",                                        // AD: AdminDecision
      "",                                        // AE: AdminDecisionTimeStamp
      "",                                        // AF: CustomerDecision
      "",                                        // AG: CustomerDecisionTimeStamp
      "",                                        // AH: AdminPersonStatus
      "",                                        // AI: Decision
      "",                                        // AJ: DecisionTimestamp
    ];

    // Write to Quotes tab
    await appendRowToSheet(sheets, "Quotes", quoteRow);
    console.log(`[QUOTES] Quote enquiry ${quoteId} written to Quotes tab`);

    // Generate quote link for tradesman
    const ts = Date.now();
    const token = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET).update(`${leadId}|${ts}`).digest("hex");
    const quoteLink = `${baseUrl}/quote-submit/${leadId}?ts=${ts}&token=${token}`;
    
    console.log(`🔗 Generated quote link: ${quoteLink}`);

    // Resolve mail routing values (direct env evaluation)
    const resolvedClientEmail = (process.env.TRADESPERSON_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    const resolvedTradesLeadBcc = (process.env.TRADES_LEAD_BCC || process.env.ADMIN_EMAIL || '').trim();
    const tradesLeadEmail = resolvedClientEmail;
    const testEmail = process.env.TEST_EMAIL || process.env.DEBUG_EMAIL;
    
    if (resolvedClientEmail) {
        console.log(`📧 Client email for CC: ${resolvedClientEmail} (for lead ${leadId})`);
    } else {
        console.warn("⚠️ TRADESPERSON_EMAIL and ADMIN_EMAIL not configured - CC recipient missing");
    }
    
    if (tradesLeadEmail) {
        console.log(`📧 Tradesperson To resolved: ${tradesLeadEmail} (for lead ${leadId})`);
    } else {
        console.warn("⚠️ TRADESPERSON_EMAIL and ADMIN_EMAIL not configured - BCC/tradesperson delivery may fail");
    }
    if (resolvedTradesLeadBcc) {
        console.log(`📧 Lead BCC resolved: ${resolvedTradesLeadBcc} (for lead ${leadId})`);
    } else {
        console.warn("⚠️ TRADES_LEAD_BCC/TRADESPERSON_EMAIL/ADMIN_EMAIL not configured - no lead BCC copy");
    }
    
    if (testEmail) {
        console.log(`📧 Test email for BCC: ${testEmail} (for verification - lead ${leadId})`);
    }

    // Email setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    // Format rooms for email display
    const roomsHtml = `<li><b>Project Type:</b> ${projectType}</li><li><b>Number of Rooms:</b> ${roomCount}</li><li><b>Estimated Area:</b> ${parseInt(roomCount) * 10} square meters</li>`;

    // Create email content with zone information
    const getTravelCostMessage = () => {
      if (!zoneInfo) {
        return '(Location not in database - travel costs may be higher)';
      }
      
      const area = zoneInfo.area.toLowerCase();
      const isGreaterAuckland = area.includes('rodney') || 
                               area.includes('papakura') || 
                               area.includes('franklin');
      
      if (isGreaterAuckland) {
        return '(Greater Auckland - higher travel costs may apply)';
      } else if (isAucklandArea) {
        return '(Standard travel costs)';
      } else {
        return '(Higher travel costs may apply)';
      }
    };

    const zoneInfoHtml = zoneInfo ? 
      `<li><b>Service Area:</b> ${zoneInfo.area} ${getTravelCostMessage()}</li>` : 
      `<li><b>Service Area:</b> ${location} (Location not in database - travel costs may be higher)</li>`;

    const leadDetailsHtml = `
      <p>A new quote enquiry has been received with the following details:</p>
      <ul>
        <li><b>Lead ID:</b> ${leadId}</li>
        <li><b>Quote ID:</b> ${quoteId}</li>
        <li><b>Customer Name:</b> ${finalName}</li>
        ${firstName && lastName ? `<li><b>First Name:</b> ${firstName}</li><li><b>Last Name:</b> ${lastName}</li>` : ''}
        <li><b>Email:</b> ${finalEmail}</li>
        <li><b>Phone:</b> ${phone || "Not provided"}</li>
        <li><b>Service:</b> ${projectType}</li>
        <li><b>Location:</b> ${location}</li>
        ${zoneInfoHtml}
        <li><b>Timeline:</b> ${timeline || "Not specified"}</li>
        ${roomsHtml}
        <li><b>Source:</b> Contact Page Quote Enquiry</li>
      </ul>
    `;

    // Send emails
    try {
      // Customer confirmation email (To: Customer, CC: Client, BCC: lead inbox)
      const customerEmailOptions = {
        from: `"Heat.nz" <${process.env.GMAIL_USER}>`,
        to: finalEmail, // To: Customer
        subject: "✅ We've Received Your Quote Enquiry!",
        html: `
          <p>Hi ${finalName},</p>
          <p>Thanks for your quote enquiry for your ${projectType} project. We've received your project details and a tradesperson will be in touch with a detailed quote shortly.</p>
          <p><strong>Quote Reference:</strong> ${quoteId}</p>
          <p>For your records, here are the details you provided:</p>
          ${leadDetailsHtml}
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Heat.nz Team</p>
        `,
      };
      
      // Add CC to client (@heat.nz domain)
      if (resolvedClientEmail) {
        customerEmailOptions.cc = [resolvedClientEmail];
        console.log(`📧 CC added to customer email: ${resolvedClientEmail}`);
      }
      
      const customerBccList = [];
      if (resolvedTradesLeadBcc) {
        customerBccList.push(resolvedTradesLeadBcc);
        console.log(`📧 BCC added to customer email: ${resolvedTradesLeadBcc}`);
      }
      if (testEmail) {
        customerBccList.push(testEmail);
        console.log(`📧 Test email BCC added to customer email: ${testEmail} (for verification)`);
      }
      if (customerBccList.length > 0) {
        customerEmailOptions.bcc = customerBccList;
      }
      
      await transporter.sendMail(customerEmailOptions);

      // Tradesman notification email (To: lead inbox, CC: Client, BCC: test only if set)
      const tradespersonEmailOptions = {
        from: `"Heat.nz Leads" <${process.env.GMAIL_USER}>`,
        to: tradesLeadEmail,
        replyTo: finalEmail, // Reply-To customer email
        subject: `🏠 New Quote Enquiry (${roomCount} Rooms): ${location}`,
        html: `
          <h1>New Quote Enquiry Received (#${leadId})</h1>
          ${leadDetailsHtml}
          <h2>Additional Project Notes</h2>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff; margin: 15px 0;">
            <p>${message}</p>
          </div>
          <p><strong>Quote Submission Link:</strong> <a href="${quoteLink}">Submit Your Quote Now</a></p>
          <p><strong>Manual Quote Link:</strong> <a href="${baseUrl}/contact?access=tradesman">Access Manual Quote Form</a></p>
          <p>This is a large project with ${roomCount} rooms. Please prepare a detailed quote for this customer.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
            <strong>💡 Tip:</strong> When replying to this email, your reply will automatically go to the customer (${finalEmail})
          </p>
        `,
      };
      
      // Add CC to client (@heat.nz domain)
      if (resolvedClientEmail) {
        tradespersonEmailOptions.cc = [resolvedClientEmail];
        console.log(`📧 CC added to tradesperson email: ${resolvedClientEmail}`);
      }
      
      const tradespersonBccList = [];
      if (resolvedTradesLeadBcc) {
        tradespersonBccList.push(resolvedTradesLeadBcc);
        console.log(`📧 Lead BCC added to tradesperson email: ${resolvedTradesLeadBcc}`);
      }
      if (testEmail) {
        tradespersonBccList.push(testEmail);
        console.log(`📧 Test email BCC added to tradesperson email: ${testEmail} (for verification)`);
      }
      if (tradespersonBccList.length > 0) {
        tradespersonEmailOptions.bcc = tradespersonBccList;
      }
      
      if (tradesLeadEmail) {
        await transporter.sendMail(tradespersonEmailOptions);
      } else {
        console.error(`❌ Skipping tradesperson notification for lead ${leadId}: TRADESPERSON_EMAIL and ADMIN_EMAIL are unset`);
      }

      console.log('✅ Quote enquiry emails sent successfully');
    } catch (emailError) {
      console.error('❌ Error sending quote enquiry emails:', emailError);
      // Don't fail the request if emails fail
    }

    return res.status(200).json({
      success: true,
      message: "Quote enquiry submitted successfully! We'll get back to you soon.",
      leadId,
      quoteId
    });

  } catch (error) {
    console.error('❌ Quote enquiry error:', error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit quote enquiry. Please try again later."
    });
  }
}
