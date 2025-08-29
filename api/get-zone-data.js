export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔍 Fetching Zone sheet data for address selection...');
        console.log('📊 Request method:', req.method);
        console.log('📊 Request headers:', req.headers);
        
        // Use dynamic import for googleapis
        const { google } = await import('googleapis');
        
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

        console.log(`📊 Found ${rows.length} rows in Zone sheet`);

        // Parse the data - assuming structure: Suburb, Area, Postcode
        const headers = rows[0];
        console.log('📋 Headers:', headers);

        // Find column indices
        const suburbColumnIndex = headers.findIndex(h => h.toLowerCase().includes('suburb'));
        const areaColumnIndex = headers.findIndex(h => h.toLowerCase().includes('area'));
        const postcodeColumnIndex = headers.findIndex(h => h.toLowerCase().includes('postcode'));

        console.log('🔍 Column indices:', {
            suburb: suburbColumnIndex,
            area: areaColumnIndex,
            postcode: postcodeColumnIndex
        });

        if (suburbColumnIndex === -1 || areaColumnIndex === -1) {
            console.log('❌ Required columns not found');
            return res.status(500).json({ 
                success: false, 
                error: 'Required columns (Suburb, Area) not found in Zone sheet',
                headers: headers
            });
        }

        // Process the data
        const zoneData = [];
        const areas = new Set();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row[suburbColumnIndex] && row[areaColumnIndex]) {
                const suburb = row[suburbColumnIndex].trim();
                const area = row[areaColumnIndex].trim();
                const postcode = postcodeColumnIndex !== -1 ? row[postcodeColumnIndex] : '';

                if (suburb && area) {
                    zoneData.push({
                        suburb: suburb,
                        area: area,
                        postcode: postcode
                    });
                    areas.add(area);
                }
            }
        }

        console.log(`📊 Processed ${zoneData.length} entries`);
        console.log(`📊 Found ${areas.size} unique areas`);

        // Group by area
        const groupedData = {};
        Array.from(areas).sort().forEach(area => {
            groupedData[area] = zoneData
                .filter(entry => entry.area === area)
                .map(entry => entry.suburb)
                .sort();
        });

        console.log('✅ Zone data processed successfully');
        console.log('📊 Final response data:', {
            areas: Array.from(areas).sort(),
            groupedDataKeys: Object.keys(groupedData),
            totalEntries: zoneData.length
        });

        res.json({
            success: true,
            data: {
                areas: Array.from(areas).sort(),
                groupedData: groupedData,
                rawData: zoneData
            }
        });

    } catch (error) {
        console.error('❌ Error fetching Zone data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
