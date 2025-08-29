import { google } from 'googleapis';

export default async (req, res) => {
    try {
        const { leadId, step, emailType, customerEmail } = req.body;
        
        console.log('🎮 Email progress update:', { leadId, step, emailType, customerEmail });
        
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
};

async function updateZoneSheetProgress(leadId, step, emailType, customerEmail) {
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
                    values: [['✅ Completed']]
                }
            });
        }
        
        console.log('✅ Zone sheet progress updated');
        
    } catch (error) {
        console.error('❌ Error updating Zone sheet:', error);
        throw error;
    }
}

async function sendNextEmail(leadId, step, emailType, customerEmail) {
    try {
        // Get customer name from the sheet
        const customerName = await getCustomerName(leadId);
        
        // Determine the next email type to send
        const nextEmailType = getNextEmailType(emailType);
        
        if (nextEmailType) {
            // Send the next email in the sequence
            const response = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/send-gamified-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerEmail,
                    customerName,
                    leadId,
                    emailType: nextEmailType
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ Next email sent:', nextEmailType);
            } else {
                console.error('❌ Failed to send next email:', result.error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error sending next email:', error);
    }
}

async function getCustomerName(leadId) {
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
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
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
        
        const range = `${targetSheet}!A:Z`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });
        
        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return 'Customer';
        }
        
        // Find the row with matching leadId (assuming leadId is in column B, customer name in column C)
        const leadIdColumnIndex = 1; // Column B
        const customerNameColumnIndex = 2; // Column C
        
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][leadIdColumnIndex] === leadId) {
                return rows[i][customerNameColumnIndex] || 'Customer';
            }
        }
        
        return 'Customer';
        
    } catch (error) {
        console.error('❌ Error getting customer name:', error);
        return 'Customer';
    }
}

function getNextEmailType(currentEmailType) {
    const emailSequence = {
        'welcome': 'quote_prepared',
        'quote_prepared': 'tradesman_assigned',
        'tradesman_assigned': 'project_started',
        'project_started': 'project_completed',
        'project_completed': null // End of sequence
    };
    
    return emailSequence[currentEmailType] || null;
}

function getNextStep(currentStep) {
    const nextStep = parseInt(currentStep) + 1;
    return nextStep <= 5 ? nextStep : null;
}
