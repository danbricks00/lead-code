const fs = require('fs');
const path = require('path');

// Read the service account JSON file
const jsonFilePath = path.join(__dirname, 'tradelead-bdec937c87b1.json');

try {
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
  
  console.log('🔧 Vercel Environment Variables Setup:');
  console.log('=====================================');
  console.log('');
  
  // Google Sheets API credentials
  console.log('📊 GOOGLE SHEETS API:');
  console.log('GOOGLE_PROJECT_ID =', jsonData.project_id);
  console.log('GOOGLE_PRIVATE_KEY_ID =', jsonData.private_key_id);
  console.log('GOOGLE_PRIVATE_KEY =', jsonData.private_key);
  console.log('GOOGLE_CLIENT_EMAIL =', jsonData.client_email);
  console.log('GOOGLE_CLIENT_ID =', jsonData.client_id);
  console.log('GOOGLE_CLIENT_CERT_URL =', jsonData.client_x509_cert_url);
  console.log('');
  
  console.log('📋 ADDITIONAL VARIABLES NEEDED:');
  console.log('GOOGLE_SPREADSHEET_ID = [Your Google Spreadsheet ID]');
  console.log('GMAIL_USER = [Your Gmail address]');
  console.log('GMAIL_APP_PASSWORD = [Your Gmail App Password]');
  console.log('');
  
  console.log('💡 Copy these values to Vercel Environment Variables!');
  
} catch (error) {
  console.error('Error reading JSON file:', error.message);
} 