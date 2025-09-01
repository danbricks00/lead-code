// pages/api/test-intake.js - Test endpoint for lead intake
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use POST method.` 
    });
  }

  try {
    console.log("🧪 Starting lead intake test...");
    
    // Environment checks
    console.log("🔧 Environment variables check:", {
      GMAIL_USER: process.env.GMAIL_USER || "MISSING",
      GMAIL_PASS: process.env.GMAIL_PASS ? "SET" : "MISSING",
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || "MISSING",
      TEAM_EMAIL: process.env.TEAM_EMAIL || "MISSING",
      GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || "MISSING"
    });

    const testData = {
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

    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';

    console.log("📋 Test data prepared:", {
      customerName: testData.customerName,
      serviceType: testData.serviceType,
      budget: testData.budget
    });

    // Call the leads API
    const response = await fetch(`${SITE_URL}/api/leads?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log("📋 Lead intake test result:", result);

    if (result.success) {
      console.log("✅ Lead intake test successful");
      return res.status(200).json({
        success: true,
        message: "Lead intake test completed successfully",
        leadId: result.leadId,
        response: result,
        testData: {
          customerName: testData.customerName,
          serviceType: testData.serviceType,
          budget: testData.budget
        }
      });
    } else {
      console.log("❌ Lead intake test failed");
      return res.status(400).json({
        success: false,
        message: "Lead intake test failed",
        error: result.error,
        response: result
      });
    }

  } catch (error) {
    console.error("❌ Lead intake test error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Lead intake test failed",
      message: error.message
    });
  }
}
