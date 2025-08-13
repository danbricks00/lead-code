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

    // Log the raw base64 string before sending
    console.log('📧 Raw Base64 Message (first 200 chars):', encodedMessage.substring(0, 200) + '...');
    console.log('📧 Full Base64 Message Length:', encodedMessage.length, 'characters');

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

// Step 1 Email Flow - Send three emails when a new lead is submitted
async function sendStep1Emails(lead) {
  console.log('📧 Starting Step 1 email flow for lead submission...');
  console.log('📋 Lead data:', JSON.stringify(lead, null, 2));
  
  // Enhanced safe fallback values for all placeholders
  const safeLead = {
    customerName: lead.customerName || 'Valued Customer',
    customerEmail: lead.customerEmail || 'customer@example.com',
    customerPhone: lead.customerPhone || 'Not provided',
    serviceType: lead.selectedService || lead.serviceType || 'General Service',
    projectDetails: lead.projectDetails || 'Project details not provided',
    projectSize: lead.projectSize || 'Not specified',
    location: lead.location || 'Auckland',
    quoteLink: lead.quoteLink || '#',
    budget: lead.budget || 'Not specified',
    timeline: lead.timeline || 'Not specified',
    specificDetails: lead.specificDetails || ''
  };
  
  // Email configuration
  const tradesmanEmail = 'quangbui0600@gmail.com';
  const adminEmail = 'danbricks18@gmail.com';
  const customerEmail = safeLead.customerEmail;
  
  console.log('📧 Email recipients configured:');
  console.log(`📧 Tradesman: ${tradesmanEmail}`);
  console.log(`📧 Admin: ${adminEmail}`);
  console.log(`📧 Customer: ${customerEmail}`);
  
  // Validate email addresses
  if (!validateEmail(tradesmanEmail)) {
    throw new Error(`Invalid tradesman email: ${tradesmanEmail}`);
  }
  if (!validateEmail(adminEmail)) {
    throw new Error(`Invalid admin email: ${adminEmail}`);
  }
  if (!validateEmail(customerEmail)) {
    throw new Error(`Invalid customer email: ${customerEmail}`);
  }
  
  const emailResults = {
    customer: { sent: false, error: null, messageId: null },
    tradesman: { sent: false, error: null, messageId: null },
    admin: { sent: false, error: null, messageId: null }
  };
  
  // 1. Send email to customer
  console.log('📧 Step 1.1: Sending customer confirmation...');
  try {
    const customerSubject = `Thank you for your inquiry - Kiwi Trade`;
    const customerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Thank you for your inquiry!</h2>
        <p>Dear ${safeLead.customerName},</p>
        <p>Thank you for submitting your inquiry through our chatbot. We have received your request and are processing it.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Your Request Details:</h3>
          <p><strong>Service:</strong> ${safeLead.serviceType}</p>
          <p><strong>Location:</strong> ${safeLead.location}</p>
          <p><strong>Project Size:</strong> ${safeLead.projectSize}</p>
          <p><strong>Budget:</strong> ${safeLead.budget}</p>
          <p><strong>Timeline:</strong> ${safeLead.timeline}</p>
        </div>
        
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Our team will review your requirements</li>
            <li>We'll prepare a detailed quote for your project</li>
            <li>You'll receive a professional quote within 24 hours</li>
            <li>You can then review and accept/decline the quote</li>
          </ul>
        </div>
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade Team</strong></p>
      </div>
    `;
    
    // Log full Gmail API payload for customer email
    console.log('📧 Customer Email - Gmail API Payload:');
    console.log('📧 Subject:', customerSubject);
    console.log('📧 Body Length:', customerHtml.length, 'characters');
    console.log('📧 Body Preview:', customerHtml.substring(0, 200) + '...');
    
    const customerResult = await sendEmailViaGmailAPI(customerEmail, customerSubject, customerHtml);
    emailResults.customer.sent = true;
    emailResults.customer.messageId = customerResult.messageId;
    logEmailAttempt(customerEmail, customerSubject, 'SUCCESS');
    console.log(`✅ Customer email sent successfully: ${customerResult.messageId}`);
  } catch (error) {
    emailResults.customer.error = error.message;
    logEmailAttempt(customerEmail, 'Thank you for your inquiry', 'FAILED', error);
    console.error(`❌ Failed to send customer email:`, error.message);
  }
  
  // 2. Send email to tradesman
  console.log('📧 Step 1.2: Sending tradesman notification...');
  try {
    const tradesmanSubject = `🔥 New Lead: ${safeLead.serviceType} - ${safeLead.location}`;
    const tradesmanHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">🔥 New Lead Available!</h2>
        <p>A new customer has submitted a lead request. Here are the details:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Customer Details:</h3>
          <p><strong>Name:</strong> ${safeLead.customerName}</p>
          <p><strong>Email:</strong> ${safeLead.customerEmail}</p>
          <p><strong>Phone:</strong> ${safeLead.customerPhone}</p>
          <p><strong>Location:</strong> ${safeLead.location}</p>
          
          <h3 style="color: #34495e;">Project Details:</h3>
          <p><strong>Service:</strong> ${safeLead.serviceType}</p>
          <p><strong>Project Size:</strong> ${safeLead.projectSize}</p>
          <p><strong>Budget:</strong> ${safeLead.budget}</p>
          <p><strong>Timeline:</strong> ${safeLead.timeline}</p>
          <p><strong>Details:</strong> ${safeLead.projectDetails}</p>
          ${safeLead.specificDetails ? `<p><strong>Specific Details:</strong> ${safeLead.specificDetails}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${safeLead.quoteLink}" 
             style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
             📝 Submit Quote
          </a>
        </div>
        
        <p>Click the button above to submit a quote. The form will be pre-filled with the customer's information.</p>
        
        <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
          This lead was generated from the Kiwi Trade website.
        </p>
      </div>
    `;
    
    // Log full Gmail API payload for tradesman email
    console.log('📧 Tradesman Email - Gmail API Payload:');
    console.log('📧 Subject:', tradesmanSubject);
    console.log('📧 Body Length:', tradesmanHtml.length, 'characters');
    console.log('📧 Body Preview:', tradesmanHtml.substring(0, 200) + '...');
    
    const tradesmanResult = await sendEmailViaGmailAPI(tradesmanEmail, tradesmanSubject, tradesmanHtml);
    emailResults.tradesman.sent = true;
    emailResults.tradesman.messageId = tradesmanResult.messageId;
    logEmailAttempt(tradesmanEmail, tradesmanSubject, 'SUCCESS');
    console.log(`✅ Tradesman email sent successfully: ${tradesmanResult.messageId}`);
  } catch (error) {
    emailResults.tradesman.error = error.message;
    logEmailAttempt(tradesmanEmail, '🔥 New Lead', 'FAILED', error);
    console.error(`❌ Failed to send tradesman email:`, error.message);
  }
  
  // 3. Send email to admin
  console.log('📧 Step 1.3: Sending admin notification...');
  try {
    const adminSubject = `📋 New Lead: ${safeLead.customerName} - ${safeLead.serviceType}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">📋 New Lead Received - Admin Copy</h2>
        <p>A new lead has been submitted and assigned to a tradesman for quote.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Lead Details:</h3>
          <p><strong>Customer Name:</strong> ${safeLead.customerName}</p>
          <p><strong>Customer Email:</strong> ${safeLead.customerEmail}</p>
          <p><strong>Customer Phone:</strong> ${safeLead.customerPhone}</p>
          <p><strong>Service Type:</strong> ${safeLead.serviceType}</p>
          <p><strong>Location:</strong> ${safeLead.location}</p>
          <p><strong>Project Details:</strong> ${safeLead.projectDetails}</p>
          <p><strong>Project Size:</strong> ${safeLead.projectSize}</p>
          <p><strong>Budget:</strong> ${safeLead.budget}</p>
          <p><strong>Timeline:</strong> ${safeLead.timeline}</p>
          ${safeLead.specificDetails ? `<p><strong>Specific Details:</strong> ${safeLead.specificDetails}</p>` : ''}
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">Status:</h3>
          <p><strong>Assigned Tradesman:</strong> quangbui0600@gmail.com</p>
          <p><strong>Status:</strong> Quote request sent - awaiting response</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Next Steps:</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Tradesman will receive quote request email</li>
            <li>Tradesman will submit quote within 24 hours</li>
            <li>Customer will receive professional quote with attachment</li>
            <li>Monitor quote status in dashboard</li>
          </ul>
        </div>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
      </div>
    `;
    
    // Log full Gmail API payload for admin email
    console.log('📧 Admin Email - Gmail API Payload:');
    console.log('📧 Subject:', adminSubject);
    console.log('📧 Body Length:', adminHtml.length, 'characters');
    console.log('📧 Body Preview:', adminHtml.substring(0, 200) + '...');
    
    const adminResult = await sendEmailViaGmailAPI(adminEmail, adminSubject, adminHtml);
    emailResults.admin.sent = true;
    emailResults.admin.messageId = adminResult.messageId;
    logEmailAttempt(adminEmail, adminSubject, 'SUCCESS');
    console.log(`✅ Admin email sent successfully: ${adminResult.messageId}`);
  } catch (error) {
    emailResults.admin.error = error.message;
    logEmailAttempt(adminEmail, '📋 New Lead', 'FAILED', error);
    console.error(`❌ Failed to send admin email:`, error.message);
  }
  
  // Calculate success rate
  const totalEmails = 3;
  const successfulEmails = Object.values(emailResults).filter(result => result.sent).length;
  const emailSuccessRate = (successfulEmails / totalEmails) * 100;
  
  console.log('📊 Step 1 Email Flow Results:');
  console.log(`📧 Success Rate: ${emailSuccessRate.toFixed(1)}% (${successfulEmails}/${totalEmails})`);
  console.log('📧 Email Results:', JSON.stringify(emailResults, null, 2));
  
  return {
    success: emailSuccessRate >= 66, // At least 2 out of 3 emails must succeed
    emailSuccessRate: `${emailSuccessRate.toFixed(1)}%`,
    emailResults,
    leadData: safeLead
  };
}

export {
  sendEmailViaGmailAPI,
  validateEmail,
  logEmailAttempt,
  getGmailQuotaInfo,
  sendStep1Emails
};
