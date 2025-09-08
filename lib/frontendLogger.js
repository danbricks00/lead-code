/**
 * Frontend logging utility for tracking button interactions and user actions
 * Provides structured logging with consistent prefixes and timestamps
 */

// Generate unique session ID for tracking
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Get user agent and basic browser info
function getBrowserInfo() {
    return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
    };
}

// Get current page info
function getPageInfo() {
    return {
        url: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        referrer: document.referrer
    };
}

// Sanitize sensitive data from logs
function sanitizeData(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential', 'email'];
    const sanitized = { ...data };
    
    for (const key in sanitized) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            sanitized[key] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

// Base logging function
function log(prefix, message, data = null, sessionId = null) {
    const timestamp = getTimestamp();
    const session = sessionId ? `[${sessionId}]` : '';
    const sanitizedData = data ? sanitizeData(data) : null;
    
    const logMessage = `[${timestamp}] ${session} ${prefix} ${message}`;
    
    if (sanitizedData) {
        console.log(logMessage, sanitizedData);
    } else {
        console.log(logMessage);
    }
    
    // Also send to server for centralized logging (optional)
    if (typeof window !== 'undefined' && window.fetch) {
        try {
            fetch('/api/log-frontend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp,
                    sessionId,
                    prefix,
                    message,
                    data: sanitizedData,
                    browserInfo: getBrowserInfo(),
                    pageInfo: getPageInfo()
                })
            }).catch(() => {
                // Silently fail if logging endpoint doesn't exist
            });
        } catch (error) {
            // Silently fail if fetch is not available
        }
    }
}

// Specific logging functions for different operations
const frontendLogger = {
    // Session management
    generateSessionId,
    
    // Admin operations
    adminAccept: (message, data = null, sessionId = null) => {
        log('[ADMIN-ACCEPT]', message, data, sessionId);
    },
    
    adminDecline: (message, data = null, sessionId = null) => {
        log('[ADMIN-DECLINE]', message, data, sessionId);
    },
    
    // Customer operations
    customerAccept: (message, data = null, sessionId = null) => {
        log('[CUSTOMER-ACCEPT]', message, data, sessionId);
    },
    
    customerDecline: (message, data = null, sessionId = null) => {
        log('[CUSTOMER-DECLINE]', message, data, sessionId);
    },
    
    // Button interactions
    buttonClick: (message, data = null, sessionId = null) => {
        log('[BUTTON-CLICK]', message, data, sessionId);
    },
    
    // Form interactions
    formSubmit: (message, data = null, sessionId = null) => {
        log('[FORM-SUBMIT]', message, data, sessionId);
    },
    
    // Navigation
    navigation: (message, data = null, sessionId = null) => {
        log('[NAVIGATION]', message, data, sessionId);
    },
    
    // Error tracking
    error: (message, error = null, sessionId = null) => {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null;
        log('[ERROR]', message, errorData, sessionId);
    },
    
    // API calls
    apiCall: (message, data = null, sessionId = null) => {
        log('[API-CALL]', message, data, sessionId);
    },
    
    // User interactions
    userAction: (message, data = null, sessionId = null) => {
        log('[USER-ACTION]', message, data, sessionId);
    },
    
    // General operations
    info: (message, data = null, sessionId = null) => {
        log('[INFO]', message, data, sessionId);
    }
};

// Auto-generate session ID on load
let sessionId = frontendLogger.generateSessionId();

// Log page load
frontendLogger.info('Page loaded', {
    url: window.location.href,
    title: document.title,
    userAgent: navigator.userAgent
}, sessionId);

// Export the logger with session ID
export default {
    ...frontendLogger,
    getSessionId: () => sessionId,
    setSessionId: (newSessionId) => { sessionId = newSessionId; }
};
