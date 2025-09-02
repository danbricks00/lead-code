const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');

function getHTML(leadDetails, quoteDetails, parsedRooms) {
    const { 
        'Customer Name': customerName, 
        'Customer Email': customerEmail, 
        'Customer Phone': customerPhone, 
        Area, 
        Suburb 
    } = leadDetails;
    
    const { 
        tradespersonName, 
        tradespersonEmail, 
        tradespersonPhone,
        totalQuote,
        notes,
        validUntil,
        labourRate,
        labourHours,
        materialsCost,
        materialsQuantity,
        travelCost,
        travelDistance,
        installationCost
    } = quoteDetails;

    // Calculate subtotals for the table
    const labourTotal = (parseFloat(labourRate) || 0) * (parseFloat(labourHours) || 0);
    const materialsTotal = (parseFloat(materialsCost) || 0) * (parseFloat(materialsQuantity) || 0);
    const travelTotal = (parseFloat(travelCost) || 0) * (parseFloat(travelDistance) || 0);
    const installTotal = parseFloat(installationCost) || 0;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; }
            .invoice-box { max-width: 1000px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-details h1 { margin: 0; font-size: 24px; color: #333; }
            .quote-details { text-align: right; }
            .details-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .customer-details, .tradesperson-details { width: 45%; }
            h2 { font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
            .items-table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
            .items-table td, .items-table th { padding: 8px; border: 1px solid #ddd; }
            .items-table th { background-color: #f9f9f9; font-weight: bold; }
            .items-table .heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
            .total-section { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals-table { width: 40%; }
            .totals-table td { padding: 8px; }
            .totals-table .total { font-weight: bold; font-size: 1.2em; }
            .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #777; }
        </style>
    </head>
    <body>
        <div class="invoice-box">
            <div class="header">
                <div class="company-details">
                    <h1>Kiwi Trade</h1>
                    <p>Your Trusted Partner</p>
                </div>
                <div class="quote-details">
                    <strong>Quote #: ${quoteDetails.quoteId}</strong><br />
                    Date: ${new Date().toLocaleDateString('en-NZ')}<br />
                    Valid Until: ${new Date(validUntil).toLocaleDateString('en-NZ')}
                </div>
            </div>

            <div class="details-grid">
                <div class="customer-details">
                    <h2>Quote For:</h2>
                    ${customerName}<br />
                    ${customerEmail}<br />
                    ${customerPhone}<br />
                    ${Suburb}, ${Area}
                </div>
                <div class="tradesperson-details">
                    <h2>From:</h2>
                    ${tradespersonName}<br />
                    ${tradespersonEmail}<br />
                    ${tradespersonPhone}
                </div>
            </div>

            <h2>Project Scope: Underfloor Heating</h2>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Room Name</th>
                        <th>Dimensions</th>
                    </tr>
                </thead>
                <tbody>
                    ${parsedRooms.map(room => `<tr><td>${room.name}</td><td>${room.dimensions}</td></tr>`).join('')}
                </tbody>
            </table>

            <h2 style="margin-top: 30px;">Cost Breakdown</h2>
            <table class="items-table">
                <tr class="heading">
                    <td>Description</td>
                    <td>Rate</td>
                    <td>Unit(s)</td>
                    <td>Subtotal</td>
                </tr>
                <tr>
                    <td>Labour</td>
                    <td>$${parseFloat(labourRate || 0).toFixed(2)} / hr</td>
                    <td>${parseFloat(labourHours || 0)}</td>
                    <td>$${labourTotal.toFixed(2)}</td>
                </tr>
                 <tr>
                    <td>Materials</td>
                    <td>$${parseFloat(materialsCost || 0).toFixed(2)} / m²</td>
                    <td>${parseFloat(materialsQuantity || 0)}</td>
                    <td>$${materialsTotal.toFixed(2)}</td>
                </tr>
                 <tr>
                    <td>Travel</td>
                    <td>$${parseFloat(travelCost || 0).toFixed(2)} / km</td>
                    <td>${parseFloat(travelDistance || 0)}</td>
                    <td>$${travelTotal.toFixed(2)}</td>
                </tr>
                 <tr>
                    <td>Installation (Fixed Cost)</td>
                    <td colspan="2"></td>
                    <td>$${installTotal.toFixed(2)}</td>
                </tr>
            </table>
            
            <div class="total-section">
                <table class="totals-table">
                    <tr>
                        <td><strong>Total (excl. GST)</strong></td>
                        <td class="total">$${totalQuote.toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <strong>Notes:</strong> ${notes || 'None'}<br/>
                This quote is valid until ${new Date(validUntil).toLocaleDateString('en-NZ')}.
            </div>
        </div>
    </body>
    </html>
    `;
}

async function generatePdf(quoteDetails, leadDetails, parsedRooms) {
    let browser = null;
    try {
        // New syntax for modern puppeteer-core and chrome-aws-lambda
        browser = await puppeteer.launch({
            args: chrome.args,
            executablePath: await chrome.executablePath,
            headless: true, // Directly set to true
        });

        const page = await browser.newPage();
        const htmlContent = getHTML(quoteDetails, leadDetails, parsedRooms);
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        return { pdfBuffer, htmlContent }; // Return both on success

    } catch (error) {
        console.error("PDF Generation Error:", error);
        // Return null for the buffer but still provide the HTML for fallback
        const htmlContent = getHTML(quoteDetails, leadDetails, parsedRooms);
        return { pdfBuffer: null, htmlContent };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}

module.exports = { generatePdf, getHTML };
