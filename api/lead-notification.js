export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Import required modules
        const nodemailer = await import('nodemailer');
        
        const { leadData } = req.body;
        
        // Create transporter
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

        // Send notification email
        const mailOptions = {
            from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
            to: process.env.ADMIN_EMAIL || 'danbricks18@gmail.com',
            subject: `New Lead: ${leadData?.customerName || 'Unknown'} - ${leadData?.selectedService || 'Service'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">🎯 New Lead Received!</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">📋 Lead Details:</h3>
                        <p><strong>Customer:</strong> ${leadData?.customerName || 'Not provided'}</p>
                        <p><strong>Email:</strong> ${leadData?.customerEmail || 'Not provided'}</p>
                        <p><strong>Phone:</strong> ${leadData?.customerPhone || 'Not provided'}</p>
                        <p><strong>Service:</strong> ${leadData?.selectedService || 'Not specified'}</p>
                        <p><strong>Location:</strong> ${leadData?.location || 'Not specified'}</p>
                    </div>
                    <p>Please assign this lead to an appropriate tradesman.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ success: true, message: 'Lead notification sent successfully' });
    } catch (error) {
        console.error('Error in lead-notification API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
