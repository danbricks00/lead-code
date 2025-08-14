import { getLeads } from '../../src/server/lib/get-leads.js';

export default async (req, res) => {
    try {
        const leads = await getLeads();
        res.json({ success: true, leads });
    } catch (error) {
        console.error('Error in get-leads API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
