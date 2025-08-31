export default async function handler(req, res) {
  try {
    console.log('🔍 Testing Lead API environment variables...');
    
         const requiredVars = [
       'GOOGLE_PRIVATE_KEY',
       'GOOGLE_CLIENT', 
       'GOOGLE_SPREADSHEET',
       'ADMIN_EMAIL',
       'GMAIL_USER',
       'GMAIL_PASS'
     ];
    
    const missingVars = [];
    const presentVars = {};
    
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        presentVars[varName] = '✅ Present';
        if (varName === 'GOOGLE_PRIVATE_KEY') {
          presentVars[varName] = `✅ Present (${process.env[varName].length} chars)`;
        }
      } else {
        missingVars.push(varName);
        presentVars[varName] = '❌ Missing';
      }
    });
    
    return res.status(200).json({
      ok: true,
      message: 'Lead API environment check',
      present: presentVars,
      missing: missingVars,
      totalMissing: missingVars.length
    });
    
  } catch (error) {
    console.error('❌ Test Lead API error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message,
      stack: error.stack 
    });
  }
}
