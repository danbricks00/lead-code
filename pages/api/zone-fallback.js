// pages/api/zone-fallback.js - Zone fallback API for debugging
export default async function handler(req, res) {
  console.log("✅ Loaded API zone-fallback.js");
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} Not Allowed. Use GET method.` 
    });
  }

  try {
    console.log("📄 Returning zone fallback JSON for debugging...");

    const zoneFallback = await import('../../../data/zones.json');
    const zones = zoneFallback.default || zoneFallback;
    
    console.log(`✅ Returning ${zones.length} zones from fallback JSON`);
    return res.status(200).json({
      success: true,
      fallback: true,
      rows: zones,
      source: 'fallback-json',
      count: zones.length
    });

  } catch (error) {
    console.error('❌ Zone fallback API error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to load zone fallback data',
      message: error.message
    });
  }
}
