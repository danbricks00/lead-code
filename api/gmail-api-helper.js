import { google } from 'googleapis';

// Gmail API configuration
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Initialize Gmail API with OAuth 2.0
async function getGmailService() {
  try {
    console.log('🔐 Initializing Gmail API with OAuth 2.0...');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: SCOPES,
    });

    const gmail = google.gmail({ version: 'v1', auth });
    console.log('✅ Gmail API service initialized successfully');
    return gmail;
  } catch (error) {
    console.error('❌ Failed to initialize Gmail API:', error.message);
    throw error;
  }
}

// Send email via Gmail API with optional attachment
async function sendEmailViaGmailAPI(to, subject, htmlContent, attachment = null, from = 'danbricks18@gmail.com') {
  try {
    console.log(`📧 Attempting to send email via Gmail API...`);
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 From: ${from}`);
    console.log(`📧 Has Attachment: ${attachment ? 'Yes' : 'No'}`);

    const gmail = await getGmailService();
    
    let message;
    
    if (attachment) {
      // Create multipart message with attachment
      const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
      
      message = [
        `From: Kiwi Trade <${from}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlContent,
        '',
        `--${boundary}`,
        `Content-Type: ${attachment.contentType}`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachment.filename}"`,
        '',
        attachment.content.toString('base64'),
        '',
        `--${boundary}--`
      ].join('\n');
    } else {
      // Create simple HTML message
      message = [
        `From: Kiwi Trade <${from}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlContent
      ].join('\n');
    }

    // Encode message in base64
    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    // Send email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`✅ Email sent successfully via Gmail API`);
    console.log(`📧 Message ID: ${response.data.id}`);
    console.log(`📧 Thread ID: ${response.data.threadId}`);
    
    return {
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId
    };

  } catch (error) {
    console.error(`❌ Failed to send email via Gmail API:`, error.message);
    console.error(`❌ Error details:`, {
      code: error.code,
      status: error.status,
      message: error.message,
      stack: error.stack
    });
    
    // Check for specific Gmail API errors
    if (error.code === 403) {
      console.error(`❌ Gmail API quota exceeded or insufficient permissions`);
    } else if (error.code === 429) {
      console.error(`❌ Gmail API rate limit exceeded`);
    }
    
    throw error;
  }
}

// Validate email address format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Log email attempt with timestamp
function logEmailAttempt(to, subject, status, error = null, attachment = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    to,
    subject,
    status,
    hasAttachment: !!attachment,
    error: error ? error.message : null
  };
  
  console.log(`📧 Email Log [${timestamp}]:`, JSON.stringify(logEntry, null, 2));
  return logEntry;
}

// Get Gmail API quota usage info
async function getGmailQuotaInfo() {
  try {
    console.log('📊 Checking Gmail API quota information...');
    
    return {
      note: 'Check Google Cloud Console for quota usage',
      dailyLimit: '1000 emails per day (default)',
      userLimit: '100 emails per 100 seconds per user',
      monitoringUrl: 'https://console.cloud.google.com/apis/credentials'
    };
  } catch (error) {
    console.error('❌ Failed to get quota info:', error.message);
    throw error;
  }
}

export {
  sendEmailViaGmailAPI,
  validateEmail,
  logEmailAttempt,
  getGmailQuotaInfo
};
