import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  console.log('--- Simplified PDF Generation Test Initialized ---');
  let browser = null;

  try {
    const simplifiedHtml = '<html><body><h1>PDF Test</h1><p>If you can see this, the PDF engine is working.</p></body></html>';
    console.log('Using simplified HTML for test.');

    // Add recommended font and Vercel-specific configurations
    await chromium.font('https://raw.githack.com/googlei18n/noto-cjk/main/NotoSansCJK-Regular.ttc');

    browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(simplifiedHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
    });

    if (!pdfBuffer || pdfBuffer.length < 100) {
        throw new Error(`PDF generation resulted in an invalid buffer. Size: ${pdfBuffer ? pdfBuffer.length : 0} bytes.`);
    }

    console.log(`✅ Simplified PDF generated successfully. Size: ${pdfBuffer.length} bytes.`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=simplified-test.pdf');
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('--- Simplified PDF Generation Test Failed ---');
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate simplified PDF.',
      message: error.message 
    });
  } finally {
      if (browser) {
          await browser.close();
      }
  }
}
