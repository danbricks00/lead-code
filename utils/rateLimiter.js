/**
 * Rate Limiting Utility
 * 
 * Prevents spam by limiting submission frequency from:
 * - Same IP address
 * - Same email address
 * 
 * Uses in-memory storage (for serverless, consider Redis or similar for production)
 */

// In-memory storage for rate limiting
// In production, use Redis or a database for persistence across serverless invocations
const submissionStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, data] of submissionStore.entries()) {
    if (now - data.firstSubmission > oneHour) {
      submissionStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Gets client IP address from request
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(req) {
  // Vercel provides this header
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Standard
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Fallback
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Checks if submission should be rate limited
 * 
 * @param {string} identifier - IP address or email
 * @param {number} maxSubmissions - Maximum submissions allowed
 * @param {number} timeWindow - Time window in milliseconds (default: 1 hour)
 * @returns {Object} Rate limit check result
 */
export function checkRateLimit(identifier, maxSubmissions = 3, timeWindow = 60 * 60 * 1000) {
  if (!identifier || identifier === 'unknown') {
    return { allowed: true, remaining: maxSubmissions, resetAt: null };
  }

  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const data = submissionStore.get(key);

  if (!data) {
    // First submission from this identifier
    submissionStore.set(key, {
      firstSubmission: now,
      lastSubmission: now,
      count: 1
    });
    return { 
      allowed: true, 
      remaining: maxSubmissions - 1, 
      resetAt: new Date(now + timeWindow) 
    };
  }

  // Check if time window has expired
  if (now - data.firstSubmission > timeWindow) {
    // Reset counter
    submissionStore.set(key, {
      firstSubmission: now,
      lastSubmission: now,
      count: 1
    });
    return { 
      allowed: true, 
      remaining: maxSubmissions - 1, 
      resetAt: new Date(now + timeWindow) 
    };
  }

  // Check if limit exceeded
  if (data.count >= maxSubmissions) {
    const resetAt = new Date(data.firstSubmission + timeWindow);
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt,
      reason: `Too many submissions. Please try again after ${resetAt.toLocaleString()}`
    };
  }

  // Increment counter
  data.count++;
  data.lastSubmission = now;
  submissionStore.set(key, data);

  return { 
    allowed: true, 
    remaining: maxSubmissions - data.count, 
    resetAt: new Date(data.firstSubmission + timeWindow) 
  };
}

/**
 * Checks rate limits for both IP and email
 * 
 * @param {Object} req - Request object
 * @param {string} email - Email address
 * @param {number} maxPerIP - Max submissions per IP (default: 5 per hour)
 * @param {number} maxPerEmail - Max submissions per email (default: 3 per hour)
 * @returns {Object} Rate limit check result
 */
export function checkSubmissionRateLimit(req, email, maxPerIP = 5, maxPerEmail = 3) {
  const clientIP = getClientIP(req);
  
  // Check IP-based rate limit
  const ipCheck = checkRateLimit(clientIP, maxPerIP, 60 * 60 * 1000);
  if (!ipCheck.allowed) {
    return {
      allowed: false,
      type: 'ip',
      reason: ipCheck.reason,
      resetAt: ipCheck.resetAt
    };
  }

  // Check email-based rate limit
  if (email) {
    const emailCheck = checkRateLimit(email.toLowerCase(), maxPerEmail, 60 * 60 * 1000);
    if (!emailCheck.allowed) {
      return {
        allowed: false,
        type: 'email',
        reason: emailCheck.reason,
        resetAt: emailCheck.resetAt
      };
    }
  }

  return {
    allowed: true,
    ipRemaining: ipCheck.remaining,
    emailRemaining: email ? checkRateLimit(email.toLowerCase(), maxPerEmail, 60 * 60 * 1000).remaining : null
  };
}

