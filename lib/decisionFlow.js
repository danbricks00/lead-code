import { upsertQuoteRow } from '../utils/sheets.js';

/**
 * Helper function for consistent NZT timestamp formatting
 */
function formatDateTimeNZT(date) {
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Pacific/Auckland'
    };
    return new Intl.DateTimeFormat('en-NZ', options).format(new Date(date));
}

/**
 * Shared decision flow handler for all decision APIs
 * @param {Object} params - Decision parameters
 * @param {string} params.type - Decision type (e.g., "ADMIN_ACCEPT", "CUSTOMER_DECLINE")
 * @param {string} params.quoteId - Quote ID
 * @param {string} params.leadId - Lead ID
 * @param {string} params.decisionValue - Decision value to record (e.g., "Approved", "Declined", "Accepted")
 * @param {string} params.statusField - Status field value (e.g., "Approved", "Declined", "Pending Admin Review", "Customer Declined")
 * @param {Object} params.col - Column mapping object
 * @param {boolean} params.rowFound - Whether the row was found
 * @param {number} params.rowIndex - Row index in the sheet
 * @param {Object} params.quoteRow - Quote row data
 * @param {Object} params.res - Express response object
 * @param {Object} params.req - Express request object
 * @returns {Object} Result object with tag and additional data
 */
export async function handleDecision({ 
    type, 
    quoteId, 
    leadId, 
    decisionValue, 
    statusField, 
    col, 
    rowFound, 
    rowIndex, 
    quoteRow, 
    res, 
    req 
}) {
    // Log incoming decision request
    console.log(`[${type}] Incoming decision request`, {
        quoteId,
        leadId,
        decisionValue,
        statusField,
        rowFound,
        rowIndex
    });

    // Ensure quoteId is a string, not an object
    const quoteIdStr = typeof quoteId === "object" ? quoteId.quoteId : String(quoteId);
    
    // Log what's being passed before update
    console.log(`[${type}] Writing decision`, {
        quoteId: quoteIdStr,
        decision: decisionValue
    });

    // Guard logic: Only fail if headers missing or row not found
    const decisionColumn = type.startsWith('ADMIN') ? 'AdminDecision' : 'CustomerDecision';
    const timestampColumn = type.startsWith('ADMIN') ? 'AdminDecisionTimeStamp' : 'CustomerDecisionTimeStamp';
    
    if (col[decisionColumn] === -1 || col[timestampColumn] === -1) {
        console.error(`[${type}] Missing headers`, { 
            decisionColumn: col[decisionColumn], 
            timestampColumn: col[timestampColumn] 
        });
        return {
            tag: `${type}_LOOKUP_FAIL`,
            reason: "Missing header",
            quoteId: quoteIdStr
        };
    }

    if (!rowFound) {
        console.error(`[${type}] Row not found`, { quoteId: quoteIdStr });
        return {
            tag: `${type}_LOOKUP_FAIL`,
            reason: "QuoteID not found",
            quoteId: quoteIdStr
        };
    }

    // Get current decision value
    const currentDecision = quoteRow[col[decisionColumn]];
    
    // Guard: prevent double-clicks (allow 'none' and empty as first-time)
    if (currentDecision && currentDecision !== "none" && currentDecision.trim() !== "") {
        console.warn(`[${type}] Already decided`, {
            currentDecision,
            decisionTime: quoteRow[col[timestampColumn]]
        });
        return {
            tag: `${type}_ALREADY_DECIDED`,
            decision: currentDecision,
            decisionTime: formatDateTimeNZT(quoteRow[col[timestampColumn]])
        };
    }

    // First-time update: allow when "none" or ""
    try {
        // Prepare update object
        const updateObject = {
            [decisionColumn]: decisionValue,
            [timestampColumn]: formatDateTimeNZT(new Date()),
            AdminPersonStatus: statusField
        };

        // Update the Google Sheets row
        const updateResult = await upsertQuoteRow(quoteIdStr, updateObject, { req, caller: type.toLowerCase() });
        
        console.log(`[${type}] Decision update success`, {
            quoteId: quoteIdStr,
            decisionValue,
            statusField,
            updateResult,
            updatedRow: {
                decision: decisionValue,
                decisionTime: formatDateTimeNZT(new Date()),
                status: statusField
            }
        });

        return {
            tag: `${type}_DECISION_RECORDED`,
            decision: decisionValue
        };
        
    } catch (err) {
        console.error(`[${type}] Sheets update failed`, {
            quoteId: quoteIdStr,
            error: err.message,
            stack: err.stack
        });
        return {
            tag: "SHEETS_UPSERT_ERROR",
            quoteId: quoteIdStr,
            error: err.message
        };
    }
}
