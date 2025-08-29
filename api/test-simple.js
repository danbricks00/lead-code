export default async function handler(req, res) {
    console.log('🧪 Test simple API - Request received');
    console.log('📊 Method:', req.method);
    console.log('📊 URL:', req.url);
    
    res.json({
        success: true,
        message: 'Simple test API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
}
