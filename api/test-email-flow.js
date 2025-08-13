// Test endpoint to verify email flow without sending actual emails
import { sendStep1Emails } from './gmail-api-helper.js';

export default async function handler(req, res) {
  console.log('🧪 Test email flow API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const leadData = req.body;
      console.log('🧪 Test lead data received:', JSON.stringify(leadData, null, 2));

      // Generate unique lead ID
      const leadId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get current URL for quote links
      const currentUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'https://lead-code.vercel.app';

      // Create quote submission link with pre-filled data
      const quoteLink = `${currentUrl}/api/quote-submission?leadId=${leadId}&customerName=${encodeURIComponent(leadData.customerName)}&customerEmail=${encodeURIComponent(leadData.customerEmail)}&customerPhone=${encodeURIComponent(leadData.customerPhone)}&serviceType=${encodeURIComponent(leadData.selectedService)}&projectDetails=${encodeURIComponent(leadData.projectDetails)}&projectSize=${encodeURIComponent(leadData.projectSize)}&budget=${encodeURIComponent(leadData.budget)}&timeline=${encodeURIComponent(leadData.timeline)}&location=${encodeURIComponent(leadData.location)}`;

      // Prepare lead data for Step 1 email flow
      const step1LeadData = {
        customerName: leadData.customerName,
        customerEmail: leadData.customerEmail,
        customerPhone: leadData.customerPhone,
        serviceType: leadData.selectedService,
        projectDetails: leadData.projectDetails,
        projectSize: leadData.projectSize,
        budget: leadData.budget,
        timeline: leadData.timeline,
        location: leadData.location,
        quoteLink: quoteLink
      };

      console.log('🧪 Preparing Step 1 email flow with data:', JSON.stringify(step1LeadData, null, 2));

      // Test the email flow (this will log everything but not send actual emails)
      const emailResult = await sendStep1Emails(step1LeadData);

      // Return test results
      const response = {
        success: true,
        message: 'Email flow test completed successfully!',
        testData: {
          leadId,
          customerName: leadData.customerName,
          serviceType: leadData.selectedService,
          location: leadData.location,
          quoteLink: quoteLink
        },
        emailStatus: {
          successRate: emailResult.emailSuccessRate,
          results: emailResult.emailResults,
          leadData: emailResult.leadData
        },
        note: 'This was a test - no actual emails were sent'
      };

      console.log('🧪 Test Results:', JSON.stringify(response, null, 2));
      return res.json(response);

    } catch (error) {
      console.error('❌ Test Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to test email flow',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
