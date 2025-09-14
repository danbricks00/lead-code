// pages/api/auth/check.js - Check authentication status using Google Sheets
import { parse } from 'cookie';
import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n');

// Google Sheets client setup
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

// Check if email exists in Tradesmen sheet
async function validateTradesmanEmail(email) {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Read Tradesmen sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tradesmen!A:H'
    });
    
    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return null; // No data or only headers
    }
    
    // Find tradesman by email (column A)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[0].toLowerCase() === email.toLowerCase()) {
        return {
          email: row[0],
          name: row[1] || '',
          tradeType: row[2] || '',
          businessName: row[3] || '',
          phone: row[4] || '',
          location: row[5] || '',
          status: row[6] || 'active',
          createdAt: row[7] || ''
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error validating tradesman email:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const cookies = parse(req.headers.cookie || '');
  const authToken = cookies['auth-token'];

  if (!authToken) {
    return res.status(200).json({ 
      success: false, 
      authenticated: false,
      message: 'Not authenticated' 
    });
  }

  try {
    // Decode the token
    const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
    const [email, timestamp] = decoded.split(':');
    
    // Check if token is not too old (7 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    if (tokenAge > maxAge) {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'Token expired' 
      });
    }

    // Verify email still exists in Tradesmen sheet and is active
    const tradesman = await validateTradesmanEmail(email);
    
    if (!tradesman) {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'Email no longer in tradesman database' 
      });
    }

    // Check if tradesman is still active
    if (tradesman.status && tradesman.status.toLowerCase() !== 'active') {
      return res.status(200).json({ 
        success: false, 
        authenticated: false,
        message: 'Account is no longer active' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      authenticated: true,
      email: tradesman.email,
      userType: 'tradesman',
      user: {
        email: tradesman.email,
        name: tradesman.name,
        businessName: tradesman.businessName,
        tradeType: tradesman.tradeType
      },
      message: 'Authenticated' 
    });
  } catch (error) {
    return res.status(200).json({ 
      success: false, 
      authenticated: false,
      message: 'Invalid token' 
    });
  }
}
