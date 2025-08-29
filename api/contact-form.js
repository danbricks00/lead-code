import { google } from 'googleapis';

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

        // Send notification emails
        let customerEmailSent = false;
        let adminEmailSent = false;

        try {
            // Use dynamic import for nodemailer
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.default.createTransporter({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                    pass: process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Send customer confirmation email
            const customerMailOptions = {
                from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                to: email,
                subject: 'Thank you for contacting Kiwi Trade',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Thank you for contacting Kiwi Trade!</h2>
                        <p>Hi ${name},</p>
                        <p>We've received your message and will get back to you within 24 hours.</p>
                        <p><strong>Your message details:</strong></p>
                        <ul>
                            <li><strong>Subject:</strong> ${subject}</li>
                            <li><strong>Message:</strong> ${message}</li>
                        </ul>
                        <p>If you have any urgent questions, please don't hesitate to call us at +64 9 123 4567.</p>
                        <p>Best regards,<br>The Kiwi Trade Team</p>
                    </div>
                `
            };

            await transporter.sendMail(customerMailOptions);
            console.log('✅ Customer confirmation email sent successfully');
            customerEmailSent = true;
        } catch (emailError) {
            console.error('❌ Customer email error:', emailError.message);
        }

        try {
            // Use dynamic import for nodemailer
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.default.createTransporter({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                    pass: process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Send admin notification email
            const adminMailOptions = {
                from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                to: process.env.ADMIN_EMAIL || 'danbricks18@gmail.com',
                subject: `New Contact Form Submission: ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">New Contact Form Submission</h2>
                        <p><strong>From:</strong> ${name} (${email})</p>
                        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <p><em>This message was sent from the Kiwi Trade contact form.</em></p>
                    </div>
                `
            };

            await transporter.sendMail(adminMailOptions);
            console.log('✅ Admin notification email sent successfully');
            adminEmailSent = true;
        } catch (emailError) {
            console.error('❌ Admin email error:', emailError.message);
        }

        return res.status(200).json({ 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            customerEmailSent,
            adminEmailSent
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        
        return res.status(200).json({ 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            note: 'Your message has been received. We may contact you via phone if email delivery fails.'
        });
    }
}

async function getGmailService() {
    try {
        console.log('🔐 Initializing Gmail API with service account...');
        
        // Check if we have the required environment variables
        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error('Missing Gmail API credentials in environment variables');
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
        });

        const gmail = google.gmail({ version: 'v1', auth });
        console.log('✅ Gmail API service initialized successfully');
        return gmail;
    } catch (error) {
        console.error('❌ Failed to initialize Gmail API:', error.message);
        throw error;
    }
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
        `