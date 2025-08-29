export default async (req, res) => {
    try {
        console.log('🧪 Simple test API working...');
        
        res.json({
            success: true,
            message: 'Simple API is working!',
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url
        });
        
    } catch (error) {
        console.error('❌ Error in simple test:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
