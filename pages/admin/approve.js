import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function AdminApprove() {
  const router = useRouter();
  const { quoteId } = router.query;
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Quote Approval...');

  useEffect(() => {
    if (quoteId) {
      // Call the API endpoint directly
      fetch(`/api/admin/approve?quoteId=${quoteId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(response => {
        if (response.ok) {
          setStatus('success');
          setMessage('Quote approved successfully! Customer has been notified.');
        } else {
          setStatus('error');
          setMessage('Failed to approve quote. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error approving quote:', error);
        setStatus('error');
        setMessage('An error occurred while approving the quote.');
      });
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
        <h2 style={{ color: status === 'success' ? '#28a745' : status === 'error' ? '#dc3545' : '#333' }}>
          {status === 'success' ? '✅ Quote Approved!' : 
           status === 'error' ? '❌ Approval Failed' : 
           'Processing Quote Approval...'}
        </h2>
        <p>{message}</p>
        {status === 'processing' && (
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #28a745',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '20px auto'
          }}></div>
        )}
        {status !== 'processing' && (
          <button 
            onClick={() => window.close()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Close Window
          </button>
        )}
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
