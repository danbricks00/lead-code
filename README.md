# Google Auth Control System

A comprehensive two-layer Google authentication control system with environment variable toggles and registered-user-only access for Next.js applications.

## Features

- **Global Kill Switch**: Completely disable Google authentication via environment variables
- **Registered Users Only**: Restrict access to users listed in a Google Sheet
- **Flexible Configuration**: Easy toggles for both frontend and backend
- **Custom Error Handling**: User-friendly error pages with detailed messages
- **Session Management**: Secure session handling with validation
- **Google Sheets Integration**: Uses existing Google Sheets infrastructure

## Quick Start

### 1. Install Dependencies
```bash
npm install next-auth googleapis
```

### 2. Set Environment Variables
Create a `.env.local` file with the required variables (see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for details):

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google

# Google Sheets
GOOGLE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
USER_SHEET_ID=your_users_sheet_id

# Auth Controls
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true
```

### 3. Set Up Google Sheets
Create a "Users" sheet with registered user emails:

| Email |
|-------|
| user1@example.com |
| user2@example.com |

### 4. Use the Login Component
```jsx
import LoginForm from './components/LoginForm';

export default function LoginPage() {
  return (
    <div>
      <h1>Welcome</h1>
      <LoginForm />
    </div>
  );
}
```

## Architecture

### File Structure
```
├── lib/
│   └── userStore.js              # Google Sheets user management
├── pages/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth].js  # NextAuth.js configuration
│   │       └── google.js         # Custom OAuth handler
│   └── auth/
│       └── error.js              # Custom error page
├── components/
│   └── LoginForm.js              # Frontend login component
└── ENVIRONMENT_VARIABLES.md      # Environment setup guide
```

### Authentication Flow

1. **Frontend Check**: `LoginForm` checks `NEXT_PUBLIC_ALLOW_GOOGLE_AUTH`
2. **Backend Validation**: API checks `ALLOW_GOOGLE_AUTH` global kill switch
3. **User Registration Check**: Verifies email exists in Google Sheets
4. **Session Creation**: Creates secure session if all checks pass
5. **Error Handling**: Redirects to custom error page if any step fails

## Configuration Options

### Environment Variable Controls

| Variable | Purpose | Values |
|----------|---------|--------|
| `ALLOW_GOOGLE_AUTH` | Backend global kill switch | `true`/`false` |
| `NEXT_PUBLIC_ALLOW_GOOGLE_AUTH` | Frontend UI control | `true`/`false` |

### Authentication Modes

#### Mode 1: Completely Disabled
```bash
ALLOW_GOOGLE_AUTH=false
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=false
```
- Shows "temporarily unavailable" message
- Blocks all authentication attempts

#### Mode 2: Registered Users Only
```bash
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true
```
- Shows Google sign-in button
- Only allows users in Google Sheets to authenticate

#### Mode 3: All Users (Not Recommended)
```bash
ALLOW_GOOGLE_AUTH=true
NEXT_PUBLIC_ALLOW_GOOGLE_AUTH=true
```
- Shows Google sign-in button
- Any Google account can attempt sign-in
- Still validates against registered users list

## API Endpoints

### NextAuth.js Configuration (`/api/auth/[...nextauth]`)
- Handles OAuth flow with NextAuth.js
- Integrates with user registration checks
- Provides session management

### Custom OAuth Handler (`/api/auth/google`)
- Alternative to NextAuth.js
- Manual OAuth implementation
- Direct Google Sheets integration

### User Management (`lib/userStore.js`)
- `checkIfUserExists(email)`: Verify user registration
- `getAllRegisteredUsers()`: Get all registered users
- `addRegisteredUser(email)`: Add new user
- `removeRegisteredUser(email)`: Remove user

## Error Handling

### Error Types
- `AccessDenied`: User not registered or auth disabled
- `OAuthError`: Google OAuth flow error
- `Configuration`: Missing environment variables
- `TokenExchange`: Failed to exchange auth code
- `ProfileError`: Failed to get user profile
- `SessionError`: Failed to create session
- `NoCode`: Missing authorization code

### Custom Error Page
Located at `/auth/error`, provides:
- User-friendly error messages
- Action buttons (Try Again, Contact Support)
- Contact information
- Responsive design

## Security Features

### Session Security
- HTTP-only cookies
- Secure session validation
- Automatic expiration
- User registration verification

### OAuth Security
- State parameter validation
- Secure redirect URIs
- Token validation
- Profile verification

### Google Sheets Security
- Service account authentication
- Least privilege access
- API usage monitoring
- Secure credential storage

## Usage Examples

### Basic Implementation
```jsx
// pages/login.js
import LoginForm from '../components/LoginForm';

export default function LoginPage() {
  return (
    <div className="login-page">
      <LoginForm />
    </div>
  );
}
```

### Protected Route
```jsx
// pages/dashboard.js
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Custom OAuth Integration
```jsx
// Custom sign-in function
const handleCustomSignIn = async () => {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectUrl: '/dashboard' })
    });
    
    const { authUrl } = await response.json();
    window.location.href = authUrl;
  } catch (error) {
    console.error('Sign-in error:', error);
  }
};
```

## Troubleshooting

### Common Issues

1. **"Google sign-in is temporarily disabled"**
   - Check environment variables are set correctly
   - Verify both `ALLOW_GOOGLE_AUTH` and `NEXT_PUBLIC_ALLOW_GOOGLE_AUTH`

2. **"This Google account is not registered"**
   - Add user email to Google Sheets "Users" tab
   - Verify `USER_SHEET_ID` is correct
   - Check service account permissions

3. **OAuth configuration errors**
   - Verify Google Cloud Console setup
   - Check redirect URIs match your domain
   - Ensure OAuth consent screen is configured

4. **Google Sheets API errors**
   - Verify service account credentials
   - Check sheet sharing permissions
   - Ensure Google Sheets API is enabled

### Debug Mode
Enable detailed logging:
```bash
DEBUG_AUTH=true
```

### Testing
1. Set up test environment variables
2. Add test users to Google Sheets
3. Test authentication flow
4. Verify error handling
5. Check session management

## Deployment

### Vercel Deployment
1. Set environment variables in Vercel dashboard
2. Deploy application
3. Configure custom domain (if needed)
4. Update OAuth redirect URIs

### Production Considerations
- Use HTTPS in production
- Set secure cookie flags
- Monitor API usage
- Implement rate limiting
- Regular security audits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@kiwitrade.co.nz
- Phone: +64 9 123 4567
- Documentation: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) 