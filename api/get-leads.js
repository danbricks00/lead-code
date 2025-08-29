export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Check for required environment variables
        if (!process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(500).json({ 
                error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
            });
        }

        // Import the handler function
        try {
            const getLeadsHandler = await import('../src/server/lib/get-leads.js');
            await getLeadsHandler.default(req, res);
        } catch (importError) {
            console.error('Import error:', importError);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to load leads handler' 
            });
        }
    } catch (error) {
        console.error('Error in get-leads API:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
