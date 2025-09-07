import { convertWithAdobePDF } from '../../lib/pdfGenerator.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        console.log('🧪 Testing Adobe PDF Services...');
        
        // Check environment variables
        const hasClientId = !!process.env.ADOBE_PDF_CLIENT_ID;
        const hasClientSecret = !!process.env.ADOBE_PDF_CLIENT_SECRET;
        const hasOrgId = !!process.env.ADOBE_PDF_ORGANIZATION_ID;
        
        console.log('🔍 Adobe PDF Environment Check:');
        console.log('   ADOBE_PDF_CLIENT_ID:', hasClientId ? '✅ Set' : '❌ Missing');
        console.log('   ADOBE_PDF_CLIENT_SECRET:', hasClientSecret ? '✅ Set' : '❌ Missing');
        console.log('   ADOBE_PDF_ORGANIZATION_ID:', hasOrgId ? '✅ Set' : '❌ Missing');
        
        if (!hasClientId || !hasClientSecret) {
            return res.status(400).json({
                success: false,
                error: 'Adobe PDF credentials not configured',
                details: {
                    hasClientId,
                    hasClientSecret,
                    hasOrgId
                }
            });
        }
        
        // Test HTML content
        const testHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Adobe PDF Test</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
                    .content { margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🧪 Adobe PDF Services Test</h1>
                    <p>Testing PDF generation with Adobe PDF Services</p>
                </div>
                <div class="content">
                    <h2>Test Content</h2>
                    <p>This is a test PDF generated using Adobe PDF Services.</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                    <p>If you can see this PDF, Adobe PDF Services is working correctly!</p>
                </div>
            </body>
            </html>
        `;
        
        console.log('🔄 Attempting Adobe PDF conversion...');
        const pdfBuffer = await convertWithAdobePDF(testHTML);
        
        console.log('✅ Adobe PDF test successful!');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="adobe-test.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);
        
        return res.status(200).send(pdfBuffer);
        
    } catch (error) {
        console.error('❌ Adobe PDF test failed:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Adobe PDF test failed',
            details: {
                message: error.message,
                stack: error.stack,
                environment: {
                    hasClientId: !!process.env.ADOBE_PDF_CLIENT_ID,
                    hasClientSecret: !!process.env.ADOBE_PDF_CLIENT_SECRET,
                    hasOrgId: !!process.env.ADOBE_PDF_ORGANIZATION_ID
                }
            }
        });
    }
}
