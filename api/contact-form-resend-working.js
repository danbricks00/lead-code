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

        // Use the same working email system as the chatbot
        let customerEmailSent = false;
        let adminEmailSent = false;

        try {
            // Use dynamic import for nodemailer
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.default.createTransport({
                service: 'gmail',
                auth: {
                    user: 'danbricks18@gmail.com',
                    pass: 'ptmcojqgthvjbqom'
                }
            });

            // Send customer confirmation email
            const customerMailOptions = {
                from: 'Kiwi Trade <danbricks18@gmail.com>',
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
            const transporter = nodemailer.default.createTransport({
                service: 'gmail',
                auth: {
                    user: 'danbricks18@gmail.com',
                    pass: 'ptmcojqgthvjbqom'
                }
            });

            // Send admin notification email
            const adminMailOptions = {
                from: 'Kiwi Trade <danbricks18@gmail.com>',
                to: 'danbricks18@gmail.com',
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
