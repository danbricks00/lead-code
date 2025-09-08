/**
 * API endpoint to receive frontend logs for centralized logging
 * This allows tracking of button interactions and user actions from the browser
 */

import quoteLogger from '../../../lib/quoteLogger.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { timestamp, sessionId, prefix, message, data, browserInfo, pageInfo } = req.body;

        // Log the frontend event with server-side logger
        quoteLogger.info(`Frontend: ${prefix} ${message}`, {
            sessionId,
            timestamp,
            data,
            browserInfo: {
                userAgent: browserInfo?.userAgent,
                language: browserInfo?.language,
                platform: browserInfo?.platform,
                onLine: browserInfo?.onLine
            },
            pageInfo: {
                url: pageInfo?.url,
                pathname: pageInfo?.pathname,
                title: pageInfo?.title
            }
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        quoteLogger.error('Frontend logging error', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
