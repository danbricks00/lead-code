import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import crypto from 'crypto';

export default function AdminApprove() {
  const router = useRouter();
  const { quoteId } = router.query;
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing Quote Approval...');

  useEffect(() => {
    console.log('🔍 [ADMIN-PAGE] Component mounted, quoteId:', quoteId);
    console.log('🔍 [ADMIN-PAGE] Current URL:', window.location.href);
    console.log('🔍 [ADMIN-PAGE] Router query:', router.query);
    
    if (quoteId) {
      console.log('🔍 [ADMIN-PAGE] Starting approval process for quoteId:', quoteId);
      
      // First, test if we can reach any admin API endpoint
      console.log('🔍 [ADMIN-PAGE] Testing admin API connectivity...');
      fetch('/api/admin/test', { method: 'GET' })
        .then(testResponse => {
          console.log('🔍 [ADMIN-PAGE] Test API response:', {
            status: testResponse.status,
            ok: testResponse.ok,
            statusText: testResponse.statusText
          });
          return testResponse.json();
        })
        .then(testData => {
          console.log('🔍 [ADMIN-PAGE] Test API data:', testData);
        })
        .catch(testError => {
          console.error('🔍 [ADMIN-PAGE] Test API failed:', testError);
        });

      // Test the actual approve endpoint directly
      console.log('🔍 [ADMIN-PAGE] Testing approve endpoint directly...');
      fetch('/api/admin-accept?quoteId=test123&ts=1234567890&token=test', { method: 'GET' })
        .then(testResponse => {
          console.log('🔍 [ADMIN-PAGE] Approve endpoint test response:', {
            status: testResponse.status,
            ok: testResponse.ok,
            statusText: testResponse.statusText,
            url: testResponse.url
          });
        })
        .catch(testError => {
          console.error('🔍 [ADMIN-PAGE] Approve endpoint test failed:', testError);
        });
      
      // Generate the proper approval link with token
      const ts = Date.now().toString();
      const token = generateToken(quoteId, ts);
      
      const apiUrl = `/api/admin-accept?quoteId=${quoteId}&ts=${ts}&token=${token}`;
      console.log('🔍 [ADMIN-PAGE] Making request to:', apiUrl);
      console.log('🔍 [ADMIN-PAGE] Current window location:', window.location.href);
      console.log('🔍 [ADMIN-PAGE] Base URL should be:', window.location.origin);
      
      // Call the API endpoint with GET method and proper parameters
      fetch(apiUrl, {
        method: 'GET',
      })
      .then(response => {
        console.log('🔍 [ADMIN-PAGE] Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        if (response.ok) {
          setStatus('success');
          setMessage('Quote approved successfully! Customer has been notified.');
        } else {
          setStatus('error');
          setMessage(`Failed to approve quote. Status: ${response.status}`);
        }
      })
      .catch(error => {
        console.error('🔍 [ADMIN-PAGE] Error approving quote:', error);
        setStatus('error');
        setMessage('An error occurred while approving the quote.');
      });
    }
  }, [quoteId]);

  // Generate token for API call
  function generateToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET || 'fallback-secret');
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
  }

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
