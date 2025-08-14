const { register } = require('../../src/server/lib/register');

module.exports = async (req, res) => {
    try {
        const result = await register(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in register API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
