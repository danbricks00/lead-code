import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';

export default function LoginForm() {
  const [allowGoogleAuth, setAllowGoogleAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check environment variable for Google auth
    setAllowGoogleAuth(process.env.NEXT_PUBLIC_ALLOW_GOOGLE_AUTH === 'true');
    
    // Check current session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const currentSession = await getSession();
      setSession(currentSession);
    } catch (err) {
      console.error('Error checking session:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        // Success - session will be updated automatically
        await checkSession();
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signIn('signout', { callbackUrl: '/' });
    } catch (err) {
      console.error('Sign-out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already signed in
  if (session) {
    return (
      <div className="login-form-container">
        <div className="user-info">
          <div className="user-avatar">
            {session.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'} 
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          
          <div className="user-details">
            <h3>{session.user?.name || 'User'}</h3>
            <p>{session.user?.email}</p>
            {session.provider && (
              <span className="provider-badge">
                Signed in with {session.provider}
              </span>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleSignOut} 
          disabled={isLoading}
          className="signout-btn"
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  // If Google auth is disabled
  if (!allowGoogleAuth) {
    return (
      <div className="auth-disabled-container">
        <div className="auth-disabled-message">
          <div className="icon">🔒</div>
          <h2>Google Sign-in Temporarily Unavailable</h2>
          <p>
            Google authentication is currently disabled for maintenance. 
            Please check back later or contact support if you need immediate access.
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> support@kiwitrade.co.nz</p>
            <p><strong>Phone:</strong> +64 9 123 4567</p>
          </div>
        </div>
      </div>
    );
  }

  // Google auth is enabled - show sign-in form
  return (
    <div className="login-form-container">
      <div className="login-header">
        <h2>Welcome to KiwiTrade</h2>
        <p>Sign in to access your account</p>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
        </div>
      )}

      <div className="auth-options">
        <button 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
          className="google-signin-btn"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner"></div>
              Signing in...
            </>
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>
      </div>

      <div className="login-footer">
        <p>
          By signing in, you agree to our{' '}
          <a href="/terms" className="footer-link">Terms of Service</a>
          {' '}and{' '}
          <a href="/privacy" className="footer-link">Privacy Policy</a>
        </p>
      </div>

      <style jsx>{`
        .login-form-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 40px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-header h2 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
          font-weight: 600;
        }

        .login-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .error-message {
          display: flex;
          align-items: center;
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .error-icon {
          margin-right: 10px;
          font-size: 18px;
        }

        .error-message p {
          margin: 0;
          font-size: 14px;
        }

        .auth-options {
          margin-bottom: 30px;
        }

        .google-signin-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px 20px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .google-signin-btn:hover:not(:disabled) {
          border-color: #4285F4;
          box-shadow: 0 2px 4px rgba(66, 133, 244, 0.2);
        }

        .google-signin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-icon {
          width: 20px;
          height: 20px;
          margin-right: 10px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #4285F4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          margin-top: 20px;
        }

        .login-footer p {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }

        .footer-link {
          color: #4285F4;
          text-decoration: none;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        .auth-disabled-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .auth-disabled-message {
          background: white;
          padding: 40px 30px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .auth-disabled-message .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .auth-disabled-message h2 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }

        .auth-disabled-message p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 16px;
          line-height: 1.5;
        }

        .contact-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .contact-info p {
          margin: 8px 0;
          font-size: 14px;
          color: #495057;
        }

        .contact-info p:first-child {
          margin-top: 0;
        }

        .contact-info p:last-child {
          margin-bottom: 0;
        }

        .user-info {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .user-avatar {
          margin-right: 15px;
        }

        .avatar-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #4285F4;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
        }

        .user-details h3 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }

        .user-details p {
          margin: 0 0 8px 0;
          color: #666;
          font-size: 14px;
        }

        .provider-badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .signout-btn {
          width: 100%;
          padding: 12px 20px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .signout-btn:hover:not(:disabled) {
          background: #c82333;
        }

        .signout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .login-form-container,
          .auth-disabled-container {
            margin: 20px;
            padding: 30px 20px;
          }

          .auth-disabled-message {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}
