import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { generatePdf } from "../../lib/pdfGenerator"; // Import the PDF generator

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

function generateDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    const token = verifyToken(quoteId, ts); // Re-using the same function for consistency
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/quote-decision/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}

// Generates links for the ADMIN to approve or decline the quote
function generateAdminDecisionLink(action, quoteId) {
    const ts = Date.now().toString();
    // A separate secret or a different context could be used here, but for simplicity, we reuse.
    const token = verifyToken(quoteId, ts); 
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    return `https://${baseUrl}/api/admin/${action}?quoteId=${quoteId}&ts=${ts}&token=${token}`;
}


async function sendQuoteEmails(transporter, customerEmail, customerName, quoteDetails, leadDetails, parsedRooms) {
    // This function is now for sending the ADMIN/TRADESPERSON approval email

    const approveLink = generateAdminDecisionLink('approve', quoteDetails.quoteId);
    const declineLink = generateAdminDecisionLink('decline', quoteDetails.quoteId);
    
    // Generate the link for the web view for the admin/tradesperson to review
    const ts = Date.now().toString();
    const token = verifyToken(quoteDetails.quoteId, ts);
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/^(https?:\/\/)/, '');
    const viewLink = `https://${baseUrl}/quote/view/${quoteDetails.quoteId}?ts=${ts}&token=${token}`;

    // Temporarily comment out old PDF generation
    // let pdfBuffer;
    // let htmlContent;
    // try {
    //   const { pdfBuffer: generatedPdf, htmlContent: generatedHtml } = await generatePdf(quoteDetails, leadDetails);
    //   pdfBuffer = generatedPdf;
    //   htmlContent = generatedHtml;
    //   console.log('PDF generated successfully for admin review.');
    // } catch (pdfError) {
    //   console.error('Error generating PDF for admin review:', pdfError);
    //   // Fallback to HTML if PDF fails
    //   htmlContent = getHTML(quoteDetails, leadDetails);
    // }

    // Prepare email content
    // const adminEmailOptions = {
    //   to: ADMIN_EMAIL,
    //   subject: `ACTION REQUIRED: Review Quote for ${leadDetails.customerName} (Lead ID: ${leadId})`,
    //   html: `
    //     <p>A new quote has been submitted by ${tradespersonName} for the lead "${leadDetails.projectName}" and is ready for your review.</p>
    //     <p><strong>Customer:</strong> ${leadDetails.customerName}</p>
    //     <p><strong>Project:</strong> ${leadDetails.projectName}</p>
    //     <p><strong>Total Quote:</strong> $${totalQuote}</p>
    //     <p>Please review the attached quote (and the web version below) and approve or decline it using the buttons below.</p>
    //     <a href="${adminApproveLink}" style="padding: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Approve Quote</a>
    //     <a href="${adminDeclineLink}" style="padding: 10px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Decline Quote</a>
    //     <hr>
    //     <p>You can also view the quote online here: <a href="${viewLink}">${viewLink}</a></p>
    //   `,
    //   attachments: pdfBuffer ? [{
    //     filename: `Quote_${leadId}.pdf`,
    //     content: pdfBuffer,
    //     contentType: 'application/pdf'
    //   }] : []
    // };

    // const tradespersonEmailOptions = {
    //   to: tradespersonEmail,
    //   subject: `Quote Submitted for ${leadDetails.customerName} - Awaiting Admin Approval`,
    //   html: `
    //     <p>Thank you for submitting your quote for the lead "${leadDetails.projectName}".</p>
    //     <p>It has been sent to the admin for review. You will be notified once a decision has been made.</p>
    //     <p>You can view the submitted quote here: <a href="${viewLink}">${viewLink}</a></p>
    //     <hr>
    //     <h3>Quote Summary:</h3>
    //     ${htmlContent}
    //   `,
    //   attachments: pdfBuffer ? [{
    //     filename: `Quote_${leadId}_Copy.pdf`,
    //     content: pdfBuffer,
    //     contentType: 'application/pdf'
    //   }] : []
    // };


    // Send emails
    // await sendEmail(adminEmailOptions);
    // console.log(`Admin review email sent successfully to ${ADMIN_EMAIL}.`);
    // await sendEmail(tradespersonEmailOptions);
    // console.log(`Tradesperson confirmation email sent successfully to ${tradespersonEmail}.`);

    // --- TEMPORARY RESPONSE ---
    // This will be replaced by the Xero logic and proper emails later.
    const adminEmailOptions = {
        to: process.env.ADMIN_EMAIL,
        subject: `ACTION REQUIRED: Review Quote for ${leadDetails.customerName} (Lead ID: ${quoteDetails.quoteId})`,
        html: `
            <p>A new quote has been submitted by ${quoteDetails.tradespersonName} for the lead "${leadDetails.projectName}" and is ready for your review.</p>
            <p><strong>Customer:</strong> ${leadDetails.customerName}</p>
            <p><strong>Project:</strong> ${leadDetails.projectName}</p>
            <p><strong>Total Quote:</strong> $${quoteDetails.totalQuote.toFixed(2)}</p>
            <p>Please review the quote details and approve or decline it using the buttons below.</p>
            <p><i>PDF generation is temporarily disabled while we integrate with Xero.</i></p>
            <a href="${approveLink}" style="padding: 10px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Approve Quote</a>
            <a href="${declineLink}" style="padding: 10px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">Decline Quote</a>
            <hr>
            <p>You can also view the quote online here: <a href="${viewLink}">${viewLink}</a></p>
        `,
    };

    const tradespersonEmailOptions = {
        to: customerEmail,
        subject: `Quote Submitted for ${leadDetails.customerName} - Awaiting Admin Approval`,
        html: `
            <p>Thank you for submitting your quote for the lead "${leadDetails.projectName}".</p>
            <p>It has been sent to the admin for review. You will be notified once a decision has been made.</p>
            <p><i>PDF generation is temporarily disabled while we integrate with Xero.</i></p>
            <p>You can view the submitted quote here: <a href="${viewLink}">${viewLink}</a></p>
        `,
    };

     try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        });
        await transporter.sendMail(adminEmailOptions);
        console.log(`Admin review email sent successfully to ${process.env.ADMIN_EMAIL}.`);
        await transporter.sendMail(tradespersonEmailOptions);
        console.log(`Tradesperson confirmation email sent successfully to ${customerEmail}.`);
    } catch (emailError) {
        console.error('Failed to send quote submission emails:', emailError);
        // We don't want to block the whole process if emails fail, but we should log it.
    }


    res.status(200).json({ success: true, message: 'Quote submitted for admin approval.' });
  } catch (error) {
        console.error("Quote submission error:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}