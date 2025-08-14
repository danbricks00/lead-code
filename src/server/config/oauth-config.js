// OAuth2 Configuration for Gmail API
const oauthConfig = {
    clientId: '715560457951-4ti03g5176854alkdku3slr1sufbue0l.apps.googleusercontent.com',
    clientSecret: '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',
    redirectUri: 'http://localhost:3000/oauth2callback',
    scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose'
    ]
};

export default oauthConfig; 