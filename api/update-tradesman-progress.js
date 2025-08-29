import express from 'express';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Function to get Google Sheets client
async function getSheetsClient() {
    try {
        const keyPath = path.join(__dirname, '..', 'service_account_key.json');
        
        if (fs.existsSync(keyPath)) {
            const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            
            const auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/gmail.send']
            });
            
            const client = await auth.getClient();
            return google.sheets({ version: 'v4', auth: client });
        } else {
            console.log('Service account key not found');
            return null;
        }
    } catch (error) {
        console.error('Error setting up Google Sheets client:', error);
        return null;
    }
}

// Function to get Gmail client
async function getGmailClient() {
    try {
        const keyPath = path.join(__dirname, '..', 'service_account_key.json');
        if (fs.existsSync(keyPath)) {
            const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            
            const auth = new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/gmail.send']
            });
            
            const client = await auth.getClient();
            return google.gmail({ version: 'v1', auth: client });
        } else {
            console.log('Service account key not found for Gmail');
            return null;
        }
    } catch (error) {
        console.error('Error setting up Gmail client:', error);
        return null;
    }
}

// Function to send email using Gmail API
async function sendEmail(to, subject, htmlBody) {
    try {
        const gmail = await getGmailClient();
        if (!gmail) {
            console.log('Gmail client not available');
            return false;
        }

        const keyPath = path.join(__dirname, '..', 'service_account_key.json');
        const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        const fromEmail = keyFile.client_email;

        const message = [
            `To: ${to}`,
            `From: ${fromEmail}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlBody
        ].join('\n');

        const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log('Email sent successfully:', response.data.id);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Function to update tradesman progress in Google Sheets
async function updateTradesmanProgress(customerEmail, step, status) {
    try {
        const sheets = await getSheetsClient();
        if (!sheets) {
            console.log('Sheets client not available');
            return false;
        }

        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        if (!spreadsheetId) {
            console.log('Google Sheets ID not configured');
            return false;
        }

        // First, find the sheet that contains the lead data
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

        console.log(`Using sheet: ${targetSheet}`);

        // Read the sheet to find the row with the customer email
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${targetSheet}!A:Z`
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found in sheet');
            return false;
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
            console.log(`Customer email ${customerEmail} not found in sheet`);
            return false;
        }

        // Determine which column to update based on the step
        let columnToUpdate = '';
        if (step === 'quote_sent') {
            columnToUpdate = 'P'; // Column P for quote sent status
        } else if (step === 'quote_decision') {
            columnToUpdate = 'Q'; // Column Q for quote decision status
        }

        if (!columnToUpdate) {
            console.log(`Unknown step: ${step}`);
            return false;
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
        return true;

    } catch (error) {
        console.error('Error updating tradesman progress:', error);
        return false;
    }
}

// API endpoint to handle tradesman progress updates
router.post('/api/update-tradesman-progress', async (req, res) => {
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
        const sheetUpdated = await updateTradesmanProgress(customerEmail, step, status);

        if (!sheetUpdated) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to update progress in Google Sheets' 
            });
        }

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

export default router;
