// Test file for Step 1 Email Flow
// This demonstrates how to use the sendStep1Emails function

import { sendStep1Emails } from './api/gmail-api-helper.js';

// Example dummy lead object to test Step 1 email flow
const dummyLead = {
  customerName: "John Doe",
  customerEmail: "john.doe@example.com",
  customerPhone: "0271234567",
  serviceType: "underfloor_heating",
  projectDetails: "Areas: 1; Sizes: 12",
  projectSize: 12,
  location: "39 Buckley Road, Epsom",
  quoteLink: "https://example.com/submit-quote",
  budget: "$5,000 - $10,000",
  timeline: "Within 2 months"
};

// Test function to demonstrate Step 1 email flow
async function testStep1EmailFlow() {
  console.log('🧪 Testing Step 1 Email Flow...');
  console.log('📋 Dummy Lead Data:', JSON.stringify(dummyLead, null, 2));
  
  try {
    // Call the Step 1 email function
    const result = await sendStep1Emails(dummyLead);
    
    console.log('📊 Test Results:');
    console.log('✅ Success:', result.success);
    console.log('📧 Email Success Rate:', result.emailSuccessRate);
    console.log('📧 Email Results:', JSON.stringify(result.emailResults, null, 2));
    
    if (result.success) {
      console.log('🎉 Step 1 Email Flow completed successfully!');
      console.log('📧 All emails sent to:');
      console.log('   - Customer:', dummyLead.customerEmail);
      console.log('   - Tradesman: quangbui0600@gmail.com');
      console.log('   - Admin: danbricks18@gmail.com');
    } else {
      console.log('⚠️ Step 1 Email Flow partially failed');
      console.log('📧 Check individual email results for details');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Error details:', error);
  }
}

// Example usage in an API endpoint
async function exampleApiUsage(req, res) {
  try {
    const leadData = req.body;
    
    // Generate quote link with lead ID
    const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const currentUrl = process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'https://lead-code.vercel.app';
    
    const quoteLink = `${currentUrl}/api/quote-submission?leadId=${leadId}&customerName=${encodeURIComponent(leadData.customerName)}&customerEmail=${encodeURIComponent(leadData.customerEmail)}&customerPhone=${encodeURIComponent(leadData.customerPhone)}&serviceType=${encodeURIComponent(leadData.serviceType)}&projectDetails=${encodeURIComponent(leadData.projectDetails)}&projectSize=${encodeURIComponent(leadData.projectSize)}&budget=${encodeURIComponent(leadData.budget)}&timeline=${encodeURIComponent(leadData.timeline)}&location=${encodeURIComponent(leadData.location)}`;
    
    // Add quote link to lead data
    const leadWithQuoteLink = {
      ...leadData,
      quoteLink
    };
    
    // Send Step 1 emails
    const emailResult = await sendStep1Emails(leadWithQuoteLink);
    
    // Return response
    return res.json({
      success: emailResult.success,
      message: emailResult.success ? 
        'Lead submitted successfully! Emails sent to all parties.' : 
        'Lead submitted successfully! Some email notifications may be delayed.',
      data: {
        leadId,
        customerName: leadData.customerName,
        serviceType: leadData.serviceType,
        location: leadData.location
      },
      emailStatus: {
        successRate: emailResult.emailSuccessRate,
        results: emailResult.emailResults
      }
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process lead submission',
      details: error.message
    });
  }
}

// Export for use in other files
export {
  testStep1EmailFlow,
  exampleApiUsage,
  dummyLead
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStep1EmailFlow();
}
