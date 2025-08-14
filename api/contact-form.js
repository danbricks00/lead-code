import { sendContactForm } from '../../src/server/emails/contact-form.js';

export default async (req, res) => {
    try {
        const result = await sendContactForm(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error in contact-form API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
