export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { leadId, step, emailType, customerEmail } = req.body;
        
        console.log('🎮 Email progress update:', { leadId, step, emailType, customerEmail });
        
        // Check for required environment variables
        if (!process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(500).json({ 
                error: 'Missing env var GOOGLE_SPREADSHEET_ID' 
            });
        }

        // Import required modules
        const { google } = await import('googleapis');
        
        // Update the Zone sheet with progress information
        await updateZoneSheetProgress(leadId, step, emailType, customerEmail);
        
        // Send the next email in the sequence
        await sendNextEmail(leadId, step, emailType, customerEmail);
        
        res.json({ 
            success: true, 
            message: 'Progress updated successfully',
            nextStep: getNextStep(step)
        });

    } catch (error) {
        console.error('❌ Error updating email progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateZoneSheetProgress(leadId, step, emailType, customerEmail) {
    try {
        const { google } = await import('googleapis');

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
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        
        // Find the Zone sheet
        const metadata = await sheets.spreadsheets.get({ spreadsheetId });
        const availableSheets = metadata.data.sheets.map(s => s.properties.title);
        
        let targetSheet = 'Sheet1';
        if (availableSheets.includes('Zone')) {
            targetSheet = 'Zone';
        } else if (availableSheets.includes('Leads')) {
            targetSheet = 'Leads';
        }
        
        // Find the row with this leadId and update the progress
        const range = `${targetSheet}!A:Z`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });
        
        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            throw new Error('No data found in sheet');
        }
        
        // Find the row with matching leadId (assuming leadId is in column B)
        const leadIdColumnIndex = 1; // Column B
        let rowIndex = -1;
        
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][leadIdColumnIndex] === leadId) {
                rowIndex = i + 1; // Sheets API is 1-indexed
                break;
            }
        }
        
        if (rowIndex === -1) {
            throw new Error('Lead not found in sheet');
        }
        
        // Update the progress columns (assuming columns 14-18 are for progress tracking)
        const progressColumns = {
            'welcome': 14,        // Column O
            'quote_prepared': 15, // Column P
            'tradesman_assigned': 16, // Column Q
            'project_started': 17,    // Column R
            'project_completed': 18   // Column S
        };
        
        const columnIndex = progressColumns[emailType];
        if (columnIndex) {
            const updateRange = `${targetSheet}!${String.fromCharCode(65 + columnIndex)}${rowIndex}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: updateRange,
                valueInputOption: 'RAW',
                resource: {
                    values: [['TRUE']]
                }
            });
            
            console.log(`✅ Updated progress for ${emailType} in ${updateRange}`);
        }
        
    } catch (error) {
        console.error('❌ Error updating Zone sheet progress:', error);
        throw error;
    }
}

async function sendNextEmail(leadId, step, emailType, customerEmail) {
    try {
        // Determine the next email type based on current step
        const nextEmailType = getNextEmailType(emailType);
        
        if (nextEmailType) {
            // Import the send-gamified-email API
            const sendGamifiedEmail = await import('./send-gamified-email.js');
            
            // Call the next email API
            const response = await fetch(`${process.env.SITE_URL || 'https://lead-code.vercel.app'}/api/send-gamified-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerEmail: customerEmail,
                    customerName: 'Customer', // You might want to get this from the lead data
                    leadId: leadId,
                    emailType: nextEmailType
                })
            });
            
            if (response.ok) {
                console.log(`✅ Sent next email: ${nextEmailType}`);
            } else {
                console.error(`❌ Failed to send next email: ${nextEmailType}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error sending next email:', error);
        // Don't throw error here as it's not critical
    }
}

function getNextStep(currentStep) {
    const steps = ['welcome', 'quote_prepared', 'quote_decision'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
        return steps[currentIndex + 1];
    }
    
    return null;
}

function getNextEmailType(currentEmailType) {
    const emailSequence = {
        'welcome': 'quote_prepared',
        'quote_prepared': 'quote_decision',
        'quote_decision': null // End of sequence
    };
    
    return emailSequence[currentEmailType] || null;
}
