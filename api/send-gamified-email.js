import nodemailer from 'nodemailer';

export default async (req, res) => {
    try {
        const { customerEmail, customerName, leadId, emailType } = req.body;
        
        console.log('🎮 Sending gamified email:', { customerEmail, emailType, leadId });
        
        // Email configuration
        const transporter = nodemailer.createTransporter({
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
};

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
                    <div class="progress-fill" id="progress"></div>
                </div>
                <p><strong>Step 1 of 3 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Project Details Sent</strong>
                            <p>Your underfloor heating project details have been received and are being processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item" id="step2">
                        <div class="step-circle pending" id="circle2">○</div>
                        <div>
                            <strong>Quote Received</strong>
                            <p>You'll receive your detailed quote with pricing and timeline within 24 hours.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item" id="step3">
                        <div class="step-circle pending" id="circle3">○</div>
                        <div>
                            <strong>Quote Decision</strong>
                            <p>Review your quote and decide whether to proceed with the project.</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://kiwitrade.co.nz/dashboard" class="btn">View Project Dashboard</a>
                    <a href="mailto:support@kiwitrade.co.nz" class="btn">Contact Support</a>
                </div>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>🎯 What's Next?</h4>
                    <p>Our team is now reviewing your project requirements and will send you a detailed quote within 24 hours. The quote will include:</p>
                    <ul>
                        <li>Detailed pricing breakdown</li>
                        <li>Project timeline and schedule</li>
                        <li>Materials and specifications</li>
                        <li>Warranty information</li>
                        <li>Payment terms and options</li>
                    </ul>
                </div>
            </div>
            
            <div class="footer">
                <p>Lead ID: ${leadId}</p>
                <p>© 2024 Kiwi Trade. All rights reserved.</p>
            </div>
        </div>
        
        <script>
            function markComplete(stepId, emailType) {
                const step = document.getElementById(stepId);
                const circle = step.querySelector('.step-circle');
                
                if (!step.classList.contains('completed')) {
                    step.classList.add('completed');
                    circle.classList.remove('pending');
                    circle.classList.add('completed');
                    circle.innerHTML = '✓';
                    
                    // Update progress bar
                    const progress = document.getElementById('progress');
                    const currentStep = stepId.replace('step', '');
                    const progressPercent = (currentStep / 3) * 100;
                    progress.style.width = progressPercent + '%';
                    
                    // Send completion notification
                    fetch('/api/update-email-progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leadId: '${leadId}',
                            step: currentStep,
                            emailType: emailType,
                            customerEmail: '${customerEmail}'
                        })
                    });
                    
                    // Show completion message
                    setTimeout(() => {
                        alert('🎉 Step completed! You\'ll receive an update shortly.');
                    }, 500);
                }
            }
        </script>
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
                    <div class="progress-fill" id="progress"></div>
                </div>
                <p><strong>Step 2 of 3 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Project Details Sent</strong>
                            <p>Your underfloor heating project details have been received and processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Quote Received</strong>
                            <p>Your detailed quote with pricing and timeline has been prepared.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item" id="step3">
                        <div class="step-circle pending" id="circle3">○</div>
                        <div>
                            <strong>Quote Decision</strong>
                            <p>Review your quote and decide whether to proceed with the project.</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://kiwitrade.co.nz/quote/${leadId}" class="btn">View Your Quote</a>
                    <a href="https://kiwitrade.co.nz/accept-quote/${leadId}" class="btn">Accept Quote</a>
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
            </div>
            
            <div class="footer">
                <p>Lead ID: ${leadId}</p>
                <p>© 2024 Kiwi Trade. All rights reserved.</p>
            </div>
        </div>
        
        <script>
            function markComplete(stepId, emailType) {
                const step = document.getElementById(stepId);
                const circle = step.querySelector('.step-circle');
                
                if (!step.classList.contains('completed')) {
                    step.classList.add('completed');
                    circle.classList.remove('pending');
                    circle.classList.add('completed');
                    circle.innerHTML = '✓';
                    
                    // Update progress bar
                    const progress = document.getElementById('progress');
                    const currentStep = stepId.replace('step', '');
                    const progressPercent = (currentStep / 3) * 100;
                    progress.style.width = progressPercent + '%';
                    
                    // Send completion notification
                    fetch('/api/update-email-progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leadId: '${leadId}',
                            step: currentStep,
                            emailType: emailType,
                            customerEmail: '${customerEmail}'
                        })
                    });
                    
                    // Show completion message
                    setTimeout(() => {
                        alert('🎉 Step completed! You\'ll receive an update shortly.');
                    }, 500);
                }
            }
        </script>
    </body>
    </html>
    `;
}

function generateQuoteDecisionEmail(customerName, leadId) {
    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quote Decision - Kiwi Trade</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); height: 100%; width: 100%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .step-circle { width: 30px; height: 30px; border-radius: 50%; margin-right: 15px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; }
            .step-circle.completed { background: #28a745; color: white; }
            .step-circle.pending { background: #e0e0e0; color: #666; border: 2px solid #ccc; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .decision-buttons { text-align: center; margin: 30px 0; }
            .decision-btn { display: inline-block; padding: 15px 30px; margin: 10px; border-radius: 25px; text-decoration: none; font-weight: bold; }
            .accept-btn { background: #28a745; color: white; }
            .decline-btn { background: #dc3545; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤔 Ready to Proceed?</h1>
                <p>Hi ${customerName}, it's decision time for your project!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Quote Journey</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress"></div>
                </div>
                <p><strong>Step 3 of 3 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Project Details Sent</strong>
                            <p>Your underfloor heating project details have been received and processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Quote Received</strong>
                            <p>Your detailed quote with pricing and timeline has been prepared and sent.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <div class="step-circle completed">✓</div>
                        <div>
                            <strong>Quote Decision</strong>
                            <p>You're now ready to make your decision about proceeding with the project.</p>
                        </div>
                    </div>
                </div>
                
                <div class="decision-buttons">
                    <h3>🎯 What's Your Decision?</h3>
                    <p>Please let us know if you'd like to proceed with your underfloor heating project:</p>
                    
                    <a href="#" class="decision-btn accept-btn" onclick="makeDecision('accept')">✅ Accept Quote & Proceed</a>
                    <a href="#" class="decision-btn decline-btn" onclick="makeDecision('decline')">❌ Decline Quote</a>
                </div>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>💡 Need More Information?</h4>
                    <p>If you have any questions about the quote or need clarification on any aspect of the project, please don't hesitate to contact us:</p>
                    <ul>
                        <li>📞 Call us: 021-000-0000</li>
                        <li>📧 Email us: info@kiwitrade.co.nz</li>
                        <li>💬 Chat with us: Available on our website</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p><strong>Thank you for choosing Kiwi Trade!</strong></p>
                    <p>We're here to make your underfloor heating project a success.</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Lead ID: ${leadId}</p>
                <p style="text-align: center; color: #666; font-size: 12px;">
                    © 2024 Kiwi Trade. All rights reserved.
                </p>
            </div>
        </div>
        
        <script>
            function makeDecision(decision) {
                // Send decision to server
                fetch('/api/update-email-progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        leadId: '${leadId}',
                        emailType: 'quote_decision',
                        decision: decision
                    })
                }).then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(decision === 'accept' ? 'Thank you for accepting! We\'ll be in touch soon.' : 'Thank you for your response. We hope to work with you in the future.');
                    }
                });
            }
        </script>
    </body>
    </html>
    `;
    
    return emailContent;
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
            .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); height: 100%; width: 60%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .checkbox { width: 20px; height: 20px; margin-right: 15px; cursor: pointer; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👷 Tradesman Assigned!</h1>
                <p>Hi ${customerName}, your project has been assigned to a qualified tradesman!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Project Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress"></div>
                </div>
                <p><strong>Step 3 of 5 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Quote Request Submitted</strong>
                            <p>Your underfloor heating quote request has been received and is being processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Quote Preparation</strong>
                            <p>Your detailed quote with pricing and timeline has been prepared.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Tradesman Assignment</strong>
                            <p>A qualified tradesman has been assigned to your project.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item" id="step4">
                        <input type="checkbox" class="checkbox" onclick="markComplete('step4', 'project_started')">
                        <div>
                            <strong>Project Commencement</strong>
                            <p>Work will begin on your underfloor heating installation.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item" id="step5">
                        <input type="checkbox" class="checkbox" onclick="markComplete('step5', 'project_completed')">
                        <div>
                            <strong>Project Completion</strong>
                            <p>Your underfloor heating system will be fully installed and tested.</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://kiwitrade.co.nz/tradesman-profile" class="btn">View Tradesman Profile</a>
                    <a href="https://kiwitrade.co.nz/schedule-consultation" class="btn">Schedule Consultation</a>
                </div>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>👷 Your Tradesman</h4>
                    <p><strong>Name:</strong> John Smith</p>
                    <p><strong>Experience:</strong> 15+ years in underfloor heating installation</p>
                    <p><strong>Specialties:</strong> Electric and hydronic underfloor heating systems</p>
                    <p><strong>Contact:</strong> john.smith@kiwitrade.co.nz | 021-123-4567</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Lead ID: ${leadId}</p>
                <p>© 2024 Kiwi Trade. All rights reserved.</p>
            </div>
        </div>
        
        <script>
            function markComplete(stepId, emailType) {
                const step = document.getElementById(stepId);
                const checkbox = step.querySelector('.checkbox');
                
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    step.classList.add('completed');
                    
                    // Update progress bar
                    const progress = document.getElementById('progress');
                    const currentStep = stepId.replace('step', '');
                    const progressPercent = (currentStep / 5) * 100;
                    progress.style.width = progressPercent + '%';
                    
                    // Send completion notification
                    fetch('/api/update-email-progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leadId: '${leadId}',
                            step: currentStep,
                            emailType: emailType,
                            customerEmail: '${customerEmail}'
                        })
                    });
                    
                    // Show completion message
                    setTimeout(() => {
                        alert('🎉 Step completed! You\'ll receive an update shortly.');
                    }, 500);
                }
            }
        </script>
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
            .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); height: 100%; width: 80%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .checkbox { width: 20px; height: 20px; margin-right: 15px; cursor: pointer; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Project Started!</h1>
                <p>Hi ${customerName}, work has begun on your underfloor heating installation!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Project Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress"></div>
                </div>
                <p><strong>Step 4 of 5 completed</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Quote Request Submitted</strong>
                            <p>Your underfloor heating quote request has been received and is being processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Quote Preparation</strong>
                            <p>Your detailed quote with pricing and timeline has been prepared.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Tradesman Assignment</strong>
                            <p>A qualified tradesman has been assigned to your project.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Project Commencement</strong>
                            <p>Work has begun on your underfloor heating installation.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item" id="step5">
                        <input type="checkbox" class="checkbox" onclick="markComplete('step5', 'project_completed')">
                        <div>
                            <strong>Project Completion</strong>
                            <p>Your underfloor heating system will be fully installed and tested.</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://kiwitrade.co.nz/project-updates/${leadId}" class="btn">View Project Updates</a>
                    <a href="https://kiwitrade.co.nz/contact-tradesman" class="btn">Contact Tradesman</a>
                </div>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>🚧 Current Work</h4>
                    <p><strong>Phase 1:</strong> Site preparation and subfloor inspection</p>
                    <p><strong>Phase 2:</strong> Heating element installation</p>
                    <p><strong>Phase 3:</strong> Floor covering installation</p>
                    <p><strong>Phase 4:</strong> System testing and commissioning</p>
                    <p><strong>Estimated Completion:</strong> 2-3 weeks</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Lead ID: ${leadId}</p>
                <p>© 2024 Kiwi Trade. All rights reserved.</p>
            </div>
        </div>
        
        <script>
            function markComplete(stepId, emailType) {
                const step = document.getElementById(stepId);
                const checkbox = step.querySelector('.checkbox');
                
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    step.classList.add('completed');
                    
                    // Update progress bar
                    const progress = document.getElementById('progress');
                    const currentStep = stepId.replace('step', '');
                    const progressPercent = (currentStep / 5) * 100;
                    progress.style.width = progressPercent + '%';
                    
                    // Send completion notification
                    fetch('/api/update-email-progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leadId: '${leadId}',
                            step: currentStep,
                            emailType: emailType,
                            customerEmail: '${customerEmail}'
                        })
                    });
                    
                    // Show completion message
                    setTimeout(() => {
                        alert('🎉 Step completed! You\'ll receive an update shortly.');
                    }, 500);
                }
            }
        </script>
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
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; margin: 20px 0; overflow: hidden; }
            .progress-fill { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); height: 100%; width: 100%; transition: width 0.3s ease; }
            .checklist { margin: 20px 0; }
            .checklist-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .checkbox { width: 20px; height: 20px; margin-right: 15px; cursor: pointer; }
            .completed { background: #d4edda; border-left: 4px solid #28a745; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; text-decoration: none; border-radius: 25px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Project Completed!</h1>
                <p>Hi ${customerName}, your underfloor heating installation is complete!</p>
            </div>
            
            <div class="content">
                <h2>📊 Your Project Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress"></div>
                </div>
                <p><strong>Step 5 of 5 completed - 100% Complete!</strong></p>
                
                <div class="checklist">
                    <h3>✅ Your Journey Checklist</h3>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Quote Request Submitted</strong>
                            <p>Your underfloor heating quote request has been received and is being processed.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Quote Preparation</strong>
                            <p>Your detailed quote with pricing and timeline has been prepared.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Tradesman Assignment</strong>
                            <p>A qualified tradesman has been assigned to your project.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Project Commencement</strong>
                            <p>Work has begun on your underfloor heating installation.</p>
                        </div>
                    </div>
                    
                    <div class="checklist-item completed">
                        <input type="checkbox" class="checkbox" checked disabled>
                        <div>
                            <strong>Project Completion</strong>
                            <p>Your underfloor heating system has been fully installed and tested.</p>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://kiwitrade.co.nz/warranty-info" class="btn">View Warranty Info</a>
                    <a href="https://kiwitrade.co.nz/leave-review" class="btn">Leave a Review</a>
                </div>
                
                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4>🎉 Congratulations!</h4>
                    <p>Your underfloor heating system is now fully operational. Here's what was completed:</p>
                    <ul>
                        <li>✅ Heating elements installed and tested</li>
                        <li>✅ Floor covering installed</li>
                        <li>✅ Thermostat configured</li>
                        <li>✅ System commissioned and tested</li>
                        <li>✅ Warranty documentation provided</li>
                    </ul>
                    <p><strong>Warranty:</strong> 5 years on heating elements, 2 years on installation</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Lead ID: ${leadId}</p>
                <p>© 2024 Kiwi Trade. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
