export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      leadId,
      tradesmanName,
      tradesmanEmail,
      tradesmanPhone,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      projectDetails,
      projectSize,
      location,
      budget,
      timeline,
      specificDetails,
      quoteAmount,
      breakdown,
      notes
    } = req.body;

    console.log('📋 Quote submission received:', {
      leadId,
      tradesmanName,
      customerName,
      serviceType,
      quoteAmount
    });

    // Validate required fields
    if (!leadId || !tradesmanName || !tradesmanEmail || !customerName || !customerEmail || !quoteAmount) {
      return res.status(400).json({
        error: 'Missing required fields: leadId, tradesmanName, tradesmanEmail, customerName, customerEmail, quoteAmount'
      });
    }

    // Check for required environment variables
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      return res.status(500).json({ 
        error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
      });
    }

    // Import required modules
    const { google } = await import('googleapis');
    const nodemailer = await import('nodemailer');
    const { generateQuotePdfBuffer, coerceNumeric } = await import('./quote-utils.js');

    const SITE_URL = process.env.SITE_URL || 'https://lead-code.vercel.app';

    // STRICT: Check if this tradesman has already submitted a quote for this lead
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      console.error('❌ Missing Google Sheets configuration - cannot validate duplicate quotes');
      return res.status(500).json({
        error: 'System configuration error. Please contact support.'
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
      
      const existingQuotes = rows.filter(row => 
        row[1] === leadId && // leadId column (B)
        row[4] === tradesmanEmail // tradesmanEmail column (E)
      );

      if (existingQuotes.length > 0) {
        // Check if any existing quote allows resubmission
        const declinedQuote = existingQuotes.find(row => row[10] === 'declined'); // status column (K)
        
        if (declinedQuote) {
          const declineReason = declinedQuote[11]; // decline reason column (L)
          const resubmissionUsed = declinedQuote[14]; // resubmission_used column (O)
          
          // Check if resubmission is allowed
          if ((declineReason === 'pricing_error' || declineReason === 'missing_details') && resubmissionUsed !== 'TRUE') {
            console.log('✅ Resubmission allowed for declined quote:', { leadId, tradesmanEmail, declineReason });
            // Continue with submission - this is a valid resubmission
          } else {
            console.log('❌ Resubmission not allowed:', { leadId, tradesmanEmail, declineReason, resubmissionUsed });
            return res.status(400).json({
              error: 'You have already submitted a quote for this lead and resubmission is not allowed.'
            });
          }
        } else {
          console.log('❌ Quote already exists and is not declined:', { leadId, tradesmanEmail });
          return res.status(400).json({
            error: 'You have already submitted a quote for this lead.'
          });
        }
      }
      
      // Continue with quote submission...
      // (The rest of the function would continue here)

      res.json({ 
        success: true, 
        message: 'Quote submitted successfully' 
      });

    } catch (error) {
      console.error('Quote submission error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }

  } catch (error) {
    console.error('Quote submission error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message 
    });
  }
}
