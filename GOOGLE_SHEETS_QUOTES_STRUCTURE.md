# Google Sheets "Quotes" Tab - Standardized Column Structure

## Required Column Names (In Exact Order)

**IMPORTANT**: These column names must be EXACTLY as specified below, with no extra spaces, typos, or variations.

### Column Structure (A through AF):

| Column | Header Name | Description | Example |
|--------|-------------|-------------|---------|
| A | `Timestamp` | When the quote was created | 2025-09-07T01:38:29.470Z |
| B | `QuoteID` | Unique quote identifier | b6af8633b6de |
| C | `LeadID` | Reference to the lead | 6309501a6537 |
| D | `TradespersonName` | Full name of tradesperson | John Smith |
| E | `TradespersonEmail` | Email of tradesperson | john@example.com |
| F | `TradespersonPhone` | Phone number of tradesperson | 0211234567 |
| G | `CustomerStatus` | Status for customer | submitted |
| H | `TradespersonStatus` | Status for tradesperson | submitted |
| I | `AdminStatus` | Admin approval status | Not Required |
| J | `XeroQuoteID` | Xero integration ID (if used) | (empty) |
| K | `LabourRate` | Hourly labour rate | 50 |
| L | `LabourHours` | Total labour hours | 10 |
| M | `MaterialsCost` | Cost per unit of materials | 20 |
| N | `MaterialsQuantity` | Quantity of materials | 124 |
| O | `TravelCost` | Cost per km for travel | 1 |
| P | `TravelDistance` | Distance in km | 10 |
| Q | `InstallationCost` | Installation cost | 10 |
| R | `TotalQuote` | Final quote amount | 3450 |
| S | `Notes` | Additional notes | Test quote |
| T | `ValidUntil` | Quote expiry date | 2025-09-20 |
| U | `ResubmissionAllowed` | Can be resubmitted | No |
| V | `Decision` | Customer decision | (empty) |
| W | `DecisionTimestamp` | When decision was made | (empty) |
| X | `CustomerName` | Customer full name | Dan Bui |
| Y | `CustomerEmail` | Customer email | dan@example.com |
| Z | `CustomerPhone` | Customer phone | 275059901 |
| AA | `ServiceType` | Type of service | Underfloor Heating |
| AB | `Location` | Project location | West Auckland, Titirangi |
| AC | `Timeline` | Project timeline | October 18 |
| AD | `Budget` | Customer budget | (empty) |
| AE | `Rooms` | Room data as JSON | [{"name":"Kitchen","dimensions":"4m x 4m"}] |
| AF | `Breakdown` | Detailed breakdown | (empty) |

## Setup Instructions

### 1. Create the Header Row
- Go to your Google Sheets "Quotes" tab
- **Delete all existing data** (if any)
- **Start from row 1, column A**
- Enter the exact column names above in the exact order

### 2. Verify Column Names
Make sure there are NO:
- Extra spaces before/after names
- Typos in column names
- Missing columns
- Extra columns

### 3. Test the Structure
After setting up, test with:
```
https://your-domain.com/api/debug-sheets-structure
```

## Common Issues to Avoid

### ❌ WRONG Column Names:
- `TradesPerson Name` (extra space)
- `TradePerson Email` (missing 's')
- `Labour Cost` (should be `LabourRate`)
- `Materials Quanitity` (typo - should be `MaterialsQuantity`)
- `Total Quote` (should be `TotalQuote`)

### ✅ CORRECT Column Names:
- `TradespersonName`
- `TradespersonEmail`
- `LabourRate`
- `MaterialsQuantity`
- `TotalQuote`

## Data Types

- **Numbers**: LabourRate, LabourHours, MaterialsCost, etc.
- **Text**: Names, emails, phone numbers
- **JSON**: Rooms data (stored as string)
- **Dates**: Timestamp, ValidUntil, DecisionTimestamp (ISO format)

## Notes

1. **Case Sensitive**: Column names are case-sensitive
2. **No Spaces**: Use camelCase or exact names as specified
3. **Order Matters**: Keep columns in the exact order listed
4. **Empty Cells**: Use empty strings `""` for missing data, not `null`

## Migration from Current Structure

If you have existing data, you'll need to:
1. Export current data
2. Recreate the sheet with correct column names
3. Import data mapping to new column structure
4. Test with debug endpoint

This standardized structure will prevent all future column mapping issues!
