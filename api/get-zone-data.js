export default async function handler(req, res) {
  try {
    const { address } = req.query;
    
    // Log for debugging in Vercel logs
    console.log("Zone API called with address:", address);
    
    // Return stubbed response
    res.status(200).json({ 
      ok: true, 
      zone: "Test Zone", 
      address: address || "No address provided",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Zone API error:", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
}
