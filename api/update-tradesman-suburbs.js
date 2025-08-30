export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Import required modules
        const { google } = await import('googleapis');
        
        const { email, suburbs } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Missing required field: email' });
        }

        if (!suburbs || !Array.isArray(suburbs) || suburbs.length === 0) {
            return res.status(400).json({ error: 'Please select at least one suburb where you provide services' });
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
        
        // First, find the tradesman by email
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Tradesmen!A:I',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No tradesmen found' });
        }

        // Find the row with matching email (email is in column C, index 2)
        let rowIndex = -1;
        for (let i = 1; i < rows.length; i++) { // Start from 1 to skip header
            if (rows[i][2] === email) { // Email is in column C (index 2)
                rowIndex = i + 1; // +1 because sheets rows are 1-indexed
                break;
            }
        }

        if (rowIndex === -1) {
            return res.status(404).json({ error: 'Tradesman not found with this email' });
        }

        // Prepare suburbs data as JSON string
        const suburbsJson = JSON.stringify(suburbs);
        
        // Update the suburbs column (column G, index 6)
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: `Tradesmen!G${rowIndex}`,
            valueInputOption: 'RAW',
            resource: {
                values: [[suburbsJson]]
            }
        });
        
        res.json({ 
            success: true, 
            message: 'Service areas updated successfully!',
            suburbs: suburbs
        });
    } catch (error) {
        console.error('Error in update-tradesman-suburbs API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
