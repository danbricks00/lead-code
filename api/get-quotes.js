import { getQuotes } from '../../src/server/lib/get-quotes.js';

export default async (req, res) => {
    try {
        const quotes = await getQuotes();
        res.json({ success: true, quotes });
    } catch (error) {
        console.error('Error in get-quotes API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
