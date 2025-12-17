/**
 * Spam Validation Utility
 * 
 * Provides server-side validation to harden contact forms against automated spam.
 * Uses a scoring system to silently drop spam submissions while allowing legitimate enquiries.
 */

/**
 * Validates phone number for New Zealand and Australian formats only
 * 
 * Allowed formats:
 * - Starts with 0 (NZ/AU local)
 * - Starts with +64 (NZ international)
 * - Starts with +61 (AU international)
 * 
 * Blocks generic 10-digit strings that don't match regional patterns
 */
export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, score: 0, reason: 'Phone number is required' };
  }

  // Strip spaces, dashes, parentheses, and other formatting
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // Check for generic 10-digit strings (common spam pattern)
  // These are just random digits without country code
  if (/^\d{10}$/.test(cleaned) && !cleaned.startsWith('0')) {
    return { 
      isValid: false, 
      score: 10, 
      reason: 'Generic 10-digit number without country code (likely spam)' 
    };
  }

  // NZ numbers: 0XXXXXXXXX or +64XXXXXXXXX
  // AU numbers: 0XXXXXXXXX or +61XXXXXXXXX
  const nzLocalPattern = /^0[2-9]\d{7,9}$/; // NZ local: 0 followed by area code (2-9) and 7-9 digits
  const nzIntlPattern = /^\+64[2-9]\d{7,9}$/; // NZ international: +64 followed by area code
  const auLocalPattern = /^0[2-9]\d{8,9}$/; // AU local: 0 followed by area code (2-9) and 8-9 digits
  const auIntlPattern = /^\+61[2-9]\d{8,9}$/; // AU international: +61 followed by area code

  if (nzLocalPattern.test(cleaned) || nzIntlPattern.test(cleaned)) {
    return { isValid: true, score: 0, reason: 'Valid NZ number' };
  }

  if (auLocalPattern.test(cleaned) || auIntlPattern.test(cleaned)) {
    return { isValid: true, score: 0, reason: 'Valid AU number' };
  }

  // If it has digits but doesn't match patterns, it's suspicious
  if (/\d/.test(cleaned)) {
    return { 
      isValid: false, 
      score: 8, 
      reason: 'Phone number does not match NZ/AU format patterns' 
    };
  }

  return { isValid: false, score: 5, reason: 'Invalid phone number format' };
}

/**
 * Splits full name into first and last name, then validates
 * 
 * Allows:
 * - First + last name (e.g., "John Smith")
 * - Initials (e.g., "A Smith", "J. P. Smith")
 * - Hyphens and apostrophes (e.g., "Mary-Anne O'Connor")
 * 
 * Blocks:
 * - Single long random strings
 * - Keyboard mash or mixed-case nonsense
 * - Names with excessive special characters
 */
export function validateAndSplitName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { 
      isValid: false, 
      score: 10, 
      firstName: '', 
      lastName: '', 
      reason: 'Name is required' 
    };
  }

  const trimmed = fullName.trim();

  // Check for empty or too short names
  if (trimmed.length < 2) {
    return { 
      isValid: false, 
      score: 10, 
      firstName: '', 
      lastName: '', 
      reason: 'Name is too short' 
    };
  }

  // Check for suspiciously long single strings (likely random spam)
  if (trimmed.length > 50 && !trimmed.includes(' ')) {
    return { 
      isValid: false, 
      score: 10, 
      firstName: '', 
      lastName: '', 
      reason: 'Name appears to be a random string (too long without spaces)' 
    };
  }

  // Check for keyboard mash patterns (repeated characters, alternating case)
  const keyboardMashPattern = /(.)\1{4,}/; // Same character repeated 5+ times
  const alternatingCase = /([a-z][A-Z]){3,}/; // Alternating case pattern
  if (keyboardMashPattern.test(trimmed) || alternatingCase.test(trimmed)) {
    return { 
      isValid: false, 
      score: 10, 
      firstName: '', 
      lastName: '', 
      reason: 'Name appears to be keyboard mash' 
    };
  }

  // Check for excessive special characters (more than 2 non-alphanumeric except hyphens/apostrophes)
  const specialCharCount = (trimmed.match(/[^a-zA-Z0-9\s\-']/g) || []).length;
  if (specialCharCount > 2) {
    return { 
      isValid: false, 
      score: 8, 
      firstName: '', 
      lastName: '', 
      reason: 'Name contains too many special characters' 
    };
  }

  // Split name into parts
  const parts = trimmed.split(/\s+/).filter(part => part.length > 0);

  if (parts.length === 0) {
    return { 
      isValid: false, 
      score: 10, 
      firstName: '', 
      lastName: '', 
      reason: 'Name cannot be empty' 
    };
  }

  // Handle single name (could be valid for some cultures, but suspicious for NZ/AU)
  if (parts.length === 1) {
    // Allow if it's a reasonable length and looks like a real name
    if (parts[0].length >= 3 && parts[0].length <= 20 && /^[a-zA-Z\-']+$/.test(parts[0])) {
      return { 
        isValid: true, 
        score: 2, // Slight penalty for single name
        firstName: parts[0], 
        lastName: '', 
        reason: 'Single name provided (may be valid)' 
      };
    }
    return { 
      isValid: false, 
      score: 8, 
      firstName: '', 
      lastName: '', 
      reason: 'Single name provided and does not appear valid' 
    };
  }

  // Extract first and last name
  // First name is the first part, last name is everything else joined
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  // Validate first name
  if (!/^[a-zA-Z\-']+$/.test(firstName)) {
    return { 
      isValid: false, 
      score: 8, 
      firstName: '', 
      lastName: '', 
      reason: 'First name contains invalid characters' 
    };
  }

  // Validate last name (allows spaces for compound surnames)
  if (!/^[a-zA-Z\s\-']+$/.test(lastName)) {
    return { 
      isValid: false, 
      score: 8, 
      firstName: '', 
      lastName: '', 
      reason: 'Last name contains invalid characters' 
    };
  }

  // Check for reasonable length
  if (firstName.length > 30 || lastName.length > 50) {
    return { 
      isValid: false, 
      score: 6, 
      firstName: '', 
      lastName: '', 
      reason: 'Name parts are unreasonably long' 
    };
  }

  return { 
    isValid: true, 
    score: 0, 
    firstName, 
    lastName, 
    reason: 'Valid name format' 
  };
}

/**
 * Common spam keywords and phrases to detect
 */
const spamKeywords = [
  // Financial spam
  'make money', 'get rich', 'work from home', 'earn $', 'guaranteed income',
  'investment opportunity', 'bitcoin', 'crypto', 'forex', 'trading',
  
  // SEO/Advertising spam
  'seo services', 'increase traffic', 'backlinks', 'page rank',
  'google ranking', 'website promotion', 'social media marketing',
  
  // Scam patterns
  'urgent', 'act now', 'limited time', 'click here', 'free trial',
  'no credit check', 'guaranteed approval', 'risk free',
  
  // Link spam
  'http://', 'https://', 'www.', '.com', '.net', '.org',
  
  // Pharmaceutical spam
  'viagra', 'cialis', 'pharmacy', 'prescription', 'medication',
  
  // Adult content
  'xxx', 'porn', 'adult', 'dating site',
  
  // Generic spam phrases
  'congratulations', 'you have won', 'claim your prize', 'winner',
  'lottery', 'sweepstakes', 'prize winner'
];

/**
 * Validates message quality and checks for spam content
 * 
 * Requirements:
 * - Minimum length (default 15 characters)
 * - Must contain at least one space (to block random character strings)
 * 
 * Blocks:
 * - Random character strings without spaces
 * - Extremely short messages
 * - Messages with spam keywords
 * - Excessive links
 */
export function validateMessage(message, minLength = 15) {
  if (!message || typeof message !== 'string') {
    return { 
      isValid: false, 
      score: 10, 
      reason: 'Message is required' 
    };
  }

  const trimmed = message.trim();

  // Check minimum length
  if (trimmed.length < minLength) {
    return { 
      isValid: false, 
      score: 8, 
      reason: `Message is too short (minimum ${minLength} characters)` 
    };
  }

  // Must contain at least one space (blocks random character strings)
  if (!trimmed.includes(' ')) {
    return { 
      isValid: false, 
      score: 10, 
      reason: 'Message must contain spaces (blocks random character strings)' 
    };
  }

  // Check for spam keywords (case-insensitive)
  const messageLower = trimmed.toLowerCase();
  const foundKeywords = spamKeywords.filter(keyword => 
    messageLower.includes(keyword.toLowerCase())
  );
  
  if (foundKeywords.length > 0) {
    return { 
      isValid: false, 
      score: 10, 
      reason: `Message contains spam keywords: ${foundKeywords.slice(0, 3).join(', ')}` 
    };
  }

  // Check for excessive links (more than 2 URLs is suspicious)
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = trimmed.match(urlPattern);
  if (urls && urls.length > 2) {
    return { 
      isValid: false, 
      score: 8, 
      reason: 'Message contains too many links (likely spam)' 
    };
  }

  // Check for excessive repetition (spam indicator)
  const words = trimmed.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = uniqueWords.size / words.length;
  
  // If less than 30% unique words, likely spam
  if (words.length > 10 && repetitionRatio < 0.3) {
    return { 
      isValid: false, 
      score: 7, 
      reason: 'Message contains excessive repetition (likely spam)' 
    };
  }

  return { isValid: true, score: 0, reason: 'Valid message format' };
}

/**
 * Checks if honeypot field was filled (spam indicator)
 * 
 * Honeypot fields should be hidden from users but visible to bots.
 * If filled, it's almost certainly a bot.
 */
export function checkHoneypot(honeypotValue) {
  if (honeypotValue && honeypotValue.trim().length > 0) {
    return { 
      isSpam: true, 
      score: 20, // High score for honeypot trigger
      reason: 'Honeypot field was filled (bot detected)' 
    };
  }
  return { isSpam: false, score: 0, reason: 'Honeypot not triggered' };
}

/**
 * Validates email pattern for suspicious characteristics
 * 
 * Checks for:
 * - Random character patterns
 * - Suspicious domain patterns
 * - Email addresses that look auto-generated
 */
export function validateEmailPattern(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, score: 0, reason: 'Email is required' };
  }

  const trimmed = email.toLowerCase();
  const [localPart, domain] = trimmed.split('@');

  if (!localPart || !domain) {
    return { isValid: false, score: 0, reason: 'Invalid email format' };
  }

  // Check for random character patterns in local part
  // Patterns like: aaa123, abc123, random123, test123
  const randomPatterns = [
    /^[a-z]{3,}\d{3,}$/,  // letters followed by numbers
    /^\d{3,}[a-z]{3,}$/,  // numbers followed by letters
    /^[a-z]\d{5,}$/,       // single letter + many digits
    /^test\d+$/,           // test + numbers
    /^user\d+$/,           // user + numbers
    /^temp\d+$/,           // temp + numbers
    /^admin\d+$/,          // admin + numbers
  ];

  for (const pattern of randomPatterns) {
    if (pattern.test(localPart)) {
      return { 
        isValid: false, 
        score: 5, 
        reason: 'Email address appears to be auto-generated' 
      };
    }
  }

  // Check for suspiciously short local parts (likely fake)
  if (localPart.length < 2) {
    return { 
      isValid: false, 
      score: 3, 
      reason: 'Email local part is too short' 
    };
  }

  return { isValid: true, score: 0, reason: 'Email pattern looks legitimate' };
}

/**
 * Validates submission timing
 * 
 * If form is submitted too quickly after page load, it's likely a bot.
 * Humans typically take at least a few seconds to fill out a form.
 * 
 * @param {number} timeOnPage - Time in milliseconds since page load (from hidden field)
 * @param {number} minTime - Minimum time in milliseconds (default: 3000 = 3 seconds)
 * @returns {Object} Timing validation result
 */
export function validateSubmissionTiming(timeOnPage, minTime = 3000) {
  if (!timeOnPage || typeof timeOnPage !== 'number') {
    // If timing not provided, don't penalize (might be legitimate)
    return { isValid: true, score: 0, reason: 'Timing not provided' };
  }

  if (timeOnPage < minTime) {
    return { 
      isValid: false, 
      score: 8, 
      reason: `Form submitted too quickly (${Math.round(timeOnPage / 1000)}s). Bots typically submit instantly.` 
    };
  }

  return { isValid: true, score: 0, reason: 'Submission timing looks legitimate' };
}

/**
 * Comprehensive spam scoring system
 * 
 * Calculates a total spam score based on all validation checks.
 * If score exceeds threshold, submission should be silently dropped.
 * 
 * @param {Object} formData - Form submission data
 * @param {number} threshold - Spam score threshold (default: 15)
 * @param {Object} options - Additional options (timing, etc.)
 * @returns {Object} Validation result with score and details
 */
export function calculateSpamScore(formData, threshold = 15, options = {}) {
  const {
    firstName,
    lastName,
    name, // Fallback if name not split
    email,
    phone,
    message,
    website, // Honeypot field name
    honeypot, // Alternative honeypot field name
    timeOnPage, // Form submission timing
    ...otherFields
  } = formData;

  let totalScore = 0;
  const issues = [];

  // Check honeypot (check both common field names)
  const honeypotValue = website || honeypot || otherFields.website || otherFields.honeypot;
  const honeypotCheck = checkHoneypot(honeypotValue);
  if (honeypotCheck.isSpam) {
    totalScore += honeypotCheck.score;
    issues.push(honeypotCheck.reason);
  }

  // Validate and split name
  let nameValidation;
  if (firstName && lastName) {
    // Name already split, validate parts
    const fullName = `${firstName} ${lastName}`;
    nameValidation = validateAndSplitName(fullName);
  } else if (name) {
    // Name not split, validate and split
    nameValidation = validateAndSplitName(name);
  } else {
    nameValidation = { 
      isValid: false, 
      score: 10, 
      firstName: '', 
      lastName: '', 
      reason: 'Name field is missing' 
    };
  }

  if (!nameValidation.isValid || nameValidation.score > 0) {
    totalScore += nameValidation.score;
    issues.push(`Name: ${nameValidation.reason}`);
  }

  // Validate phone (if provided)
  if (phone) {
    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid || phoneValidation.score > 0) {
      totalScore += phoneValidation.score;
      issues.push(`Phone: ${phoneValidation.reason}`);
    }
  }

  // Validate email pattern (if email provided)
  if (email) {
    const emailPatternValidation = validateEmailPattern(email);
    if (!emailPatternValidation.isValid || emailPatternValidation.score > 0) {
      totalScore += emailPatternValidation.score;
      issues.push(`Email Pattern: ${emailPatternValidation.reason}`);
    }
  }

  // Validate message
  const messageValidation = validateMessage(message);
  if (!messageValidation.isValid || messageValidation.score > 0) {
    totalScore += messageValidation.score;
    issues.push(`Message: ${messageValidation.reason}`);
  }

  // Validate submission timing (if provided)
  const timingValidation = validateSubmissionTiming(timeOnPage || options.timeOnPage);
  if (!timingValidation.isValid || timingValidation.score > 0) {
    totalScore += timingValidation.score;
    issues.push(`Timing: ${timingValidation.reason}`);
  }

  const isSpam = totalScore >= threshold;

  return {
    isSpam,
    score: totalScore,
    threshold,
    issues,
    nameData: {
      firstName: nameValidation.firstName,
      lastName: nameValidation.lastName,
      originalName: name || `${firstName || ''} ${lastName || ''}`.trim()
    },
    passed: !isSpam
  };
}

