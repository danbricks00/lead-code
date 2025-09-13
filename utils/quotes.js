/**
 * Unified Quote Row Builder - Single Source of Truth
 * Builds consistent 36-column quote rows with exact header spellings
 */

export function buildQuoteRow({
  lead,
  quoteId,
  body = {},          // financials + notes on submit
  mode = 'draft'      // 'draft' | 'submitted' | 'accepted' | 'rejected'
}) {
  // Generate NZT timestamp in DD-MM-YYYY HH:mm format
  const now = new Date();
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Pacific/Auckland' // Ensure NZT
  };
  const nztFormattedDate = new Intl.DateTimeFormat('en-NZ', options).format(now);

  // Normalize tradesperson fields from various possible keys
  const tradePersonName = body.tradePersonName || body.tradespersonName || body.trade_name || lead.TradePersonName || '';
  const tradePersonEmail = body.tradePersonEmail || body.tradespersonEmail || body.trade_email || lead.TradePersonEmail || '';
  const tradePersonPhone = body.tradePersonPhone || body.tradespersonPhone || body.trade_phone || lead.TradePersonPhone || '';

  const row = {
    TimeStamp: nztFormattedDate,
    QuoteID: quoteId,
    LeadID: lead.Lead || '',

    // Customer / lead info
    CustomerName: lead.CustomerName || '',
    CustomerEmail: lead.CustomerEmail || '',
    CustomerPhone: lead.CustomerPhone || '',
    ServiceType: lead.ServiceType || '',
    Address: body.address || lead.Address || '', // Prefer submitted address
    Rooms: body.rooms ? JSON.stringify(body.rooms) : lead.Rooms || '', // Use submitted rooms
    Sqm: body.totalSqm ? parseFloat(body.totalSqm).toFixed(2) : (lead.Sqm || ''), // Use calculated totalSqm
    Area: lead.Area || '',
    Suburb: lead.Suburb || '',
    Budget: lead.Budget || '',
    Timelline: lead.Timelline || '',  // Note: exact spelling with typo
    'Specfic Details': lead['Specfic Details'] || '',  // Note: exact spelling with typo

    // Tradesperson info (now normalized)
    TradePersonName: tradePersonName,
    TradePersonEmail: tradePersonEmail,
    TradePersonPhone: tradePersonPhone,

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
    ValidUntil: body.validUntil || '',

    // Decision fields
    Decison: '',  // Note: exact spelling with typo
    DecisonTimeStamp: '',  // Note: exact spelling with typo
    AdminDecisionTimeStamp: body.adminDecisionTimestamp || '',
    AdminDecision: body.adminDecision || '',

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
    row.DecisonTimeStamp = nzTimestamp;
  }

  if (mode === 'rejected') {
    row.TradePersonStatus = 'Declined';
    row.CustomerStatus = 'Not Sent';
    row.AdminPersonStatus = 'Closed';
    row.Decison = 'Rejected';
    row.DecisonTimeStamp = nzTimestamp;
  }

  return row;
}
