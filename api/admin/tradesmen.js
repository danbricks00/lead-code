const { getTradesmen } = require('../../../src/server/lib/get-tradesmen');

module.exports = async (req, res) => {
    try {
        const tradesmen = await getTradesmen();
        res.json({ success: true, tradesmen });
    } catch (error) {
        console.error('Error in admin/tradesmen API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
