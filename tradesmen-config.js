// Tradesmen Email Configuration
// Update these emails with real tradesmen email addresses

const tradesmenConfig = {
    // Building & Construction tradesmen
    builder: [
        'danbricks18@gmail.com',
        'danbricks18@gmail.com'
    ],
    
    // Electrical tradesmen
    electrician: [
        'danbui@outlook.co.nz',    // Replace with real electrician email
        'danbui@outlook.co.nz'   // Replace with real electrical company email
    ],
    
    // Plumbing tradesmen
    plumber: [
        'danbricks@outlook.co.nz',        // Replace with real plumber email
        'danbricks@outlook.co.nz'    // Replace with real plumbing company email
    ],
    
    // General/Other services
    other: [
        'quangbui@outlook.co.nz',       // Replace with real handyman email
        'quangbui@outlook.co.nz'     // Replace with real general services email
    ]
};

// Function to get tradesmen emails for a specific service
function getTradesmenEmails(service) {
    return tradesmenConfig[service] || tradesmenConfig.other;
}

// Function to add a new tradesman
function addTradesman(service, email) {
    if (!tradesmenConfig[service]) {
        tradesmenConfig[service] = [];
    }
    if (!tradesmenConfig[service].includes(email)) {
        tradesmenConfig[service].push(email);
    }
}

// Function to remove a tradesman
function removeTradesman(service, email) {
    if (tradesmenConfig[service]) {
        tradesmenConfig[service] = tradesmenConfig[service].filter(e => e !== email);
    }
}

module.exports = {
    tradesmenConfig,
    getTradesmenEmails,
    addTradesman,
    removeTradesman
}; 