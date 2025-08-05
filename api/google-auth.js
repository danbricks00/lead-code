// Google authentication endpoint
import { findUserByEmail } from './database.js';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;
    
    // For now, we'll extract email from the credential
    // In production, you should verify the Google token properly
    let email = 'test@example.com'; // Placeholder
    
    // Try to decode the credential (this is a simplified version)
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      email = payload.email;
    } catch (e) {
      console.log('Could not decode credential, using placeholder email');
    }
    
    // Check if user is registered
    const user = findUserByEmail(email);
    
    if (user) {
      res.json({ 
        success: true, 
        user: user,
        message: 'Successfully signed in!'
      });
    } else {
      res.json({ 
        success: false, 
        needsRegistration: true,
        message: 'Please complete registration first',
        email: email
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
} 