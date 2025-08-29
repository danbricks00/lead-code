export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 Zone data API called');

        // Return sample zone data for now
        const sampleZoneData = {
            success: true,
            data: {
                areas: ['Central Auckland', 'North Shore', 'West Auckland', 'South Auckland'],
                groupedData: {
                    'Central Auckland': ['Parnell', 'Remuera', 'Epsom', 'Mount Eden', 'Grey Lynn'],
                    'North Shore': ['Takapuna', 'Devonport', 'Milford', 'Browns Bay', 'Albany'],
                    'West Auckland': ['Henderson', 'Glen Eden', 'New Lynn', 'Te Atatu', 'Massey'],
                    'South Auckland': ['Manukau', 'Papatoetoe', 'Otahuhu', 'Mangere', 'Papakura']
                }
            }
        };

        res.json(sampleZoneData);

    } catch (error) {
        console.error('❌ Zone data API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
