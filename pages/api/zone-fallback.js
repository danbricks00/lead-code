// pages/api/zone-fallback.js - Zone fallback API with search functionality
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
    const { search } = req.query;
    console.log("📄 Loading zone fallback JSON...");

    // Use path and fs for a reliable file path
    const path = require('path');
    const fs = require('fs').promises;
    const filePath = path.join(process.cwd(), 'data', 'zones.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const parsedData = JSON.parse(fileContents);
    
    // Handle the actual structure of zones.json which has a "suburbs" array
    const zones = parsedData.suburbs || parsedData;
    
    // Ensure all zones have the new schema fields for compatibility
    const enhancedZones = zones.map(zone => ({
      suburb: zone.suburb || '',
      altName: zone.altName || '', // Māori spelling alternative
      postCode: zone.postCode || '',
      area: zone.area || '',
      zone: zone.zone || '',
      zoneCost: zone.zoneCost || '',
      zoneKm: zone.zoneKm || ''
    }));

    // Apply search filter if provided
    let filteredZones = enhancedZones;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredZones = enhancedZones.filter(zone => {
        const suburb = (zone.suburb || '').toLowerCase();
        const altName = (zone.altName || '').toLowerCase();
        
        return suburb.startsWith(searchLower) || altName.startsWith(searchLower);
      });
      
      // Log if any alternative names were matched
      const altNameMatches = filteredZones.filter(zone => 
        zone.altName && zone.altName.toLowerCase().startsWith(searchLower)
      );
      if (altNameMatches.length > 0) {
        console.log(`🔤 Found ${altNameMatches.length} matches using alternative names (Māori spelling)`);
      }
    }
    
    console.log(`✅ Returning ${filteredZones.length} zones from fallback JSON${search ? ` (filtered by "${search}")` : ''}`);
    return res.status(200).json({
      success: true,
      fallback: true,
      rows: filteredZones,
      source: 'fallback-json',
      count: filteredZones.length,
      totalCount: enhancedZones.length,
      searchTerm: search || null
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
