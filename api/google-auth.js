import { googleAuth } from '../../src/server/integrations/google/google-auth.js';

export default async (req, res) => {
    try {
        const result = await googleAuth(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in google-auth API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
