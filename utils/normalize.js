/**
 * Normalization utilities for handling Google Sheets data
 * Maps PascalCase sheet headers to camelCase API parameters
 */

/**
 * Maps a Google Sheets row to include both PascalCase and camelCase ID fields
 * @param {Object} row - Raw row data from Google Sheets
 * @returns {Object} - Row with both QuoteID/LeadID and quoteId/leadId fields
 */
export function mapIds(row) {
  if (!row) return row;
  
  return {
    ...row,
    // Add camelCase versions for API compatibility
    quoteId: row.QuoteID,
    leadId: row.LeadID,
    // Keep original PascalCase for sheet operations
    QuoteID: row.QuoteID,
    LeadID: row.LeadID,
  };
}

/**
 * Normalizes query parameters from URL to sheet header format
 * @param {Object} query - Request query parameters
 * @returns {Object} - Normalized parameters with both formats
 */
export function normalizeQueryParams(query) {
  const { quoteId, leadId, ...otherParams } = query;
  
  return {
    // Original camelCase (for API responses)
    quoteId,
    leadId,
    // PascalCase (for sheet operations)
    QuoteID: quoteId,
    LeadID: leadId,
    // Other parameters
    ...otherParams
  };
}

/**
 * Validates that quote and lead IDs match
 * @param {Object} quoteData - Quote data from sheets
 * @param {Object} leadData - Lead data from sheets
 * @param {string} expectedQuoteId - Expected quote ID
 * @param {string} expectedLeadId - Expected lead ID
 * @returns {boolean} - True if IDs match
 */
export function validateIdMatch(quoteData, leadData, expectedQuoteId, expectedLeadId) {
  if (!quoteData || !leadData) return false;
  
  const quoteMatches = quoteData.QuoteID === expectedQuoteId;
  const leadMatches = leadData.LeadID === expectedLeadId;
  const crossMatches = quoteData.LeadID === expectedLeadId && leadData.QuoteID === expectedQuoteId;
  
  return quoteMatches && leadMatches && crossMatches;
}

/**
 * Creates a standardized error response for ID mismatches
 * @param {string} tag - Error tag for logging
 * @param {string} quoteId - Quote ID
 * @param {string} leadId - Lead ID
 * @param {Object} quoteData - Quote data (optional)
 * @param {Object} leadData - Lead data (optional)
 * @returns {Object} - Error response object
 */
export function createIdMismatchError(tag, quoteId, leadId, quoteData = null, leadData = null) {
  console.error(JSON.stringify({
    tag,
    quoteId,
    leadId,
    foundQuote: !!quoteData,
    foundLead: !!leadData,
    quoteQuoteID: quoteData?.QuoteID,
    quoteLeadID: quoteData?.LeadID,
    leadQuoteID: leadData?.QuoteID,
    leadLeadID: leadData?.LeadID,
    expectedQuoteID: quoteId,
    expectedLeadID: leadId
  }));
  
  return {
    status: 404,
    json: { error: 'Quote or Lead not found' }
  };
}