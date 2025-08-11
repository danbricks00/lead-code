import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import crypto from 'crypto';

class TradesmenDB {
    constructor() {
        this.dbPath = path.join(__dirname, 'tradesmen-database.json');
        this.users = this.loadUsers();
    }

    // Load users from file
    loadUsers() {
        try {
            if (fs.existsSync(this.dbPath)) {
                const data = fs.readFileSync(this.dbPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading users database:', error);
        }
        return {};
    }

    // Save users to file
    saveUsers() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.users, null, 2));
        } catch (error) {
            console.error('Error saving users database:', error);
        }
    }

    // Hash email for security
    hashEmail(email) {
        return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
    }

    // Register a new tradesman
    registerTradesman(googleId, email, name, tradeType, businessName, phone, location) {
        const hashedEmail = this.hashEmail(email);
        
        // Check if user already exists
        if (this.users[googleId]) {
            return { success: false, error: 'User already registered' };
        }

        // Create new user
        this.users[googleId] = {
            googleId,
            hashedEmail,
            name,
            tradeType,
            businessName,
            phone,
            location,
            status: 'pending', // pending, approved, suspended
            registeredAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        this.saveUsers();
        return { success: true, user: this.users[googleId] };
    }

    // Get user by Google ID
    getUserByGoogleId(googleId) {
        return this.users[googleId] || null;
    }

    // Get user by email (hashed)
    getUserByEmail(email) {
        const hashedEmail = this.hashEmail(email);
        return Object.values(this.users).find(user => user.hashedEmail === hashedEmail) || null;
    }

    // Update user information
    updateUser(googleId, updates) {
        if (!this.users[googleId]) {
            return { success: false, error: 'User not found' };
        }

        // Only allow certain fields to be updated
        const allowedUpdates = ['tradeType', 'businessName', 'phone', 'location', 'status'];
        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key)) {
                this.users[googleId][key] = value;
            }
        }

        this.users[googleId].lastUpdated = new Date().toISOString();
        this.saveUsers();
        return { success: true, user: this.users[googleId] };
    }

    // Get all tradesmen by trade type
    getTradesmenByType(tradeType) {
        return Object.values(this.users).filter(user => 
            user.tradeType === tradeType && user.status === 'approved'
        );
    }

    // Get all approved tradesmen
    getAllApprovedTradesmen() {
        return Object.values(this.users).filter(user => user.status === 'approved');
    }

    // Approve a tradesman
    approveTradesman(googleId) {
        if (!this.users[googleId]) {
            return { success: false, error: 'User not found' };
        }

        this.users[googleId].status = 'approved';
        this.users[googleId].approvedAt = new Date().toISOString();
        this.saveUsers();
        return { success: true, user: this.users[googleId] };
    }

    // Suspend a tradesman
    suspendTradesman(googleId) {
        if (!this.users[googleId]) {
            return { success: false, error: 'User not found' };
        }

        this.users[googleId].status = 'suspended';
        this.users[googleId].suspendedAt = new Date().toISOString();
        this.saveUsers();
        return { success: true, user: this.users[googleId] };
    }

    // Get tradesmen emails for a specific service (for lead distribution)
    getTradesmenEmailsForService(serviceType) {
        const tradesmen = this.getTradesmenByType(serviceType);
        return tradesmen.map(tradesman => ({
            googleId: tradesman.googleId,
            name: tradesman.name,
            businessName: tradesman.businessName,
            phone: tradesman.phone,
            location: tradesman.location
        }));
    }

    // Update last login
    updateLastLogin(googleId) {
        if (this.users[googleId]) {
            this.users[googleId].lastLogin = new Date().toISOString();
            this.saveUsers();
        }
    }

    // Get statistics
    getStats() {
        const total = Object.keys(this.users).length;
        const approved = Object.values(this.users).filter(u => u.status === 'approved').length;
        const pending = Object.values(this.users).filter(u => u.status === 'pending').length;
        const suspended = Object.values(this.users).filter(u => u.status === 'suspended').length;

        const byTrade = {};
        Object.values(this.users).forEach(user => {
            if (user.tradeType) {
                byTrade[user.tradeType] = (byTrade[user.tradeType] || 0) + 1;
            }
        });

        return {
            total,
            approved,
            pending,
            suspended,
            byTrade
        };
    }
}

export default new TradesmenDB(); 