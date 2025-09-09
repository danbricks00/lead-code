import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AdminDecline() {
  const router = useRouter();
  const { quoteId } = router.query;

  useEffect(() => {
    if (quoteId) {
      // Redirect to the API endpoint
      window.location.href = `/api/admin/decline?quoteId=${quoteId}`;
    }
  }, [quoteId]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Processing Quote Decline...</h2>
        <p>Please wait while we process your request.</p>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #dc3545',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
