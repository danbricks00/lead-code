import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { initializeXeroDirectApi, makeXeroApiCall, getXeroQuoteAsPdf } from '../../lib/xeroDirectApi.js';
import nodemailer from "nodemailer";
import crypto from "crypto";
import { google } from "googleapis";
import { sendEmail } from '../../lib/emailHelper'; // Assuming you have a centralized email helper

async function getSheetsClient() {
    const { privateKey } = JSON.parse(process.env.GOOGLE_PRIVATE_KEY || '{}');
    if (!privateKey) throw new Error("GOOGLE_PRIVATE_KEY is not set correctly.");
    
    const auth = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
    );
    await auth.authorize();
    return google.sheets({ version: 'v4', auth });
}

function verifyToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET);
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
}

function generateAdminDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts); 
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/admin/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

// Main handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  
  try {
    const { quoteId, ts, token, quoteDetails, leadDetails } = req.body;

    if (!quoteId || !ts || !token || !quoteDetails || !leadDetails) {
        return res.status(400).json({ success: false, error: 'Missing required fields for quote submission.' });
    }

    if (token !== verifyToken(quoteId, ts)) {
        return res.status(403).json({ success: false, error: 'Invalid or expired link.' });
    }
    
    // --- XERO INTEGRATION (DIRECT API) ---
    let xeroConfig;
    try {
        xeroConfig = await initializeXeroDirectApi();
        console.log('Xero Direct API initialized successfully');
    } catch (initError) {
        console.error("Xero Direct API Initialization Error:", initError);
        return res.status(500).json({ success: false, error: "Failed during Xero API initialization." });
    }

    // 1. Find or Create Contact in Xero
    let contactID;
    // Extract customer details with fallbacks and proper field names
    const customerName = leadDetails.CustomerName || leadDetails.customerName || 'Unknown Customer';
    const customerEmail = leadDetails.CustomerEmail || leadDetails.customerEmail;
    const customerPhone = leadDetails.CustomerPhone || leadDetails.customerPhone || '';
    
    console.log('DEBUG - Customer details extracted:', { customerName, customerEmail, customerPhone });
    console.log('DEBUG - Full leadDetails object:', JSON.stringify(leadDetails, null, 2));
    
    if (!customerEmail) {
        console.error('Customer email is missing from leadDetails');
        return res.status(400).json({ success: false, error: "Customer email is required but missing from lead details." });
    }
    try {
      // Search for existing contact by email
      const contactsResponse = await makeXeroApiCall(
        `Contacts?where=EmailAddress%3D%3D"${encodeURIComponent(customerEmail)}"`,
        'GET',
        null,
        xeroConfig
      );
      
      if (contactsResponse.Contacts && contactsResponse.Contacts.length > 0) {
          contactID = contactsResponse.Contacts[0].ContactID;
          console.log(`Found existing Xero contact: ${contactID}`);
      } else {
          // Create new contact
          const newContactData = {
            Contacts: [{
              Name: customerName,
              EmailAddress: customerEmail,
              Phones: [{ PhoneType: 'DEFAULT', PhoneNumber: customerPhone }]
            }]
          };
          
          const createContactResponse = await makeXeroApiCall('Contacts', 'POST', newContactData, xeroConfig);
          contactID = createContactResponse.Contacts[0].ContactID;
          console.log(`Created new Xero contact: ${contactID}`);
      }
    } catch (contactError) {
        console.error("Xero Contact Error:", contactError);
        return res.status(500).json({ success: false, error: "Failed to find or create Xero contact." });
    }

    // 2. Create Quote in Xero
    let xeroQuoteId;
    const {
        labourRate, labourHours, materialsCost, materialsQuantity,
        travelCost, travelDistance, installationCost, subtotal, gst, totalQuote, notes, validUntil,
        tradespersonName, tradespersonEmail, tradespersonPhone
    } = quoteDetails;
    try {
      const quoteData = {
          Quotes: [{
              Contact: { ContactID: contactID },
              Date: new Date().toISOString().split('T')[0], // Today's date
              ExpiryDate: new Date(validUntil).toISOString().split('T')[0],
              Title: `Quote for ${leadDetails.ServiceType || 'services'} for ${leadDetails.CustomerName}`,
              Summary: notes,
              LineItems: [
                  { Description: 'Labour', Quantity: labourHours, UnitAmount: labourRate, AccountCode: '200' },
                  { Description: 'Materials', Quantity: materialsQuantity, UnitAmount: materialsCost, AccountCode: '200' },
                  { Description: 'Travel', Quantity: travelDistance, UnitAmount: travelCost, AccountCode: '200' },
                  { Description: 'Installation', Quantity: 1, UnitAmount: installationCost, AccountCode: '200' }
              ],
              Status: 'DRAFT' // Draft until admin approves
          }]
      };
      
      const createQuoteResponse = await makeXeroApiCall('Quotes', 'POST', quoteData, xeroConfig);
      xeroQuoteId = createQuoteResponse.Quotes[0].QuoteID;
      console.log(`Successfully created Xero Quote (Draft): ${xeroQuoteId}`);
    } catch (quoteError) {
        console.error("Xero Create Quote Error:", quoteError);
        return res.status(500).json({ success: false, error: "Failed to create quote in Xero." });
    }

    // 3. Get PDF of the Quote from Xero
    let pdfBuffer;
    try {
        pdfBuffer = await getXeroQuoteAsPdf(xeroQuoteId, xeroConfig);
        console.log(`Successfully downloaded PDF for Quote ${xeroQuoteId}`);
    } catch (pdfError) {
        console.error("Xero Get PDF Error:", pdfError);
        return res.status(500).json({ success: false, error: "Failed to download PDF quote from Xero." });
    }

    // 4. Update Google Sheet with Xero Quote ID and new status
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = getSpreadsheetId();
    const range = 'Quotes!A:Z';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = response.data.values;
    const header = rows[0];
    const rowIndex = rows.findIndex(row => row[header.indexOf('QuoteID')] === quoteId); // CORRECTED HEADER
    
    if (rowIndex > -1) {
        const targetRow = rows[rowIndex];
        targetRow[header.indexOf('Admin Status')] = 'Pending Approval';
        targetRow[header.indexOf('Customer Status')] = 'Quote Pending Approval';
        targetRow[header.indexOf('TradePerson Status')] = 'Quote Submitted'; // CORRECTED HEADER
        targetRow[header.indexOf('Xero Quote iD')] = xeroQuoteId; // CORRECTED HEADER

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Quotes!A${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [targetRow] },
        });
        console.log(`Updated Google Sheet for Quote ID ${quoteId} with Xero ID ${xeroQuoteId}`);
    }

    // 5. Send Review Email to Admin and Tradesperson with PDF
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const approveLink = generateAdminDecisionLink('approve', quoteId);
    const declineFormLink = (() => {
        const ts = Date.now().toString();
        const token = verifyToken(quoteId, ts);
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
        return `https://${baseUrl}/admin/decline-form?quoteId=${quoteId}&ts=${ts}&token=${token}`;
    })();

    console.log('DEBUG - Email details:', { 
        tradespersonName, 
        tradespersonEmail, 
        ADMIN_EMAIL,
        leadDetails_ServiceType: leadDetails.ServiceType || leadDetails.serviceType,
        leadDetails_CustomerName: leadDetails.CustomerName || leadDetails.customerName
    });

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🔍 New Quote Review Required</h2>
            <p>A new quote for <strong>"${leadDetails.ServiceType || leadDetails.serviceType || 'service'}"</strong> has been submitted by <strong>${tradespersonName}</strong> and created in Xero.</p>
            
            <h3>Customer Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${customerName}</li>
                <li><strong>Email:</strong> ${customerEmail}</li>
                <li><strong>Phone:</strong> ${customerPhone}</li>
                <li><strong>Area:</strong> ${leadDetails.Area || leadDetails.area || 'N/A'}</li>
                <li><strong>Suburb:</strong> ${leadDetails.Suburb || leadDetails.suburb || 'N/A'}</li>
                <li><strong>Timeline:</strong> ${leadDetails.Timelline || leadDetails.timeline || 'N/A'}</li>
            </ul>

            <h3>Tradesperson Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${tradespersonName}</li>
                <li><strong>Email:</strong> ${tradespersonEmail}</li>
                <li><strong>Phone:</strong> ${tradespersonPhone}</li>
            </ul>

            <h3>Quote Summary:</h3>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Labour (${labourHours}h @ $${labourRate}/h):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(labourRate) * parseFloat(labourHours) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Materials (${materialsQuantity}m² @ $${materialsCost}/m²):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(materialsCost) * parseFloat(materialsQuantity) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Travel (${travelDistance}km @ $${travelCost}/km):</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${(parseFloat(travelCost) * parseFloat(travelDistance) || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 5px 0; border-bottom: 1px solid #e0e0e0;">Installation:</td><td style="text-align: right; padding: 5px 0; border-bottom: 1px solid #e0e0e0;">$${parseFloat(installationCost || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 8px 0; font-weight: bold;">Subtotal (excl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold;">$${parseFloat(subtotal || 0).toFixed(2)}</td></tr>
                    <tr><td style="padding: 5px 0;">GST (15%):</td><td style="text-align: right; padding: 5px 0;">$${parseFloat(gst || 0).toFixed(2)}</td></tr>
                    <tr style="border-top: 2px solid #333;"><td style="padding: 8px 0; font-weight: bold; font-size: 1.1em;">Total (incl. GST):</td><td style="text-align: right; padding: 8px 0; font-weight: bold; font-size: 1.1em;">$${parseFloat(totalQuote || 0).toFixed(2)}</td></tr>
                </table>
            </div>
            <p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString('en-NZ')}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            
            <div style="margin: 20px 0; text-align: center;">
                <a href="${approveLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">✅ Approve & Send to Customer</a>
                <a href="${declineFormLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">❌ Decline Quote</a>
            </div>
            
            <p><em>Quote ID: ${quoteId}</em></p>
        </div>
    `;

    // Build recipient list with validation
    const recipients = [];
    if (ADMIN_EMAIL && ADMIN_EMAIL.trim()) {
        recipients.push(ADMIN_EMAIL.trim());
    }
    if (tradespersonEmail && tradespersonEmail.trim()) {
        recipients.push(tradespersonEmail.trim());
    }

    console.log('DEBUG - Email recipients:', recipients);

    if (recipients.length === 0) {
        console.error('❌ No valid email recipients found. ADMIN_EMAIL:', ADMIN_EMAIL, 'tradespersonEmail:', tradespersonEmail);
        // Don't fail the whole process, just log the error
    } else {
        const emailOptions = {
            to: recipients,
            subject: `ACTION REQUIRED: Review Quote for ${customerName}`,
            html: emailHtml,
            attachments: [{
                filename: `Quote_${quoteId}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        };

        try {
            await sendEmail(emailOptions);
            console.log(`✅ Admin/Tradesperson review email sent successfully to: ${recipients.join(', ')}`);
        } catch (emailError) {
            console.error('❌ Failed to send review email:', emailError);
            // Don't fail the whole process, just log the error
        }
    }
    
    res.status(200).json({ success: true, message: 'Quote submitted and created in Xero.' });

  } catch (error) {
    console.error("A top-level error occurred in quote-submit:", error);
    res.status(500).json({ success: false, error: 'A fatal error occurred during quote submission.' });
  }
}