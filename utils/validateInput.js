// Input validation utilities for the quote system

// NZ Phone number validation (021xxxxxxx or +6421xxxxxxx)
const nzPhoneRegex = /^(?:\+64\d{7,10}|0\d{7,10})$/;

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Validate email
export function validateEmail(email) {
  if (!email) return false;
  return emailRegex.test(email.trim());
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
      return "Hmm, that doesn't look like an email, try sample@email.com";
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
