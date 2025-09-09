export default async function handler(req, res) {
    console.log('🔍 [ADMIN-TEST] Test endpoint hit!', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: req.headers,
        timestamp: new Date().toISOString()
    });
    
    // Also log to Vercel function logs
    console.log('VERCEL LOG: Admin test endpoint accessed');
    
    return res.status(200).json({ 
        success: true, 
        message: 'Admin test endpoint working',
        timestamp: new Date().toISOString(),
        method: req.method,
        query: req.query,
        url: req.url
    });
}
