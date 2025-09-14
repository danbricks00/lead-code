// pages/api/contact.js - Contact Form API
import { sendEmail } from '../../lib/emailHelper';
import { validateAndCorrectEmail } from '../../utils/emailValidator';

export default async function handler(req, res) {
    const { ADMIN_EMAIL, GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

    if (req.method === 'POST') {
        const { 
            name, 
            email, 
            message, 
            formType = 'general',
            phone,
            projectType,
            roomCount,
            timeline,
            budget,
            location
        } = req.body;

        // Validation
        if (!name || !email || !message) {
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
            console.log("❌ Contact form validation failed - invalid email format");
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

        console.log("📧 Contact form submission received:", { name, email: finalEmail });

        // Environment checks
        const adminEmail = process.env.ADMIN_EMAIL;
        const gmailUser = process.env.GMAIL_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD; // Use GMAIL_APP_PASSWORD for consistency
        
        console.log("🔧 Environment variables check:", {
            GMAIL_USER: gmailUser ? "SET" : "MISSING",
            GMAIL_APP_PASSWORD: gmailPass ? "SET" : "MISSING", // Corrected from GMAIL_PASS
            ADMIN_EMAIL: adminEmail ? "SET" : "MISSING"
        });

        if (!adminEmail) {
            console.error("❌ ADMIN_EMAIL not configured");
            return res.status(200).json({  // Changed to 200 to not break client experience
                success: true,  // Changed to true for better UX
                message: "Your message was received. Note: Email delivery is currently disabled."
            });
        }

        // Create email content based on form type
        let subject, html;
        
        if (formType === 'quote') {
            subject = `🏠 New Quote Enquiry (20+ Rooms) - ${name}`;
            html = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; margin: 20px 0;">🏠 New Quote Enquiry (20+ Rooms)</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <h3 style="color: #667eea; margin-top: 0;">Customer Information</h3>
                        <p><strong>Name:</strong> ${name}</p>
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
            subject = `📋 Manual Quote Submission - ${name}`;
            html = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; margin: 20px 0;">📋 Manual Quote Submission</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <h3 style="color: #667eea; margin-top: 0;">Tradesman/Admin Information</h3>
                        <p><strong>Name:</strong> ${name}</p>
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
            subject = `📧 New Contact Form Submission - ${name}`;
            html = `
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333; margin: 20px 0;">New Contact Form Submission</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                        <p><strong>Name:</strong> ${name}</p>
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

        // Send email
        try {
            console.log(`📤 Sending contact form email to: ${process.env.ADMIN_EMAIL}`);
            const result = await sendEmail(process.env.ADMIN_EMAIL, subject, html);
            
            if (result.success) {
                console.log(`✅ Contact form email sent successfully, msgId: ${result.messageId}`);
                return res.status(200).json({
                    success: true,
                    message: "Thank you for your message. We'll get back to you soon!"
                });
            } else {
                console.error(`❌ Contact form email failed: ${result.error}`);
                return res.status(500).json({
                    success: false,
                    error: "Failed to send message. Please try again later."
                });
            }
        } catch (error) {
            console.error(`❌ Contact form email error: ${error.message}`);
            return res.status(500).json({
                success: false,
                error: "Failed to send message. Please try again later."
            });
        }

    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
