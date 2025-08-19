import { google } from 'googleapis';

// Initialize Google Sheets client
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Check if a user exists in the registered users Google Sheet
 * @param {string} email - The email to check
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
export async function checkIfUserExists(email) {
  try {
    // Check if Google Sheets is configured
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.USER_SHEET_ID) {
      console.error('❌ Missing Google Sheets configuration for user validation');
      return false;
    }

    const sheets = getGoogleSheetsClient();
    
    // Get all registered users from the Users sheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.USER_SHEET_ID,
      range: "Users!A:A", // Adjust based on your sheet structure
    });

    const users = result.data.values?.flat() || [];
    const exists = users.includes(email);
    
    console.log(`🔍 User validation for ${email}: ${exists ? '✅ Registered' : '❌ Not registered'}`);
    return exists;

  } catch (error) {
    console.error('❌ Error checking if user exists:', error.message);
    // Fail closed - if we can't verify, don't allow access
    return false;
  }
}

/**
 * Get all registered users from the Google Sheet
 * @returns {Promise<string[]>} - Array of registered email addresses
 */
export async function getAllRegisteredUsers() {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.USER_SHEET_ID) {
      console.error('❌ Missing Google Sheets configuration for user list');
      return [];
    }

    const sheets = getGoogleSheetsClient();
    
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.USER_SHEET_ID,
      range: "Users!A:A",
    });

    const users = result.data.values?.flat() || [];
    console.log(`📋 Retrieved ${users.length} registered users`);
    return users;

  } catch (error) {
    console.error('❌ Error getting registered users:', error.message);
    return [];
  }
}

/**
 * Add a new user to the registered users sheet
 * @param {string} email - The email to add
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function addRegisteredUser(email) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.USER_SHEET_ID) {
      console.error('❌ Missing Google Sheets configuration for adding user');
      return false;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Check if user already exists
    const exists = await checkIfUserExists(email);
    if (exists) {
      console.log(`⚠️ User ${email} already exists in registered users`);
      return true;
    }

    // Add user to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.USER_SHEET_ID,
      range: "Users!A:A",
      valueInputOption: 'RAW',
      resource: {
        values: [[email, new Date().toISOString()]]
      }
    });

    console.log(`✅ Added user ${email} to registered users`);
    return true;

  } catch (error) {
    console.error('❌ Error adding registered user:', error.message);
    return false;
  }
}

/**
 * Remove a user from the registered users sheet
 * @param {string} email - The email to remove
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function removeRegisteredUser(email) {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.USER_SHEET_ID) {
      console.error('❌ Missing Google Sheets configuration for removing user');
      return false;
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get all users to find the row index
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.USER_SHEET_ID,
      range: "Users!A:A",
    });

    const users = result.data.values || [];
    const rowIndex = users.findIndex(row => row[0] === email);
    
    if (rowIndex === -1) {
      console.log(`⚠️ User ${email} not found in registered users`);
      return false;
    }

    // Delete the row (add 1 because sheets are 1-indexed)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.USER_SHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Assuming Users is the first sheet
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }
        ]
      }
    });

    console.log(`✅ Removed user ${email} from registered users`);
    return true;

  } catch (error) {
    console.error('❌ Error removing registered user:', error.message);
    return false;
  }
}
