import { sendLeadNotification } from '../src/server/emails/lead-notification.js';

export default async (req, res) => {
    try {
        const leadData = req.body;
        console.log('📝 Lead intake request received:', leadData);

        // Validate required fields
        if (!leadData.customerName || !leadData.customerEmail || !leadData.customerPhone) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Missing required fields: name, email, phone' 
            });
        }

        // Send lead notification
        const result = await sendLeadNotification(leadData);
        
        if (result.success) {
            console.log('✅ Lead saved successfully');
            res.json({ 
                ok: true, 
                leadId: Date.now().toString(), // Simple ID generation
                quoteLink: `/quote/${Date.now().toString()}` // Simple quote link
            });
        } else {
            console.error('❌ Lead save failed:', result.error);
            res.status(500).json({ 
                ok: false, 
                error: result.error || 'Failed to save lead' 
            });
        }
    } catch (error) {
        console.error('❌ Lead intake error:', error);
        res.status(500).json({ 
            ok: false, 
            error: 'Internal server error' 
        });
    }
};
