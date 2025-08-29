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

        // For now, just return success - email functionality can be added later
        return res.status(200).json({ 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
        });

    } catch (error) {
        console.error('❌ Contact form error:', error);
        return res.status(500).json({ 
            error: 'Internal server error. Please try again.' 
        });
    }
}