import { suspendTradesman } from '../../../../src/server/lib/suspend-tradesman.js';

export default async (req, res) => {
    try {
        const { googleId } = req.query;
        const result = await suspendTradesman(googleId);
        res.json(result);
    } catch (error) {
        console.error('Error in admin/suspend API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
