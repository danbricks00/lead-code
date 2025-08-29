export default async function handler(req, res) {
    console.log('🧪 Test deployment API - Request received');
    
    res.json({
        success: true,
        message: 'Deployment test successful!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
}
