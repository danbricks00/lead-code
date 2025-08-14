const { sendToSheets } = require('../../src/server/integrations/google/send-to-sheets-helper');

module.exports = async (req, res) => {
    try {
        const result = await sendToSheets(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in send-to-sheets API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
