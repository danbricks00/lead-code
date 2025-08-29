export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ 
                error: 'Missing credential' 
            });
        }

        // Check for required environment variables
        if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
            return res.status(500).json({ 
                error: 'Missing env var GOOGLE_OAUTH_CLIENT_ID' 
            });
        }

        console.log('🔐 Processing Google Sign-In credential');

        // Import required modules
        const { google } = await import('googleapis');

        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            process.env.GOOGLE_OAUTH_REDIRECT_URI
        );

        try {
            // Verify the ID token
            const ticket = await oauth2Client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_OAUTH_CLIENT_ID
            });

            const payload = ticket.getPayload();
            console.log('✅ Google token verified successfully');

            // Extract user information
            const userInfo = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                sub: payload.sub, // Google's unique user ID
                email_verified: payload.email_verified
            };

            console.log('👤 User info extracted:', {
                email: userInfo.email,
                name: userInfo.name,
                email_verified: userInfo.email_verified
            });

            // Check if user exists in your system
            const existingUser = await checkUserExists(userInfo.email);

            if (existingUser) {
                console.log('✅ User found in system:', existingUser.email);
                return res.json({
                    success: true,
                    user: existingUser,
                    message: 'Login successful'
                });
            } else {
                console.log('⚠️ New user needs registration:', userInfo.email);
                return res.json({
                    success: false,
                    needsRegistration: true,
                    email: userInfo.email,
                    name: userInfo.name,
                    message: 'User needs to complete registration'
                });
            }

        } catch (verifyError) {
            console.error('❌ Token verification failed:', verifyError);
            return res.status(401).json({
                success: false,
                error: 'Invalid Google token'
            });
        }

    } catch (error) {
        console.error('❌ Google Auth error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message 
        });
    }
}

// Function to check if user exists in your system
async function checkUserExists(email) {
    try {
        // Check for required environment variables
        if (!process.env.GOOGLE_SPREADSHEET_ID) {
            console.log('⚠️ No Google Sheets ID configured, using mock user');
            return {
                email: email,
                name: 'Test User',
                tradeType: 'Underfloor Heating',
                businessName: 'Test Business',
                status: 'Active',
                id: 'test-user-id'
            };
        }

        // Import required modules
        const { google } = await import('googleapis');

        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Search for user in the Tradesmen sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Tradesmen!A:Z',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('❌ No data found in Tradesmen sheet');
            return null;
        }

        // Find user by email (assuming email is in column B)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[1] === email) { // Email column (B)
                console.log('✅ User found in Tradesmen sheet');
                return {
                    id: row[0] || `user-${i}`,
                    email: row[1] || email,
                    name: row[2] || 'Unknown',
                    tradeType: row[3] || 'Not specified',
                    businessName: row[4] || 'Not specified',
                    phone: row[5] || 'Not specified',
                    location: row[6] || 'Not specified',
                    status: row[7] || 'Active'
                };
            }
        }

        console.log('❌ User not found in Tradesmen sheet');
        return null;

    } catch (error) {
        console.error('❌ Error checking user existence:', error);
        return null;
    }
}
