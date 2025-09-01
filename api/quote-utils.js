// Utility function to coerce numeric fields
export function coerceNumeric(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// Unified function to fetch quote data with proper error handling
export async function fetchQuoteData(quoteId) {
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return null;
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get available sheets to find the correct one to use
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // Search for the quote across ALL columns in each row
    console.log(`🔍 Searching for quote ID: "${quoteId}" across all columns`);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Search for the quoteId in ANY column of this row
      let foundQuoteId = null;
      let foundColumnIndex = -1;
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === quoteId) {
          foundQuoteId = cellValue;
          foundColumnIndex = colIndex;
          break;
        }
      }
      
      if (foundQuoteId === quoteId) {
        console.log(`✅ Found quote in row ${i + 1}, column ${foundColumnIndex} (${String.fromCharCode(65 + foundColumnIndex)})`);
        
        // Found the quote! Now map the data using exact column indices from quote submission
        // Based on the quote submission order: timestamp, quoteId, leadId, customerName, customerEmail, customerPhone, tradesmanName, tradesmanEmail, tradesmanPhone, serviceType, projectDetails, projectSize, location, budget, timeline, specificDetails, quoteAmount, labourRate, labourHours, labourSubtotal, materialRate, materialSQM, materialSubtotal, installationAmount, installationSubtotal, breakdown, notes, validUntil, status, onlineQuoteUrl, acceptUrl, declineUrl
        const mappedData = {
          timestamp: row[0] || '',
          quoteId: foundQuoteId,
          leadId: row[2] || '', // Column C
          customerName: row[3] || '', // Column D
          customerEmail: row[4] || '', // Column E
          customerPhone: row[5] || '', // Column F
          tradesmanName: row[6] || '', // Column G
          tradesmanEmail: row[7] || '', // Column H
          tradesmanPhone: row[8] || '', // Column I
          serviceType: row[9] || '', // Column J
          projectDetails: row[10] || '', // Column K
          projectSize: row[11] || '', // Column L
          location: row[12] || '', // Column M
          budget: coerceNumeric(row[13]), // Column N
          timeline: row[14] || '', // Column O
          specificDetails: row[15] || '', // Column P
          quoteAmount: coerceNumeric(row[16]), // Column Q
          labourRate: coerceNumeric(row[17]), // Column R
          labourHours: coerceNumeric(row[18]), // Column S
          labourSubtotal: coerceNumeric(row[19]), // Column T
          materialRate: coerceNumeric(row[20]), // Column U
          materialSQM: coerceNumeric(row[21]), // Column V
          materialSubtotal: coerceNumeric(row[22]), // Column W
          installationAmount: coerceNumeric(row[23]), // Column X
          installationSubtotal: coerceNumeric(row[24]), // Column Y
          breakdown: row[25] || '', // Column Z
          notes: row[26] || '', // Column AA
          validUntil: row[27] || '', // Column AB
          status: row[28] || 'pending', // Column AC
          onlineQuoteUrl: row[29] || '', // Column AD
          acceptUrl: row[30] || '', // Column AE
          declineUrl: row[31] || '' // Column AF
        };

        console.log('✅ Quote data mapped successfully:', {
          quoteId: mappedData.quoteId,
          customerName: mappedData.customerName,
          quoteAmount: mappedData.quoteAmount,
          status: mappedData.status
        });

        return mappedData;
      }
    }

    console.log('❌ Quote not found in any row');
    return null;

  } catch (error) {
    console.error('❌ Error fetching quote data:', error);
    return null;
  }
}

// Unified function to fetch lead data with proper error handling
export async function fetchLeadData(leadId) {
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return null;
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get available sheets to find the correct one to use
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Find the correct sheet to use (prefer 'Leads', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Leads')) {
      targetSheet = 'Leads';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return null;
    }

    // Search for the lead across ALL columns in each row
    console.log(`🔍 Searching for lead ID: "${leadId}" across all columns`);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Search for the leadId in ANY column of this row
      let foundLeadId = null;
      let foundColumnIndex = -1;
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === leadId) {
          foundLeadId = cellValue;
          foundColumnIndex = colIndex;
          break;
        }
      }
      
      if (foundLeadId === leadId) {
        console.log(`✅ Found lead in row ${i + 1}, column ${foundColumnIndex} (${String.fromCharCode(65 + foundColumnIndex)})`);
        
        // Found the lead! Now map the data using exact column indices from lead intake
        // Based on the lead intake order: timestamp, leadId, customerName, customerEmail, customerPhone, selectedService, projectDetails, projectSize, location, budget, timeline, specificDetails
        const mappedData = {
          timestamp: row[0] || '',
          leadId: foundLeadId,
          customerName: row[2] || '', // Column C
          customerEmail: row[3] || '', // Column D
          customerPhone: row[4] || '', // Column E
          selectedService: row[5] || '', // Column F
          projectDetails: row[6] || '', // Column G
          projectSize: row[7] || '', // Column H
          location: row[8] || '', // Column I
          budget: row[9] || '', // Column J
          timeline: row[10] || '', // Column K
          specificDetails: row[11] || '' // Column L
        };

        console.log('✅ Lead data mapped successfully:', {
          leadId: mappedData.leadId,
          customerName: mappedData.customerName,
          selectedService: mappedData.selectedService
        });

        return mappedData;
      }
    }

    console.log('❌ Lead not found in any row');
    return null;

  } catch (error) {
    console.error('❌ Error fetching lead data:', error);
    return null;
  }
}

// Unified function to check quote decision state (keyed by quoteId + leadId)
export async function checkQuoteDecisionState(quoteId, leadId) {
  try {
    const quoteData = await fetchQuoteData(quoteId);
    if (!quoteData) {
      return { found: false, status: null, message: 'Quote not found' };
    }

    // Verify the quote belongs to the correct lead
    if (quoteData.leadId !== leadId) {
      return { found: false, status: null, message: 'Quote does not match lead' };
    }

    const status = quoteData.status || 'Pending';
    const isDecided = status === 'Accepted' || status === 'Declined';
    
    return {
      found: true,
      status: status,
      isDecided: isDecided,
      message: isDecided ? `Quote already ${status.toLowerCase()}` : 'Quote pending decision'
    };
  } catch (error) {
    console.error('Error checking quote decision state:', error);
    return { found: false, status: null, message: 'Error checking quote state' };
  }
}

// Unified function to update quote status
export async function updateQuoteStatus(quoteId, status) {
  try {
    // Check if we have the required environment variables
    const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
      console.log('⚠️ Google Sheets credentials not found');
      return false;
    }

    const { google } = await import('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: serviceAccountEmail,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get available sheets to find the correct one to use
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });
    
    const availableSheets = metadata.data.sheets.map(s => s.properties.title);
    
    // Find the correct sheet to use (prefer 'Quotes', fallback to 'Sheet1', then first sheet)
    let targetSheet = 'Sheet1'; // Default fallback
    if (availableSheets.includes('Quotes')) {
      targetSheet = 'Quotes';
    } else if (availableSheets.includes('Sheet1')) {
      targetSheet = 'Sheet1';
    } else if (availableSheets.length > 0) {
      targetSheet = availableSheets[0];
    }

    // Read all data to find the row with the matching quoteId
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet');
      return false;
    }

    // Find the row with the matching quoteId by searching all columns
    let targetRow = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Search for the quoteId in ANY column of this row
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        if (cellValue === quoteId) {
          targetRow = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }
      
      if (targetRow !== -1) break;
    }

    if (targetRow === -1) {
      console.log(`Quote ID ${quoteId} not found in sheet`);
      return false;
    }

    // Status is in column 29 (AC) - 0-indexed is 28
    const statusColumn = 29; // Column AC

    // Convert column number to letter (1=A, 2=B, ..., 26=Z, 27=AA, 28=AB, 29=AC)
    function columnToLetter(column) {
      let result = '';
      while (column > 0) {
        column--;
        result = String.fromCharCode(65 + (column % 26)) + result;
        column = Math.floor(column / 26);
      }
      return result;
    }

    const statusColumnLetter = columnToLetter(statusColumn);

    // Update the status in the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: `${targetSheet}!${statusColumnLetter}${targetRow}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[status]]
      }
    });

    console.log(`✅ Updated quote status to "${status}" for quote ${quoteId} at row ${targetRow}`);
    return true;

  } catch (error) {
    console.error('Error updating quote status:', error);
    return false;
  }
}

// Unified function to generate quote PDF content (HTML)
export function generateQuotePdfContent(leadData, quoteData = null) {
  // Generate professional quote HTML matching the sample format
  const quoteNumber = quoteData?.quoteId || `QUOTE${Date.now()}`;
  const currentDate = new Date().toLocaleDateString('en-GB');
  
  // Use custom valid until date if provided, otherwise default to 30 days
  let validUntil;
  if (quoteData?.validUntil) {
    validUntil = new Date(quoteData.validUntil).toLocaleDateString('en-GB');
  } else {
    validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');
  }
  
  // Use quote data if available, otherwise fallback to budget calculations
  // All amounts are coerced to numbers for consistency
  let materials, labor, installation, total;
  if (quoteData) {
    materials = coerceNumeric(quoteData.materialSubtotal);
    labor = coerceNumeric(quoteData.labourSubtotal);
    installation = coerceNumeric(quoteData.installationSubtotal);
    total = coerceNumeric(quoteData.quoteAmount);
  } else {
    // Calculate totals based on budget (fallback if no quote data)
    const budget = coerceNumeric(leadData.budget) || 5000;
    materials = Math.round(budget * 0.6);
    labor = Math.round(budget * 0.3);
    installation = Math.round(budget * 0.1);
    total = materials + labor + installation;
  }
  
  const content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote - ${leadData.customerName}</title>
         <style>
         body { 
             font-family: Arial, sans-serif; 
             margin: 15px; 
             line-height: 1.4;
             color: #333;
             font-size: 12px;
         }
         .header { 
             text-align: center; 
             border-bottom: 2px solid #2c3e50; 
             padding-bottom: 10px; 
             margin-bottom: 15px; 
         }
         .company-name {
             font-size: 20px;
             font-weight: bold;
             color: #2c3e50;
             margin-bottom: 3px;
         }
         .quote-title {
             font-size: 18px;
             font-weight: bold;
             color: #34495e;
             margin-bottom: 8px;
         }
         .quote-info {
             display: flex;
             justify-content: space-between;
             margin-bottom: 15px;
             flex-wrap: wrap;
             gap: 10px;
         }
         .customer-details, .tradesman-details {
             flex: 1;
             min-width: 250px;
             margin-bottom: 10px;
         }
         .details-title {
             font-size: 14px;
             font-weight: bold;
             color: #2c3e50;
             border-bottom: 1px solid #3498db;
             padding-bottom: 3px;
             margin-bottom: 8px;
         }
         .detail-row {
             margin: 4px 0;
             display: flex;
             font-size: 11px;
         }
         .detail-label {
             font-weight: bold;
             width: 80px;
             flex-shrink: 0;
         }
         .detail-value {
             flex: 1;
         }
         .breakdown-section {
             margin: 15px 0;
         }
         .breakdown-title {
             font-size: 16px;
             font-weight: bold;
             color: #2c3e50;
             margin-bottom: 8px;
         }
         .breakdown-table {
             width: 100%;
             border-collapse: collapse;
             margin-bottom: 10px;
             font-size: 11px;
         }
         .breakdown-table th {
             background-color: #34495e;
             color: white;
             padding: 6px;
             text-align: left;
             font-weight: bold;
             font-size: 11px;
         }
         .breakdown-table td {
             padding: 6px;
             border-bottom: 1px solid #ddd;
             font-size: 11px;
         }
         .breakdown-table tr:nth-child(even) {
             background-color: #f8f9fa;
         }
         .total-section {
             text-align: right;
             margin: 10px 0;
         }
         .total-amount {
             font-size: 18px;
             font-weight: bold;
             color: #27ae60;
         }
         .notes-section {
             margin: 15px 0;
         }
         .notes-title {
             font-size: 14px;
             font-weight: bold;
             color: #2c3e50;
             margin-bottom: 5px;
         }
         .footer {
             margin-top: 20px;
             text-align: center;
             padding: 10px;
             background-color: #f8f9fa;
             border-radius: 4px;
             font-size: 10px;
         }
         .footer-text {
             font-size: 10px;
             color: #666;
             margin: 2px 0;
         }
         @media print {
             body { 
                 margin: 10px; 
                 font-size: 11px;
             }
             .header { 
                 margin-bottom: 10px; 
                 padding-bottom: 8px;
             }
             .company-name { font-size: 18px; }
             .quote-title { font-size: 16px; }
             .quote-info { margin-bottom: 10px; }
             .details-title { font-size: 12px; margin-bottom: 5px; }
             .detail-row { margin: 2px 0; font-size: 10px; }
             .breakdown-section { margin: 10px 0; }
             .breakdown-title { font-size: 14px; margin-bottom: 5px; }
             .breakdown-table { margin-bottom: 8px; }
             .breakdown-table th, .breakdown-table td { 
                 padding: 4px; 
                 font-size: 10px; 
             }
             .total-amount { font-size: 16px; }
             .notes-section { margin: 10px 0; }
             .notes-title { font-size: 12px; margin-bottom: 3px; }
             .footer { 
                 margin-top: 15px; 
                 padding: 8px; 
                 font-size: 9px; 
             }
             .footer-text { font-size: 9px; margin: 1px 0; }
         }
     </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Kiwi Trade</div>
        <div class="quote-title">QUOTE</div>
        <div style="display: flex; justify-content: space-between; max-width: 600px; margin: 0 auto;">
            <div><strong>Quote Number:</strong> ${quoteNumber}</div>
            <div><strong>Date:</strong> ${currentDate}</div>
            <div><strong>Valid Until:</strong> ${validUntil}</div>
        </div>
    </div>
    
    <div class="quote-info">
        <div class="customer-details">
            <div class="details-title">Customer Details</div>
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${quoteData?.customerName || leadData.customerName || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${quoteData?.customerEmail || leadData.customerEmail || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${quoteData?.customerPhone || leadData.customerPhone || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${quoteData?.location || leadData.location || 'Not provided'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Timeline:</span>
                <span class="detail-value">${quoteData?.timeline || leadData.timeline || 'Not specified'}</span>
            </div>
        </div>
        
        <div class="tradesman-details">
            <div class="details-title">Tradesman Details</div>
            <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">${quoteData?.tradesmanName || 'Kiwi Underfloor Heating'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${quoteData?.tradesmanEmail || 'info@kiwitrade.co.nz'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${quoteData?.tradesmanPhone || '021 123 456'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${quoteData?.serviceType || leadData.selectedService || 'Underfloor Heating'}</span>
            </div>
        </div>
    </div>
    
    <div class="breakdown-section">
        <div class="breakdown-title">Quote Breakdown</div>
                            <table class="breakdown-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Description</th>
                                <th>Rate per Hour/Unit</th>
                                <th>Amount of Hours/Unit</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materials > 0 ? `
                            <tr>
                                <td>Materials</td>
                                <td>Underfloor heating materials and components</td>
                                <td>$${quoteData ? coerceNumeric(quoteData.materialRate).toFixed(2) : (leadData.budget ? (coerceNumeric(leadData.budget) * 0.6 / 25).toFixed(2) : '120.00')} per SQM</td>
                                <td>${quoteData ? coerceNumeric(quoteData.materialSQM).toFixed(1) : (leadData.projectSize ? coerceNumeric(leadData.projectSize) : '25')} SQM</td>
                                <td>$${materials.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${labor > 0 ? `
                            <tr>
                                <td>Labor</td>
                                <td>Professional installation services</td>
                                <td>$${quoteData ? coerceNumeric(quoteData.labourRate).toFixed(2) : (leadData.budget ? (coerceNumeric(leadData.budget) * 0.3 / 8).toFixed(2) : '56.25')} per hour</td>
                                <td>${quoteData ? coerceNumeric(quoteData.labourHours).toFixed(1) : '8'} hours</td>
                                <td>$${labor.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${installation > 0 ? `
                            <tr>
                                <td>Installation</td>
                                <td>System setup and configuration</td>
                                <td>Fixed cost</td>
                                <td>-</td>
                                <td>$${installation.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
        
                            <div class="total-section">
                        <div class="total-amount">Total Amount: $${total.toFixed(2)}</div>
                    </div>
    </div>
    
    ${leadData.specificDetails ? `
    <div class="notes-section">
        <div class="notes-title">Additional Notes</div>
        <p>${leadData.specificDetails}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <div class="footer-text">Kiwi Trade</div>
        <div class="footer-text">Professional underfloor heating solutions for your home</div>
        <div class="footer-text">This quote was generated using our automated system</div>
        <div class="footer-text">Thank you for choosing Kiwi Trade!</div>
        <div class="footer-text" style="margin-top: 15px; font-size: 12px;">Lead ID: ${leadData.leadId}</div>
    </div>
</body>
</html>
  `;
  
  return content;
}

// Unified function to generate quote PDF buffer for email attachments
export async function generateQuotePdfBuffer({ leadId, token, quoteId, quoteData: passedQuoteData }) {
  try {
    // Use passed quote data if available, otherwise try to fetch it
    let quoteData = passedQuoteData;
    if (!quoteData && quoteId) {
      quoteData = await fetchQuoteData(quoteId);
    }
    
    // Fallback to lead data if no quote data found
    const leadData = quoteData || await fetchLeadData(leadId);
    if (!leadData) {
      throw new Error('Lead not found');
    }

    // Generate HTML content using the unified function
    const htmlContent = generateQuotePdfContent(leadData, quoteData);
    
    // Return HTML content as buffer for email attachments
    const buffer = Buffer.from(htmlContent, 'utf8');
    return buffer;
  } catch (error) {
    console.error('Error generating quote document buffer:', error);
    throw error;
  }
}
