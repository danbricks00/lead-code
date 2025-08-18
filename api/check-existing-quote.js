import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log('🔍 Check Existing Quote API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { leadId, tradesmanEmail } = req.query;
      
      console.log('🔍 Checking for existing quote:', { leadId, tradesmanEmail });

      if (!leadId || !tradesmanEmail) {
        return res.status(400).json({
          success: false,
          error: 'Both leadId and tradesmanEmail are required'
        });
      }

      // Check if Google Sheets is configured
      if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
        console.error('❌ Missing Google Sheets configuration');
        return res.status(500).json({
          success: false,
          error: 'System configuration error'
        });
      }

      try {
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Check the Quotes sheet for existing quotes from this tradesman for this lead
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
          range: 'Quotes!A:T',
        });

        const rows = response.data.values || [];
        console.log('🔍 Checking for duplicate quotes. Total rows:', rows.length);
        console.log('🔍 Looking for:', { leadId, tradesmanEmail });
        
        const existingQuote = rows.find(row => 
          row[1] === leadId && // leadId column (B)
          row[4] === tradesmanEmail // tradesmanEmail column (E)
        );

        if (existingQuote) {
          console.log('❌ Duplicate quote found:', { leadId, tradesmanEmail });
          return res.json({
            success: true,
            exists: true,
            quote: {
              quoteId: existingQuote[1],
              quoteNumber: existingQuote[2],
              tradesmanName: existingQuote[3],
              tradesmanEmail: existingQuote[4],
              totalAmount: existingQuote[6],
              status: existingQuote[10] || 'submitted',
              timestamp: existingQuote[0]
            }
          });
        } else {
          console.log('✅ No duplicate quote found');
          return res.json({
            success: true,
            exists: false,
            quote: null
          });
        }
      } catch (sheetsError) {
        console.error('❌ Google Sheets error:', sheetsError.message);
        return res.status(500).json({
          success: false,
          error: 'Unable to check for existing quotes'
        });
      }
    } catch (error) {
      console.error('❌ Error checking existing quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check existing quote',
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
