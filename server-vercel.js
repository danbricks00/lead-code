// Vercel-compatible server
const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const { getTradesmenEmails } = require('./tradesmen-config.js');
const tradesmenDB = require('./tradesmen-db.js');
const session = require('express-session');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Session configuration for authentication
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile('frontend.html', { root: __dirname });
});

app.get('/frontend', (req, res) => {
    res.sendFile('frontend.html', { root: __dirname });
});

app.get('/frontend.html', (req, res) => {
    res.sendFile('frontend.html', { root: __dirname });
});

app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: __dirname });
});

app.get('/admin', (req, res) => {
    res.sendFile('admin.html', { root: __dirname });
});

app.get('/about', (req, res) => {
    res.sendFile('about.html', { root: __dirname });
});

app.get('/contact', (req, res) => {
    res.sendFile('contact.html', { root: __dirname });
});

// Function to get Google Sheets client using API key
async function getSheetsClient() {
    try {
        const auth = new google.auth.GoogleAuth({
            key: process.env.GOOGLE_API_KEY,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('Error setting up Google Sheets client:', error);
        return null;
    }
}

// Function to send email using Nodemailer (fallback)
async function sendEmail(to, subject, body) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: to,
            subject: subject,
            html: body
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', result.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// API endpoint to save lead data to Google Sheets
app.post('/api/send-to-sheets', async (req, res) => {
    try {
        const leadData = req.body;
        console.log('Received lead data:', leadData);

        // Get Google Sheets client
        const sheets = await getSheetsClient();
        if (!sheets) {
            return res.status(500).json({ success: false, message: 'Failed to initialize Google Sheets client' });
        }

        // Prepare data for Google Sheets
        const values = [
            [
                new Date().toISOString(),
                leadData.customerName,
                leadData.customerEmail,
                leadData.customerPhone,
                leadData.selectedService,
                leadData.projectDetails,
                leadData.budget,
                leadData.timeline,
                leadData.projectSize,
                leadData.specificDetails
            ]
        ];

        // Write to Google Sheets
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:J',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values }
        });

        console.log('Data written to Google Sheets:', response.data);

        // Send emails
        const customerSubject = 'Thank you for your inquiry - LeadBot';
        const customerBody = `
            <h2>Thank you for your inquiry!</h2>
            <p>Dear ${leadData.customerName},</p>
            <p>We have received your request for ${leadData.selectedService} services.</p>
            <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
            <p><strong>Budget:</strong> ${leadData.budget}</p>
            <p><strong>Timeline:</strong> ${leadData.timeline}</p>
            <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
            <p><strong>Specific Requirements:</strong> ${leadData.specificDetails}</p>
            <p>Our team will contact you within 24 hours to discuss your project.</p>
            <p>Best regards,<br>LeadBot Team</p>
        `;

        // Send email to customer
        await sendEmail(leadData.customerEmail, customerSubject, customerBody);

        // Send emails to tradesmen
        const tradesmenSubject = `New ${leadData.selectedService} Lead - LeadBot`;
        const tradesmenBody = `
            <h2>New Lead Alert!</h2>
            <p><strong>Service:</strong> ${leadData.selectedService}</p>
            <p><strong>Customer:</strong> ${leadData.customerName}</p>
            <p><strong>Email:</strong> ${leadData.customerEmail}</p>
            <p><strong>Phone:</strong> ${leadData.customerPhone}</p>
            <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
            <p><strong>Budget:</strong> ${leadData.budget}</p>
            <p><strong>Timeline:</strong> ${leadData.timeline}</p>
            <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
            <p><strong>Specific Requirements:</strong> ${leadData.specificDetails}</p>
            <p>Please contact the customer as soon as possible.</p>
        `;

        // Get tradesmen from the database for the service
        const tradesmen = tradesmenDB.getTradesmenEmailsForService(leadData.selectedService);
        // Fallback to old system if no tradesmen in database
        const fallbackEmails = getTradesmenEmails(leadData.selectedService);
        const allTradesmen = tradesmen.length > 0 ? tradesmen : fallbackEmails.map(email => ({ email }));

        // Send emails to all relevant tradesmen
        for (const tradesman of allTradesmen) {
            const email = tradesman.email || tradesman.hashedEmail;
            const success = await sendEmail(email, tradesmenSubject, tradesmenBody);
            console.log(`Email sent to ${email}: ${success ? 'Success' : 'Failed'}`);
        }

        res.json({ success: true, message: 'Lead data saved and emails sent successfully' });

    } catch (error) {
        console.error('Error processing lead:', error);
        res.status(500).json({ success: false, message: 'Error processing lead: ' + error.message });
    }
});

// Authentication endpoints
app.post('/api/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        
        // Verify the Google token (simplified for demo)
        // In production, you should properly verify the JWT token
        
        const user = {
            googleId: 'demo-google-id',
            name: 'Demo User',
            email: 'demo@example.com'
        };

        // Check if user exists in database
        const existingUser = tradesmenDB.getUserByGoogleId(user.googleId);
        
        if (existingUser) {
            req.session.user = existingUser;
            res.json({ success: true, user: existingUser });
        } else {
            res.json({ success: false, needsRegistration: true });
        }
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { tradeType, businessName, phone, location } = req.body;
        
        // Register new tradesman
        const newUser = tradesmenDB.registerTradesman({
            googleId: 'demo-google-id',
            name: 'Demo User',
            email: 'demo@example.com',
            tradeType,
            businessName,
            phone,
            location,
            status: 'pending'
        });

        req.session.user = newUser;
        res.json({ success: true, user: newUser });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Admin endpoints
app.get('/api/admin/tradesmen', (req, res) => {
    try {
        const tradesmen = tradesmenDB.getAllTradesmen();
        res.json({ success: true, tradesmen });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tradesmen' });
    }
});

app.post('/api/admin/approve/:googleId', (req, res) => {
    try {
        const { googleId } = req.params;
        tradesmenDB.approveTradesman(googleId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to approve tradesman' });
    }
});

app.post('/api/admin/suspend/:googleId', (req, res) => {
    try {
        const { googleId } = req.params;
        tradesmenDB.suspendTradesman(googleId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to suspend tradesman' });
    }
});

// For Vercel serverless functions
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;