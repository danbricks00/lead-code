const { sendContactForm } = require('../../src/server/emails/contact-form');

module.exports = async (req, res) => {
    try {
        const result = await sendContactForm(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in contact-form API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
