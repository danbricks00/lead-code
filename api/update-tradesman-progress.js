export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { customerEmail, service, step, status } = req.body;

        // Validate required fields
        if (!customerEmail || !service || !step) {
            return res.status(400).json({ 
                error: 'Missing required fields: customerEmail, service, step' 
            });
        }

        // Check for required environment variables
        if (!process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(500).json({ 
                error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
            });
        }

        // Import required modules
        const { google } = await import('googleapis');
        const nodemailer = await import('nodemailer');

        console.log('🔄 Updating tradesman progress:', { customerEmail, service, step, status });

        // Update Google Sheets
        try {
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

            // Find the row with this customer email
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
                range: 'Leads!A:Z',
            });

            const rows = response.data.values || [];
            let customerRowIndex = -1;

            // Find the customer row
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row[3] === customerEmail) { // customerEmail is in column D (index 3)
                    customerRowIndex = i;
                    break;
                }
            }

            if (customerRowIndex === -1) {
                console.log('❌ Customer not found in leads sheet:', customerEmail);
                return res.status(404).json({ 
                    error: 'Customer not found in leads sheet' 
                });
            }

            // Update the appropriate columns based on the step
            let updateRange = '';
            let updateValue = '';

            switch (step) {
                case 'quote_sent':
                    updateRange = `Leads!P${customerRowIndex + 1}`; // Column P
                    updateValue = 'TRUE';
                    break;
                case 'quote_decision':
                    updateRange = `Leads!Q${customerRowIndex + 1}`; // Column Q
                    updateValue = status === 'accepted' ? 'accepted' : 'declined';
                    break;
                default:
                    console.log('⚠️ Unknown step:', step);
                    return res.status(400).json({ 
                        error: 'Unknown step' 
                    });
            }

            // Update the cell
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
                range: updateRange,
                valueInputOption: 'RAW',
                resource: {
                    values: [[updateValue]]
                }
            });

            console.log('✅ Google Sheets updated successfully');

        } catch (sheetsError) {
            console.error('❌ Google Sheets error:', sheetsError);
            // Continue with email sending even if sheets update fails
        }

        // Send admin notification email
        try {
            const transporter = nodemailer.default.createTransport({
                service: 'gmail',
                auth: {
                    user: 'danbricks18@gmail.com',
                    pass: 'ptmcojqgthvjbqom'
                }
            });

            const subject = `Tradesman Progress Update - ${step}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>🔄 Tradesman Progress Update</h2>
                    <p>A tradesman has updated their progress for a customer.</p>
                    
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Progress Details</h3>
                        <p><strong>Customer Email:</strong> ${customerEmail}</p>
                        <p><strong>Service:</strong> ${service}</p>
                        <p><strong>Step:</strong> ${step}</p>
                        <p><strong>Status:</strong> ${status || 'N/A'}</p>
                        <p><strong>Updated:</strong> ${new Date().toLocaleString('en-NZ')}</p>
                    </div>
                    
                    <p style="margin-top: 20px; color: #6b7280;">
                        This is an automated notification from the Kiwi Trade system.
                    </p>
                </div>
            `;

            await transporter.sendMail({
                from: 'danbricks18@gmail.com',
                to: 'danbricks18@gmail.com',
                subject: subject,
                html: html
            });

            console.log('✅ Admin notification email sent successfully');

        } catch (emailError) {
            console.error('❌ Email error:', emailError);
        }

        res.json({ 
            success: true, 
            message: 'Tradesman progress updated successfully' 
        });

    } catch (error) {
        console.error('❌ Update tradesman progress error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
