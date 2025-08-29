module.exports = async (req, res) => {
    console.log('🧪 Test CJS API - Request received');
    console.log('📊 Method:', req.method);
    console.log('📊 URL:', req.url);
    
    res.json({
        success: true,
        message: 'CJS API routing is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
};
