import googleAuthHandler from '../../src/server/integrations/google/google-auth.js';

export default async (req, res) => {
    try {
        // Call the handler function directly with req and res
        await googleAuthHandler(req, res);
    } catch (error) {
        console.error('Error in google-auth API:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
