import getLeadsHandler from '../../src/server/lib/get-leads.js';

export default async (req, res) => {
    try {
        // Call the handler function directly with req and res
        await getLeadsHandler(req, res);
    } catch (error) {
        console.error('Error in get-leads API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
