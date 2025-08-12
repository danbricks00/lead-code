import { google } from 'googleapis';
import puppeteer from 'puppeteer';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';

export default async function handler(req, res) {
  console.log('🔍 Quote submission API called:', req.method, req.url);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

    if (req.method === 'GET') {
    // Show quote submission form with pre-filled data from lead
    const { 
      quoteId, 
      leadId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      serviceType, 
      projectDetails, 
      projectSize, 
      budget, 
      timeline, 
      location 
    } = req.query;
    
    return res.status(200).send(`
    <!DOCTYPE html>
      <html>
    <head>
        <title>Submit Quote - ${leadId || quoteId}</title>
      <style>
          body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input, textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
          .quote-details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          .customer-info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #2196f3; }
          .readonly { background-color: #f5f5f5; }
          
          .breakdown-section {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border: 1px solid #e9ecef;
          }
          
          .breakdown-section h4 {
              margin: 0 0 15px 0;
              color: #495057;
              border-bottom: 2px solid #007bff;
              padding-bottom: 5px;
          }
          
          .breakdown-row {
              display: flex;
              gap: 15px;
              align-items: end;
          }
          
          .breakdown-col {
              flex: 1;
          }
          
          .total-section {
              background: #e8f5e8;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border: 2px solid #28a745;
          }
          
          .total-section h4 {
              margin: 0 0 15px 0;
              color: #155724;
              font-size: 1.2em;
          }
          
          .total-row {
              display: flex;
              align-items: center;
              gap: 15px;
          }
          
          .total-row label {
              flex: 1;
              margin: 0;
          }
          
          .total-row input {
              flex: 1;
              font-size: 1.1em;
              font-weight: bold;
              background-color: #d4edda;
              border-color: #28a745;
          }
          
          .breakdown-col input[readonly] {
              background-color: #f8f9fa;
              border-color: #6c757d;
              color: #495057;
              font-weight: 600;
          }
          
          .calculating {
              background-color: #fff3cd !important;
              border-color: #ffc107 !important;
          }
          
          @media (max-width: 768px) {
              .breakdown-row {
                  flex-direction: column;
                  gap: 10px;
              }
              
              .total-row {
                  flex-direction: column;
                  gap: 10px;
              }
          }
      </style>
    </head>
    <body>
          <h1>Submit Quote</h1>
        
        ${leadId ? `
        <div class="customer-info">
          <h3>📋 Customer Information (Pre-filled from Lead)</h3>
          <p><strong>Lead ID:</strong> ${leadId}</p>
          <p><strong>Customer:</strong> ${customerName || 'Not provided'}</p>
          <p><strong>Service:</strong> ${serviceType || 'Not specified'}</p>
          <p><strong>Location:</strong> ${location || 'Not specified'}</p>
          <p><strong>Project Size:</strong> ${projectSize || 'Not specified'}</p>
          <p><strong>Budget:</strong> ${budget || 'Not specified'}</p>
          <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
        </div>
        ` : `
        <div class="quote-details">
          <h3>Quote ID: ${quoteId}</h3>
          <p>Please fill in your quote details below:</p>
        </div>
        `}

        <form id="quoteForm">
          <div class="form-group">
            <label for="tradesmanName">Your Name/Company:</label>
            <input type="text" id="tradesmanName" name="tradesmanName" required>
          </div>
          
          <div class="form-group">
            <label for="tradesmanPhone">Your Phone:</label>
            <input type="tel" id="tradesmanPhone" name="tradesmanPhone" required>
          </div>

          <div class="form-group">
            <label for="tradesmanEmail">Your Email:</label>
            <input type="email" id="tradesmanEmail" name="tradesmanEmail" required>
          </div>

          <div class="form-group">
            <label for="quoteNumber">Quote Number:</label>
            <input type="text" id="quoteNumber" name="quoteNumber" value="QU${Date.now()}" required>
          </div>

          <div class="form-group">
            <label for="validUntil">Quote Valid Until:</label>
            <input type="date" id="validUntil" name="validUntil" required>
          </div>

          <div class="form-group">
            <h3>Cost Breakdown</h3>
            <div class="breakdown-section">
              <h4>Labour</h4>
              <div class="breakdown-row">
                <div class="breakdown-col">
                  <label for="labourRate">Rate per Hour ($):</label>
                  <input type="number" id="labourRate" name="labourRate" step="0.01" min="0" placeholder="e.g., 75.00">
                </div>
                <div class="breakdown-col">
                  <label for="labourHours">Hours:</label>
                  <input type="number" id="labourHours" name="labourHours" step="0.5" min="0" placeholder="e.g., 8">
                </div>
                <div class="breakdown-col">
                  <label for="labourSubtotal">Subtotal ($):</label>
                  <input type="text" id="labourSubtotal" name="labourSubtotal" readonly>
                </div>
              </div>
            </div>

            <div class="breakdown-section">
              <h4>Materials</h4>
              <div class="breakdown-row">
                <div class="breakdown-col">
                  <label for="materialRate">Cost per SQM ($):</label>
                  <input type="number" id="materialRate" name="materialRate" step="0.01" min="0" placeholder="e.g., 45.00">
                </div>
                <div class="breakdown-col">
                  <label for="materialSQM">Total SQM:</label>
                  <input type="number" id="materialSQM" name="materialSQM" step="0.1" min="0" placeholder="e.g., 25.5">
                </div>
                <div class="breakdown-col">
                  <label for="materialSubtotal">Subtotal ($):</label>
                  <input type="text" id="materialSubtotal" name="materialSubtotal" readonly>
                </div>
              </div>
            </div>

            <div class="breakdown-section">
              <h4>Installation</h4>
              <div class="breakdown-row">
                <div class="breakdown-col">
                  <label for="installationAmount">Installation Cost ($):</label>
                  <input type="number" id="installationAmount" name="installationAmount" step="0.01" min="0" placeholder="e.g., 500.00">
                </div>
                <div class="breakdown-col">
                  <label>&nbsp;</label>
                  <div style="height: 38px;"></div>
                </div>
                <div class="breakdown-col">
                  <label for="installationSubtotal">Subtotal ($):</label>
                  <input type="text" id="installationSubtotal" name="installationSubtotal" readonly>
                </div>
              </div>
            </div>

            <div class="total-section">
              <h4>Total Amount</h4>
              <div class="total-row">
                <label for="totalAmount">Total Quote Amount ($):</label>
                <input type="text" id="totalAmount" name="totalAmount" readonly>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="itemBreakdown">Item Breakdown (Auto-generated, optional to edit):</label>
            <textarea id="itemBreakdown" name="itemBreakdown" rows="6" placeholder="Auto-generated breakdown will appear here. You can edit this if needed."></textarea>
          </div>

          <div class="form-group">
            <label for="additionalNotes">Additional Notes:</label>
            <textarea id="additionalNotes" name="additionalNotes" rows="4"></textarea>
          </div>

          <!-- Hidden fields for customer data -->
          <input type="hidden" id="customerName" name="customerName" value="${customerName || ''}">
          <input type="hidden" id="customerEmail" name="customerEmail" value="${customerEmail || ''}">
          <input type="hidden" id="customerPhone" name="customerPhone" value="${customerPhone || ''}">
          <input type="hidden" id="serviceType" name="serviceType" value="${serviceType || 'Underfloor Heating'}">
          <input type="hidden" id="projectDetails" name="projectDetails" value="${projectDetails || ''}">
          <input type="hidden" id="projectSize" name="projectSize" value="${projectSize || ''}">
          <input type="hidden" id="budget" name="budget" value="${budget || ''}">
          <input type="hidden" id="timeline" name="timeline" value="${timeline || ''}">
          <input type="hidden" id="location" name="location" value="${location || 'Auckland'}">
          <input type="hidden" id="leadId" name="leadId" value="${leadId || ''}">

          <button type="submit">Submit Quote</button>
        </form>
        
        <!-- Debug section -->
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
          <h4>Debug Information</h4>
          <button type="button" id="testCalcBtn" style="background: #28a745; margin-right: 10px;">Test Calculation</button>
          <button type="button" id="manualCalcBtn" style="background: #ffc107; margin-right: 10px;">Manual Calculate</button>
          <button type="button" id="checkElementsBtn" style="background: #17a2b8;">Check Elements</button>
          <div id="debugOutput" style="margin-top: 10px; font-family: monospace; font-size: 12px;"></div>
        </div>

      <script>
          // Function to calculate subtotals and total
          function calculateTotals() {
              console.log('🔄 Calculating totals...');
              
              try {
                  // Get input values
                  const labourRate = parseFloat(document.getElementById('labourRate').value) || 0;
                  const labourHours = parseFloat(document.getElementById('labourHours').value) || 0;
                  const materialRate = parseFloat(document.getElementById('materialRate').value) || 0;
                  const materialSQM = parseFloat(document.getElementById('materialSQM').value) || 0;
                  const installationAmount = parseFloat(document.getElementById('installationAmount').value) || 0;
                  
                  console.log('📊 Values:', { labourRate, labourHours, materialRate, materialSQM, installationAmount });
                  
                  // Calculate subtotals
                  const labourSubtotal = labourRate * labourHours;
                  const materialSubtotal = materialRate * materialSQM;
                  const installationSubtotal = installationAmount;
                  
                  // Calculate total
                  const total = labourSubtotal + materialSubtotal + installationSubtotal;
                  
                  console.log('💰 Subtotals:', { labourSubtotal, materialSubtotal, installationSubtotal, total });
                  
                  // Update display immediately
                  const labourSubtotalEl = document.getElementById('labourSubtotal');
                  const materialSubtotalEl = document.getElementById('materialSubtotal');
                  const installationSubtotalEl = document.getElementById('installationSubtotal');
                  const totalAmountEl = document.getElementById('totalAmount');
                  
                  if (labourSubtotalEl) {
                      labourSubtotalEl.value = labourSubtotal.toFixed(2);
                  }
                  
                  if (materialSubtotalEl) {
                      materialSubtotalEl.value = materialSubtotal.toFixed(2);
                  }
                  
                  if (installationSubtotalEl) {
                      installationSubtotalEl.value = installationSubtotal.toFixed(2);
                  }
                  
                  if (totalAmountEl) {
                      totalAmountEl.value = total.toFixed(2);
                  }
                  
                  // Generate item breakdown
                  generateItemBreakdown(labourRate, labourHours, labourSubtotal, materialRate, materialSQM, materialSubtotal, installationAmount);
                  
              } catch (error) {
                  console.error('❌ Error in calculateTotals:', error);
              }
          }
          
          // Function to generate item breakdown
          function generateItemBreakdown(labourRate, labourHours, labourSubtotal, materialRate, materialSQM, materialSubtotal, installationAmount) {
              try {
                  let breakdown = '';
                  
                  if (labourSubtotal > 0) {
                      breakdown += 'Labour: $' + labourRate.toFixed(2) + '/hour x ' + labourHours + ' hours = $' + labourSubtotal.toFixed(2) + '\n';
                  }
                  
                  if (materialSubtotal > 0) {
                      breakdown += 'Materials: $' + materialRate.toFixed(2) + '/sqm x ' + materialSQM + ' sqm = $' + materialSubtotal.toFixed(2) + '\n';
                  }
                  
                  if (installationAmount > 0) {
                      breakdown += 'Installation: $' + installationAmount.toFixed(2) + '\n';
                  }
                  
                  const itemBreakdownEl = document.getElementById('itemBreakdown');
                  if (itemBreakdownEl) {
                      itemBreakdownEl.value = breakdown;
                  }
              } catch (error) {
                  console.error('❌ Error in generateItemBreakdown:', error);
              }
          }
          
          // Function to add event listeners
          function addEventListeners() {
              console.log('🔧 Adding event listeners...');
              
              const elements = [
                  'labourRate',
                  'labourHours', 
                  'materialRate',
                  'materialSQM',
                  'installationAmount'
              ];
              
              elements.forEach(id => {
                  const element = document.getElementById(id);
                  if (element) {
                      // Add event listeners
                      element.addEventListener('input', calculateTotals);
                      element.addEventListener('change', calculateTotals);
                      element.addEventListener('keyup', calculateTotals);
                      console.log('✅ Added event listener to:', id);
                  } else {
                      console.error('❌ Element not found:', id);
                  }
              });
              
              // Add debug button listeners
              const testCalcBtn = document.getElementById('testCalcBtn');
              const manualCalcBtn = document.getElementById('manualCalcBtn');
              const checkElementsBtn = document.getElementById('checkElementsBtn');
              
              if (testCalcBtn) {
                  testCalcBtn.addEventListener('click', testCalculation);
              }
              
              if (manualCalcBtn) {
                  manualCalcBtn.addEventListener('click', calculateTotals);
              }
              
              if (checkElementsBtn) {
                  checkElementsBtn.addEventListener('click', function() {
                      console.log('Form elements:', document.getElementById('labourRate'), document.getElementById('labourSubtotal'));
                  });
              }
          }
          
          // Initialize when DOM is loaded
          document.addEventListener('DOMContentLoaded', function() {
              console.log('🚀 DOM loaded, initializing quote form...');
              addEventListeners();
              calculateTotals(); // Initial calculation
          });
          
          // Also try to add listeners immediately (in case DOM is already loaded)
          if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', addEventListeners);
          } else {
              console.log('📄 DOM already loaded, adding listeners immediately...');
              addEventListeners();
              calculateTotals(); // Initial calculation
          }
          
          // Test function for debugging
          function testCalculation() {
              console.log('🧪 Testing calculation...');
              const debugOutput = document.getElementById('debugOutput');
              
              // Test if elements exist
              const elements = ['labourRate', 'labourHours', 'materialRate', 'materialSQM', 'installationAmount', 'labourSubtotal', 'materialSubtotal', 'installationSubtotal', 'totalAmount'];
              const elementStatus = {};
              
              elements.forEach(id => {
                  const element = document.getElementById(id);
                  elementStatus[id] = element ? 'Found' : 'Missing';
                  if (element) {
                      elementStatus[id] += ' (value: ' + element.value + ')';
                  }
              });
              
              debugOutput.innerHTML = '<strong>Element Status:</strong><br>' + 
                  Object.entries(elementStatus).map(([id, status]) => id + ': ' + status).join('<br>');
              
              // Test calculation
              calculateTotals();
              
              setTimeout(() => {
                  const finalStatus = {};
                  elements.forEach(id => {
                      const element = document.getElementById(id);
                      finalStatus[id] = element ? 'Found (value: ' + element.value + ')' : 'Missing';
                  });
                  
                  debugOutput.innerHTML += '<br><br><strong>After Calculation:</strong><br>' + 
                      Object.entries(finalStatus).map(([id, status]) => id + ': ' + status).join('<br>');
              }, 500);
          }
          
          document.getElementById('quoteForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              data.quoteId = '${leadId || quoteId}';
              
              // Clean and validate data
              if (data.totalAmount) {
                  // Remove any non-numeric characters except decimal point
                  data.totalAmount = data.totalAmount.replace(/[^0-9.]/g, '');
              }
              
              if (data.tradesmanPhone) {
                  // Clean phone number - just trim whitespace
                  data.tradesmanPhone = data.tradesmanPhone.trim();
              }
              
              // Ensure required fields are present
              if (!data.tradesmanName || !data.tradesmanEmail || !data.totalAmount) {
                  alert('Please fill in all required fields: Name, Email, and Total Amount');
                  return;
              }
              
              // Validate that at least one cost category has been entered
              const labourSubtotal = parseFloat(data.labourSubtotal) || 0;
              const materialSubtotal = parseFloat(data.materialSubtotal) || 0;
              const installationSubtotal = parseFloat(data.installationSubtotal) || 0;
              
              if (labourSubtotal === 0 && materialSubtotal === 0 && installationSubtotal === 0) {
                  alert('Please enter at least one cost category (Labour, Materials, or Installation)');
                  return;
              }
              
              try {
                  const response = await fetch('/api/quote-submission', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                  });
                  
                  const result = await response.json();
                  
                  if (result.success) {
                      alert('✅ Quote submitted successfully! The customer will receive your professional quote with PDF attachment.');
                      window.close();
                  } else {
                      alert('❌ Error: ' + result.error);
                  }
              } catch (error) {
                  alert('Error submitting quote: ' + error.message);
              }
          });
          
          // Set default valid until date (30 days from now)
          const today = new Date();
          const validUntil = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
          document.getElementById('validUntil').value = validUntil.toISOString().split('T')[0];
      </script>
    </body>
    </html>
    `);
  }

  if (req.method === 'POST') {
    try {
      const quoteData = req.body;
      console.log('✅ Quote received:', quoteData);

      // Basic validation
      if (!quoteData.tradesmanName || !quoteData.tradesmanEmail || !quoteData.totalAmount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: tradesmanName, tradesmanEmail, totalAmount'
        });
      }

      // Clean and validate data
      quoteData.tradesmanName = quoteData.tradesmanName.trim();
      quoteData.tradesmanEmail = quoteData.tradesmanEmail.trim();
      quoteData.totalAmount = quoteData.totalAmount.toString().replace(/[^0-9.]/g, '');
      quoteData.tradesmanPhone = quoteData.tradesmanPhone ? quoteData.tradesmanPhone.trim() : '';
      quoteData.itemBreakdown = quoteData.itemBreakdown ? quoteData.itemBreakdown.trim() : '';
      quoteData.additionalNotes = quoteData.additionalNotes ? quoteData.additionalNotes.trim() : '';

      // Fetch customer data from Google Sheets if missing
      if ((!quoteData.customerName || !quoteData.customerEmail || !quoteData.customerPhone) && quoteData.leadId && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
          const auth = new google.auth.GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
          });

          const sheets = google.sheets({ version: 'v4', auth });
          
          // Fetch lead data from Google Sheets
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Sheet1!A:K',
          });

          const rows = response.data.values || [];
          
          // Find the lead by leadId
          const leadRow = rows.find(row => row[13] === quoteData.leadId); // Assuming leadId is in column N

          if (leadRow) {
            // Update quote data with customer information from Google Sheets
            quoteData.customerName = quoteData.customerName || leadRow[1] || '';
            quoteData.customerEmail = quoteData.customerEmail || leadRow[2] || '';
            quoteData.customerPhone = quoteData.customerPhone || leadRow[3] || '';
            quoteData.serviceType = quoteData.serviceType || leadRow[4] || 'Underfloor Heating';
            quoteData.projectDetails = quoteData.projectDetails || leadRow[5] || '';
            quoteData.location = quoteData.location || leadRow[10] || 'Auckland';
            console.log('✅ Customer data fetched from Google Sheets:', {
              customerName: quoteData.customerName,
              customerEmail: quoteData.customerEmail,
              customerPhone: quoteData.customerPhone
            });
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets error fetching customer data:', sheetsError.message);
        }
      }

      // Note: Customer email will be sent by the PDF generation endpoint with the actual PDF attachment
      let customerEmailSent = false;

      // 2. Send notification to admin
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: 'danbricks18@gmail.com',
            pass: 'ptmcojqgthvjbqom'
          }
        });

        const adminMailOptions = {
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: 'danbricks18@gmail.com',
          subject: `Quote ${quoteData.quoteNumber} Submitted - ${quoteData.tradesmanName}`,
          html: `
            <h2>New Quote Submitted!</h2>
            <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
            <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
            <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
            <p><strong>Phone:</strong> ${quoteData.tradesmanPhone}</p>
            <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
            <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
            <p><strong>Item Breakdown:</strong></p>
            <pre>${quoteData.itemBreakdown}</pre>
            ${quoteData.additionalNotes ? `<p><strong>Additional Notes:</strong> ${quoteData.additionalNotes}</p>` : ''}
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Create quote document using Google Docs template</li>
              <li>Make any necessary adjustments</li>
              <li>Save as PDF</li>
              <li>Send to customer</li>
            </ol>
          `
        };

        await transporter.sendMail(adminMailOptions);
        console.log('✅ Admin notification email sent');
      } catch (adminEmailError) {
        console.error('❌ Admin email failed:', adminEmailError.message);
      }

      // 3. Save to Google Sheets (if configured)
      let sheetsUpdated = false;
      if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const values = [
      [
        new Date().toISOString(),
              quoteData.quoteId,
              quoteData.quoteNumber,
              quoteData.tradesmanName,
              quoteData.tradesmanEmail,
              quoteData.tradesmanPhone,
              quoteData.totalAmount,
              quoteData.itemBreakdown,
              quoteData.validUntil,
              quoteData.additionalNotes,
              'submitted'
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            range: 'Quotes!A:K',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('✅ Quote saved to Google Sheets');
          sheetsUpdated = true;
        } catch (sheetsError) {
          console.error('❌ Google Sheets error:', sheetsError.message);
        }
      }

      // 3. Send confirmation email to tradesman
      let tradesmanEmailSent = false;
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: 'danbricks18@gmail.com',
            pass: 'ptmcojqgthvjbqom'
          }
        });

        const currentUrl = process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}` : 
          'https://lead-code.vercel.app';

        const tradesmanMailOptions = {
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: quoteData.tradesmanEmail,
          subject: `Quote Submitted Successfully - ${quoteData.quoteNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">✅ Quote Submitted Successfully!</h2>
              <p>Dear ${quoteData.tradesmanName},</p>
              <p>Your quote has been successfully submitted and is being processed.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Customer:</strong> ${quoteData.customerName || 'Not specified'}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Valid Until:</strong> ${quoteData.validUntil}</p>
                <p><strong>Status:</strong> Submitted and being processed</p>
              </div>
              
              <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #27ae60; margin-top: 0;">What happens next:</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>✅ Quote saved to Google Sheets</li>
                  <li>📄 Professional PDF being generated</li>
                  <li>📧 Customer will receive quote email with PDF attachment</li>
                  <li>📧 You will receive a copy of the customer email</li>
                  <li>📊 Quote status will be updated in dashboard</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>Kiwi Trade System</strong></p>
            </div>
          `
        };

        await transporter.sendMail(tradesmanMailOptions);
        console.log('✅ Tradesman confirmation email sent successfully');
        tradesmanEmailSent = true;
      } catch (emailError) {
        console.error('❌ Tradesman email error:', emailError.message);
      }

      // 4. Create quote document with multiple fallback options (PDF → DOCX → HTML)
      let quoteAttachment = null;
      let attachmentType = 'none';
      let attachmentFilename = '';
      
      try {
        // Format date as DD/MM/YYYY
        const formatDate = (date) => {
          const d = new Date(date);
          return d.toLocaleDateString('en-GB'); // DD/MM/YYYY format
        };

        // Function to generate breakdown table rows from new structured data
        const generateBreakdownRows = (quoteData) => {
          const rows = [];
          
          // Labour row
          if (quoteData.labourSubtotal && parseFloat(quoteData.labourSubtotal) > 0) {
            const labourRate = parseFloat(quoteData.labourRate) || 0;
            const labourHours = parseFloat(quoteData.labourHours) || 0;
            const labourSubtotal = parseFloat(quoteData.labourSubtotal) || 0;
            rows.push(`<tr><td>Labour</td><td>$${labourRate.toFixed(2)}/hour × ${labourHours} hours</td><td>$${labourSubtotal.toFixed(2)}</td></tr>`);
          }
          
          // Materials row
          if (quoteData.materialSubtotal && parseFloat(quoteData.materialSubtotal) > 0) {
            const materialRate = parseFloat(quoteData.materialRate) || 0;
            const materialSQM = parseFloat(quoteData.materialSQM) || 0;
            const materialSubtotal = parseFloat(quoteData.materialSubtotal) || 0;
            rows.push(`<tr><td>Materials</td><td>$${materialRate.toFixed(2)}/sqm × ${materialSQM} sqm</td><td>$${materialSubtotal.toFixed(2)}</td></tr>`);
          }
          
          // Installation row
          if (quoteData.installationSubtotal && parseFloat(quoteData.installationSubtotal) > 0) {
            const installationSubtotal = parseFloat(quoteData.installationSubtotal) || 0;
            rows.push(`<tr><td>Installation</td><td>Installation services</td><td>$${installationSubtotal.toFixed(2)}</td></tr>`);
          }
          
          if (rows.length === 0) {
            return '<tr><td colspan="3">No breakdown provided</td></tr>';
          }
          
          return rows.join('');
        };

        // Function to create DOCX document
        const createDocxQuote = async (quoteData) => {
          const breakdownRows = [];
          
          // Add breakdown rows
          if (quoteData.labourSubtotal && parseFloat(quoteData.labourSubtotal) > 0) {
            const labourRate = parseFloat(quoteData.labourRate) || 0;
            const labourHours = parseFloat(quoteData.labourHours) || 0;
            const labourSubtotal = parseFloat(quoteData.labourSubtotal) || 0;
            breakdownRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Labour' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${labourRate.toFixed(2)}/hour × ${labourHours} hours` })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${labourSubtotal.toFixed(2)}` })] })] })
                ]
              })
            );
          }
          
          if (quoteData.materialSubtotal && parseFloat(quoteData.materialSubtotal) > 0) {
            const materialRate = parseFloat(quoteData.materialRate) || 0;
            const materialSQM = parseFloat(quoteData.materialSQM) || 0;
            const materialSubtotal = parseFloat(quoteData.materialSubtotal) || 0;
            breakdownRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Materials' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${materialRate.toFixed(2)}/sqm × ${materialSQM} sqm` })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${materialSubtotal.toFixed(2)}` })] })] })
                ]
              })
            );
          }
          
          if (quoteData.installationSubtotal && parseFloat(quoteData.installationSubtotal) > 0) {
            const installationSubtotal = parseFloat(quoteData.installationSubtotal) || 0;
            breakdownRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Installation' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Installation services' })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${installationSubtotal.toFixed(2)}` })] })] })
                ]
              })
            );
          }

          const doc = new Document({
            sections: [{
              properties: {},
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'KIWI TRADE', bold: true, size: 32 })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'QUOTE', bold: true, size: 40 })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Quote Number: ${quoteData.quoteNumber}`, bold: true })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Date: ${formatDate(new Date())}` })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Valid Until: ${formatDate(quoteData.validUntil)}` })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({ children: [new TextRun({ text: '' })] }), // Spacing
                new Paragraph({
                  children: [new TextRun({ text: 'Customer Details', bold: true, size: 24 })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Name: ${quoteData.customerName || 'Not specified'}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Email: ${quoteData.customerEmail || 'Not specified'}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Phone: ${quoteData.customerPhone || 'Not specified'}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Address: ${quoteData.location || 'Auckland'}` })]
                }),
                new Paragraph({ children: [new TextRun({ text: '' })] }), // Spacing
                new Paragraph({
                  children: [new TextRun({ text: 'Tradesman Details', bold: true, size: 24 })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Company: ${quoteData.tradesmanName}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Email: ${quoteData.tradesmanEmail}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Phone: ${quoteData.tradesmanPhone || 'Not specified'}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Service: ${quoteData.serviceType || 'Underfloor Heating'}` })]
                }),
                new Paragraph({ children: [new TextRun({ text: '' })] }), // Spacing
                new Paragraph({
                  children: [new TextRun({ text: 'Quote Breakdown', bold: true, size: 24 })]
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] })] }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })] })
                      ]
                    }),
                    ...breakdownRows
                  ]
                }),
                new Paragraph({ children: [new TextRun({ text: '' })] }), // Spacing
                new Paragraph({
                  children: [new TextRun({ text: `Total Amount: $${quoteData.totalAmount}`, bold: true, size: 28 })],
                  alignment: AlignmentType.RIGHT
                }),
                ...(quoteData.additionalNotes ? [
                  new Paragraph({ children: [new TextRun({ text: '' })] }),
                  new Paragraph({
                    children: [new TextRun({ text: 'Additional Notes', bold: true, size: 24 })]
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: quoteData.additionalNotes })]
                  })
                ] : []),
                new Paragraph({ children: [new TextRun({ text: '' })] }), // Spacing
                new Paragraph({
                  children: [new TextRun({ text: 'Kiwi Trade', bold: true })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Professional underfloor heating solutions for your home' })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'This quote was generated using our automated system' })],
                  alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                  children: [new TextRun({ text: 'Thank you for choosing Kiwi Trade!' })],
                  alignment: AlignmentType.CENTER
                })
              ]
            }]
          });

          return await Packer.toBuffer(doc);
        };

        // Create professional HTML for PDF generation matching the image format
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>Quote ${quoteData.quoteNumber}</title>
              <style>
                @page { 
                    margin: 0.3in; 
                    size: A4 landscape;
                }
                body { 
                    font-family: 'Arial', sans-serif; 
                    margin: 0; 
                    padding: 20px; 
                    color: #333;
                    line-height: 1.4;
                    font-size: 12px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 25px; 
                }
                .company-name { 
                    color: #4a90e2; 
                    margin: 0; 
                    font-size: 18px; 
                    font-weight: normal;
                }
                .quote-title { 
                    color: #333; 
                    margin: 10px 0 5px 0; 
                    font-size: 24px; 
                    font-weight: bold;
                }
                .quote-number { 
                    color: #333; 
                    margin: 5px 0; 
                    font-size: 14px; 
                    font-weight: bold;
                }
                .quote-dates { 
                    color: #333; 
                    margin: 5px 0; 
                    font-size: 12px; 
                }
                .divider { 
                    border-top: 1px solid #333; 
                    margin: 15px 0; 
                }
                .details-section { 
                    display: flex; 
                    margin: 20px 0; 
                    gap: 20px;
                }
                .details-column { 
                    flex: 1; 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 4px; 
                    border-left: 4px solid #4a90e2; 
                }
                .details-title { 
                    color: #333; 
                    margin: 0 0 10px 0; 
                    font-size: 14px; 
                    font-weight: bold;
                }
                .details-content { 
                    font-size: 12px; 
                    line-height: 1.6;
                }
                .details-content p { 
                    margin: 5px 0; 
                }
                .quote-breakdown { 
                    margin: 20px 0; 
                }
                .breakdown-title { 
                    color: #333; 
                    margin: 0 0 10px 0; 
                    font-size: 14px; 
                    font-weight: bold;
                    border-left: 4px solid #4a90e2; 
                    padding-left: 10px;
                }
                .breakdown-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0; 
                    font-size: 12px;
                }
                .breakdown-table th, .breakdown-table td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                }
                .breakdown-table th { 
                    background: #333; 
                    color: white; 
                    font-weight: bold; 
                }
                .total-section { 
                    text-align: right; 
                    margin: 20px 0; 
                }
                .total-amount { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #333;
                }
                .notes-section { 
                    margin: 20px 0; 
                }
                .notes-title { 
                    color: #333; 
                    margin: 0 0 10px 0; 
                    font-size: 14px; 
                    font-weight: bold;
                }
                .footer { 
                    margin-top: 30px; 
                    padding-top: 15px; 
                    border-top: 1px solid #ddd; 
                    font-size: 10px; 
                    color: #666;
                    text-align: center;
                }
                .footer p { 
                    margin: 3px 0; 
                }
              </style>
          </head>
          <body>
              <div class="header">
                  <h1 class="company-name">KIWI TRADE</h1>
                  <h2 class="quote-title">QUOTE</h2>
                  <p class="quote-number">Quote Number: ${quoteData.quoteNumber}</p>
                  <p class="quote-dates">Date: ${formatDate(new Date())}</p>
                  <p class="quote-dates">Valid Until: ${formatDate(quoteData.validUntil)}</p>
              </div>

              <div class="divider"></div>

              <div class="details-section">
                  <div class="details-column">
                      <h3 class="details-title">Customer Details</h3>
                      <div class="details-content">
                          <p><strong>Name:</strong> ${quoteData.customerName || 'Not specified'}</p>
                          <p><strong>Email:</strong> ${quoteData.customerEmail || 'Not specified'}</p>
                          <p><strong>Phone:</strong> ${quoteData.customerPhone || 'Not specified'}</p>
                          <p><strong>Address:</strong> ${quoteData.location || 'Auckland'}</p>
                      </div>
                  </div>
                  <div class="details-column">
                      <h3 class="details-title">Tradesman Details</h3>
                      <div class="details-content">
                          <p><strong>Company:</strong> ${quoteData.tradesmanName}</p>
                          <p><strong>Email:</strong> ${quoteData.tradesmanEmail}</p>
                          <p><strong>Phone:</strong> ${quoteData.tradesmanPhone || 'Not specified'}</p>
                          <p><strong>Service:</strong> ${quoteData.serviceType || 'Underfloor Heating'}</p>
                      </div>
                  </div>
              </div>

              <div class="divider"></div>

              <div class="quote-breakdown">
                  <h3 class="breakdown-title">Quote Breakdown</h3>
                  <table class="breakdown-table">
                      <thead>
                          <tr>
                              <th>Item</th>
                              <th>Description</th>
                              <th>Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${generateBreakdownRows(quoteData)}
                      </tbody>
                  </table>
              </div>

              <div class="total-section">
                  <div class="total-amount">Total Amount: $${quoteData.totalAmount}</div>
              </div>

              ${quoteData.additionalNotes ? `
              <div class="notes-section">
                  <h3 class="notes-title">Additional Notes</h3>
                  <p>${quoteData.additionalNotes}</p>
              </div>
              ` : ''}

              <div class="footer">
                  <p><strong>Kiwi Trade</strong></p>
                  <p>Professional underfloor heating solutions for your home</p>
                  <p>This quote was generated using our automated system</p>
                  <p>Thank you for choosing Kiwi Trade!</p>
              </div>
          </body>
          </html>
        `;

        // Multi-format quote generation with fallback system
        console.log('🔄 Starting quote generation with fallback system...');
        
        // Try 1: Generate PDF with Puppeteer
        try {
          console.log('📄 Attempting PDF generation with Puppeteer...');
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          });
          const page = await browser.newPage();
          await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
          const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '0.3in', right: '0.3in', bottom: '0.3in', left: '0.3in' }
          });
          await browser.close();
          
          quoteAttachment = pdfBuffer;
          attachmentType = 'pdf';
          attachmentFilename = `Quote-${quoteData.quoteNumber}.pdf`;
          console.log('✅ PDF generated successfully with Puppeteer');
        } catch (puppeteerError) {
          console.log('⚠️ PDF generation failed, trying DOCX...');
          
          // Try 2: Generate DOCX document
          try {
            console.log('📝 Attempting DOCX generation...');
            const docxBuffer = await createDocxQuote(quoteData);
            
            quoteAttachment = docxBuffer;
            attachmentType = 'docx';
            attachmentFilename = `Quote-${quoteData.quoteNumber}.docx`;
            console.log('✅ DOCX generated successfully');
          } catch (docxError) {
            console.log('⚠️ DOCX generation failed, using HTML fallback...');
            
            // Try 3: Use HTML as final fallback
            try {
              console.log('🌐 Using HTML fallback...');
              quoteAttachment = Buffer.from(htmlContent, 'utf8');
              attachmentType = 'html';
              attachmentFilename = `Quote-${quoteData.quoteNumber}.html`;
              console.log('✅ HTML fallback ready');
            } catch (htmlError) {
              console.log('❌ All quote generation methods failed:', htmlError.message);
              quoteAttachment = null;
              attachmentType = 'none';
            }
          }
        }

        // Get current URL for links
        const currentUrl = process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}` : 
          'https://lead-code.vercel.app';

        // Setup email transporter
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: {
            user: 'danbricks18@gmail.com',
            pass: 'ptmcojqgthvjbqom'
          }
        });

        // Determine attachment content type and message
        const getAttachmentInfo = () => {
          switch (attachmentType) {
            case 'pdf':
              return {
                contentType: 'application/pdf',
                message: 'Please find your professional PDF quote attached to this email.',
                note: ''
              };
            case 'docx':
              return {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                message: 'Please find your professional DOCX quote attached to this email.',
                note: 'You can open this file with Microsoft Word, Google Docs, or any compatible word processor.'
              };
            case 'html':
              return {
                contentType: 'text/html',
                message: 'Please find your quote attached as an HTML file.',
                note: 'The attached HTML file can be opened in any web browser and printed as a PDF for a professional look.'
              };
            default:
              return {
                contentType: 'text/plain',
                message: 'Quote details are included in this email.',
                note: 'No attachment was generated due to technical limitations.'
              };
          }
        };

        const attachmentInfo = getAttachmentInfo();

        // Send email to customer with appropriate attachment
        const customerMailOptions = {
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: quoteData.customerEmail || 'danbricks18@gmail.com',
          subject: `Professional Quote ${quoteData.quoteNumber} - ${quoteData.serviceType || 'Your Project'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Your Professional Quote is Ready!</h2>
              <p>Hi ${quoteData.customerName || 'there'},</p>
              <p>Please find attached your professional quote for <strong>${quoteData.serviceType || 'your project'}</strong>.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Summary:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Valid Until:</strong> ${formatDate(quoteData.validUntil)}</p>
                <p><strong>Tradesman:</strong> ${quoteData.tradesmanName}</p>
                <p><strong>Format:</strong> ${attachmentType.toUpperCase()}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${currentUrl}/api/view-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
                 View Quote Online
                </a>
                <a href="${currentUrl}/api/accept-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                   style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
                 Accept Quote
                </a>
                <a href="${currentUrl}/api/decline-quote?quoteId=${quoteData.quoteId}&quoteNumber=${quoteData.quoteNumber}" 
                   style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px;">
                 Decline Quote
                </a>
              </div>
              
              <p>${attachmentInfo.message}</p>
              ${attachmentInfo.note ? `<p><strong>Note:</strong> ${attachmentInfo.note}</p>` : ''}
              <p>You can view the quote online and accept/decline it using the links above.</p>
              <p>Please review the attached quote and let us know if you have any questions.</p>
              
              <p style="margin-top: 30px;">Best regards,<br><strong>${quoteData.tradesmanName}</strong></p>
            </div>
          `,
          attachments: quoteAttachment ? [{
            filename: attachmentFilename,
            content: quoteAttachment.toString('base64'),
            encoding: 'base64',
            contentType: attachmentInfo.contentType
          }] : []
        };

        await transporter.sendMail(customerMailOptions);
        console.log(`✅ Customer email sent with ${attachmentType.toUpperCase()} attachment`);
        pdfEmailSent = true;

        // Send copy to tradesman
        const tradesmanCopyMailOptions = {
          from: 'Kiwi Trade <danbricks18@gmail.com>',
          to: quoteData.tradesmanEmail,
          subject: `Quote ${quoteData.quoteNumber} - Copy for ${quoteData.customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c3e50;">Quote Copy</h2>
              <p>Here's a copy of the quote you submitted for ${quoteData.customerName}.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #34495e; margin-top: 0;">Quote Details:</h3>
                <p><strong>Quote Number:</strong> ${quoteData.quoteNumber}</p>
                <p><strong>Customer:</strong> ${quoteData.customerName}</p>
                <p><strong>Total Amount:</strong> $${quoteData.totalAmount}</p>
                <p><strong>Service:</strong> ${quoteData.serviceType}</p>
                <p><strong>Format:</strong> ${attachmentType.toUpperCase()}</p>
              </div>
              
              <p>The customer has been notified and can view the quote online.</p>
              <p>Your quote was generated in ${attachmentType.toUpperCase()} format and sent to the customer.</p>
            </div>
          `,
          attachments: quoteAttachment ? [{
            filename: attachmentFilename,
            content: quoteAttachment.toString('base64'),
            encoding: 'base64',
            contentType: attachmentInfo.contentType
          }] : []
        };

        await transporter.sendMail(tradesmanCopyMailOptions);
        console.log('✅ Tradesman copy sent');

      } catch (emailError) {
        console.error('❌ Customer email error:', emailError.message);
      }

      // Return success response
      const response = {
        success: true,
        message: pdfEmailSent ? 'Quote submitted successfully! Professional PDF has been created and sent to all parties.' : 'Quote submitted successfully! PDF generation is in progress.',
        data: quoteData,
        quoteNumber: quoteData.quoteNumber,
        timestamp: new Date().toISOString(),
        status: {
          sheetsUpdated,
          tradesmanEmailSent,
          customerEmailSent: pdfEmailSent, // Only true if PDF was created successfully
          pdfCreated: pdfEmailSent
        }
      };

      console.log('📊 Quote Response:', response);
      res.json(response);

  } catch (error) {
      console.error('❌ Error processing quote:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process quote',
        details: error.message
      });
    }
  }
}