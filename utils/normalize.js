// Address normalization utilities

/**
 * Normalize customer address by removing "Unlisted Suburb" suffix
 * @param {string} address - The address to normalize
 * @returns {string} - Normalized address
 */
export function normalizeCustomerAddress(address) {
    if (!address || typeof address !== 'string') {
        return address || '';
    }

    // Remove "Unlisted Suburb" suffix (case-insensitive)
    const normalized = address.replace(/\s*unlisted\s+suburb\s*$/i, '').trim();
    
    console.log(`[NORMALIZE] Address normalization: "${address}" → "${normalized}"`);
    
    return normalized;
}

/**
 * Normalize suburb name by removing "Unlisted Suburb" suffix
 * @param {string} suburb - The suburb to normalize
 * @returns {string} - Normalized suburb
 */
export function normalizeSuburbName(suburb) {
    if (!suburb || typeof suburb !== 'string') {
        return suburb || '';
    }

    // Remove "Unlisted Suburb" suffix (case-insensitive)
    const normalized = suburb.replace(/\s*unlisted\s+suburb\s*$/i, '').trim();
    
    console.log(`[NORMALIZE] Suburb normalization: "${suburb}" → "${normalized}"`);
    
    return normalized;
}

/**
 * Normalize location data (address + suburb combination)
 * @param {string} location - The location string to normalize
 * @returns {string} - Normalized location
 */
export function normalizeLocation(location) {
    if (!location || typeof location !== 'string') {
        return location || '';
    }

    // Split by common separators and normalize each part
    const parts = location.split(/[,\s]+/).filter(part => part.trim());
    const normalizedParts = parts.map(part => normalizeSuburbName(part));
    
    const normalized = normalizedParts.join(' ').trim();
    
    console.log(`[NORMALIZE] Location normalization: "${location}" → "${normalized}"`);
    
    return normalized;
}

/**
 * Check if an address contains "Unlisted Suburb"
 * @param {string} address - The address to check
 * @returns {boolean} - True if address contains "Unlisted Suburb"
 */
export function isUnlistedSuburb(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }
    
    return /unlisted\s+suburb/i.test(address);
}

/**
 * Extract primary suburb name from address
 * @param {string} address - The address to extract from
 * @returns {string} - Primary suburb name
 */
export function extractPrimarySuburb(address) {
    if (!address || typeof address !== 'string') {
        return '';
    }

    // Remove "Unlisted Suburb" suffix and get the primary suburb
    const normalized = normalizeSuburbName(address);
    
    // If it's a compound suburb like "Epsom South", return the first part
    const parts = normalized.split(/\s+/);
    if (parts.length > 1) {
        return parts[0];
    }
    
    return normalized;
}

/**
 * Normalize quote data addresses
 * @param {object} quoteData - Quote data object
 * @returns {object} - Quote data with normalized addresses
 */
export function normalizeQuoteDataAddresses(quoteData) {
    if (!quoteData || typeof quoteData !== 'object') {
        return quoteData;
    }

    const normalized = { ...quoteData };

    // Normalize customer address
    if (normalized.customerAddress) {
        normalized.customerAddress = normalizeCustomerAddress(normalized.customerAddress);
    }

    // Normalize location
    if (normalized.location) {
        normalized.location = normalizeLocation(normalized.location);
    }

    // Normalize address in breakdown if it exists
    if (normalized.breakdown && normalized.breakdown.address) {
        normalized.breakdown.address = normalizeCustomerAddress(normalized.breakdown.address);
    }

    console.log(`[NORMALIZE] Normalized quote data addresses for quoteId: ${normalized.quoteId || 'unknown'}`);

    return normalized;
}

/**
 * Normalize lead data addresses
 * @param {object} leadData - Lead data object
 * @returns {object} - Lead data with normalized addresses
 */
export function normalizeLeadDataAddresses(leadData) {
    if (!leadData || typeof leadData !== 'object') {
        return leadData;
    }

    const normalized = { ...leadData };

    // Normalize location
    if (normalized.Location) {
        normalized.Location = normalizeLocation(normalized.Location);
    }

    // Normalize location (lowercase)
    if (normalized.location) {
        normalized.location = normalizeLocation(normalized.location);
    }

    // Normalize suburb
    if (normalized.Suburb) {
        normalized.Suburb = normalizeSuburbName(normalized.Suburb);
    }

    // Normalize suburb (lowercase)
    if (normalized.suburb) {
        normalized.suburb = normalizeSuburbName(normalized.suburb);
    }

    // Normalize area
    if (normalized.Area) {
        normalized.Area = normalizeSuburbName(normalized.Area);
    }

    // Normalize area (lowercase)
    if (normalized.area) {
        normalized.area = normalizeSuburbName(normalized.area);
    }

    console.log(`[NORMALIZE] Normalized lead data addresses for leadId: ${normalized.LeadId || normalized.Lead || 'unknown'}`);

    return normalized;
}
