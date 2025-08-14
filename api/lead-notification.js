const { sendLeadNotification } = require('../../src/server/emails/lead-notification');

module.exports = async (req, res) => {
    try {
        const result = await sendLeadNotification(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in lead-notification API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
