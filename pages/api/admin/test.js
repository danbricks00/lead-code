export default async function handler(req, res) {
    console.log('🔍 [ADMIN-TEST] Test endpoint hit!', {
        method: req.method,
        url: req.url,
        query: req.query,
        timestamp: new Date().toISOString()
    });
    
    return res.status(200).json({ 
        success: true, 
        message: 'Admin test endpoint working',
        timestamp: new Date().toISOString(),
        method: req.method,
        query: req.query
    });
}
