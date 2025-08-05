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
    
    // Extract email from the Google credential
    let email = null;
    let name = null;
    
    try {
      // Decode the JWT token (Google credential is a JWT)
      const parts = credential.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        email = payload.email;
        name = payload.name;
        console.log('Decoded credential:', { email, name });
      }
    } catch (e) {
      console.error('Error decoding credential:', e);
    }
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not extract email from Google credential' 
      });
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
        email: email,
        name: name
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
} 