/**
 * Write Guard Utility - Strict Route Validation
 * Prevents unauthorized writes to specific Google Sheets tabs
 */

/**
 * Assert that only Leads tab writes are allowed
 * @param {object} context - { req, caller }
 * @throws {Error} if trying to write to unauthorized tabs
 */
export function assertLeadWriteOnly({ req, caller }) {
  const ok = req?.method === 'POST' && req?.url?.includes('/api/lead-intake');
  if (!ok) throw new Error(`LEADS_WRITE_BLOCKED ${caller||'unknown'}`);
  return true;
}

/**
 * Assert that only Quotes tab writes are allowed
 * @param {object} context - { req, caller }
 * @throws {Error} if trying to write to unauthorized tabs
 */
export function assertQuoteWriteOnly({ req, caller }) {
  const allowed =
    (req?.method === 'GET' && req?.url?.includes('/api/quote/init')) || // draft write permitted via init route
    (req?.method === 'POST' && req?.url?.includes('/api/quote-submit')) ||
    (req?.method === 'GET' && (req?.url?.includes('/api/admin-accept') || req?.url?.includes('/api/admin-decline'))) ||
    (req?.method === 'GET' && (req?.url?.includes('/api/customer-accept') || req?.url?.includes('/api/customer-decline')));
  if (!allowed) throw new Error(`QUOTES_WRITE_BLOCKED ${caller||'unknown'}`);
  return true;
}
