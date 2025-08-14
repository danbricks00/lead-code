const { getQuotes } = require('../../src/server/lib/get-quotes');

module.exports = async (req, res) => {
    try {
        const quotes = await getQuotes();
        res.json({ success: true, quotes });
    } catch (error) {
        console.error('Error in get-quotes API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
