import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Create a client-only component
function AuthErrorClient() {
  const router = useRouter();
  const { error, message } = router.query;
  const [errorDetails, setErrorDetails] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (error) {
      setErrorDetails(getErrorDetails(error, message));
    }
  }, [error, message]);

  const getErrorDetails = (errorCode, customMessage) => {
    switch (errorCode) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: customMessage || 'This Google account is not registered. Please contact support.',
          icon: '🚫',
          color: '#dc3545',
          action: 'Contact Support'
        };
      case 'OAuthError':
        return {
          title: 'OAuth Error',
          message: 'There was an error with Google authentication. Please try again.',
          icon: '⚠️',
          color: '#ffc107',
          action: 'Try Again'
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'Authentication is not properly configured. Please contact support.',
          icon: '⚙️',
          color: '#6c757d',
          action: 'Contact Support'
        };
      case 'TokenExchange':
        return {
          title: 'Authentication Failed',
          message: 'Failed to complete authentication. Please try again.',
          icon: '🔐',
          color: '#dc3545',
          action: 'Try Again'
        };
      case 'ProfileError':
        return {
          title: 'Profile Error',
          message: 'Unable to retrieve your profile information. Please try again.',
          icon: '👤',
          color: '#ffc107',
          action: 'Try Again'
        };
      case 'SessionError':
        return {
          title: 'Session Error',
          message: 'Failed to create your session. Please try again.',
          icon: '💻',
          color: '#dc3545',
          action: 'Try Again'
        };
      case 'NoCode':
        return {
          title: 'Authentication Incomplete',
          message: 'The authentication process was not completed. Please try again.',
          icon: '🔄',
          color: '#ffc107',
          action: 'Try Again'
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication. Please try again.',
          icon: '❓',
          color: '#6c757d',
          action: 'Try Again'
        };
    }
  };

  const handleAction = () => {
    if (errorDetails?.action === 'Contact Support') {
      window.location.href = 'mailto:support@heat.nz?subject=Authentication Error';
    } else {
      router.push('/auth/signin');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!errorDetails) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading error details...</p>
      </div>
    );
  }

  return (
    <div className="auth-error-page">
      <div className="error-container">
        <div className="error-icon" style={{ color: errorDetails.color }}>
          {errorDetails.icon}
        </div>
        
        <h1>{errorDetails.title}</h1>
        
        <div className="error-message">
          <p>{errorDetails.message}</p>
        </div>

        <div className="error-actions">
          <button 
            onClick={handleAction}
            className="primary-action"
            style={{ backgroundColor: errorDetails.color }}
          >
            {errorDetails.action}
          </button>
          
          <button onClick={handleGoHome} className="secondary-action">
            Return to Home
          </button>
        </div>

        <div className="error-help">
          <h3>Need Help?</h3>
          <p>
            If you continue to experience issues, please contact our support team:
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> support@heat.nz</p>
            <p><strong>Phone:</strong> +64 9 123 4567</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-error-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .error-container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .error-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .error-container h1 {
          margin: 0 0 20px 0;
          color: #333;
          font-size: 28px;
          font-weight: 600;
        }

        .error-message {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007bff;
        }

        .error-message p {
          margin: 0;
          color: #495057;
          font-size: 16px;
          line-height: 1.5;
        }

        .error-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .primary-action, .secondary-action {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .primary-action {
          color: white;
        }

        .primary-action:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .secondary-action {
          background: #6c757d;
          color: white;
        }

        .secondary-action:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .error-help {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }

        .error-help h3 {
          margin: 0 0 15px 0;
          color: #1976d2;
          font-size: 18px;
          font-weight: 600;
        }

        .error-help p {
          margin: 0 0 15px 0;
          color: #424242;
          font-size: 14px;
          line-height: 1.4;
        }

        .contact-info {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
        }

        .contact-info p {
          margin: 8px 0;
          font-size: 14px;
          color: #666;
        }

        .contact-info p:first-child {
          margin-top: 0;
        }

        .contact-info p:last-child {
          margin-bottom: 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .loading-spinner {
          font-size: 48px;
          margin-bottom: 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .error-container {
            padding: 30px 20px;
          }

          .error-actions {
            flex-direction: column;
          }

          .primary-action, .secondary-action {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Export with dynamic import to disable SSR
export default dynamic(() => Promise.resolve(AuthErrorClient), {
  ssr: false,
  loading: () => (
    <div className="loading-container">
      <div className="loading-spinner">⏳</div>
      <p>Loading...</p>
    </div>
  )
});
