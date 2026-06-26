# Google Sheets "Quotes" Tab - Standardized Column Structure

## Required Column Names (In Exact Order)

**IMPORTANT**: These column names must be EXACTLY as specified below, with no extra spaces, typos, or variations.

### Column Structure (A through AJ):

| Column | Header Name | Description | Example |
|--------|-------------|-------------|---------|
| A | `Timestamp` | When the quote was created | 2025-09-07T01:38:29.470Z |
| B | `QuoteID` | Unique quote identifier | b6af8633b6de |
| C | `LeadID` | Reference to the lead | 6309501a6537 |
| D | `TradePersonName` | Full name of tradesperson | John Smith |
| E | `TradePersonEmail` | Email of tradesperson | john@example.com |
| F | `TradePersonPhone` | Phone number of tradesperson | 0211234567 |
| G | `CustomerStatus` | Status for customer | submitted |
| H | `TradespersonStatus` | Status for tradesperson | submitted |
| I | `AdminStatus` | Admin approval status | Not Required |
| J | `LabourRate` | Hourly labour rate | 50 |
| K | `LabourHours` | Total labour hours | 10 |
| L | `LabourTotal` | Total labour cost (rate × hours) | 500 |
| M | `MaterialsCost` | Cost per unit of materials | 20 |
| N | `MaterialsQuantity` | Quantity of materials | 124 |
| O | `MaterialsTotal` | Total materials cost (cost × quantity) | 2480 |
| P | `TravelCost` | Cost per km for travel | 1 |
| Q | `TravelDistance` | Distance in km | 10 |
| R | `TravelTotal` | Total travel cost (cost × distance) | 10 |
| S | `InstallationCost` | Installation cost | 10 |
| T | `Subtotal` | Subtotal before GST | 3000 |
| U | `GST` | GST amount (15%) | 450 |
| V | `TotalQuote` | Final quote amount | 3450 |
| W | `Notes` | Additional notes | Test quote |
| X | `ValidUntil` | Quote expiry date | 2025-09-20 |
| Y | `ResubmissionAllowed` | Can be resubmitted | No |
| Z | `Decision` | Customer decision | (empty) |
| AA | `DecisionTimestamp` | When decision was made | (empty) |
| AB | `CustomerName` | Customer full name | Dan Bui |
| AC | `CustomerEmail` | Customer email | dan@example.com |
| AD | `CustomerPhone` | Customer phone | 275059901 |
| AE | `ServiceType` | Type of service | Underfloor Heating |
| AF | `Location` | Project location | West Auckland, Titirangi |
| AG | `Timeline` | Project timeline | October 18 |
| AH | `Budget` | Customer budget | (empty) |
| AI | `Rooms` | Room data as JSON | [{"name":"Kitchen","dimensions":"4m x 4m"}] |
| AJ | `Breakdown`         | String (JSON) | Optional      | JSON string representing the detailed breakdown of the quote. |
| AK | `AdminDecisionTimeStamp` | String (Timestamp) | Optional | Timestamp of the admin's decision. |
| AL | `AdminDecision`          | String        | Optional      | The decision made by the admin (e.g., 'Approved', 'Rejected'). |
| AM | `Address`                | String        | Optional      | The full address of the property. |
| AN | `(Reserved)`             | -             | -             | Reserved for future use. |
| AO | `(Reserved)`             | -             | -             | Reserved for future use. |
| AP | `(Reserved)`             | -             | -             | Reserved for future use. |
| AQ | `TotalSQM`               | Number        | Optional      | The total square meters for the job. |

### Important Notes
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
- `TradePersonName`
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
