export default async function handler(req, res) {
    console.log('🧪 Test API routing - Request received');
    console.log('📊 Method:', req.method);
    console.log('📊 URL:', req.url);
    console.log('📊 Headers:', req.headers);
    
    res.json({
        success: true,
        message: 'API routing is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
}
