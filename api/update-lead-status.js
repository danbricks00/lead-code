import { updateLeadStatus } from '../../src/server/lib/update-lead-status.js';

export default async (req, res) => {
    try {
        const result = await updateLeadStatus(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in update-lead-status API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
