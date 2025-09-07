import { getGoogleSheetsClient, getSpreadsheetId } from "../../lib/googleSheets.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { leadId } = req.body;
        
        if (!leadId) {
            return res.status(400).json({ success: false, error: 'Lead ID is required' });
        }

        console.log('🔍 Fetching lead data for ID:', leadId);

        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = getSpreadsheetId();

        // Get the Leads sheet data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Leads!A:Z'
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return res.status(404).json({ success: false, error: 'No leads found' });
        }

        const header = rows[0];
        console.log('🔍 Available lead columns:', header);

        // Find the lead row
        const leadIndex = header.indexOf('Lead');
        if (leadIndex === -1) {
            return res.status(500).json({ success: false, error: 'Lead column not found' });
        }

        const leadRow = rows.find(row => row[leadIndex] === leadId);
        if (!leadRow) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        // Build lead data object
        const leadData = {
            leadId: leadId
        };

        // Map all the columns to the lead data
        header.forEach((columnName, index) => {
            if (columnName && leadRow[index]) {
                // Convert column names to camelCase for consistency
                const camelCaseKey = columnName
                    .toLowerCase()
                    .replace(/\s+/g, '')
                    .replace(/^[a-z]/, (match) => match.toUpperCase());
                
                leadData[camelCaseKey] = leadRow[index];
                
                // Also keep original column name for compatibility
                leadData[columnName] = leadRow[index];
            }
        });

        console.log('✅ Lead data retrieved:', {
            leadId: leadData.leadId,
            customerName: leadData.CustomerName,
            customerEmail: leadData.CustomerEmail,
            serviceType: leadData.ServiceType,
            area: leadData.Area,
            suburb: leadData.Suburb,
            rooms: leadData.Rooms ? 'Present' : 'Not present'
        });

        return res.status(200).json({
            success: true,
            lead: leadData
        });

    } catch (error) {
        console.error('❌ Error fetching lead data:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
