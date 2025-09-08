/**
 * Comprehensive logging utility for quote accept/decline operations
 * Provides structured logging with consistent prefixes and timestamps
 */

// Generate unique request ID for tracking
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get current timestamp in NZ timezone
function getTimestamp() {
    return new Date().toLocaleString('en-NZ', {
        timeZone: 'Pacific/Auckland',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// Sanitize sensitive data from logs
function sanitizeData(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    const sanitized = { ...data };
    
    for (const key in sanitized) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            sanitized[key] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

// Base logging function
function log(prefix, message, data = null, requestId = null) {
    const timestamp = getTimestamp();
    const reqId = requestId ? `[${requestId}]` : '';
    const sanitizedData = data ? sanitizeData(data) : null;
    
    const logMessage = `[${timestamp}] ${reqId} ${prefix} ${message}`;
    
    if (sanitizedData) {
        console.log(logMessage, JSON.stringify(sanitizedData, null, 2));
    } else {
        console.log(logMessage);
    }
}

// Specific logging functions for different operations
const quoteLogger = {
    // Request ID management
    generateRequestId,
    
    // Admin operations
    adminAccept: (message, data = null, requestId = null) => {
        log('[ADMIN-ACCEPT]', message, data, requestId);
    },
    
    adminDecline: (message, data = null, requestId = null) => {
        log('[ADMIN-DECLINE]', message, data, requestId);
    },
    
    // Customer operations
    customerAccept: (message, data = null, requestId = null) => {
        log('[CUSTOMER-ACCEPT]', message, data, requestId);
    },
    
    customerDecline: (message, data = null, requestId = null) => {
        log('[CUSTOMER-DECLINE]', message, data, requestId);
    },
    
    // API operations
    apiAccept: (message, data = null, requestId = null) => {
        log('[API-ACCEPT]', message, data, requestId);
    },
    
    apiDecline: (message, data = null, requestId = null) => {
        log('[API-DECLINE]', message, data, requestId);
    },
    
    // Data flow tracking
    dataFlow: (message, data = null, requestId = null) => {
        log('[DATA-FLOW]', message, data, requestId);
    },
    
    // Error tracking
    error: (message, error = null, requestId = null) => {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null;
        log('[ERROR]', message, errorData, requestId);
    },
    
    // Response tracking
    response: (message, data = null, requestId = null) => {
        log('[RESPONSE]', message, data, requestId);
    },
    
    // Google Sheets operations
    sheets: (message, data = null, requestId = null) => {
        log('[SHEETS]', message, data, requestId);
    },
    
    // Email operations
    email: (message, data = null, requestId = null) => {
        log('[EMAIL]', message, data, requestId);
    },
    
    // PDF operations
    pdf: (message, data = null, requestId = null) => {
        log('[PDF]', message, data, requestId);
    },
    
    // General operations
    info: (message, data = null, requestId = null) => {
        log('[INFO]', message, data, requestId);
    },
    
    // Request tracking
    request: (message, data = null, requestId = null) => {
        log('[REQUEST]', message, data, requestId);
    }
};

export default quoteLogger;
