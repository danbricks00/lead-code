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

  // Normalize tradesperson fields from various possible keys - using consistent TradePerson format
  const TradePersonName = body.TradePersonName || body.tradePersonName || body.trade_name || lead.TradePersonName || '';
  const TradePersonEmail = body.TradePersonEmail || body.tradePersonEmail || body.tradespersonEmail || body.trade_email || lead.TradePersonEmail || '';
  const TradePersonPhone = body.TradePersonPhone || body.tradePersonPhone || body.tradespersonPhone || body.trade_phone || lead.TradePersonPhone || '';

  const row = {
    Timestamp: nztFormattedDate, // Corrected from TimeStamp
    QuoteID: quoteId,
    LeadID: body.leadId || lead.LeadID || '', // Corrected from lead.Lead

    // Customer / lead info
    CustomerName: body.customerName || lead.CustomerName || '',
    CustomerEmail: body.customerEmail || lead.CustomerEmail || '',
    CustomerPhone: body.customerPhone || lead.CustomerPhone || '',
    ServiceType: body.serviceType || lead.ServiceType || '',
    Address: body.address || lead.Address || '', // Prefer submitted address
    Rooms: body.rooms || lead.Rooms || '', // Use submitted rooms
    TotalSQM: body.TotalSQM || body.totalSqm ? parseFloat(body.TotalSQM || body.totalSqm).toFixed(2) : (lead.TotalSQM || ''), // Use calculated totalSqm
    Location: lead.Location || '',
    Timeline: lead.Timeline || '',  // Note: exact spelling with typo
    Budget: lead.Budget || '',

    // Tradesperson info (now normalized) - Using consistent TradePerson format as per Google Sheet
    TradePersonName: body.TradePersonName || TradePersonName,
    TradePersonEmail: body.TradePersonEmail || TradePersonEmail,
    TradePersonPhone: body.TradePersonPhone || TradePersonPhone,

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

    // Decision fields - Fixed column names to match Google Sheets structure
    Decision: '',  // Fixed typo from 'Decison'
    DecisionTimestamp: '',  // Fixed typo from 'DecisonTimeStamp'
    AdminDecisionTimeStamp: body.adminDecisionTimestamp || '',
    AdminDecision: body.adminDecision || '',

    // Default workflow states - Using camelCase format as per Google Sheet
    TradePersonStatus: 'Draft',  // camelCase format
    CustomerStatus: 'Pending',
    AdminPersonStatus: 'Pending',  // camelCase format
  };

  if (mode === 'submitted') {
    row.TradePersonStatus = 'Pending';  // camelCase format
    row.CustomerStatus = 'Submitted';
    row.AdminPersonStatus = 'Pending';  // camelCase format
  }

  if (mode === 'accepted') {
    row.TradePersonStatus = 'Accepted';  // camelCase format
    row.CustomerStatus = 'Approved';
    row.AdminPersonStatus = 'Closed';  // camelCase format
    row.Decision = 'Accepted';  // Fixed typo
    row.DecisionTimestamp = nztFormattedDate;  // Fixed typo and variable name
  }

  if (mode === 'rejected') {
    row.TradePersonStatus = 'Declined';  // camelCase format
    row.CustomerStatus = 'Not Sent';
    row.AdminPersonStatus = 'Closed';  // camelCase format
    row.Decision = 'Rejected';  // Fixed typo
    row.DecisionTimestamp = nztFormattedDate;  // Fixed typo and variable name
  }

  return row;
}
