export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🧪 Testing Google APIs...');
        
        // Test if googleapis can be imported
        const { google } = await import('googleapis');
        console.log('✅ Google APIs imported successfully');
        
        res.json({
            success: true,
            message: 'Google APIs test successful!',
            timestamp: new Date().toISOString(),
            googleapisVersion: google.version || 'unknown'
        });
    } catch (error) {
        console.error('❌ Google APIs test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
