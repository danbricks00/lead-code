// Simple script to update Google OAuth Client ID
// Run this after you get your Client ID from Google Cloud Console

const fs = require('fs');
const path = require('path');

function updateGoogleAuthClientId(clientId) {
    const loginPath = path.join(__dirname, 'public', 'login.html');
    
    if (!fs.existsSync(loginPath)) {
        console.error('❌ login.html not found');
        return;
    }
    
    let content = fs.readFileSync(loginPath, 'utf8');
    
    // Replace the placeholder with actual client ID
    content = content.replace(
        /YOUR_GOOGLE_OAUTH_CLIENT_ID_HERE/g,
        clientId
    );
    
    fs.writeFileSync(loginPath, content);
    console.log('✅ Updated login.html with Client ID:', clientId);
}

// Usage example:
// updateGoogleAuthClientId('123456789-abcdef.apps.googleusercontent.com');

module.exports = { updateGoogleAuthClientId };
