import { google } from 'googleapis';

export default async (req, res) => {
    try {
        console.log('🧪 Simple Zone Test Starting...');
        
        // Step 1: Check environment variables
        const serviceAccountEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_PRIVATE_KEY;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        console.log('🔧 Environment Check:');
        console.log('- GOOGLE_CLIENT_EMAIL:', serviceAccountEmail ? '✅ Set' : '❌ Missing');
        console.log('- GOOGLE_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
        console.log('- GOOGLE_SPREADSHEET_ID:', spreadsheetId ? '✅ Set' : '❌ Missing');

        if (!serviceAccountEmail || !privateKey || !spreadsheetId) {
            return res.json({
                success: false,
                error: 'Missing environment variables',
                missing: {
                    serviceAccountEmail: !serviceAccountEmail,
                    privateKey: !privateKey,
                    spreadsheetId: !spreadsheetId
                }
            });
        }

        // Step 2: Initialize Google Auth
        console.log('🔐 Initializing Google Auth...');
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

        const sheets = google.sheets({ version: 'v4', auth });

        // Step 3: Get spreadsheet metadata
        console.log('📋 Getting spreadsheet metadata...');
        const metadata = await sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId
        });
        
        const availableSheets = metadata.data.sheets.map(s => s.properties.title);
        console.log('📋 Available sheets:', availableSheets);

        // Step 4: Find Zone sheet
        const lastSheet = availableSheets[availableSheets.length - 1];
        console.log('🔍 Last sheet:', lastSheet);

        let zoneSheet = null;
        if (availableSheets.includes('Zone')) {
            zoneSheet = 'Zone';
        } else if (lastSheet.toLowerCase().includes('zone')) {
            zoneSheet = lastSheet;
        }

        if (!zoneSheet) {
            return res.json({
                success: false,
                error: 'Zone sheet not found',
                availableSheets: availableSheets,
                lastSheet: lastSheet
            });
        }

        console.log('✅ Found Zone sheet:', zoneSheet);

        // Step 5: Read Zone sheet data
        console.log('📊 Reading Zone sheet data...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${zoneSheet}!A:C` // Only read first 3 columns
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.json({
                success: false,
                error: 'No data found in Zone sheet',
                sheetName: zoneSheet
            });
        }

        console.log('📊 Total rows:', rows.length);
        console.log('📋 Headers:', rows[0]);
        console.log('📋 First few data rows:', rows.slice(1, 4));

        // Step 6: Process data
        const headers = rows[0];
        const dataRows = rows.slice(1);

        const suburbColumnIndex = headers.findIndex(header => 
            header.toLowerCase().includes('suburb')
        );
        
        const areaColumnIndex = headers.findIndex(header => 
            header.toLowerCase().includes('area')
        );

        console.log('🔍 Column indices:');
        console.log('- Suburb column:', suburbColumnIndex);
        console.log('- Area column:', areaColumnIndex);

        if (suburbColumnIndex === -1 || areaColumnIndex === -1) {
            return res.json({
                success: false,
                error: 'Required columns not found',
                headers: headers,
                suburbColumnIndex: suburbColumnIndex,
                areaColumnIndex: areaColumnIndex
            });
        }

        // Step 7: Group data
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
            }
        });

        const areas = Object.keys(areasData).sort();
        const suburbsByArea = {};
        areas.forEach(area => {
            suburbsByArea[area] = areasData[area].sort();
        });

        console.log('✅ Success! Areas found:', areas.length);
        console.log('📊 Areas:', areas);

        res.json({
            success: true,
            data: {
                areas: areas,
                suburbsByArea: suburbsByArea
            },
            debug: {
                sheetName: zoneSheet,
                totalRows: rows.length,
                headers: headers,
                areasFound: areas.length
            }
        });

    } catch (error) {
        console.error('❌ Error in simple test:', error);
        res.json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};
