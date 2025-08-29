export default async (req, res) => {
    try {
        console.log('🧪 Testing googleapis import...');
        
        // Try to import googleapis
        const { google } = await import('googleapis');
        console.log('✅ googleapis imported successfully');
        
        res.json({
            success: true,
            message: 'googleapis module is working!',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error importing googleapis:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};
