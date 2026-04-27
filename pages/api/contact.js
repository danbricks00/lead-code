// pages/api/contact.js - Contact Form API
import { sendEmail } from '../../lib/emailHelper';
import { validateAndCorrectEmail, logEmailValidation } from '../../utils/emailValidator';
import { calculateSpamScore } from '../../utils/spamValidator';
import { checkSubmissionRateLimit } from '../../utils/rateLimiter';

export default async function handler(req, res) {
    const { ADMIN_EMAIL, GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

    if (req.method === 'POST') {
        const { 
            firstName,
            lastName,
            name, // Fallback for backward compatibility
            email, 
            message, 
            formType = 'general',
            phone,
            projectType,
            roomCount,
            timeline,
            budget,
            location,
            website, // Honeypot field
            timeOnPage // Form submission timing
        } = req.body;

        // Rate limiting check (before processing)
        const rateLimitCheck = checkSubmissionRateLimit(req, email, 5, 3);
        if (!rateLimitCheck.allowed) {
            console.log(`🚫 Rate limit exceeded (${rateLimitCheck.type}):`, {
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
            console.log(`🚫 Spam submission blocked (score: ${spamCheck.score}/${spamCheck.threshold}):`, {
                issues: spamCheck.issues,
                email: email ? email.substring(0, 10) + '...' : 'no email',
                name: spamCheck.nameData.originalName.substring(0, 20) + '...'
            });
            return res.status(200).json({
                success: true,
                message: "Thank you for your message. We'll get back to you soon!"
            });
        }

        // Use validated name data (split from full name if needed)
        const finalName = (firstName && lastName) 
            ? `${firstName} ${lastName}` 
            : (name || spamCheck.nameData.originalName);

        // Basic validation (after spam check)
        if (!finalName || !email || !message) {
            console.log("❌ Contact form validation failed - missing required fields");
            return res.status(400).json({
                success: false,
                error: "Missing required fields: name, email, message"
            });
        }

        // Smart email validation with autocorrect and MX checking
        const emailValidation = await validateAndCorrectEmail(email, true);
        logEmailValidation('EMAIL_VALIDATION', emailValidation, 'contact-form');
        
        if (!emailValidation.isValid) {
            if (emailValidation.isDisposable) {
                console.log(`🚫 Contact form blocked disposable email: ${email}`);
            } else {
                console.log("❌ Contact form validation failed - invalid email format");
            }
            return res.status(400).json({
                success: false,
                error: emailValidation.error
            });
        }
        
        // Use corrected email if available
        const finalEmail = emailValidation.correctedEmail || email;
        
        // Log if email was corrected
        if (emailValidation.needsCorrection) {
            console.log(`📧 Email autocorrected: ${email} → ${finalEmail}`);
        }

        const autofillDetected = req.body.autofillDetected || false;
        
        console.log("📧 Contact form submission received:", { 
            name: finalName, 
            email: finalEmail,
            spamScore: spamCheck.score,
            phone: phone || 'not provided',
            autofillDetected: autofillDetected
        });
        
        if (autofillDetected) {
            console.log("📝 Autofill was used to fill the form");
        }

        // Environment checks (direct env evaluation)
        const resolvedClientEmail = (process.env.TRADESPERSON_EMAIL || process.env.ADMIN_EMAIL || '').trim();
        const resolvedTradesLeadBcc = (process.env.TRADES_LEAD_BCC || process.env.ADMIN_EMAIL || '').trim();
        const resolvedAdminEmail = (process.env.ADMIN_EMAIL || '').trim();
        const testEmail = process.env.TEST_EMAIL || process.env.DEBUG_EMAIL; // Optional test email for verification
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD; // Use GMAIL_APP_PASSWORD for consistency
        
        console.log("🔧 Environment variables check:", {
            GMAIL_USER: gmailUser ? "SET" : "MISSING",
            GMAIL_APP_PASSWORD: gmailPass ? "SET" : "MISSING",
            CLIENT_EMAIL: resolvedClientEmail ? "SET" : "MISSING",
            TRADESPERSON_EMAIL: process.env.TRADESPERSON_EMAIL ? "SET" : "MISSING",
            TRADES_LEAD_BCC: resolvedTradesLeadBcc ? "SET" : "MISSING",
            ADMIN_EMAIL: resolvedAdminEmail ? "SET" : "MISSING",
            TEST_EMAIL: testEmail ? "SET" : "MISSING"
        });
        
        // Warn if Gmail credentials might be invalid
        if (gmailUser && gmailPass) {
            // Check if password looks like an app password (16 characters, no spaces)
            const passwordLength = gmailPass.length;
            const hasSpaces = gmailPass.includes(' ');
            const trimmedLength = gmailPass.trim().length;
            
            if (passwordLength !== 16 || hasSpaces) {
                console.error("❌ GMAIL_APP_PASSWORD format is INCORRECT:");
                console.error(`   - Current length: ${passwordLength} characters (should be 16)`);
                console.error(`   - Trimmed length: ${trimmedLength} characters`);
                console.error(`   - Contains spaces: ${hasSpaces}`);
                console.error("   - Action required: Generate a new App Password from https://myaccount.google.com/apppasswords");
                console.error("   - Make sure to copy all 16 characters with NO spaces");
                console.error("   - Update GMAIL_APP_PASSWORD in Vercel environment variables");
                console.error("   - Redeploy the application after updating");
            } else {
                console.log("✅ GMAIL_APP_PASSWORD format looks correct (16 characters, no spaces)");
            }
        } else {
            console.warn("⚠️ Gmail credentials not configured - emails will fail");
        }

        // Note: Email sending will proceed - CC/BCC fallback uses TRADESPERSON_EMAIL -> ADMIN_EMAIL

        // Create email content based on form type
        let subject, html;
        
        if (formType === 'quote') {
            subject = `🏠 New Quote Enquiry (20+ Rooms) - ${finalName}`;
            html = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; margin: 20px 0;">🏠 New Quote Enquiry (20+ Rooms)</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <h3 style="color: #667eea; margin-top: 0;">Customer Information</h3>
                        <p><strong>Name:</strong> ${finalName}</p>
                        ${firstName && lastName ? `<p><strong>First Name:</strong> ${firstName}</p><p><strong>Last Name:</strong> ${lastName}</p>` : ''}
                        <p><strong>Email:</strong> ${finalEmail}</p>
                        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                        
                        <h3 style="color: #667eea;">Project Details</h3>
                        <p><strong>Project Type:</strong> ${projectType}</p>
                        <p><strong>Number of Rooms:</strong> ${roomCount}</p>
                        <p><strong>Location:</strong> ${location}</p>
                        ${timeline ? `<p><strong>Timeline:</strong> ${timeline}</p>` : ''}
                        ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
                        
                        <h3 style="color: #667eea;">Additional Details</h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            <strong>Submitted:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}
                        </p>
                    </div>
                </div>
            `;
        } else if (formType === 'manual-quote') {
            subject = `📋 Manual Quote Submission - ${finalName}`;
            html = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; margin: 20px 0;">📋 Manual Quote Submission</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <h3 style="color: #667eea; margin-top: 0;">Tradesman/Admin Information</h3>
                        <p><strong>Name:</strong> ${finalName}</p>
                        ${firstName && lastName ? `<p><strong>First Name:</strong> ${firstName}</p><p><strong>Last Name:</strong> ${lastName}</p>` : ''}
                        <p><strong>Email:</strong> ${finalEmail}</p>
                        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                        
                        <h3 style="color: #667eea;">Project Details</h3>
                        <p><strong>Project Type:</strong> ${projectType}</p>
                        <p><strong>Number of Rooms:</strong> ${roomCount}</p>
                        <p><strong>Location:</strong> ${location}</p>
                        ${timeline ? `<p><strong>Timeline:</strong> ${timeline}</p>` : ''}
                        ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
                        
                        <h3 style="color: #667eea;">Quote Details & Customer Information</h3>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        
                        <p style="color: #666; font-size: 12px; margin-top: 20px;">
                            <strong>Submitted:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}
                        </p>
                    </div>
                </div>
            `;
        } else {
            // General enquiry
            subject = `📧 New Contact Form Submission - ${finalName}`;
            html = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; margin: 20px 0;">New Contact Form Submission</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <p><strong>Name:</strong> ${finalName}</p>
                        ${firstName && lastName ? `<p><strong>First Name:</strong> ${firstName}</p><p><strong>Last Name:</strong> ${lastName}</p>` : ''}
                        <p><strong>Email:</strong> ${finalEmail}</p>
                        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                        <p><strong>Message:</strong></p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</p>
                    </div>
                </div>
            `;
        }

        console.log("📧 Built contact form email template");

        // Email flow: To = Customer, CC = Client (@heat.nz), BCC = tradesperson lead inbox
        try {
            console.log(`📤 Sending contact form email:`);
            console.log(`   To: ${finalEmail} (customer)`);
            console.log(`   CC: ${resolvedClientEmail || 'NOT SET'}`);
            console.log(`   BCC: ${resolvedTradesLeadBcc || 'NOT SET'}`);
            
            const emailOptions = {
                to: finalEmail, // To: Customer
                subject: subject,
                html: html,
                replyTo: finalEmail // Reply-To customer email
            };
            
            // Add CC to client (@heat.nz domain)
            if (resolvedClientEmail) {
                emailOptions.cc = [resolvedClientEmail];
                console.log(`📧 CC added: ${resolvedClientEmail}`);
            } else {
                console.warn("⚠️ TRADESPERSON_EMAIL and ADMIN_EMAIL not configured - CC recipient missing");
            }
            
            const bccList = [];
            if (resolvedTradesLeadBcc) {
                bccList.push(resolvedTradesLeadBcc);
                console.log(`📧 BCC added (lead inbox): ${resolvedTradesLeadBcc}`);
            } else {
                console.warn("⚠️ TRADESPERSON_EMAIL and ADMIN_EMAIL not configured - no BCC lead copy");
            }
            
            // Add optional test email for verification (if configured)
            if (testEmail) {
                bccList.push(testEmail);
                console.log(`📧 Test email BCC added: ${testEmail} (for verification)`);
            }
            
            if (bccList.length > 0) {
                emailOptions.bcc = bccList;
            }
            
            const emailResult = await sendEmail(emailOptions);
            
            if (emailResult.success) {
                console.log(`✅ Contact form email sent successfully, msgId: ${emailResult.messageId}`);
                return res.status(200).json({
                    success: true,
                    message: "Thank you for your message. We'll get back to you soon!"
                });
            } else {
                console.error(`❌ Contact form email failed: ${emailResult.error}`);
                // Still return success to user (don't block legitimate submissions due to email issues)
                return res.status(200).json({
                    success: true,
                    message: "Thank you for your message. We'll get back to you soon!"
                });
            }
        } catch (error) {
            // Log error but don't block legitimate submissions
            console.error(`❌ Contact form processing error:`, {
                error: error.message,
                stack: error.stack,
                submissionData: {
                    name: finalName,
                    email: finalEmail,
                    phone: phone || 'not provided'
                },
                timestamp: new Date().toISOString()
            });
            
            // Still return success to user (email service issues shouldn't block submissions)
            return res.status(200).json({
                success: true,
                message: "Thank you for your message. We'll get back to you soon!"
            });
        }

    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
