import { getAllTradesmen } from './database.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Debug: Checking registered tradesmen...');
    
    const allTradesmen = await getAllTradesmen();
    console.log('📋 All tradesmen found:', allTradesmen.length);
    
    // Group by service type
    const tradesmenByService = {};
    allTradesmen.forEach(tradesman => {
      const service = tradesman.tradeType;
      if (!tradesmenByService[service]) {
        tradesmenByService[service] = [];
      }
      tradesmenByService[service].push(tradesman);
    });
    
    console.log('📊 Tradesmen by service:', tradesmenByService);
    
    const response = {
      success: true,
      totalTradesmen: allTradesmen.length,
      tradesmenByService,
      allTradesmen: allTradesmen.map(t => ({
        email: t.email,
        name: t.name,
        tradeType: t.tradeType,
        status: t.status,
        businessName: t.businessName
      })),
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Debug response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to debug tradesmen',
      details: error.message
    });
  }
} 