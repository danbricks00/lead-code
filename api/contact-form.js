import { sendEmailViaGmailAPI } from '../src/server/integrations/google/gmail-api-helper.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, email, subject, and message are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        console.log('📧 Contact form submission received:', {
            name,
            email,
            phone: phone || 'Not provided',
            subject,
            messageLength: message.length
        });

        // Prepare email data
        const contactData = {
            name,
            email,
            phone: phone || 'Not provided',
            subject,
            message,
            timestamp: new Date().toISOString()
        };

        // Send emails
        const emailResults = await sendContactEmails(contactData);

        // Check if all emails were sent successfully
        const allSuccessful = emailResults.every(result => result.success);
        
        if (allSuccessful) {
            console.log('✅ All contact form emails sent successfully');
            return res.status(200).json({ 
                success: true,
                message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
            });
        } else {
            console.error('❌ Some contact form emails failed to send:', emailResults);
            return res.status(500).json({ 
                error: 'Message received but there was an issue sending confirmation emails. We\'ll still get back to you.' 
            });
        }

    } catch (error) {
        console.error('❌ Contact form error:', error);
        return res.status(500).json({ 
            error: 'Internal server error. Please try again or contact us directly.' 
        });
    }
}

async function sendContactEmails(contactData) {
    const results = [];

    try {
        // 1. Send confirmation email to customer
        console.log('📧 Sending confirmation email to customer:', contactData.email);
        const customerEmailResult = await sendCustomerConfirmationEmail(contactData);
        results.push({
            type: 'customer_confirmation',
            email: contactData.email,
            success: customerEmailResult.success,
            error: customerEmailResult.error
        });

        // 2. Send notification email to admin
        console.log('📧 Sending notification email to admin');
        const adminEmailResult = await sendAdminNotificationEmail(contactData);
        results.push({
            type: 'admin_notification',
            email: 'danbricks18@gmail.com', // Admin email
            success: adminEmailResult.success,
            error: adminEmailResult.error
        });

    } catch (error) {
        console.error('❌ Error in sendContactEmails:', error);
        results.push({
            type: 'general_error',
            success: false,
            error: error.message
        });
    }

    return results;
}

async function sendCustomerConfirmationEmail(contactData) {
    try {
        const subject = `Thank you for contacting Kiwi Trade - ${contactData.subject}`;
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Thank You for Contacting Kiwi Trade</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Hi ${contactData.name},</p>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Thank you for reaching out to us! We've received your message and our team will get back to you within 24 hours.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #667eea; margin-top: 0;">Your Message Details:</h3>
                        <p><strong>Subject:</strong> ${contactData.subject}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">${contactData.message}</p>
                    </div>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">If you have any urgent questions, you can also reach us at:</p>
                    <ul style="color: #333; font-size: 16px; line-height: 1.6;">
                        <li>📧 Email: support@kiwiunderfloor.com</li>
                        <li>📞 Phone: +64 9 123 4567</li>
                    </ul>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Best regards,<br>The Kiwi Trade Team</p>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                    <p>This is an automated confirmation email. Please do not reply to this message.</p>
                </div>
            </div>
        `;

        const result = await sendEmailViaGmailAPI(
            contactData.email,
            subject,
            htmlContent
        );

        console.log('✅ Customer confirmation email sent successfully');
        return { success: true };

    } catch (error) {
        console.error('❌ Failed to send customer confirmation email:', error);
        return { success: false, error: error.message };
    }
}

async function sendAdminNotificationEmail(contactData) {
    try {
        const subject = `New Contact Form Submission - ${contactData.subject}`;
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">A new contact form submission has been received from the Kiwi Trade website.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #667eea; margin-top: 0;">Contact Details:</h3>
                        <p><strong>Name:</strong> ${contactData.name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${contactData.email}" style="color: #667eea;">${contactData.email}</a></p>
                        <p><strong>Phone:</strong> ${contactData.phone}</p>
                        <p><strong>Subject:</strong> ${contactData.subject}</p>
                        <p><strong>Submitted:</strong> ${new Date(contactData.timestamp).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })}</p>
                        
                        <h4 style="color: #667eea; margin-top: 20px;">Message:</h4>
                        <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; white-space: pre-wrap;">${contactData.message}</p>
                    </div>
                    
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">Please respond to this inquiry within 24 hours.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="mailto:${contactData.email}?subject=Re: ${contactData.subject}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block;">Reply to Customer</a>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                    <p>This is an automated notification from the Kiwi Trade contact form.</p>
                </div>
            </div>
        `;

        const result = await sendEmailViaGmailAPI(
            'danbricks18@gmail.com', // Admin email
            subject,
            htmlContent
        );

        console.log('✅ Admin notification email sent successfully');
        return { success: true };

    } catch (error) {
        console.error('❌ Failed to send admin notification email:', error);
        return { success: false, error: error.message };
    }
}
