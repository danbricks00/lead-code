import { sendToSheets } from '../src/server/integrations/google/send-to-sheets-helper.js';

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

        // Process lead data to match expected format
        const processedLeadData = {
            customerName: leadData.customerName,
            customerEmail: leadData.customerEmail,
            customerPhone: leadData.customerPhone,
            selectedService: leadData.selectedService || 'underfloor_heating',
            projectDetails: leadData.projectDetails || `Areas: ${leadData.areasCount || '1'}; Sizes: ${leadData.areaSizes || '12'}`,
            projectSize: leadData.projectSize || leadData.areaSizes || '12',
            location: leadData.location || 'Not specified',
            budget: leadData.budget || 'Not specified',
            timeline: leadData.timeline || 'Not specified',
            specificDetails: leadData.specificDetails || ''
        };

        console.log('📝 Processed lead data:', processedLeadData);

        // Send to Google Sheets and handle notifications
        const result = await sendToSheets(processedLeadData);
        
        if (result.success) {
            console.log('✅ Lead processed successfully:', result.details);
            res.json({ 
                ok: true, 
                leadId: result.details.leadId,
                quoteLink: `/quote/${result.details.leadId}`,
                message: 'Lead submitted successfully. A qualified tradesman will contact you within 24 hours.'
            });
        } else {
            console.error('❌ Lead processing failed:', result.error);
            res.status(500).json({ 
                ok: false, 
                error: result.error || 'Failed to process lead' 
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
