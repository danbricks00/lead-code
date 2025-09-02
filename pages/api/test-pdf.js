import { generatePdf } from '../../lib/pdfGenerator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  console.log('--- PDF Generation Test Initialized ---');

  try {
    // 1. Create realistic mock data
    const mockQuoteDetails = {
      quoteId: 'TEST-123',
      tradespersonName: 'John Doe',
      tradespersonEmail: 'john.doe@example.com',
      tradespersonPhone: '021 123 4567',
      companyName: 'JD Underfloor Heating',
      labourCost: '1200',
      materialsCost: '2500',
      travelCost: '80',
      installationCost: '500',
      totalCost: '4280',
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NZ'),
      notes: 'This is a sample quote for testing purposes.'
    };

    const mockLeadDetails = {
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      serviceType: 'Underfloor Heating Installation',
      area: 'Central Auckland',
      suburb: 'Parnell',
      timeline: 'In a couple of months'
    };
    
    const mockRooms = [
        { name: 'Kitchen', dimensions: '15m²' },
        { name: 'Lounge', dimensions: '25m²' }
    ];

    console.log('Mock data created. Generating PDF...');

    // 2. Generate the PDF buffer
    const pdfBuffer = await generatePdf(mockQuoteDetails, mockLeadDetails, mockRooms);

    console.log('✅ PDF generated successfully.');

    // 3. Send the PDF as the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=test-quote.pdf');
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('--- PDF Generation Test Failed ---');
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate PDF.',
      message: error.message 
    });
  }
}
