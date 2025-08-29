// Import functions will be defined inline to avoid path issues

const allowGoogleAuth = process.env.ALLOW_GOOGLE_AUTH === 'true';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check global kill switch first
  if (!allowGoogleAuth) {
    console.log('❌ Google auth disabled globally');
    if (req.method === 'GET') {
      return res.redirect('/auth/error?error=AccessDenied&message=Google sign-in is temporarily disabled');
    } else {
      return res.status(403).json({ 
        error: "Google sign-in is temporarily disabled.",
        code: 'AUTH_DISABLED'
      });
    }
  }

  if (req.method === 'GET') {
    // Handle OAuth callback
    const { code, state, error } = req.query;

    if (error) {
      console.error('❌ OAuth error:', error);
      return res.redirect(`/auth/error?error=OAuthError&message=${encodeURIComponent(error)}`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect('/auth/error?error=NoCode&message=No authorization code received');
    }

    try {
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);
      if (!tokens) {
        throw new Error('Failed to exchange code for tokens');
      }

      // Get user profile from Google
      const profile = await getGoogleProfile(tokens.access_token);
      if (!profile) {
        throw new Error('Failed to get user profile');
      }

      console.log('✅ Got user profile:', { email: profile.email, name: profile.name });

      // Check if user is registered
      const exists = await checkIfUserExists(profile.email);
      if (!exists) {
        console.log('❌ User not registered:', profile.email);
        return res.redirect('/auth/error?error=AccessDenied&message=This Google account is not registered');
      }

      // Create user session
      const session = await createUserSession(profile, tokens);
      if (!session) {
        throw new Error('Failed to create user session');
      }

      console.log('✅ User authenticated successfully:', profile.email);

      // Redirect to dashboard or intended page
      const redirectUrl = state ? decodeURIComponent(state) : '/dashboard';
      return res.redirect(redirectUrl);

    } catch (error) {
      console.error('❌ Authentication error:', error);
      return res.redirect(`/auth/error?error=TokenExchange&message=${encodeURIComponent(error.message)}`);
    }

  } else if (req.method === 'POST') {
    // Handle OAuth initiation
    try {
      const { redirectUrl } = req.body;
      const authUrl = generateOAuthUrl(redirectUrl);
      
      return res.json({ 
        success: true, 
        authUrl,
        message: 'OAuth URL generated successfully'
      });

    } catch (error) {
      console.error('❌ OAuth initiation error:', error);
      return res.status(500).json({ 
        error: 'Failed to generate OAuth URL',
        details: error.message
      });
    }

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Helper function to exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens exchanged successfully');
    return tokens;

  } catch (error) {
    console.error('❌ Token exchange error:', error);
    throw error;
  }
}

// Helper function to get user profile from Google
async function getGoogleProfile(accessToken) {
  try {
    const profileResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );

    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }

    const profile = await profileResponse.json();
    console.log('✅ Profile retrieved successfully');
    return profile;

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    throw error;
  }
}

// Helper function to generate OAuth URL
function generateOAuthUrl(redirectUrl = '/dashboard') {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: encodeURIComponent(redirectUrl),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Helper function to create user session
async function createUserSession(profile, tokens) {
  try {
    // In a real implementation, you would:
    // 1. Store session in database or Redis
    // 2. Set secure HTTP-only cookies
    // 3. Implement proper session management
    
    // For this example, we'll create a simple session object
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      },
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      createdAt: new Date().toISOString(),
    };

    // Set session cookie (in production, use secure, httpOnly cookies)
    res.setHeader('Set-Cookie', [
      `session=${JSON.stringify(session)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${tokens.expires_in}`,
      `user_email=${profile.email}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${tokens.expires_in}`,
    ]);

    console.log('✅ Session created successfully');
    return session;

  } catch (error) {
    console.error('❌ Session creation error:', error);
    throw error;
  }
}

// Helper function to validate session (for protected routes)
export async function validateSession(req) {
  try {
    const sessionCookie = req.cookies?.session;
    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    // Verify user still exists in registered users
    const exists = await checkIfUserExists(session.user.email);
    if (!exists) {
      return null;
    }

    return session;

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return null;
  }
}

// Helper function to clear session (for sign out)
export function clearSession(res) {
  res.setHeader('Set-Cookie', [
    'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
    'user_email=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
  ]);
}
