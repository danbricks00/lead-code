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

        console.log('📧 Contact form submission received (Resend):', {
            name,
            email,
            phone: phone || 'Not provided',
            subject,
            messageLength: message.length
        });

        // Check if Resend API key is available
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.log('⚠️ RESEND_API_KEY not found in environment variables');
            console.log('📝 Contact form data logged successfully');
            console.log('📧 Customer would receive confirmation email');
            console.log('📧 Admin would receive notification email');
            console.log('📧 From email would be: "Kiwi Trade <onboarding@resend.dev>"');
            
            return res.status(200).json({ 
                success: true,
                message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
                note: 'Email sending requires Resend API key setup. Your message has been received and logged.'
            });
        }

        // Import Resend dynamically
        const { Resend } = await import('resend');
        const resend = new Resend(resendApiKey);

        // Use environment variable for from email or fallback to Resend's default domain
        // To use your own domain: Set RESEND_FROM_EMAIL="Kiwi Trade <hello@yourdomain.com>"
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Kiwi Trade <onboarding@resend.dev>';

        // Send customer confirmation email
        const customerEmailResult = await resend.emails.send({
            from: fromEmail,
            to: [email],
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
        });

        // Send admin notification email
        const adminEmailResult = await resend.emails.send({
            from: fromEmail,
            to: ['danbricks18@gmail.com'],
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
        });

        console.log('✅ Customer email sent:', customerEmailResult);
        console.log('✅ Admin email sent:', adminEmailResult);

        return res.status(200).json({ 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
        });

    } catch (error) {
        console.error('❌ Contact form Resend error:', error);
        
        // Log the error but still return success to user
        console.log('📝 Contact form data logged despite email error');
        console.log('📧 From email would be: "Kiwi Trade <onboarding@resend.dev>"');
        
        return res.status(200).json({ 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            note: 'Your message has been received. We may contact you via phone if email delivery fails.'
        });
    }
}
