export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Import required modules
        const { google } = await import('googleapis');
        
        const { googleId } = req.query;
        
        if (!googleId) {
            return res.status(400).json({ error: 'Missing googleId parameter' });
        }
        
        // Get Google Sheets client
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
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Find and update the tradesman status
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Tradesmen!A:Z'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No tradesmen found' });
        }

        // Find the tradesman by Google ID (assuming it's in a specific column)
        const tradesmanIndex = rows.findIndex(row => row[1] === googleId); // Assuming Google ID is in column B
        if (tradesmanIndex === -1) {
            return res.status(404).json({ error: 'Tradesman not found' });
        }

        // Update the status to 'Approved' (assuming status is in column H)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: `Tradesmen!H${tradesmanIndex + 1}`,
            valueInputOption: 'RAW',
            resource: {
                values: [['Approved']]
            }
        });
        
        res.json({ success: true, message: 'Tradesman approved successfully' });
    } catch (error) {
        console.error('Error in admin/approve API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
