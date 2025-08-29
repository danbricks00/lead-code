export default async (req, res) => {
    res.json({
        success: true,
        message: 'API deployment is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        headers: req.headers
    });
};
