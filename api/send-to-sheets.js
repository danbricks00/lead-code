import { sendToSheets } from '../../src/server/integrations/google/send-to-sheets-helper.js';

export default async (req, res) => {
    try {
        const result = await sendToSheets(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in send-to-sheets API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
