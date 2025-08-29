export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const leadData = req.body;
        console.log('📝 Lead intake request received:', leadData);

        // Validate required fields
        if (!leadData.customerName || !leadData.customerEmail || !leadData.customerPhone) {
            return res.status(400).json({ 
                ok: false, 
                error: 'Missing required fields: name, email, phone' 
            });
        }

        // Check for required environment variables
        if (!process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(500).json({ 
                ok: false, 
                error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
            });
        }

        // Process lead data to match expected format
        const processedLeadData = {
            customerName: leadData.customerName,
            customerEmail: leadData.customerEmail,
            customerPhone: leadData.customerPhone,
            selectedService: leadData.selectedService || 'underfloor_heating',
            projectDetails: leadData.projectDetails || `Areas: ${leadData.areasCount || '1'}; Sizes: ${leadData.areaSizes || '12'}`,
            projectSize: leadData.projectSize || leadData.areaSizes || '12',
            location: leadData.location || 'Not specified',
            budget: leadData.budget || 'Not specified',
            timeline: leadData.timeline || 'Not specified',
            specificDetails: leadData.specificDetails || ''
        };

        console.log('📝 Processed lead data:', processedLeadData);

        // Import required modules
        const { google } = await import('googleapis');
        const nodemailer = await import('nodemailer');

        // Get Google Sheets client
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Generate unique lead ID
        const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Prepare data for Google Sheets
        const rowData = [
            leadId,
            processedLeadData.customerName,
            processedLeadData.customerEmail,
            processedLeadData.customerPhone,
            processedLeadData.selectedService,
            processedLeadData.projectDetails,
            processedLeadData.projectSize,
            processedLeadData.location,
            processedLeadData.budget,
            processedLeadData.timeline,
            processedLeadData.specificDetails,
            new Date().toISOString(),
            'New',
            'Pending'
        ];

        console.log('📊 Appending to Google Sheets:', rowData);

        // Append to Leads sheet
        const appendResponse = await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Leads!A:N',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [rowData]
            }
        });

        console.log('✅ Lead appended to Google Sheets:', appendResponse.data);

        // Send notification emails
        try {
            // Send customer confirmation email
            const customerTransporter = nodemailer.default.createTransporter({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                    pass: process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            const customerMailOptions = {
                from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                to: processedLeadData.customerEmail,
                subject: '🎯 Your Kiwi Trade Lead Has Been Received!',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">🎯 Thank You for Your Interest!</h2>
                        <p>Hi ${processedLeadData.customerName},</p>
                        <p>We've received your underfloor heating project enquiry and our team is working to match you with the perfect tradesman.</p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">📋 Project Details:</h3>
                            <p><strong>Service:</strong> ${processedLeadData.selectedService}</p>
                            <p><strong>Project:</strong> ${processedLeadData.projectDetails}</p>
                            <p><strong>Location:</strong> ${processedLeadData.location}</p>
                            <p><strong>Timeline:</strong> ${processedLeadData.timeline}</p>
                        </div>
                        
                        <p>You'll receive a quote from a qualified tradesman within 24 hours.</p>
                        <p>Best regards,<br>The Kiwi Trade Team</p>
                    </div>
                `
            };

            await customerTransporter.sendMail(customerMailOptions);
            console.log('✅ Customer notification email sent');

            // Send admin notification email
            const adminTransporter = nodemailer.default.createTransporter({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                    pass: process.env.GMAIL_APP_PASSWORD || 'ptmcojqgthvjbqom'
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            const adminMailOptions = {
                from: process.env.GMAIL_USER || 'danbricks18@gmail.com',
                to: process.env.ADMIN_EMAIL || 'danbricks18@gmail.com',
                subject: `🎯 New Lead: ${processedLeadData.customerName} - ${processedLeadData.selectedService}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">🎯 New Lead Received!</h2>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">📋 Lead Details:</h3>
                            <p><strong>Lead ID:</strong> ${leadId}</p>
                            <p><strong>Customer:</strong> ${processedLeadData.customerName}</p>
                            <p><strong>Email:</strong> ${processedLeadData.customerEmail}</p>
                            <p><strong>Phone:</strong> ${processedLeadData.customerPhone}</p>
                            <p><strong>Service:</strong> ${processedLeadData.selectedService}</p>
                            <p><strong>Project:</strong> ${processedLeadData.projectDetails}</p>
                            <p><strong>Location:</strong> ${processedLeadData.location}</p>
                            <p><strong>Timeline:</strong> ${processedLeadData.timeline}</p>
                        </div>
                        
                        <p>Please assign this lead to an appropriate tradesman.</p>
                    </div>
                `
            };

            await adminTransporter.sendMail(adminMailOptions);
            console.log('✅ Admin notification email sent');

        } catch (emailError) {
            console.error('❌ Email sending error:', emailError);
            // Don't fail the entire request if emails fail
        }

        res.json({ 
            ok: true, 
            leadId: leadId,
            quoteLink: `/quote/${leadId}`,
            message: 'Lead submitted successfully. A qualified tradesman will contact you within 24 hours.'
        });

    } catch (error) {
        console.error('❌ Lead intake error:', error);
        res.status(500).json({ 
            ok: false, 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
