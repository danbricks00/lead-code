const { approveTradesman } = require('../../../../src/server/lib/approve-tradesman');

module.exports = async (req, res) => {
    try {
        const { googleId } = req.query;
        const result = await approveTradesman(googleId);
        res.json(result);
    } catch (error) {
        console.error('Error in admin/approve API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
