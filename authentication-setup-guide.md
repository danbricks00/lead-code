# LeadBot Authentication System Setup Guide

## Overview
The new authentication system provides:
- **Secure Google Sign-In** for tradesmen
- **Trade classification** system
- **Admin panel** for managing tradesmen
- **Encrypted email storage** (no plain text emails)
- **Approval workflow** for tradesmen

## System Components

### 1. Login System (`/login`)
- **Google Sign-In** integration
- **Tradesman registration** with trade classification
- **User dashboard** showing status and information

### 2. Admin Panel (`/admin`)
- **View all tradesmen** with filtering and search
- **Approve/suspend** tradesmen
- **Statistics dashboard**
- **Trade type management**

### 3. Database System (`tradesmen-db.js`)
- **Secure JSON storage** with hashed emails
- **User management** functions
- **Trade classification** system
- **Status tracking** (pending, approved, suspended)

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install express-session
```

### Step 2: Configure Google Sign-In
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google Identity API**
4. Create **OAuth 2.0 credentials**
5. Add authorized origins: `http://localhost:3000`
6. Add authorized redirect URIs: `http://localhost:3000/login`

### Step 3: Update Configuration
1. Update `oauth-config.js` with your Google OAuth credentials
2. Update the client ID in `login.html` (line with `client_id`)

### Step 4: Start the Server
```bash
npm start
```

## How It Works

### For Tradesmen:
1. **Visit `/login`** from the main site
2. **Sign in with Google** (first time)
3. **Register as tradesman** with:
   - Trade type (builder, electrician, etc.)
   - Business name
   - Phone number
   - Service area
4. **Wait for admin approval**
5. **Receive leads** automatically when approved

### For Admins:
1. **Visit `/admin`** to access admin panel
2. **View pending registrations**
3. **Approve qualified tradesmen**
4. **Monitor statistics** and manage users

### For Customers:
1. **Use the chatbot** as before
2. **Leads are automatically distributed** to approved tradesmen
3. **No changes** to the customer experience

## Security Features

### Email Protection:
- **Hashed email storage** (SHA-256)
- **No plain text emails** in database
- **Secure user identification** via Google ID

### Access Control:
- **Session-based authentication**
- **Admin-only approval system**
- **Status-based lead distribution**

### Data Privacy:
- **Minimal data collection**
- **Secure storage** in JSON files
- **No external dependencies** for user data

## Trade Classification System

### Supported Trades:
- **Builder** - General construction
- **Electrician** - Electrical work
- **Plumber** - Plumbing services
- **Carpenter** - Woodwork and joinery
- **Painter** - Painting and decorating
- **Roofer** - Roofing services
- **Landscaper** - Garden and landscaping
- **Heating Engineer** - Heating systems
- **Decorator** - Interior decoration
- **Other** - Custom trade types

### Lead Distribution:
- **Automatic matching** by trade type
- **Location-based filtering** (future feature)
- **Approval status** required for leads

## File Structure

```
lead code/
├── login.html              # Tradesman login page
├── admin.html              # Admin panel
├── tradesmen-db.js         # Database management
├── server.js               # Updated with auth endpoints
├── oauth-config.js         # Google OAuth configuration
├── tradesmen-database.json # User data (auto-generated)
└── authentication-setup-guide.md # This guide
```

## API Endpoints

### Authentication:
- `POST /api/auth/google` - Google Sign-In
- `POST /api/auth/register` - Tradesman registration
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - Sign out

### Admin:
- `GET /api/admin/tradesmen` - Get all tradesmen
- `POST /api/admin/approve/:googleId` - Approve tradesman
- `POST /api/admin/suspend/:googleId` - Suspend tradesman

### Pages:
- `GET /login` - Login page
- `GET /admin` - Admin panel

## Troubleshooting

### Common Issues:

1. **"User not registered" error**
   - User needs to complete registration after Google Sign-In
   - Check if user exists in `tradesmen-database.json`

2. **Google Sign-In not working**
   - Verify OAuth credentials in Google Cloud Console
   - Check authorized origins and redirect URIs
   - Ensure HTTPS in production

3. **Admin panel not loading**
   - Check if `tradesmen-database.json` exists
   - Verify file permissions
   - Check browser console for errors

4. **Leads not being distributed**
   - Ensure tradesmen are approved
   - Check trade type matching
   - Verify email sending configuration

### Database Management:
- **Backup** `tradesmen-database.json` regularly
- **Monitor** file size and performance
- **Consider** migration to proper database for production

## Production Considerations

### Security:
- **Change session secret** in production
- **Use HTTPS** for all communications
- **Implement rate limiting**
- **Add admin authentication**

### Performance:
- **Use proper database** (PostgreSQL, MongoDB)
- **Implement caching**
- **Add monitoring and logging**

### Scalability:
- **Load balancing** for multiple servers
- **Database clustering**
- **CDN** for static assets

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify configuration files
4. Test with different browsers 