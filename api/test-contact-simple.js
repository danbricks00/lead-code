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

        console.log('📧 Simple contact form submission received:', {
            name,
            email,
            phone: phone || 'Not provided',
            subject,
            messageLength: message.length
        });

        // For now, just log the data and return success
        // This will help us verify the API structure works
        console.log('✅ Contact form data received successfully');
        console.log('📧 Would send email to:', email);
        console.log('📧 Would send admin notification to: danbricks18@gmail.com');

        return res.status(200).json({ 
            success: true,
            message: 'Thank you for your message! We\'ll get back to you within 24 hours.',
            note: 'This is a test response. Email functionality will be restored shortly.',
            data: {
                name,
                email,
                phone: phone || 'Not provided',
                subject,
                messageLength: message.length
            }
        });

    } catch (error) {
        console.error('❌ Simple contact form error:', error);
        
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Failed to process contact form. Please try again.'
        });
    }
}
