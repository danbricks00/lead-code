export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🧪 Testing Zone API connection...');
        
        // Check environment variables
        const envCheck = {
            GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
            GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
            GOOGLE_SPREADSHEET_ID: !!process.env.GOOGLE_SPREADSHEET_ID,
            GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
            GOOGLE_PRIVATE_KEY_ID: !!process.env.GOOGLE_PRIVATE_KEY_ID,
            GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_CER_URL: !!process.env.GOOGLE_CLIENT_CER_URL
        };

        console.log('🔧 Environment variables check:', envCheck);

        // Test Google Sheets connection
        try {
            const { google } = await import('googleapis');
            
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    type: 'service_account',
                    project_id: process.env.GOOGLE_PROJECT_ID,
                    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
            
            // Test connection by getting spreadsheet metadata
            const metadata = await sheets.spreadsheets.get({
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
            });
            
            const availableSheets = metadata.data.sheets.map(s => s.properties.title);
            console.log('✅ Google Sheets connection successful');
            console.log('📋 Available sheets:', availableSheets);

            res.json({
                success: true,
                message: 'Zone API connection test successful',
                environment: envCheck,
                availableSheets: availableSheets,
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
            });

        } catch (sheetsError) {
            console.error('❌ Google Sheets connection failed:', sheetsError);
            res.status(500).json({
                success: false,
                message: 'Google Sheets connection failed',
                error: sheetsError.message,
                environment: envCheck
            });
        }

    } catch (error) {
        console.error('❌ Test connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Test connection failed',
            error: error.message
        });
    }
}
