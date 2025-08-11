import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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

        // Check if Gmail credentials are configured
        const gmailUser = process.env.GMAIL_USER || 'danbricks18@gmail.com';
        const gmailPass = process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom';

        if (!gmailUser || !gmailPass) {
            console.error('❌ Gmail credentials not configured');
            return res.status(500).json({ 
                error: 'Email service not configured. Please contact support.' 
            });
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailPass
            }
        });

        // Email content
        const emailSubject = `Contact Form: ${subject} - From ${name}`;
        const emailBody = `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                ${message.replace(/\n/g, '<br>')}
            </div>
            <hr>
            <p><em>This message was sent from the Kiwi Underfloor Heating contact form.</em></p>
        `;

        // Send email to admin
        const adminEmail = gmailUser;
        const mailOptions = {
            from: process.env.MAIL_FROM || `Kiwi Underfloor Heating <${gmailUser}>`,
            to: adminEmail,
            replyTo: email, // Set reply-to as the customer's email
            subject: emailSubject,
            html: emailBody
        };

        console.log('📧 Sending contact form email to admin:', adminEmail);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Contact form email sent successfully:', info.messageId);

        // Send confirmation email to customer
        const customerConfirmation = {
            from: process.env.MAIL_FROM || `Kiwi Underfloor Heating <${gmailUser}>`,
            to: email,
            subject: 'Thank you for contacting Kiwi Underfloor Heating',
            html: `
                <h2>Thank you for your message!</h2>
                <p>Hi ${name},</p>
                <p>We've received your message and will get back to you within 24 hours.</p>
                <p><strong>Your message:</strong></p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <p>If you have any urgent questions, you can also reach us at:</p>
                <ul>
                    <li>Phone: +64 9 123 4567</li>
                    <li>Email: support@kiwiunderfloor.com</li>
                </ul>
                <p>Best regards,<br>The Kiwi Underfloor Heating Team</p>
            `
        };

        await transporter.sendMail(customerConfirmation);
        console.log('✅ Confirmation email sent to customer:', email);

        res.status(200).json({ 
            success: true, 
            message: 'Your message has been sent successfully. We\'ll get back to you within 24 hours.' 
        });

    } catch (error) {
        console.error('❌ Error sending contact form email:', error);
        res.status(500).json({ 
            error: 'Failed to send message. Please try again or contact us directly.' 
        });
    }
} 