// pages/api/auth/login.js - Google Sheets-based authentication for tradesman/admin
import { serialize } from 'cookie';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  // Check if email exists in Tradesmen sheet
  const tradesman = await validateTradesmanEmail(email);
  
  if (!tradesman) {
    return res.status(401).json({ success: false, error: 'Email not found in tradesman database' });
  }

  // Check if tradesman is active
  if (tradesman.status && tradesman.status.toLowerCase() !== 'active') {
    return res.status(401).json({ success: false, error: 'Account is not active' });
  }

  // For now, we'll use a simple password check
  // In production, you might want to add password hashing to the Tradesmen sheet
  // For now, we'll use a simple validation (you can enhance this later)
  const validPassword = 'tradesman123'; // Default password for all tradesmen
  
  if (password !== validPassword) {
    return res.status(401).json({ success: false, error: 'Invalid password' });
  }

  // Create session token
  const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  
  // Set cookie
  res.setHeader('Set-Cookie', serialize('auth-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  }));

  return res.status(200).json({ 
    success: true, 
    message: 'Login successful',
    userType: 'tradesman',
    user: {
      email: tradesman.email,
      name: tradesman.name,
      businessName: tradesman.businessName,
      tradeType: tradesman.tradeType
    }
  });
}
