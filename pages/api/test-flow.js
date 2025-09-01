// pages/api/test-flow.js - Test endpoint for leads API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    console.log("🧪 Starting comprehensive leads API flow test...");
    
    // Environment checks
    console.log("🔧 Environment variables check:", {
      GMAIL_USER: process.env.GMAIL_USER || "MISSING",
      GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
      TEAM_EMAIL: process.env.TEAM_EMAIL || "MISSING"
    });

    const testResults = {
      leadIntake: false,
      quoteSent: false,
      decisionAccepted: false,
      decisionDeclined: false
    };

    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';

    // Test Stage 1: Lead Creation
    console.log("🧪 Testing Stage 1: Lead Creation...");
    try {
      const leadData = {
        name: "Test Customer",
        customerName: "Test Customer",
        customerEmail: process.env.ADMIN_EMAIL || "test@example.com",
        customerPhone: "021-123-4567",
        serviceType: "Kitchen Renovation",
        rooms: [
          { roomName: "Kitchen", dimensions: "4m x 3m" },
          { roomName: "Dining Area", dimensions: "3m x 2.5m" }
        ],
        budget: "$15,000 - $25,000",
        timeline: "Within a month",
        area: "Auckland",
        suburb: "Parnell",
        specificDetails: "Complete kitchen renovation with new cabinets and countertops"
      };

      const leadResponse = await fetch(`${SITE_URL}/api/leads?action=create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      const leadResult = await leadResponse.json();
      console.log("📋 Lead creation result:", leadResult);
      
      if (leadResult.success) {
        testResults.leadIntake = true;
        console.log("✅ Stage 1: Lead creation successful");
      } else {
        console.log("❌ Stage 1: Lead creation failed");
      }
    } catch (error) {
      console.error("❌ Stage 1 error:", error.message);
    }

    // Test Stage 2: Quote Submission
    console.log("🧪 Testing Stage 2: Quote Submission...");
    try {
      const quoteData = {
        leadId: `TEST-LEAD-${Date.now()}`,
        customerName: "Test Customer",
        customerEmail: process.env.ADMIN_EMAIL || "test@example.com",
        serviceType: "Kitchen Renovation",
        quoteAmount: "22000",
        timeline: "Within a month",
        projectDetails: "Complete kitchen renovation including new cabinets, countertops, and appliances",
        budget: "$15,000 - $25,000",
        tradesmanName: "Test Tradesperson",
        tradesmanEmail: process.env.ADMIN_EMAIL || "test@example.com",
        tradesmanPhone: "021-987-6543",
        projectSize: "Medium",
        breakdown: "Cabinets: $12,000, Countertops: $5,000, Appliances: $3,000, Labor: $2,000",
        notes: "Test quote for kitchen renovation",
        companyName: "Test Trades Company"
      };

      const quoteResponse = await fetch(`${SITE_URL}/api/leads?action=submit-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      const quoteResult = await quoteResponse.json();
      console.log("📋 Quote submission result:", quoteResult);
      
      if (quoteResult.success) {
        testResults.quoteSent = true;
        console.log("✅ Stage 2: Quote submission successful");
      } else {
        console.log("❌ Stage 2: Quote submission failed");
      }
    } catch (error) {
      console.error("❌ Stage 2 error:", error.message);
    }

    // Test Stage 3: Quote Acceptance
    console.log("🧪 Testing Stage 3: Quote Acceptance...");
    try {
      const acceptData = {
        quoteId: `TEST-QUOTE-${Date.now()}`,
        leadId: `TEST-LEAD-${Date.now()}`,
        action: "accept",
        decisionType: "accept"
      };

      const acceptResponse = await fetch(`${SITE_URL}/api/leads?action=decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acceptData)
      });

      const acceptResult = await acceptResponse.json();
      console.log("📋 Quote acceptance result:", acceptResult);
      
      if (acceptResult.success) {
        testResults.decisionAccepted = true;
        console.log("✅ Stage 3: Quote acceptance successful");
      } else {
        console.log("❌ Stage 3: Quote acceptance failed");
      }
    } catch (error) {
      console.error("❌ Stage 3 (accept) error:", error.message);
    }

    // Test Stage 3: Quote Decline
    console.log("🧪 Testing Stage 3: Quote Decline...");
    try {
      const declineData = {
        quoteId: `TEST-QUOTE-DECLINE-${Date.now()}`,
        leadId: `TEST-LEAD-DECLINE-${Date.now()}`,
        action: "decline",
        decisionType: "decline"
      };

      const declineResponse = await fetch(`${SITE_URL}/api/leads?action=decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(declineData)
      });

      const declineResult = await declineResponse.json();
      console.log("📋 Quote decline result:", declineResult);
      
      if (declineResult.success) {
        testResults.decisionDeclined = true;
        console.log("✅ Stage 3: Quote decline successful");
      } else {
        console.log("❌ Stage 3: Quote decline failed");
      }
    } catch (error) {
      console.error("❌ Stage 3 (decline) error:", error.message);
    }

    // Summary
    console.log("🧪 Test flow completed. Results:", testResults);
    
    const successCount = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`📊 Test Summary: ${successCount}/${totalTests} stages successful`);

    return res.status(200).json({
      success: true,
      message: "Test flow completed",
      results: testResults,
      summary: `${successCount}/${totalTests} stages successful`,
      note: "All test emails sent to ADMIN_EMAIL only"
    });

  } catch (error) {
    console.error("❌ Test flow error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Test flow failed",
      message: error.message
    });
  }
}
