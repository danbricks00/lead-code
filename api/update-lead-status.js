import { google } from 'googleapis';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, newStatus, tradesmanEmail } = req.body;
    console.log('📊 Update lead status request:', { leadId, newStatus, tradesmanEmail });

    if (!leadId || !newStatus || !tradesmanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID, new status, and tradesman email are required'
      });
    }

    // Validate status
    const validStatuses = ['received', 'contacted', 'completed', 'rejected'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: received, contacted, completed, rejected'
      });
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    const spreadsheetId = process.env.GOOGLE_SPEADSHEET_ID;

    if (!spreadsheetId) {
      console.log('❌ No spreadsheet ID configured');
      return res.status(500).json({
        success: false,
        error: 'Google Sheets not configured'
      });
    }

    // Read all data to find the lead
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Sheet1!A:Z'
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No leads found'
      });
    }

    // Find the lead by timestamp (assuming timestamp is unique identifier)
    let leadRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Use timestamp as lead ID (first column or timestamp column)
      if (row[0] === leadId || row.includes(leadId)) {
        leadRowIndex = i;
        break;
      }
    }

    if (leadRowIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    // Check if status column exists, if not add it
    const headers = rows[0];
    let statusColumnIndex = headers.findIndex(h => h.toLowerCase().includes('status'));
    
    if (statusColumnIndex === -1) {
      // Add status column
      statusColumnIndex = headers.length;
      const newHeaderRange = `Sheet1!${String.fromCharCode(65 + statusColumnIndex)}1`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: newHeaderRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Status']]
        }
      });
    }

    // Update the status
    const statusCell = `Sheet1!${String.fromCharCode(65 + statusColumnIndex)}${leadRowIndex + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: statusCell,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newStatus]]
      }
    });

    // Add a note about who updated it and when
    const noteColumnIndex = headers.findIndex(h => h.toLowerCase().includes('notes')) !== -1 
      ? headers.findIndex(h => h.toLowerCase().includes('notes'))
      : headers.length;

    if (noteColumnIndex === headers.length) {
      // Add notes column
      const newNoteHeaderRange = `Sheet1!${String.fromCharCode(65 + noteColumnIndex)}1`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: newNoteHeaderRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Notes']]
        }
      });
    }

    const noteCell = `Sheet1!${String.fromCharCode(65 + noteColumnIndex)}${leadRowIndex + 1}`;
    const currentNote = rows[leadRowIndex][noteColumnIndex] || '';
    const newNote = `${currentNote ? currentNote + '; ' : ''}Status updated to ${newStatus} by ${tradesmanEmail} on ${new Date().toLocaleString()}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: noteCell,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newNote]]
      }
    });

    console.log('✅ Lead status updated successfully');
    
    return res.json({
      success: true,
      message: 'Lead status updated successfully',
      leadId: leadId,
      newStatus: newStatus,
      updatedBy: tradesmanEmail
    });

  } catch (error) {
    console.error('❌ Error updating lead status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead status',
      details: error.message
    });
  }
} 