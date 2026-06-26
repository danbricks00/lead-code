import { getGoogleSheetsClient, getSpreadsheetId } from '../../lib/googleSheets.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { leadId } = req.body;
    console.log('🔍 GET-LEAD-BY-ID: Fetching lead data for ID:', leadId);

    if (!leadId) {
        return res.status(400).json({ success: false, error: 'Lead ID is required' });
    }

    try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // Get all data from the "Leads" tab
        const range = 'Leads!A:P';
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = response.data.values;
        
        if (!rows || rows.length < 2) {
            return res.status(404).json({ success: false, error: 'No leads found' });
        }
        
        const header = rows[0];
        const leadIndex = header.indexOf('Lead');
        
        if (leadIndex === -1) {
            return res.status(500).json({ success: false, error: 'Lead column not found in sheet' });
        }
        
        // Find the row with the matching lead ID
        const dataRow = rows.find(row => row[leadIndex] === leadId);
        
        if (!dataRow) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }
        
        // Build lead object by mapping headers to values
        const lead = {
            leadId: leadId
        };
        
        header.forEach((headerName, index) => {
            if (headerName && dataRow[index]) {
                // Map column names to expected field names
                switch (headerName) {
                    case 'CustomerName':
                        lead.customerName = dataRow[index];
                        break;
                    case 'CustomerEmail':
                        lead.customerEmail = dataRow[index];
                        break;
                    case 'CustomerPhone':
                        lead.customerPhone = dataRow[index];
                        break;
                    case 'ServiceType':
                        lead.selectedService = dataRow[index];
                        break;
                    case 'Area':
                        lead.area = dataRow[index];
                        break;
                    case 'Suburb':
                        lead.suburb = dataRow[index];
                        break;
                    case 'Street Address':
                        lead.streetAddress = dataRow[index];
                        break;
                    case 'Address':
                        lead.address = dataRow[index];
                        break;
                    case 'Budget':
                        lead.budget = dataRow[index];
                        break;
                    case 'Timelline':
                        lead.timeline = dataRow[index];
                        break;
                    case 'Specfic Details':
                        lead.specificDetails = dataRow[index];
                        break;
                    case 'Rooms':
                        lead.rooms = dataRow[index];
                        lead.Rooms = dataRow[index]; // Also store with capital R for consistency
                        break;
                    case 'TotalSqm':
                        lead.totalSqm = dataRow[index];
                        break;
                    default:
                        // Store other fields as-is
                        lead[headerName] = dataRow[index];
                        break;
                }
            }
        });
        
        // Set default values for missing fields
        lead.location = lead.address || (lead.area ? `${lead.area}, ${lead.suburb}` : 'Auckland');
        lead.projectDetails = lead.specificDetails || '';
        lead.projectSize = lead.totalSqm ? `${lead.totalSqm} sqm` : '';
        
        console.log('✅ GET-LEAD-BY-ID: Lead data retrieved successfully:', lead);
        
        res.status(200).json({ 
            success: true, 
            lead: lead 
        });

    } catch (error) {
        console.error('❌ GET-LEAD-BY-ID: Error fetching lead data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve lead data from Google Sheets.' 
        });
    }
}
