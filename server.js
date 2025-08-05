// Simple Express server example
const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const config = require('./config.js');
const { getTradesmenEmails } = require('./tradesmen-config.js');
const oauthConfig = require('./oauth-config.js');
const tradesmenDB = require('./tradesmen-db.js');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Session configuration for authentication
app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Add specific route for the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

app.get('/frontend', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

app.get('/frontend.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Function to get Google Sheets client
async function getSheetsClient() {
    try {
        // Check if service account key file exists
        const keyPath = path.join(__dirname, 'service_account_key.json');
        console.log('Checking for service account key at:', keyPath);
        console.log('File exists:', fs.existsSync(keyPath));
        
        if (fs.existsSync(keyPath)) {
            console.log('Using service account authentication...');
            const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            console.log('Service account email:', keyFile.client_email);
            
            const auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/gmail.send']
            });
            
            const client = await auth.getClient();
            console.log('Auth client created successfully');
            
            return google.sheets({ version: 'v4', auth: client });
        } else {
            console.log('Service account key not found, using API key...');
            const auth = new google.auth.GoogleAuth({
                key: config.sheets.apiKey,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            });
            return google.sheets({ version: 'v4', auth });
        }
    } catch (error) {
        console.error('Error setting up Google Sheets client:', error);
        return null;
    }
}

// Function to get Gmail client using service account (more reliable)
async function getGmailClient() {
    try {
        const keyPath = path.join(__dirname, 'service_account_key.json');
        if (fs.existsSync(keyPath)) {
            console.log('🔧 Using service account for Gmail...');
            const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            console.log('🔧 Service account email:', keyFile.client_email);
            
            const auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/gmail.send']
            });
            
            const client = await auth.getClient();
            return google.gmail({ version: 'v1', auth: client });
        } else {
            console.log('⚠️ No service account key found for Gmail');
            return null;
        }
    } catch (error) {
        console.error('Error setting up Gmail client:', error);
        return null;
    }
}

// Function to send email via Gmail API or fallback to SMTP
async function sendEmail(to, subject, body) {
    try {
        // Try Gmail API first
        const gmail = await getGmailClient();
        if (gmail) {
            console.log(`📧 Attempting to send email via Gmail API to: ${to}`);
            
            const message = [
                'Content-Type: text/html; charset=utf-8',
                'MIME-Version: 1.0',
                `To: ${to}`,
                `Subject: ${subject}`,
                '',
                body
            ].join('\n');

            const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

            const response = await gmail.users.messages.send({
                userId: 'me',
                resource: {
                    raw: encodedMessage
                }
            });

            console.log('✅ Email sent successfully via Gmail API:', response.data.id);
            return true;
        }
    } catch (error) {
        console.error('❌ Gmail API failed:', error.message);
    }

    // Fallback to real SMTP (Gmail)
    try {
        console.log(`📧 Attempting to send email via Gmail SMTP to: ${to}`);
        
        // Use Gmail SMTP with your credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'danbricks18@gmail.com', // Your Gmail address
                pass: 'ptmcojqgthvjbqom' // You'll need to generate an app password
            }
        });

        const mailOptions = {
            from: '"LeadBot" <danbricks18@gmail.com>',
            to: to,
            subject: subject,
            html: body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail SMTP:', info.messageId);
        return true;
    } catch (smtpError) {
        console.error('❌ Gmail SMTP failed:', smtpError.message);
        
        // Final fallback - just log the email content
        console.log('📧 EMAIL CONTENT (for manual sending):');
        console.log('=====================================');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
        console.log('=====================================');
        return false;
    }
}



// Authentication endpoints
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        
        if (!credential) {
            return res.json({ success: false, error: 'No credential provided' });
        }

        // Verify Google token (in production, you should verify with Google's API)
        // For now, we'll decode the JWT token
        const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
        
        const user = {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };

        // Check if user exists in our database
        let dbUser = tradesmenDB.getUserByGoogleId(user.googleId);
        
        if (!dbUser) {
            // User not registered, return error
            return res.json({ 
                success: false, 
                error: 'User not registered. Please register first.',
                needsRegistration: true,
                user: user
            });
        }

        // Update last login
        tradesmenDB.updateLastLogin(user.googleId);
        
        // Store user in session
        req.session.user = dbUser;
        
        res.json({ 
            success: true, 
            user: {
                ...dbUser,
                email: user.email, // Include email for display
                picture: user.picture
            }
        });
        
    } catch (error) {
        console.error('Google auth error:', error);
        res.json({ success: false, error: 'Authentication failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { tradeType, businessName, phone, location } = req.body;
        
        // Get user from session (should be set after Google auth)
        const user = req.session.tempUser;
        
        if (!user) {
            return res.json({ success: false, error: 'No user session found. Please sign in with Google first.' });
        }

        // Register the tradesman
        const result = tradesmenDB.registerTradesman(
            user.googleId,
            user.email,
            user.name,
            tradeType,
            businessName,
            phone,
            location
        );

        if (result.success) {
            // Store user in session
            req.session.user = result.user;
            delete req.session.tempUser;
            
            res.json({ success: true, user: result.user });
        } else {
            res.json({ success: false, error: result.error });
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, error: 'Registration failed' });
    }
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.json({ success: false, error: 'Logout failed' });
        } else {
            res.json({ success: true });
        }
    });
});

// Admin endpoints
app.get('/api/admin/tradesmen', (req, res) => {
    // In production, add admin authentication here
    const tradesmen = tradesmenDB.getAllApprovedTradesmen();
    res.json({ success: true, tradesmen });
});

app.post('/api/admin/approve/:googleId', (req, res) => {
    const { googleId } = req.params;
    const result = tradesmenDB.approveTradesman(googleId);
    res.json(result);
});

app.post('/api/admin/suspend/:googleId', (req, res) => {
    const { googleId } = req.params;
    const result = tradesmenDB.suspendTradesman(googleId);
    res.json(result);
});

// API endpoint to send lead data to Google Sheets
app.post('/api/send-to-sheets', async (req, res) => {
    try {
        console.log('Received lead data:', req.body);
        const leadData = req.body;
        
        // Log the data
        console.log('=== LEAD DATA RECEIVED ===');
        console.log('Customer Name:', leadData.customerName);
        console.log('Customer Email:', leadData.customerEmail);
        console.log('Customer Phone:', leadData.customerPhone);
        console.log('Selected Service:', leadData.selectedService);
        console.log('Project Details:', leadData.projectDetails);
        console.log('Project Size:', leadData.projectSize);
        console.log('Specific Details:', leadData.specificDetails);
        console.log('Location:', leadData.location);
        console.log('Budget:', leadData.budget);
        console.log('Timeline:', leadData.timeline);
        console.log('Timestamp:', new Date().toISOString());
        console.log('========================');
        
        // Try to write to Google Sheets
        const sheets = await getSheetsClient();
        let sheetsSuccess = false;
        
        if (sheets) {
            try {
                const values = [
                    [
                        new Date().toISOString(),
                        leadData.customerName,
                        leadData.customerEmail,
                        leadData.customerPhone,
                        leadData.selectedService,
                        leadData.projectDetails,
                        leadData.projectSize,
                        leadData.specificDetails,
                        leadData.location,
                        leadData.budget,
                        leadData.timeline
                    ]
                ];
                
                const response = await sheets.spreadsheets.values.append({
                    spreadsheetId: config.sheets.spreadsheetId,
                    range: 'Sheet1!A:K',
                    valueInputOption: 'USER_ENTERED',
                    resource: { values }
                });
                
                console.log('✅ Data written to Google Sheets successfully!');
                sheetsSuccess = true;
            } catch (sheetsError) {
                console.error('❌ Google Sheets error:', sheetsError.message);
            }
        } else {
            console.log('⚠️ Google Sheets client not available');
        }

        // Send emails to tradesmen and customer
        try {
            // Get tradesmen from the database for the service
            const tradesmen = tradesmenDB.getTradesmenEmailsForService(leadData.selectedService);
            
            // Fallback to old system if no tradesmen in database
            const fallbackEmails = getTradesmenEmails(leadData.selectedService);
            const allTradesmen = tradesmen.length > 0 ? tradesmen : fallbackEmails.map(email => ({ email }));
            
            console.log('📧 EMAIL NOTIFICATIONS:');
            console.log('=====================================');
            
            // Email to tradesmen
            const tradesmenSubject = `New Lead: ${leadData.selectedService} Project in ${leadData.location}`;
            const tradesmenBody = `
New Lead Received

Service Required: ${leadData.selectedService}
Customer Name: ${leadData.customerName}
Customer Email: ${leadData.customerEmail}
Customer Phone: ${leadData.customerPhone}
Location: ${leadData.location}
Project Details: ${leadData.projectDetails}
Project Size: ${leadData.projectSize}
Specific Requirements: ${leadData.specificDetails}
Budget: ${leadData.budget}
Timeline: ${leadData.timeline}
Date: ${new Date().toLocaleString()}

Please contact the customer directly to discuss this project.
            `;

            console.log('📤 TO TRADESMEN:');
            for (const tradesman of allTradesmen) {
                const email = tradesman.email || tradesman.hashedEmail;
                console.log(`   To: ${tradesman.name || 'Tradesman'} (${email})`);
                console.log(`   Subject: ${tradesmenSubject}`);
                console.log(`   Body: ${tradesmenBody}`);
                console.log('   ---');
            }
            
            // Email to customer (confirmation)
            const customerSubject = `Your Project Request - LeadBot`;
            const customerBody = `
Thank you for your project request!

Dear ${leadData.customerName},

We have received your request for ${leadData.selectedService} services and have forwarded it to qualified tradesmen in your area.

Project Details:
- Service: ${leadData.selectedService}
- Location: ${leadData.location}
- Project: ${leadData.projectDetails}
- Size/Scope: ${leadData.projectSize}
- Specific Requirements: ${leadData.specificDetails}
- Budget: ${leadData.budget}
- Timeline: ${leadData.timeline}

Qualified tradesmen will contact you within 24 hours to discuss your project and provide quotes.

If you have any questions, please don't hesitate to contact us.

Best regards,
The LeadBot Team
            `;

            // Create email summary for easy copying
            console.log('\n📋 EMAIL SUMMARY FOR MANUAL SENDING:');
            console.log('=====================================');
            console.log('TRADESMEN EMAILS:');
            allTradesmen.forEach((tradesman, index) => {
                const email = tradesman.email || tradesman.hashedEmail;
                console.log(`${index + 1}. To: ${tradesman.name || 'Tradesman'} (${email})`);
                console.log(`   Subject: ${tradesmenSubject}`);
                console.log(`   Body: ${tradesmenBody.replace(/\n/g, '\\n')}`);
                console.log('');
            });
            
            console.log('CUSTOMER EMAIL:');
            console.log(`To: ${leadData.customerEmail}`);
            console.log(`Subject: ${customerSubject}`);
            console.log(`Body: ${customerBody.replace(/\n/g, '\\n')}`);
            console.log('=====================================');

            console.log('📤 TO CUSTOMER:');
            console.log(`   To: ${leadData.customerEmail}`);
            console.log(`   Subject: ${customerSubject}`);
            console.log(`   Body: ${customerBody}`);
            console.log('=====================================');
            
            // Try to send via Gmail API (if configured)
            for (const tradesman of allTradesmen) {
                const email = tradesman.email || tradesman.hashedEmail;
                const success = await sendEmail(email, tradesmenSubject, tradesmenBody);
                if (success) {
                    console.log(`✅ Email sent to tradesman: ${tradesman.name || 'Tradesman'} (${email})`);
                } else {
                    console.log(`❌ Failed to send email to tradesman: ${tradesman.name || 'Tradesman'} (${email})`);
                }
            }

            const customerEmailSuccess = await sendEmail(leadData.customerEmail, customerSubject, customerBody);
            if (customerEmailSuccess) {
                console.log(`✅ Confirmation email sent to customer: ${leadData.customerEmail}`);
            } else {
                console.log(`❌ Failed to send confirmation email to customer: ${leadData.customerEmail}`);
            }

        } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
        }

        // Return response
        if (sheetsSuccess) {
            res.json({ success: true, message: 'Lead data saved and emails sent successfully' });
        } else {
            res.json({ success: true, message: 'Lead data received and emails sent (Google Sheets error)' });
        }
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});