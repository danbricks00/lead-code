import { getAllTradesmen } from './database.js';

export default function handler(req, res) {
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
    const tradesmen = getAllTradesmen();
    console.log('🔍 Debug: All tradesmen:', tradesmen);

    res.json({
      success: true,
      message: 'Debug information',
      tradesmenCount: tradesmen.length,
      tradesmen: tradesmen,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get debug info',
      details: error.message
    });
  }
} 