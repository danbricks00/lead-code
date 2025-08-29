export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, message } = req.body;
        
        console.log('🧪 Test contact form submission:', { name, email, messageLength: message?.length });
        
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        res.json({
            success: true,
            message: 'Test contact form processed successfully!',
            timestamp: new Date().toISOString(),
            receivedData: { name, email, messageLength: message?.length }
        });
    } catch (error) {
        console.error('❌ Test contact form error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
