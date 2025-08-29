export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Import required modules
        const { google } = await import('googleapis');
        
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
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get leads from Google Sheets
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Leads!A:Z'
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.json({ success: true, leads: [] });
        }

        // Process leads data
        const headers = rows[0];
        const leads = rows.slice(1).map(row => {
            const lead = {};
            headers.forEach((header, index) => {
                lead[header] = row[index] || '';
            });
            return lead;
        });

        res.json({ success: true, leads });
    } catch (error) {
        console.error('Error in get-leads API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
