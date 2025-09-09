/**
 * Quote Versioning Utility
 * Handles versioned quote ID generation for resubmissions
 */

/**
 * Generate a versioned quote ID based on existing quotes for a lead
 * @param {string} leadId - The lead ID
 * @param {Array} existingQuotes - Array of existing quotes for this lead
 * @returns {string} Versioned quote ID (e.g., "abc123", "abc123-B", "abc123-2")
 */
export function generateVersionedQuoteId(leadId, existingQuotes = []) {
  // Generate base quote ID from lead ID (first 6 characters + random suffix)
  const baseId = leadId.substring(0, 6) + Math.random().toString(36).substr(2, 3);
  
  // If no existing quotes, return base ID
  if (!existingQuotes || existingQuotes.length === 0) {
    return baseId;
  }
  
  // Find the highest version number for this base ID
  let maxVersion = 0;
  const versionPattern = /^(.+)-([A-Z]|\d+)$/;
  
  existingQuotes.forEach(quote => {
    const quoteId = String(quote.QuoteID || '').trim();
    const match = quoteId.match(versionPattern);
    
    if (match) {
      const [, base, version] = match;
      if (base === baseId) {
        // Convert version to number for comparison
        let versionNum = 0;
        if (version === 'A') versionNum = 1;
        else if (version === 'B') versionNum = 2;
        else if (version === 'C') versionNum = 3;
        else if (version === 'D') versionNum = 4;
        else if (version === 'E') versionNum = 5;
        else if (version === 'F') versionNum = 6;
        else if (version === 'G') versionNum = 7;
        else if (version === 'H') versionNum = 8;
        else if (version === 'I') versionNum = 9;
        else if (version === 'J') versionNum = 10;
        else {
          // Numeric version
          versionNum = parseInt(version, 10) || 0;
        }
        
        maxVersion = Math.max(maxVersion, versionNum);
      }
    }
  });
  
  // Generate next version
  const nextVersion = maxVersion + 1;
  
  // Convert version number to letter or number
  if (nextVersion <= 10) {
    const versionLetters = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    return `${baseId}-${versionLetters[nextVersion]}`;
  } else {
    return `${baseId}-${nextVersion}`;
  }
}

/**
 * Extract base quote ID from versioned quote ID
 * @param {string} quoteId - Versioned quote ID
 * @returns {string} Base quote ID without version suffix
 */
export function getBaseQuoteId(quoteId) {
  const versionPattern = /^(.+)-([A-Z]|\d+)$/;
  const match = String(quoteId).match(versionPattern);
  return match ? match[1] : String(quoteId);
}

/**
 * Get version number from versioned quote ID
 * @param {string} quoteId - Versioned quote ID
 * @returns {number} Version number (0 for base, 1+ for versions)
 */
export function getQuoteVersion(quoteId) {
  const versionPattern = /^(.+)-([A-Z]|\d+)$/;
  const match = String(quoteId).match(versionPattern);
  
  if (!match) return 0; // Base version
  
  const version = match[2];
  if (version === 'A') return 1;
  if (version === 'B') return 2;
  if (version === 'C') return 3;
  if (version === 'D') return 4;
  if (version === 'E') return 5;
  if (version === 'F') return 6;
  if (version === 'G') return 7;
  if (version === 'H') return 8;
  if (version === 'I') return 9;
  if (version === 'J') return 10;
  
  return parseInt(version, 10) || 0;
}

/**
 * Check if a quote ID is a resubmission (has version suffix)
 * @param {string} quoteId - Quote ID to check
 * @returns {boolean} True if it's a resubmission
 */
export function isResubmission(quoteId) {
  const versionPattern = /^(.+)-([A-Z]|\d+)$/;
  return versionPattern.test(String(quoteId));
}

/**
 * Get all quotes for a lead grouped by base ID
 * @param {Array} quotes - Array of quote objects
 * @returns {Object} Quotes grouped by base ID
 */
export function groupQuotesByBaseId(quotes) {
  const grouped = {};
  
  quotes.forEach(quote => {
    const baseId = getBaseQuoteId(quote.QuoteID);
    if (!grouped[baseId]) {
      grouped[baseId] = [];
    }
    grouped[baseId].push(quote);
  });
  
  // Sort each group by version number
  Object.keys(grouped).forEach(baseId => {
    grouped[baseId].sort((a, b) => {
      const versionA = getQuoteVersion(a.QuoteID);
      const versionB = getQuoteVersion(b.QuoteID);
      return versionA - versionB;
    });
  });
  
  return grouped;
}
