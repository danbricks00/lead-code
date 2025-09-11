// Input validation utilities for the quote system

// NZ Phone number validation (021xxxxxxx or +6421xxxxxxx)
const nzPhoneRegex = /^(?:\+64\d{7,10}|0\d{7,10})$/;

// Email validation
const emailRegex = /^[^\s@]{2,}@[^\s@]+\.[^\s@]+$/;

// Invalid domain patterns (like .x.x for Outlook)
const invalidDomainPatterns = [
  /\.x\.x$/i,           // .x.x pattern
  /\.x\.\w+$/i,         // .x.anything pattern
  /\.\w+\.x$/i,         // .anything.x pattern
  /\.x$/i,              // .x pattern
  /\.\d+\.\d+$/i,       // .number.number pattern
  /\.\d+$/i,            // .number pattern
  /\.x\.\w+\.\w+$/i,    // .x.anything.anything pattern (like .x.net.nz)
];

// Valid TLD patterns for common domains
const validTLDPatterns = [
  /\.(com|co|org|net|edu|gov|mil|int)$/i,  // Generic TLDs
  
  // New Zealand domains (comprehensive support)
  /\.(co\.nz|org\.nz|net\.nz|ac\.nz|govt\.nz|school\.nz|iwi\.nz|maori\.nz)$/i,  // NZ second-level domains
  /\.nz$/i,  // Direct .nz domains
  
  // Other country-specific TLDs
  /\.(co\.uk|com\.au|co\.za|co\.jp|co\.kr|co\.in|co\.br|co\.mx|co\.ca)$/i,  // Country-specific TLDs
  /\.(uk|au|za|jp|kr|in|br|mx|ca|de|fr|it|es|nl|se|no|dk|fi|pl|cz|hu|ro|bg|hr|si|sk|ee|lv|lt|mt|cy|ie|pt|gr|lu|at|be|ch|li|is|fo|gl|ad|mc|sm|va|gi|je|gg|im|ax|sj|bv|hm|tf|aq|gs|fk|sh|ac|ta|io|cc|tv|me|ly|as|mp|gu|vi|pr|us|dm|lc|vc|ag|bb|gd|kn|ms|tc|vg|ai|bm|ky)$/i  // Country codes
];

// Sanitize phone number (remove spaces, dashes, brackets)
export function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '');
}

// Validate NZ phone number
export function validatePhone(phone) {
  if (!phone) return false;
  const sanitized = sanitizePhone(phone);
  return nzPhoneRegex.test(sanitized);
}

// Enhanced email validation with domain checking
export function validateEmail(email) {
  if (!email) return false;
  
  const trimmedEmail = email.trim();
  
  // Basic email format validation
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Extract domain part
  const domain = trimmedEmail.split('@')[1];
  if (!domain) return false;
  
  // Check for invalid domain patterns
  for (const pattern of invalidDomainPatterns) {
    if (pattern.test(domain)) {
      console.log(`❌ Invalid domain pattern detected: ${domain}`);
      return false;
    }
  }
  
  // Block specific invalid domains (common typos or incorrect TLDs)
  const invalidDomainCombinations = [
    { provider: 'gmail', validTlds: ['com', 'net'], invalidTlds: ['co'] },
    { provider: 'yahoo', validTlds: ['com', 'co.uk', 'co.nz'], invalidTlds: ['co'] },
    { provider: 'hotmail', validTlds: ['com', 'co.uk', 'co.nz'], invalidTlds: ['co'] },
    { provider: 'outlook', validTlds: ['com', 'co.uk', 'co.nz'], invalidTlds: ['co'] }
  ];
  
  // Check for invalid domain combinations
  const domainParts = domain.split('.');
  const provider = domainParts[0].toLowerCase();
  const tld = domainParts.slice(1).join('.');
  
  for (const item of invalidDomainCombinations) {
    if (provider === item.provider && item.invalidTlds.includes(tld)) {
      console.log(`❌ Invalid domain combination blocked: ${domain} (${provider}.${tld})`);
      return false;
    }
  }
  
  // Check for valid TLD patterns (more permissive for international domains)
  const hasValidTLD = validTLDPatterns.some(pattern => pattern.test(domain));
  
  // If no valid TLD pattern matches, do additional checks
  if (!hasValidTLD) {
    // Allow domains with at least 2 parts and reasonable length
    const domainParts = domain.split('.');
    if (domainParts.length < 2) {
      console.log(`❌ Domain has insufficient parts: ${domain}`);
      return false;
    }
    
    // Check if any part is too short or contains invalid characters
    for (const part of domainParts) {
      if (part.length < 2 || /[^a-zA-Z0-9\-]/.test(part)) {
        console.log(`❌ Invalid domain part: ${part} in ${domain}`);
        return false;
      }
    }
  }
  
  return true;
}

// Validate numeric input
export function validateNumeric(value) {
  if (!value) return false;
  const num = parseFloat(value.toString().replace(/[^0-9.]/g, ''));
  return !isNaN(num) && num >= 0;
}

// Validate date (DD/MM/YYYY or ISO format)
export function validateDate(date) {
  if (!date) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

// Get validation error message
export function getInvalidMessage(type, value = '') {
  switch (type) {
    case 'phone':
      return "That doesn't look like a NZ phone number, try 0211234567 or +64211234567";
    case 'email':
      return "Please enter a valid email address (e.g., user@outlook.com, user@example.co.nz, user@company.nz)";
    case 'numeric':
      return "Please enter a valid number";
    case 'date':
      return "Please enter a valid date";
    case 'required':
      return "This field is required";
    default:
      return "Invalid input";
  }
}

// Comprehensive validation function
export function validateInput(type, value) {
  switch (type) {
    case 'phone':
      return validatePhone(value);
    case 'email':
      return validateEmail(value);
    case 'numeric':
      return validateNumeric(value);
    case 'date':
      return validateDate(value);
    case 'required':
      return value && value.toString().trim().length > 0;
    default:
      return true;
  }
}

// Validate tradesperson details
export function validateTradespersonDetails(details) {
  const errors = [];
  
  if (!validateInput('required', details.name)) {
    errors.push('Name is required');
  }
  
  if (!validateInput('email', details.email)) {
    errors.push(getInvalidMessage('email'));
  }
  
  if (details.phone && !validateInput('phone', details.phone)) {
    errors.push(getInvalidMessage('phone'));
  }
  
  if (!validateInput('required', details.address)) {
    errors.push('Business address is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate customer details
export function validateCustomerDetails(details) {
  const errors = [];
  
  if (!validateInput('required', details.name)) {
    errors.push('Customer name is required');
  }
  
  if (!validateInput('email', details.email)) {
    errors.push(getInvalidMessage('email'));
  }
  
  if (details.phone && !validateInput('phone', details.phone)) {
    errors.push(getInvalidMessage('phone'));
  }
  
  if (!validateInput('required', details.address)) {
    errors.push('Customer address is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate quote details
export function validateQuoteDetails(details) {
  const errors = [];
  
  if (!validateInput('numeric', details.amount)) {
    errors.push('Quote amount must be a valid number');
  }
  
  if (!validateInput('required', details.description)) {
    errors.push('Quote description is required');
  }
  
  if (!validateInput('date', details.validUntil)) {
    errors.push('Valid until date is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
