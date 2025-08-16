import { google } from 'googleapis';
import { fetchQuoteData, fetchLeadData, generateQuotePdfContent } from './quote-utils.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { quoteId, leadId } = req.query;
    
    if (!quoteId && !leadId) {
      return res.status(400).json({ error: 'Either Quote ID or Lead ID is required' });
    }

    console.log('🔍 Debug quote mismatch for:', { quoteId, leadId });

    let quoteData = null;
    let leadData = null;

    // First, try to get the actual quote data if quoteId is provided
    if (quoteId) {
      console.log('🔍 Fetching quote data for quote ID:', quoteId);
      quoteData = await fetchQuoteData(quoteId);
      console.log('📋 Quote data result:', quoteData ? 'Found' : 'Not found');
    }

    // If no quote data found, or no quoteId provided, get lead data
    if (!quoteData) {
      console.log('🔍 Fetching lead data for lead ID:', leadId);
      leadData = await fetchLeadData(leadId);
      console.log('📋 Lead data result:', leadData ? 'Found' : 'Not found');
    }

    if (!quoteData && !leadData) {
      return res.status(404).json({ error: 'Neither quote nor lead data found' });
    }

    // Generate HTML content using the same function as the PDF
    const htmlContent = generateQuotePdfContent(leadData || quoteData, quoteData);

    // Extract key data for comparison
    const comparisonData = {
      quoteId: quoteId,
      leadId: leadId,
      quoteData: quoteData ? {
        quoteId: quoteData.quoteId,
        customerName: quoteData.customerName,
        customerEmail: quoteData.customerEmail,
        customerPhone: quoteData.customerPhone,
        tradesmanName: quoteData.tradesmanName,
        serviceType: quoteData.serviceType,
        quoteAmount: quoteData.quoteAmount,
        materialSubtotal: quoteData.materialSubtotal,
        labourSubtotal: quoteData.labourSubtotal,
        installationSubtotal: quoteData.installationSubtotal,
        validUntil: quoteData.validUntil,
        status: quoteData.status
      } : null,
      leadData: leadData ? {
        leadId: leadData.leadId,
        customerName: leadData.customerName,
        customerEmail: leadData.customerEmail,
        customerPhone: leadData.customerPhone,
        selectedService: leadData.selectedService,
        projectDetails: leadData.projectDetails,
        projectSize: leadData.projectSize,
        location: leadData.location,
        budget: leadData.budget,
        specificDetails: leadData.specificDetails
      } : null,
      generatedHtml: htmlContent.substring(0, 500) + '...', // First 500 chars for preview
      dataSource: quoteData ? 'Quote Data' : 'Lead Data',
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      comparison: comparisonData,
      message: 'Use this data to compare online quote vs email attachment'
    });

  } catch (error) {
    console.error('❌ Debug quote mismatch error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
