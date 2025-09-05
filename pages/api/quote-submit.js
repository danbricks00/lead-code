import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';
import { xero, initializeXero } from "../../lib/xero";
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
    
    // --- XERO INTEGRATION ---
    let xeroClient, tenantId;
    try {
        xeroClient = await initializeXero();
        tenantId = xeroClient.tenants[0].tenantId;
    } catch (initError) {
        console.error("Xero Initialization Error:", initError);
        return res.status(500).json({ success: false, error: "Failed during Xero client initialization." });
    }

    // 1. Find or Create Contact in Xero
    let contactID;
    const { customerName, customerEmail, customerPhone } = leadDetails;
    try {
      const getContactResponse = await xeroClient.accountingApi.getContacts(tenantId, null, `EmailAddress=="${customerEmail}"`);
      if (getContactResponse.body.contacts && getContactResponse.body.contacts.length > 0) {
          contactID = getContactResponse.body.contacts[0].contactID;
          console.log(`Found existing Xero contact: ${contactID}`);
      } else {
          const newContact = { contacts: [{ name: customerName, emailAddress: customerEmail, phones: [{ phoneType: 'DEFAULT', phoneNumber: customerPhone }] }] };
          const createContactResponse = await xeroClient.accountingApi.createContacts(tenantId, newContact);
          contactID = createContactResponse.body.contacts[0].contactID;
          console.log(`Created new Xero contact: ${contactID}`);
      }
    } catch (contactError) {
        console.error("Xero Contact Error:", contactError.response ? JSON.stringify(contactError.response.body, null, 2) : contactError);
        return res.status(500).json({ success: false, error: "Failed to find or create Xero contact." });
    }

    // 2. Create Quote in Xero
    let xeroQuoteId;
    const {
        labourRate, labourHours, materialsCost, materialsQuantity,
        travelCost, travelDistance, installationCost, totalQuote, notes, validUntil
    } = quoteDetails;
    try {
      const quoteToCreate = {
          quotes: [{
              contact: { contactID: contactID },
              date: new Date().toISOString().split('T')[0], // Today's date
              expiryDate: new Date(validUntil).toISOString().split('T')[0],
              title: `Quote for ${leadDetails.ServiceType || 'services'} for ${leadDetails.CustomerName}`,
              summary: notes,
              lineItems: [
                  { description: 'Labour', quantity: labourHours, unitAmount: labourRate, accountCode: '200' },
                  { description: 'Materials', quantity: materialsQuantity, unitAmount: materialsCost, accountCode: '200' },
                  { description: 'Travel', quantity: travelDistance, unitAmount: travelCost, accountCode: '200' },
                  { description: 'Installation', quantity: 1, unitAmount: installationCost, accountCode: '200' }
              ],
              status: 'DRAFT' // Draft until admin approves
          }]
      };
      
      const createQuoteResponse = await xeroClient.accountingApi.createQuotes(tenantId, quoteToCreate);
      xeroQuoteId = createQuoteResponse.body.quotes[0].quoteID;
      console.log(`Successfully created Xero Quote (Draft): ${xeroQuoteId}`);
    } catch (quoteError) {
        console.error("Xero Create Quote Error:", quoteError.response ? JSON.stringify(quoteError.response.body, null, 2) : quoteError);
        if (quoteError.response && quoteError.response.body && quoteError.response.body.Elements) {
            console.error("Validation Errors:", JSON.stringify(quoteError.response.body.Elements[0].ValidationErrors, null, 2));
        }
        return res.status(500).json({ success: false, error: "Failed to create quote in Xero." });
    }

    // 3. Get PDF of the Quote from Xero
    let pdfBuffer;
    try {
        const quotePdf = await xeroClient.accountingApi.getQuoteAsPdf(tenantId, xeroQuoteId, { headers: { 'Accept': 'application/pdf' } });
        pdfBuffer = Buffer.from(quotePdf.body);
        console.log(`Successfully downloaded PDF for Quote ${xeroQuoteId}`);
    } catch (pdfError) {
        console.error("Xero Get PDF Error:", pdfError.response ? JSON.stringify(pdfError.response.body, null, 2) : pdfError);
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
    const { tradespersonName, tradespersonEmail } = quoteDetails;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const approveLink = generateAdminDecisionLink('approve', quoteId);
    const declineLink = generateAdminDecisionLink('decline', quoteId);

    const emailHtml = `
        <p>A new quote for "${leadDetails.projectName}" has been submitted by ${tradespersonName} and created in Xero.</p>
        <p>Please review the attached PDF quote and approve or decline it.</p>
        <a href="${approveLink}">Approve & Send to Customer</a> | <a href="${declineLink}">Decline</a>
    `;

    const emailOptions = {
        to: [ADMIN_EMAIL, tradespersonEmail],
        subject: `ACTION REQUIRED: Review Quote for ${leadDetails.customerName}`,
        html: emailHtml,
        attachments: [{
            filename: `Quote_${quoteId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    };

    await sendEmail(emailOptions);
    console.log(`Admin/Tradesperson review email sent with Xero PDF attached.`);
    
    res.status(200).json({ success: true, message: 'Quote submitted and created in Xero.' });

  } catch (error) {
    console.error("A top-level error occurred in quote-submit:", error);
    res.status(500).json({ success: false, error: 'A fatal error occurred during quote submission.' });
  }
}