import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🧪 Testing Gmail API authentication...');
        
        // Test 1: Check environment variables
        console.log('📋 Environment variables check:');
        console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
        console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');
        console.log('- GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing');
        console.log('- MAIL_FORM:', process.env.MAIL_FORM ? '✅ Set' : '❌ Missing');
        console.log('- MAIL_REPLY_TO:', process.env.MAIL_REPLY_TO ? '✅ Set' : '❌ Missing');
        
        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return res.status(500).json({ 
                error: 'Missing Gmail API credentials',
                details: {
                    clientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
                    privateKey: !!process.env.GOOGLE_PRIVATE_KEY,
                    gmailUser: process.env.GMAIL_USER || 'Not set',
                    mailForm: process.env.MAIL_FORM || 'Not set',
                    mailReplyTo: process.env.MAIL_REPLY_TO || 'Not set'
                }
            });
        }

        // Test 2: Initialize Gmail API
        console.log('🔐 Initializing Gmail API...');
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/gmail.send'],
        });

        const gmail = google.gmail({ version: 'v1', auth });
        console.log('✅ Gmail API initialized successfully');

        // Test 3: Try to get user profile (this tests authentication)
        console.log('👤 Testing user profile access...');
        const profile = await gmail.users.getProfile({ userId: 'me' });
        console.log('✅ User profile accessed successfully:', profile.data.emailAddress);

        // Test 4: Try to send a simple test email
        console.log('📧 Testing email sending...');
        
        // Use environment variables for email configuration
        const fromEmail = process.env.MAIL_FORM || 'danbricks18@gmail.com';
        const toEmail = process.env.GMAIL_USER || 'danbricks18@gmail.com';
        
        const testMessage = [
            `From: Kiwi Trade <${fromEmail}>`,
            `To: ${toEmail}`,
            'Subject: Gmail API Test - Contact Form Integration',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=utf-8',
            '',
            'This is a test email from the Gmail API to verify authentication is working for the contact form integration.',
            '',
            'Environment Variables Used:',
            `- GMAIL_USER: ${process.env.GMAIL_USER || 'Not set'}`,
            `- MAIL_FORM: ${process.env.MAIL_FORM || 'Not set'}`,
            `- MAIL_REPLY_TO: ${process.env.MAIL_REPLY_TO || 'Not set'}`,
            `- Service Account: ${process.env.GOOGLE_CLIENT_EMAIL}`
        ].join('\n');

        const encodedMessage = Buffer.from(testMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
        
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log('✅ Test email sent successfully!');
        console.log('📧 Message ID:', response.data.id);

        return res.status(200).json({
            success: true,
            message: 'Gmail API authentication test passed!',
            details: {
                userEmail: profile.data.emailAddress,
                messageId: response.data.id,
                threadId: response.data.threadId,
                environmentVariables: {
                    gmailUser: process.env.GMAIL_USER || 'Not set',
                    mailForm: process.env.MAIL_FORM || 'Not set',
                    mailReplyTo: process.env.MAIL_REPLY_TO || 'Not set',
                    serviceAccount: process.env.GOOGLE_CLIENT_EMAIL
                }
            }
        });

    } catch (error) {
        console.error('❌ Gmail API test failed:', error);
        
        // Provide specific error information
        let errorDetails = {
            message: error.message,
            code: error.code,
            status: error.status
        };

        if (error.code === 403) {
            errorDetails.suggestion = 'Check if Gmail API is enabled and service account has proper permissions';
        } else if (error.code === 400 && error.message.includes('Precondition check failed')) {
            errorDetails.suggestion = 'Service account may not have permission to send emails on behalf of the Gmail account. Enable domain-wide delegation in Google Workspace Admin Console.';
        } else if (error.code === 401) {
            errorDetails.suggestion = 'Authentication failed - check service account credentials';
        }

        return res.status(500).json({
            error: 'Gmail API authentication test failed',
            details: errorDetails,
            environmentVariables: {
                gmailUser: process.env.GMAIL_USER || 'Not set',
                mailForm: process.env.MAIL_FORM || 'Not set',
                mailReplyTo: process.env.MAIL_REPLY_TO || 'Not set',
                serviceAccount: process.env.GOOGLE_CLIENT_EMAIL || 'Not set'
            }
        });
    }
}
