# Comprehensive Logging System Guide

## Overview

This system implements comprehensive logging for all quote management operations, including admin actions, customer decisions, API calls, and data transformations. The logging system provides detailed tracking for debugging, monitoring, and auditing purposes.

## Logging Components

### 1. Server-Side Logging (`lib/quoteLogger.js`)

**Purpose**: Centralized logging for all server-side operations including API endpoints, Google Sheets interactions, email sending, and error handling.

**Key Features**:
- Unique request IDs for tracing requests across the system
- Structured logging with consistent prefixes
- Automatic timestamp generation
- Error tracking with stack traces
- Data flow monitoring

**Usage**:
```javascript
import quoteLogger from '../lib/quoteLogger.js';

export default async function handler(req, res) {
    const requestId = quoteLogger.generateRequestId();
    const startTime = Date.now();
    
    // Log API request entry
    quoteLogger.apiAccept('Request received', {
        method: req.method,
        url: req.url,
        query: req.query
    }, requestId);
    
    try {
        // Your logic here
        
        // Log successful operations
        quoteLogger.sheets('Data written to Google Sheets', {
            sheetName: 'Quotes',
            rowCount: 1
        }, requestId);
        
        // Log response
        quoteLogger.response('Success response sent', {
            statusCode: 200,
            processingTime: Date.now() - startTime
        }, requestId);
        
    } catch (error) {
        // Log errors
        quoteLogger.error('Operation failed', {
            error: error.message,
            stack: error.stack
        }, requestId);
    }
}
```

### 2. Frontend Logging (`lib/frontendLogger.js`)

**Purpose**: Client-side logging for user interactions, button clicks, API calls, and browser events.

**Key Features**:
- Session-based logging with unique session IDs
- Button click tracking
- API call monitoring
- Error and warning logging
- Navigation tracking

**Usage**:
```javascript
import frontendLogger from '/lib/frontendLogger.js';

// Log button clicks
function approveQuote(quoteId) {
    frontendLogger.adminAccept('Approve button clicked', {
        quoteId,
        buttonType: 'approve',
        timestamp: new Date().toISOString()
    });
    
    // Make API call
    fetch(`/api/admin/approve?quoteId=${quoteId}`)
        .then(response => {
            frontendLogger.apiCall('API response received', {
                quoteId,
                status: response.status,
                processingTime: Date.now() - startTime
            });
        });
}
```

## Log Categories and Prefixes

### Server-Side Logs

| Prefix | Category | Description |
|--------|----------|-------------|
| `[ADMIN-ACCEPT]` | Admin approval actions | Admin quote approval operations |
| `[ADMIN-DECLINE]` | Admin decline actions | Admin quote decline operations |
| `[CUSTOMER-ACCEPT]` | Customer acceptance | Customer quote acceptance |
| `[CUSTOMER-DECLINE]` | Customer decline | Customer quote decline |
| `[API-ACCEPT]` | API acceptance endpoints | Server-side acceptance processing |
| `[API-DECLINE]` | API decline endpoints | Server-side decline processing |
| `[SHEETS]` | Google Sheets operations | All Google Sheets read/write operations |
| `[EMAIL]` | Email operations | Email sending and template processing |
| `[PDF]` | PDF generation | PDF creation and processing |
| `[DATA-FLOW]` | Data transformations | Data processing and validation |
| `[RESPONSE]` | API responses | Response generation and sending |
| `[ERROR]` | Error handling | All error conditions and exceptions |

### Frontend Logs

| Prefix | Category | Description |
|--------|----------|-------------|
| `[ADMIN-ACCEPT]` | Admin approval UI | Admin approval button interactions |
| `[ADMIN-DECLINE]` | Admin decline UI | Admin decline button interactions |
| `[CUSTOMER-ACCEPT]` | Customer acceptance UI | Customer acceptance button interactions |
| `[CUSTOMER-DECLINE]` | Customer decline UI | Customer decline button interactions |
| `[API-CALL]` | Frontend API calls | All frontend API requests and responses |
| `[USER-ACTION]` | User interactions | General user actions and navigation |
| `[NAVIGATION]` | Page navigation | Page loads and navigation events |
| `[ERROR]` | Frontend errors | JavaScript errors and exceptions |
| `[WARNING]` | Frontend warnings | Non-critical issues and warnings |
| `[INFO]` | General information | General frontend information |

## Log Data Structure

### Standard Log Entry
```javascript
{
    timestamp: "2024-01-15T10:30:45.123Z",
    requestId: "req_abc123def456", // Server-side only
    sessionId: "sess_xyz789", // Frontend only
    level: "info|warn|error",
    category: "ADMIN-ACCEPT|CUSTOMER-DECLINE|etc",
    message: "Human-readable description",
    data: {
        // Context-specific data
        quoteId: "Q-2024-001",
        customerName: "John Smith",
        processingTime: 1250,
        // ... other relevant data
    }
}
```

### Request ID Generation
- **Server-side**: `req_` + 12-character random string
- **Frontend**: `sess_` + 8-character random string
- **Format**: `req_abc123def456` or `sess_xyz789`

## Implementation Examples

### 1. Admin Quote Approval

**Frontend (Button Click)**:
```javascript
frontendLogger.adminAccept('Approve button clicked', {
    quoteId: 'Q-2024-001',
    customerName: 'John Smith',
    totalAmount: 4500.00,
    buttonType: 'approve'
});
```

**Backend (API Processing)**:
```javascript
quoteLogger.adminAccept('Request received', {
    method: 'GET',
    url: '/api/admin/approve',
    query: { quoteId: 'Q-2024-001' }
}, requestId);

quoteLogger.sheets('Reading quote data from Google Sheets', {
    quoteId: 'Q-2024-001',
    sheetName: 'Quotes'
}, requestId);

quoteLogger.email('Sending customer quote email', {
    to: 'customer@example.com',
    quoteId: 'Q-2024-001'
}, requestId);
```

### 2. Customer Quote Decision

**Frontend (Decision Button)**:
```javascript
frontendLogger.customerAccept('Accept button clicked', {
    quoteId: 'Q-2024-001',
    decision: 'accept',
    buttonType: 'accept'
});
```

**Backend (Decision Processing)**:
```javascript
quoteLogger.customerAccept('Customer decision received', {
    quoteId: 'Q-2024-001',
    decision: 'accept',
    ip: req.ip
}, requestId);

quoteLogger.sheets('Updating quote status in Google Sheets', {
    quoteId: 'Q-2024-001',
    newStatus: 'Accepted'
}, requestId);
```

### 3. Error Handling

**Frontend Error**:
```javascript
frontendLogger.error('API call failed', {
    url: '/api/admin/approve',
    status: 500,
    error: 'Internal Server Error'
});
```

**Backend Error**:
```javascript
quoteLogger.error('Google Sheets operation failed', {
    operation: 'update',
    sheetName: 'Quotes',
    error: error.message,
    stack: error.stack
}, requestId);
```

## Log Monitoring and Analysis

### 1. Vercel Logs
- All server-side logs are automatically sent to Vercel's logging system
- Access via Vercel dashboard or CLI: `vercel logs`
- Search by request ID for end-to-end tracing

### 2. Browser Console
- Frontend logs are displayed in browser console
- Use browser dev tools to filter and search logs
- Session ID allows tracking user sessions

### 3. Log Analysis Patterns

**Find all operations for a specific quote**:
```bash
# Search by quote ID
vercel logs | grep "Q-2024-001"
```

**Find all admin actions**:
```bash
# Search by admin action prefix
vercel logs | grep "\[ADMIN-ACCEPT\]"
```

**Find all errors**:
```bash
# Search by error prefix
vercel logs | grep "\[ERROR\]"
```

**Trace a specific request**:
```bash
# Search by request ID
vercel logs | grep "req_abc123def456"
```

## Best Practices

### 1. Logging Guidelines
- **Always include request ID** in server-side logs for tracing
- **Log at appropriate levels**: info for normal operations, warn for issues, error for failures
- **Include relevant context**: quote IDs, customer names, processing times
- **Avoid sensitive data**: Don't log passwords, tokens, or personal information
- **Use consistent prefixes**: Follow the established prefix system

### 2. Performance Considerations
- **Minimize log data size**: Only include necessary information
- **Use structured logging**: JSON format for easy parsing
- **Batch operations**: Group related operations in single log entries when possible
- **Async logging**: Don't block operations for logging

### 3. Error Handling
- **Log all errors**: Catch and log all exceptions
- **Include stack traces**: For debugging server-side errors
- **Log error context**: Include relevant data when errors occur
- **Don't expose sensitive data**: Sanitize error messages

## Troubleshooting Common Issues

### 1. Missing Logs
- Check if logging is properly imported
- Verify request ID generation
- Ensure logs are being sent to Vercel

### 2. Incomplete Request Tracing
- Use consistent request IDs across all operations
- Include request ID in all log entries
- Log both request entry and response

### 3. Frontend Logging Issues
- Check browser console for errors
- Verify session ID generation
- Ensure proper import of frontend logger

## Integration with Existing Code

### 1. Adding Logging to New APIs
```javascript
import quoteLogger from '../lib/quoteLogger.js';

export default async function handler(req, res) {
    const requestId = quoteLogger.generateRequestId();
    const startTime = Date.now();
    
    quoteLogger.info('API request received', {
        method: req.method,
        url: req.url
    }, requestId);
    
    try {
        // Your existing logic here
        
        quoteLogger.response('Success response', {
            statusCode: 200,
            processingTime: Date.now() - startTime
        }, requestId);
        
    } catch (error) {
        quoteLogger.error('API error', {
            error: error.message,
            stack: error.stack
        }, requestId);
    }
}
```

### 2. Adding Frontend Logging
```javascript
import frontendLogger from '/lib/frontendLogger.js';

// Log button clicks
button.addEventListener('click', function() {
    frontendLogger.userAction('Button clicked', {
        buttonId: this.id,
        action: 'submit'
    });
});

// Log API calls
fetch('/api/endpoint')
    .then(response => {
        frontendLogger.apiCall('API response', {
            status: response.status,
            url: '/api/endpoint'
        });
    });
```

This comprehensive logging system provides complete visibility into all quote management operations, making debugging and monitoring much more effective.
