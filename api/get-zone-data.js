import { google } from 'googleapis';

export default async (req, res) => {
    try {
        console.log('🔍 Fetching Zone sheet data for address selection...');
        console.log('📊 Request method:', req.method);
        console.log('📊 Request headers:', req.headers);
        
        // Check if we have the required environment variables
        const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        console.log('🔧 Environment check:');
        console.log('- GOOGLE_CLIENT_EMAIL:', serviceAccountEmail ? '✅ Set' : '❌ Missing');
        console.log('- GOOGLE_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
        console.log('- GOOGLE_SPREADSHEET_ID:', spreadsheetId ? '✅ Set' : '❌ Missing');

        if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
            console.log('⚠️ Google Sheets credentials not found');
            return res.status(500).json({ 
                success: false, 
                error: 'Google Sheets credentials not configured',
                missing: {
                    serviceAccountEmail: !serviceAccountEmail,
                    privateKey: !privateKey,
                    spreadsheetId: !spreadsheetId
                }
            });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                private_key: privateKey.replace(/\\n/g, '\n'),
                client_email: serviceAccountEmail,
                client_id: process.env.GOOGLE_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: process.env.GOOGLE_CLIENT_CER_URL
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        console.log('🔐 Google Auth initialized');

        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get available sheets to find the Zone sheet
        console.log('📋 Fetching spreadsheet metadata...');
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });
        
        const availableSheets = metadata.data.sheets.map(s => s.properties.title);
        console.log('📋 Available sheets:', availableSheets);
        
        // Find the Zone sheet (it's the last sheet in the spreadsheet)
        let zoneSheet = null;
        if (availableSheets.includes('Zone')) {
            zoneSheet = 'Zone';
        } else {
            // Try to find it by looking at the last sheet
            const lastSheet = availableSheets[availableSheets.length - 1];
            console.log('🔍 Last sheet in spreadsheet:', lastSheet);
            
            // Check if the last sheet might be the Zone sheet (case insensitive)
            if (lastSheet.toLowerCase().includes('zone')) {
                zoneSheet = lastSheet;
                console.log('✅ Found Zone sheet as last sheet:', zoneSheet);
            } else {
                console.log('❌ Zone sheet not found in available sheets');
                return res.status(404).json({ 
                    success: false, 
                    error: 'Zone sheet not found in the spreadsheet',
                    availableSheets: availableSheets,
                    lastSheet: lastSheet
                });
            }
        }
        
        console.log('🎯 Using Zone sheet:', zoneSheet);
        
        // Read the Zone sheet data
        const range = `${zoneSheet}!A:Z`;
        console.log('📊 Reading range:', range);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('❌ No data found in Zone sheet');
            return res.status(404).json({ 
                success: false, 
                error: 'No data found in Zone sheet'
            });
        }

        console.log('📊 Zone sheet data retrieved, processing...');
        console.log('📊 Total rows:', rows.length);
        
        // Process the data to extract areas and suburbs
        // Assuming first row contains headers
        const headers = rows[0];
        const dataRows = rows.slice(1);
        
        console.log('📋 Headers found:', headers);
        
        // Find the relevant columns (Zone sheet structure: Suburb, Area, Postcode)
        const suburbColumnIndex = headers.findIndex(header => 
            header.toLowerCase().includes('suburb') || 
            header.toLowerCase().includes('location') ||
            header.toLowerCase().includes('city')
        );
        
        const areaColumnIndex = headers.findIndex(header => 
            header.toLowerCase().includes('area') || 
            header.toLowerCase().includes('region') ||
            header.toLowerCase().includes('zone')
        );

        // Also check for postcode column (though we don't use it for now)
        const postcodeColumnIndex = headers.findIndex(header => 
            header.toLowerCase().includes('postcode') || 
            header.toLowerCase().includes('post code') ||
            header.toLowerCase().includes('zip')
        );

        console.log('🔍 Column indices:');
        console.log('- Suburb column index:', suburbColumnIndex);
        console.log('- Area column index:', areaColumnIndex);
        console.log('- Postcode column index:', postcodeColumnIndex);

        if (areaColumnIndex === -1 || suburbColumnIndex === -1) {
            console.log('⚠️ Could not find Area or Suburb columns in Zone sheet');
            console.log('📋 Available headers:', headers);
            return res.status(400).json({ 
                success: false, 
                error: 'Zone sheet does not contain required Area and Suburb columns',
                headers: headers,
                suburbColumnIndex: suburbColumnIndex,
                areaColumnIndex: areaColumnIndex
            });
        }

        // Group suburbs by areas
        const areasData = {};
        
        dataRows.forEach((row, index) => {
            if (row[areaColumnIndex] && row[suburbColumnIndex]) {
                const area = row[areaColumnIndex].trim();
                const suburb = row[suburbColumnIndex].trim();
                
                if (!areasData[area]) {
                    areasData[area] = [];
                }
                
                if (!areasData[area].includes(suburb)) {
                    areasData[area].push(suburb);
                }
            } else {
                console.log(`⚠️ Row ${index + 2} missing data:`, row);
            }
        });

        // Convert to the format expected by the frontend
        const areas = Object.keys(areasData).sort();
        const suburbsByArea = {};
        
        areas.forEach(area => {
            suburbsByArea[area] = areasData[area].sort();
        });

        console.log('✅ Zone data processed successfully');
        console.log('📊 Areas found:', areas.length);
        console.log('📊 Areas:', areas);

        res.json({
            success: true,
            data: {
                areas: areas,
                suburbsByArea: suburbsByArea
            }
        });

    } catch (error) {
        console.error('❌ Error fetching Zone data:', error);
        console.error('❌ Error stack:', error.stack);
        
        // Return more detailed error information
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            type: error.name
        });
    }
};
