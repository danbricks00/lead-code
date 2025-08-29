export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { customerEmail, customerName, leadId, emailType } = req.body;
        
        console.log('🎮 Sending gamified email:', { customerEmail, emailType, leadId });
        
        // Check for required environment variables
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            return res.status(500).json({ 
                error: 'Missing env vars GMAIL_USER or GMAIL_APP_PASSWORD' 
            });
        }

        // Import nodemailer dynamically
        const nodemailer = await import('nodemailer');
        
        // Email configuration
        const transporter = nodemailer.default.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        let emailContent = '';
        let subject = '';

        switch (emailType) {
            case 'welcome':
                subject = '🎉 Welcome to Kiwi Trade - Your Quote Journey Begins!';
                emailContent = generateWelcomeEmail(customerName, leadId);
                break;
            case 'quote_prepared':
                subject = '📋 Your Quote is Ready - Next Steps!';
                emailContent = generateQuotePreparedEmail(customerName, leadId);
                break;
            case 'quote_decision':
                subject = '🤔 Quote Decision - Ready to Proceed?';
                emailContent = generateQuoteDecisionEmail(customerName, leadId);
                break;
            case 'tradesman_assigned':
                subject = '👷 Tradesman Assigned - Project Moving Forward!';
                emailContent = generateTradesmanAssignedEmail(customerName, leadId);
                break;
            case 'project_started':
                subject = '🚀 Project Started - Let\'s Get Building!';
                emailContent = generateProjectStartedEmail(customerName, leadId);
                break;
            case 'project_completed':
                subject = '✅ Project Completed - Thank You!';
                emailContent = generateProjectCompletedEmail(customerName, leadId);
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid email type' });
        }

        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: customerEmail,
            subject: subject,
            html: emailContent
        };

        await transporter.sendMail(mailOptions);
        
        console.log('✅ Gamified email sent successfully');
        res.json({ success: true, message: 'Gamified email sent successfully' });

    } catch (error) {
        console.error('❌ Error sending gamified email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

function generateWelcomeEmail(customerName, leadId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Kiwi Trade</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 100%; width: 33%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .step-circle { width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
            .step-circle.completed { background: #28a745; color: white; }
            .step-circle.pending { background: #e0e0e0; color: #666; border: 2px solid #ccc; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to Kiwi Trade!</h1>
                <p>Hi ${customerName}, your project details have been received!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Quote Journey</h2>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p><strong>Step 1 of 3 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Project Details Sent</strong>
                            <p style="margin: 5px 0 0 0;">Your underfloor heating project details have been received and processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item">
                        <div class="step-circle pending">2</div>
                        <div>
                            <strong>Quote Received</strong>
                            <p style="margin: 5px 0 0 0;">A qualified tradesman will prepare your detailed quote.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item">
                        <div class="step-circle pending">3</div>
                        <div>
                            <strong>Quote Decision</strong>
                            <p style="margin: 5px 0 0 0;">Review and make your decision on the quote.</p>
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 20px;">We're excited to help you with your underfloor heating project! A qualified tradesman will review your details and prepare a comprehensive quote within 24 hours.</p>
                
                <p style="margin-top: 20px;">Best regards,<br>The Kiwi Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateQuotePreparedEmail(customerName, leadId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Quote is Ready</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); height: 100%; width: 66%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .step-circle { width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
            .step-circle.completed { background: #28a745; color: white; }
            .step-circle.pending { background: #e0e0e0; color: #666; border: 2px solid #ccc; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Your Quote is Ready!</h1>
                <p>Hi ${customerName}, your detailed quote has been prepared!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Quote Journey</h2>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p><strong>Step 2 of 3 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Project Details Sent</strong>
                            <p style="margin: 5px 0 0 0;">Your underfloor heating project details have been received and processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Quote Received</strong>
                            <p style="margin: 5px 0 0 0;">Your detailed quote with pricing and timeline has been prepared and sent.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item">
                        <div class="step-circle pending">3</div>
                        <div>
                            <strong>Quote Decision</strong>
                            <p style="margin: 5px 0 0 0;">Review and make your decision on the quote.</p>
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 20px;">Your detailed quote is now ready for review! Please check your email for the complete quote with all pricing details and project timeline.</p>
                
                <p style="margin-top: 20px;">Best regards,<br>The Kiwi Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateQuoteDecisionEmail(customerName, leadId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Decision</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); height: 100%; width: 100%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .step-circle { width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
            .step-circle.completed { background: #28a745; color: white; }
            .step-circle.pending { background: #e0e0e0; color: #666; border: 2px solid #ccc; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤔 Quote Decision Time!</h1>
                <p>Hi ${customerName}, it's time to make your decision!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Quote Journey</h2>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <p><strong>Step 3 of 3 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Project Details Sent</strong>
                            <p style="margin: 5px 0 0 0;">Your underfloor heating project details have been received and processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Quote Received</strong>
                            <p style="margin: 5px 0 0 0;">Your detailed quote with pricing and timeline has been prepared and sent.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Quote Decision</strong>
                            <p style="margin: 5px 0 0 0;">You've made your decision about proceeding with the project.</p>
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 20px;">Thank you for choosing Kiwi Trade! Your decision has been recorded and we'll be in touch soon with next steps.</p>
                
                <p style="margin-top: 20px;">Best regards,<br>The Kiwi Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateTradesmanAssignedEmail(customerName, leadId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tradesman Assigned</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👷 Tradesman Assigned!</h1>
                <p>Hi ${customerName}, your project is moving forward!</p>
            </div>
            
            <div class="content">
                <h2>🎉 Great News!</h2>
                <p>A qualified tradesman has been assigned to your project and will be in touch within 24 hours to discuss scheduling and next steps.</p>
                
                <p style="margin-top: 20px;">Best regards,<br>The Kiwi Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateProjectStartedEmail(customerName, leadId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Started</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Project Started!</h1>
                <p>Hi ${customerName}, let's get building!</p>
            </div>
            
            <div class="content">
                <h2>🎉 Construction Begins!</h2>
                <p>Your underfloor heating project has officially started! The team is on-site and ready to begin installation.</p>
                
                <p style="margin-top: 20px;">Best regards,<br>The Kiwi Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

function generateProjectCompletedEmail(customerName, leadId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Completed</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Project Completed!</h1>
                <p>Hi ${customerName}, congratulations!</p>
            </div>
            
            <div class="content">
                <h2>🎉 Project Successfully Completed!</h2>
                <p>Your underfloor heating installation has been completed successfully! Enjoy your new heating system.</p>
                
                <p style="margin-top: 20px;">Thank you for choosing Kiwi Trade!</p>
                
                <p style="margin-top: 20px;">Best regards,<br>The Kiwi Trade Team</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
