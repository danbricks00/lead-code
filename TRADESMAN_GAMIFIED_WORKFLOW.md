# Tradesman Gamified Email Workflow

## Overview

The tradesman gamified email system provides an interactive, progress-tracking experience for tradesmen when they receive leads. The system automatically updates the tradesman's progress based on real system events, creating a seamless workflow that keeps tradesmen engaged and informed.

## Workflow Steps

### Step 1: Lead Received ✅ (Automatic)
- **Status**: Automatically completed when lead is assigned
- **Visual**: Green tick (✓) in a green circle
- **Progress**: 33% complete
- **Description**: "New lead details have been received and assigned to you."

### Step 2: Quote Sent ✅ (Automatic)
- **Status**: Automatically completed when quote is sent to customer
- **Visual**: Green tick (✓) in a green circle
- **Progress**: 66% complete
- **Description**: "Quote has been sent to the customer."
- **Trigger**: When `/api/generate-quote` sends a quote email to the customer

### Step 3: Quote Decision ✅/❌ (Automatic)
- **Status**: Automatically updated based on customer decision
- **Visual**: 
  - **Accepted**: Green tick (✓) in a green circle
  - **Declined**: Red X (✗) in a red circle
- **Progress**: 100% complete
- **Description**: "Quote has been [accepted/declined] by the customer."
- **Trigger**: When customer accepts or declines quote via `/api/quote-decision`

## Technical Implementation

### 1. Lead Assignment (Step 1)
When a new lead is assigned to tradesmen, the initial email includes:
- Progress bar showing 33% completion
- "Lead Received" step marked as completed
- "Quote Sent" and "Quote Decision" steps as pending

### 2. Quote Generation (Step 2)
When a tradesman generates and sends a quote:

**File**: `server.js` - `sendQuoteEmail()` function
```javascript
// Automatically update tradesman progress to mark "Quote Sent" as completed
const updateResponse = await fetch(`${currentUrl}/api/update-tradesman-progress`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        customerEmail: quoteData.customerEmail,
        service: quoteData.serviceType,
        step: 'quote_sent',
        status: 'completed'
    })
});
```

**Result**:
- Progress bar updates to 66%
- "Quote Sent" step gets green tick
- Admin receives notification email

### 3. Quote Decision (Step 3)
When a customer makes a decision:

**File**: `api/quote-decision.js` - Main handler
```javascript
// Automatically update tradesman progress for quote decision
const updateResponse = await fetch(`${currentUrl}/api/update-tradesman-progress`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        customerEmail: leadData?.customerEmail || quoteData?.customerEmail,
        service: quoteData?.serviceType || leadData?.selectedService,
        step: 'quote_decision',
        status: action === 'accept' ? 'accepted' : 'declined'
    })
});
```

**Result**:
- Progress bar updates to 100%
- "Quote Decision" step gets green tick (accepted) or red X (declined)
- Admin receives notification email with decision details

## API Endpoints

### `/api/update-tradesman-progress`
Handles all tradesman progress updates and sends notifications.

**Request Body**:
```json
{
    "customerEmail": "customer@example.com",
    "service": "Painting",
    "step": "quote_sent" | "quote_decision",
    "status": "completed" | "accepted" | "declined"
}
```

**Response**:
```json
{
    "success": true,
    "message": "Tradesman progress updated successfully",
    "step": "quote_sent",
    "status": "completed"
}
```

## Email Templates

### Tradesman Lead Email
- **Header**: Purple gradient with "New Lead Received!"
- **Progress Bar**: 33% completion
- **Checklist**: 3-step process with interactive elements
- **Lead Details**: Complete project information
- **Next Steps**: Clear action items for tradesman

### Admin Notifications
- **Quote Sent**: Green-themed notification when quote is sent
- **Quote Decision**: Dynamic notification based on acceptance/decline

## Google Sheets Integration

The system updates the Google Sheets with progress information:
- **Column P**: Quote sent status
- **Column Q**: Quote decision status
- **Sheet Priority**: Zone → Leads → Sheet1 → First available

## Testing

Use `test-tradesman-gamified-email.html` to test the workflow:
- **Simulate Quote Sent**: Tests Step 2 completion
- **Simulate Quote Accepted**: Tests Step 3 with green tick
- **Simulate Quote Declined**: Tests Step 3 with red X

## Benefits

1. **Automatic Updates**: No manual intervention required
2. **Real-time Progress**: Tradesmen see immediate feedback
3. **Engagement**: Gamified elements increase participation
4. **Transparency**: Clear visibility into lead status
5. **Admin Oversight**: Automatic notifications for all events

## File Structure

```
├── server.js                          # Main server with quote generation
├── api/
│   ├── quote-decision.js              # Quote decision handling
│   └── update-tradesman-progress.js   # Progress update API
├── test-tradesman-gamified-email.html # Test interface
└── TRADESMAN_GAMIFIED_WORKFLOW.md     # This documentation
```

## Future Enhancements

1. **Email Templates**: Add more interactive elements
2. **Mobile Optimization**: Improve mobile email experience
3. **Analytics**: Track engagement and completion rates
4. **Customization**: Allow tradesmen to customize their workflow
5. **Integration**: Connect with other business systems
