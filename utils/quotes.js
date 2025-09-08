/**
 * Unified Quote Row Builder - Single Source of Truth
 * Builds consistent 36-column quote rows with exact header spellings
 */

export function buildQuoteRow({
  lead,
  quoteId,
  tradePersonName = '',
  tradePersonEmail = '',
  tradePersonPhone = '',
  body = {},          // financials + notes on submit
  mode = 'draft'      // 'draft' | 'submitted' | 'accepted' | 'rejected'
}) {
  const row = {
    TimeStamp: new Date().toISOString(),
    QuoteID: quoteId,
    LeadID: lead.Lead || '',

    // Customer / lead info
    CustomerName: lead.CustomerName || '',
    CustomerEmail: lead.CustomerEmail || '',
    CustomerPhone: lead.CustomerPhone || '',
    ServiceType: lead.ServiceType || '',
    Rooms: lead.Rooms || '',
    Sqm: lead.Sqm || '',
    Area: lead.Area || '',
    Suburb: lead.Suburb || '',
    Budget: lead.Budget || '',
    Timelline: lead.Timelline || '',  // Note: exact spelling with typo
    'Specfic Details': lead['Specfic Details'] || '',  // Note: exact spelling with typo

    // Tradesperson info
    TradePersonName: tradePersonName || '',
    TradePersonEmail: tradePersonEmail || '',
    TradePersonPhone: tradePersonPhone || '',

    // Financials (blank in draft; filled on submit)
    LabourRate: body.labourRate || '',
    LabourHours: body.labourHours || '',
    LabourTotal: body.labourTotal || '',
    MaterialsCost: body.materialsCost || '',
    MaterialsQuantity: body.materialsQuantity || '',
    MaterialsTotal: body.materialsTotal || '',
    TravelCost: body.travelCost || '',
    TravelDistance: body.travelDistance || '',
    TravelTotal: body.travelTotal || '',
    InstallationCost: body.installationCost || '',
    Subtotal: body.subtotal || '',
    GST: body.gst || '',
    TotalQuote: body.totalQuote || '',
    Notes: body.notes || '',
    ValidUnitl: body.validUntil || '',  // Note: exact spelling with typo

    // Decision fields
    Decison: '',  // Note: exact spelling with typo
    DecisonTimeStamp: '',  // Note: exact spelling with typo

    // Default workflow states
    TradePersonStatus: 'Draft',
    CustomerStatus: 'Pending',
    AdminPersonStatus: 'Pending',
  };

  if (mode === 'submitted') {
    row.TradePersonStatus = 'Pending';
    row.CustomerStatus = 'Submitted';
    row.AdminPersonStatus = 'Pending';
  }

  if (mode === 'accepted') {
    row.TradePersonStatus = 'Accepted';
    row.CustomerStatus = 'Approved';
    row.AdminPersonStatus = 'Closed';
    row.Decison = 'Accepted';
    row.DecisonTimeStamp = new Date().toISOString();
  }

  if (mode === 'rejected') {
    row.TradePersonStatus = 'Declined';
    row.CustomerStatus = 'Not Sent';
    row.AdminPersonStatus = 'Closed';
    row.Decison = 'Rejected';
    row.DecisonTimeStamp = new Date().toISOString();
  }

  return row;
}
