// Simple Express server example
import express from 'express';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import config from './config.js';
import { getTradesmenEmails } from './tradesmen-config.js';
import oauthConfig from './oauth-config.js';
import tradesmenDB from './tradesmen-db.js';
import fs from 'fs';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Function to send quote email to customer
async function sendQuoteEmail(quoteData, req) {
    try {
        console.log('📧 Sending quote email to customer:', quoteData.customerEmail);
        
        const currentUrl = req.headers.host ? 
            `http://${req.headers.host}` : 
            'http://localhost:3000';

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1>📋 Your Quote is Ready!</h1>
                    <p>Hi ${quoteData.customerName}, your detailed quote has been prepared!</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2>📊 Your Quote Journey</h2>
                    <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); height: 100%; width: 66%; transition: width 0.3s ease;"></div>
                    </div>
                    <p><strong>Step 2 of 3 completed</strong></p>
                    
                    <div style="margin: 20px 0;">
                        <h3>✅ Your Journey Checklist</h3>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                            <div>
                                <strong>Project Details Sent</strong>
                                <p style="margin: 5px 0 0 0;">Your underfloor heating project details have been received and processed.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                            <div>
                                <strong>Quote Received</strong>
                                <p style="margin: 5px 0 0 0;">Your detailed quote with pricing and timeline has been prepared.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc;">○</div>
                            <div>
                                <strong>Quote Decision</strong>
                                <p style="margin: 5px 0 0 0;">Review your quote and decide whether to proceed with the project.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px 5px; display: inline-block;">View Your Quote</a>
                        <a href="${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px 5px; display: inline-block;">Accept Quote</a>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📋 Quote Details</h4>
                        <p>Your quote includes:</p>
                        <ul>
                            <li>Detailed cost breakdown</li>
                            <li>Project timeline (start and completion dates)</li>
                            <li>Materials and specifications</li>
                            <li>Warranty information</li>
                            <li>Payment terms and schedule</li>
                        </ul>
                        <p><strong>Next Steps:</strong> Review the quote and let us know if you'd like to proceed with the project.</p>
                    </div>
                    
                    <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us.</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.companyName}</strong></p>
                </div>
            </div>
        `;

        const success = await sendEmail(quoteData.customerEmail, `Quote ${quoteData.quoteNumber} - ${quoteData.serviceType}`, emailContent);
        
        if (success) {
            console.log('✅ Quote email sent to customer successfully');
            
            // Automatically update tradesman progress to mark "Quote Sent" as completed
            try {
                const updateResponse = await fetch(`${currentUrl}/api/update-tradesman-progress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerEmail: quoteData.customerEmail,
                        service: quoteData.serviceType,
                        step: 'quote_sent',
                        status: 'completed'
                    })
                });
                
                if (updateResponse.ok) {
                    console.log('✅ Tradesman progress updated: Quote Sent marked as completed');
                } else {
                    console.log('⚠️ Failed to update tradesman progress');
                }
            } catch (updateError) {
                console.log('⚠️ Error updating tradesman progress:', updateError.message);
            }
        } else {
            console.log('❌ Failed to send quote email to customer');
        }
        
    } catch (error) {
        console.error('❌ Error sending quote email:', error.message);
    }
}

// Function to send admin quote email
async function sendAdminQuoteEmail(quoteData, req) {
    try {
        console.log('📧 Sending admin copy of quote');
        
        const currentUrl = req.headers.host ? 
            `http://${req.headers.host}` : 
            'http://localhost:3000';

        const commissionRate = 0.10; // 10% commission
        const potentialCommission = parseFloat(quoteData.total) * commissionRate;

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1>📊 New Quote Generated!</h1>
                    <p>Hello Admin, a new quote has been generated and sent to the customer.</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2>📊 Lead Management Journey</h2>
                    <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); height: 100%; width: 75%; transition: width 0.3s ease;"></div>
                    </div>
                    <p><strong>Step 3 of 4 completed</strong></p>
                    
                    <div style="margin: 20px 0;">
                        <h3>✅ Lead Management Checklist</h3>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                            <div>
                                <strong>Lead Captured</strong>
                                <p style="margin: 5px 0 0 0;">New lead details have been captured and stored in the system.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                            <div>
                                <strong>Tradesman Assignment</strong>
                                <p style="margin: 5px 0 0 0;">Lead has been assigned to qualified tradesmen for quote preparation.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                            <div>
                                <strong>Quote Generated</strong>
                                <p style="margin: 5px 0 0 0;">Tradesman has generated and sent quote to customer.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc;">○</div>
                            <div>
                                <strong>Project Won/Lost</strong>
                                <p style="margin: 5px 0 0 0;">Customer will make decision on quote and project status.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📋 Quote Details</h4>
                    <p><strong>Quote ID:</strong> ${quoteData.quoteId}</p>
                    <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                    <p><strong>Customer:</strong> ${quoteData.customerName}</p>
                    <p><strong>Customer Email:</strong> ${quoteData.customerEmail}</p>
                    <p><strong>Service Type:</strong> ${quoteData.serviceType}</p>
                </div>

                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #155724; margin-top: 0;">💰 Financial Details</h4>
                    <p><strong>Total Quote Amount:</strong> $${quoteData.total}</p>
                    <p><strong>Potential Commission (10%):</strong> $${potentialCommission.toFixed(2)}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${currentUrl}/api/generate-quote?quoteId=${quoteData.quoteId}" 
                           style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                            📄 View Full Quote
                    </a>
                </div>

                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h4>🎯 Next Steps</h4>
                        <p><strong>The customer will now review the quote and make their decision.</strong></p>
                        <p>You'll receive another notification when the customer accepts or declines the quote.</p>
                    </div>

                    <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
                </div>
            </div>
        `;

        const adminEmail = 'danbricks18@gmail.com'; // Your admin email
        const success = await sendEmail(adminEmail, `📊 New Quote Generated - ${quoteData.quoteNumber} - $${quoteData.total}`, emailContent);
        
        if (success) {
            console.log('✅ Admin quote email sent successfully');
        } else {
            console.log('❌ Failed to send admin quote email');
        }
        
    } catch (error) {
        console.error('❌ Error sending admin email:', error.message);
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

// Quote generation endpoint
app.post('/api/generate-quote', async (req, res) => {
    try {
        const {
            quoteId,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            serviceType,
            projectDetails,
            tradesmanName,
            tradesmanEmail,
            tradesmanPhone,
            companyName = 'Kiwi Trade ',
            companyAddress = 'Auckland, New Zealand',
            gstNumber = '120-681-729',
            items = []
        } = req.body;

        console.log('📝 Generating quote:', { quoteId, customerName, serviceType });

        // Validate required fields
        if (!quoteId || !customerName || !customerEmail || !serviceType) {
            return res.status(400).json({
                success: false,
                error: 'Quote ID, customer name, email, and service type are required'
            });
        }

        // Generate quote number
        const quoteNumber = `QU-${Date.now().toString().slice(-4)}`;
        
        // Set expiry date (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        // Calculate totals
        let subtotal = 0;
        const processedItems = items.map(item => {
            const amount = parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0);
            subtotal += amount;
            return {
                ...item,
                amount: amount.toFixed(2)
            };
        });

        const gst = subtotal * 0.15;
        const total = subtotal + gst;

        // Create quote data
        const quoteData = {
            quoteId,
            quoteNumber,
            customerName,
            customerEmail,
            customerPhone,
            customerAddress,
            serviceType,
            projectDetails,
            tradesmanName,
            tradesmanEmail,
            tradesmanPhone,
            companyName,
            companyAddress,
            gstNumber,
            items: processedItems,
            subtotal: subtotal.toFixed(2),
            gst: gst.toFixed(2),
            total: total.toFixed(2),
            date: new Date().toISOString().split('T')[0],
            expiryDate: expiryDate.toISOString().split('T')[0],
            status: 'quote_sent'
        };

        // Send email to customer with quote
        await sendQuoteEmail(quoteData, req);

        // Send admin copy for tracking and commission purposes
        await sendAdminQuoteEmail(quoteData, req);

        console.log('✅ Quote generated successfully:', { quoteNumber, total });

        res.json({
            success: true,
            message: 'Quote generated and sent successfully',
            quote: {
                quoteId,
                quoteNumber,
                total: total.toFixed(2),
                customerName,
                customerEmail
            }
        });

    } catch (error) {
        console.error('❌ Quote generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate quote',
            details: error.message
        });
    }
});

// Quote view endpoint
app.get('/api/generate-quote', async (req, res) => {
    try {
        const { quoteId } = req.query;
        
        if (!quoteId) {
            return res.status(400).json({ error: 'Quote ID is required' });
        }

        console.log('🔍 Looking up quote:', quoteId);

        // For now, return a simple quote view since we don't have the full database setup
        const quoteHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quote ${quoteId} - Kiwi Trade</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .actions { text-align: center; margin-bottom: 40px; padding: 20px; background: #f8f9fa; }
                .action-btn { display: inline-block; padding: 15px 30px; margin: 0 10px; text-decoration: none; border-radius: 8px; font-weight: 600; }
                .accept-btn { background: #27ae60; color: white; }
                .decline-btn { background: #e74c3c; color: white; }
                .quote-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            </style>
        </head>
        <body>
            <div class="quote-container">
                <div class="actions">
                    <a href="/api/quote-responses?action=accept&quoteId=${quoteId}" class="action-btn accept-btn">
                        ✅ Accept Quote
                    </a>
                    <a href="/api/quote-responses?action=decline&quoteId=${quoteId}" class="action-btn decline-btn">
                        ❌ Decline Quote
                    </a>
                </div>
                
                <h1>Quote ${quoteId}</h1>
                <p>This is a test quote view. The accept/reject buttons are at the top of the page.</p>
                <p>Quote ID: ${quoteId}</p>
                <p>Status: Quote Sent</p>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(quoteHtml);
    } catch (error) {
        console.error('❌ Error handling quote view:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Quote responses endpoint
app.get('/api/quote-responses', async (req, res) => {
    try {
        const { action, quoteId } = req.query;
        
        if (!action || !quoteId) {
            return res.status(400).json({ error: 'Action and quote ID are required' });
        }

        console.log('📝 Processing quote response:', { action, quoteId });

        const isAccepted = action === 'accept';
        const title = isAccepted ? 'Quote Accepted!' : 'Quote Response Received';
        const message = isAccepted
            ? `Thank you for accepting quote ${quoteId}! A tradesman will contact you soon to arrange the work.`
            : `Thank you for your response to quote ${quoteId}. If you have any questions, please contact us.`;

        const responseHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
                .container { max-width: 600px; margin: 50px auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .icon { font-size: 64px; margin-bottom: 20px; }
                .success { color: #27ae60; }
                .info { color: #3498db; }
                .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; color: #2c3e50; }
                .message { font-size: 16px; margin-bottom: 30px; color: #555; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon ${isAccepted ? 'success' : 'info'}">
                    ${isAccepted ? '✅' : '📋'}
                </div>
                <div class="title">${title}</div>
                <div class="message">${message}</div>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(responseHtml);

    } catch (error) {
        console.error('❌ Quote response error:', error);
        res.status(500).json({ error: 'Failed to process quote response' });
    }
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
            const tradesmenSubject = `🎯 New Lead: ${leadData.selectedService} Project in ${leadData.location}`;
            const tradesmenBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1>🎯 New Lead Received!</h1>
                    <p>Hi there, you have a new ${leadData.selectedService} project opportunity!</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2>📊 Your Lead Journey</h2>
                    <div style="background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; width: 33%; transition: width 0.3s ease;"></div>
                    </div>
                    <p><strong>Step 1 of 3 completed</strong></p>
                    
                    <div style="margin: 20px 0;">
                        <h3>✅ Your Lead Checklist</h3>
                        
                        <div style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background: #d4edda; border-left: 4px solid #28a745;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #28a745; color: white;">✓</div>
                            <div>
                                <strong>Lead Received</strong>
                                <p style="margin: 5px 0 0 0;">New lead details have been received and assigned to you.</p>
                            </div>
                        </div>
                        
                        <div id="quote-sent-step" style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;" onclick="markQuoteSent('${leadData.customerEmail}', '${leadData.selectedService}')">
                            <div id="quote-sent-icon" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc; transition: all 0.3s ease;">○</div>
                            <div>
                                <strong>Quote Sent</strong>
                                <p style="margin: 5px 0 0 0;">Click here when you have sent your quote to the customer.</p>
                            </div>
                        </div>
                        
                        <div id="quote-decision-step" style="display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div id="quote-decision-icon" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; background: #e0e0e0; color: #666; border: 2px solid #ccc; transition: all 0.3s ease;">○</div>
                            <div>
                                <strong>Quote Decision</strong>
                                <p style="margin: 5px 0 0 0;">Customer will review your quote and make their decision.</p>
                                <div style="margin-top: 10px;">
                                    <button onclick="updateQuoteDecision('${leadData.customerEmail}', 'accepted')" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Quote Accepted</button>
                                    <button onclick="updateQuoteDecision('${leadData.customerEmail}', 'declined')" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Quote Declined</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📋 Lead Details</h4>
                        <p><strong>Service Required:</strong> ${leadData.selectedService}</p>
                        <p><strong>Customer Name:</strong> ${leadData.customerName}</p>
                        <p><strong>Customer Email:</strong> ${leadData.customerEmail}</p>
                        <p><strong>Customer Phone:</strong> ${leadData.customerPhone}</p>
                        <p><strong>Location:</strong> ${leadData.location}</p>
                        <p><strong>Project Details:</strong> ${leadData.projectDetails}</p>
                        <p><strong>Project Size:</strong> ${leadData.projectSize}</p>
                        <p><strong>Specific Requirements:</strong> ${leadData.specificDetails}</p>
                        <p><strong>Budget:</strong> ${leadData.budget}</p>
                        <p><strong>Timeline:</strong> ${leadData.timeline}</p>
                        <p><strong>Date Received:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h4>🎯 Next Steps</h4>
                        <p><strong>Please contact the customer directly to discuss this project and prepare your quote.</strong></p>
                        <ul>
                            <li>Review the project requirements carefully</li>
                            <li>Contact the customer within 24 hours</li>
                            <li>Prepare a detailed quote with pricing</li>
                            <li>Submit your quote through the system</li>
                        </ul>
                    </div>
                    
                    <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact the admin team.</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade Team</strong></p>
                </div>
                
                <script>
                function markQuoteSent(customerEmail, service) {
                    const quoteSentStep = document.getElementById('quote-sent-step');
                    const quoteSentIcon = document.getElementById('quote-sent-icon');
                    const progressBar = document.querySelector('.progress-bar-fill');
                    
                    // Update the UI
                    quoteSentIcon.innerHTML = '✓';
                    quoteSentIcon.style.background = '#28a745';
                    quoteSentIcon.style.color = 'white';
                    quoteSentIcon.style.border = 'none';
                    quoteSentStep.style.background = '#d4edda';
                    quoteSentStep.style.borderLeft = '4px solid #28a745';
                    quoteSentStep.style.cursor = 'default';
                    
                    // Update progress bar to 66%
                    if (progressBar) {
                        progressBar.style.width = '66%';
                    }
                    
                    // Update the step text
                    const stepText = quoteSentStep.querySelector('p');
                    stepText.innerHTML = 'Quote has been sent to the customer.';
                    
                    // Disable the click
                    quoteSentStep.onclick = null;
                    
                    // Send update to server
                    fetch('/api/update-tradesman-progress', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            customerEmail: customerEmail,
                            service: service,
                            step: 'quote_sent',
                            status: 'completed'
                        })
                    }).catch(error => console.log('Progress update sent'));
                }
                
                function updateQuoteDecision(customerEmail, decision) {
                    const quoteDecisionStep = document.getElementById('quote-decision-step');
                    const quoteDecisionIcon = document.getElementById('quote-decision-icon');
                    const progressBar = document.querySelector('.progress-bar-fill');
                    
                    if (decision === 'accepted') {
                        // Update UI for accepted
                        quoteDecisionIcon.innerHTML = '✓';
                        quoteDecisionIcon.style.background = '#28a745';
                        quoteDecisionIcon.style.color = 'white';
                        quoteDecisionIcon.style.border = 'none';
                        quoteDecisionStep.style.background = '#d4edda';
                        quoteDecisionStep.style.borderLeft = '4px solid #28a745';
                    } else {
                        // Update UI for declined
                        quoteDecisionIcon.innerHTML = '✗';
                        quoteDecisionIcon.style.background = '#dc3545';
                        quoteDecisionIcon.style.color = 'white';
                        quoteDecisionIcon.style.border = 'none';
                        quoteDecisionStep.style.background = '#f8d7da';
                        quoteDecisionStep.style.borderLeft = '4px solid #dc3545';
                    }
                    
                    // Update progress bar to 100%
                    if (progressBar) {
                        progressBar.style.width = '100%';
                    }
                    
                    // Update the step text
                    const stepText = quoteDecisionStep.querySelector('p');
                    stepText.innerHTML = \`Quote has been \${decision === 'accepted' ? 'accepted' : 'declined'} by the customer.\`;
                    
                    // Remove the buttons
                    const buttonsDiv = quoteDecisionStep.querySelector('div');
                    buttonsDiv.innerHTML = '';
                    
                    // Send update to server
                    fetch('/api/update-tradesman-progress', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            customerEmail: customerEmail,
                            step: 'quote_decision',
                            status: decision
                        })
                    }).catch(error => console.log('Decision update sent'));
                }
                </script>
            </div>
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

// API endpoint to handle tradesman progress updates
app.post('/api/update-tradesman-progress', async (req, res) => {
    try {
        const { customerEmail, service, step, status } = req.body;

        if (!customerEmail || !step || !status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: customerEmail, step, status' 
            });
        }

        console.log(`Updating tradesman progress: ${customerEmail} - ${step} - ${status}`);

        // Update the Google Sheet
        const sheets = await getSheetsClient();
        if (!sheets) {
            return res.status(500).json({ 
                success: false, 
                message: 'Google Sheets client not available' 
            });
        }

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        if (!spreadsheetId) {
            return res.status(500).json({ 
                success: false, 
                message: 'Google Sheets ID not configured' 
            });
        }

        // Find the sheet that contains the lead data
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });

        let targetSheet = null;
        for (const sheet of spreadsheet.data.sheets) {
            const sheetName = sheet.properties.title;
            if (sheetName === 'Zone' || sheetName === 'Leads' || sheetName === 'Sheet1') {
                targetSheet = sheetName;
                break;
            }
        }

        if (!targetSheet) {
            targetSheet = spreadsheet.data.sheets[0].properties.title;
        }

        // Read the sheet to find the row with the customer email
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${targetSheet}!A:Z`
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'No data found in sheet' 
            });
        }

        // Find the row with the customer email
        let targetRow = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][2] === customerEmail) { // Assuming email is in column C (index 2)
                targetRow = i + 1; // Sheets rows are 1-indexed
                break;
            }
        }

        if (targetRow === -1) {
            return res.status(404).json({ 
                success: false, 
                message: `Customer email ${customerEmail} not found in sheet` 
            });
        }

        // Determine which column to update based on the step
        let columnToUpdate = '';
        if (step === 'quote_sent') {
            columnToUpdate = 'P'; // Column P for quote sent status
        } else if (step === 'quote_decision') {
            columnToUpdate = 'Q'; // Column Q for quote decision status
        }

        if (!columnToUpdate) {
            return res.status(400).json({ 
                success: false, 
                message: `Unknown step: ${step}` 
            });
        }

        // Update the cell
        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: `${targetSheet}!${columnToUpdate}${targetRow}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[status]]
            }
        });

        console.log(`Updated ${targetSheet}!${columnToUpdate}${targetRow} with status: ${status}`);

        // If quote was sent, send notification to admin
        if (step === 'quote_sent' && status === 'completed') {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@kiwitrade.co.nz';
            const adminSubject = `📋 Quote Sent: ${service} Project`;
            const adminBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1>📋 Quote Sent!</h1>
                    <p>A tradesman has sent a quote for a ${service} project.</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4>📋 Project Details</h4>
                        <p><strong>Service:</strong> ${service}</p>
                        <p><strong>Customer Email:</strong> ${customerEmail}</p>
                        <p><strong>Quote Status:</strong> Sent</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <p style="margin-top: 30px;">The customer will now review the quote and make their decision.</p>
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
                </div>
            </div>
            `;

            await sendEmail(adminEmail, adminSubject, adminBody);
        }

        // If quote decision was made, send notification to admin
        if (step === 'quote_decision') {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@kiwitrade.co.nz';
            const decisionText = status === 'accepted' ? 'Accepted' : 'Declined';
            const adminSubject = `🎯 Quote Decision: ${decisionText} - ${service} Project`;
            const adminBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, ${status === 'accepted' ? '#28a745 0%, #20c997 100%' : '#dc3545 0%, #fd7e14 100%'}); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1>🎯 Quote ${decisionText}!</h1>
                    <p>The customer has ${status === 'accepted' ? 'accepted' : 'declined'} the quote for the ${service} project.</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                    <div style="background: ${status === 'accepted' ? '#d4edda' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${status === 'accepted' ? '#28a745' : '#dc3545'};">
                        <h4>📋 Project Decision</h4>
                        <p><strong>Service:</strong> ${service}</p>
                        <p><strong>Customer Email:</strong> ${customerEmail}</p>
                        <p><strong>Decision:</strong> <span style="color: ${status === 'accepted' ? '#28a745' : '#dc3545'}; font-weight: bold;">${decisionText}</span></p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    ${status === 'accepted' ? 
                        '<p style="margin-top: 20px;"><strong>🎉 Congratulations! The project is now confirmed and ready to proceed.</strong></p>' :
                        '<p style="margin-top: 20px;"><strong>📝 The project was not accepted. Consider following up with the customer for feedback.</strong></p>'
                    }
                    
                    <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
                </div>
            </div>
            `;

            await sendEmail(adminEmail, adminSubject, adminBody);
        }

        res.json({ 
            success: true, 
            message: 'Tradesman progress updated successfully',
            step: step,
            status: status
        });

    } catch (error) {
        console.error('Error in update-tradesman-progress:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});