import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import crypto from 'crypto';

export default function AdminDeclineForm() {
  const router = useRouter();
  const { quoteId, ts, token } = router.query;
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate token for API call
  function generateToken(id, ts) {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET || 'fallback-secret');
    hmac.update(`${id}|${ts}`);
    return hmac.digest("hex");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for declining the quote');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/decline?quoteId=${quoteId}&ts=${ts}&token=${token}&reason=${encodeURIComponent(reason)}`, {
        method: 'GET',
      });

      if (response.ok) {
        router.push(`/quote-status?status=success&message=Quote declined successfully. Reason sent to tradesperson.`);
      } else {
        setError('Failed to decline quote. Please try again.');
      }
    } catch (error) {
      console.error('Error declining quote:', error);
      setError('An error occurred while declining the quote.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#e74c3c', margin: '0 0 10px 0', fontSize: '28px' }}>⚠️ Decline Quote</h1>
          <p style={{ color: '#7f8c8d', margin: '0', fontSize: '16px' }}>Quote ID: {quoteId}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold', 
              color: '#495057' 
            }}>
              Reason for Declining:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a reason for declining this quote. This will be sent to the tradesperson to help them improve their next submission."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '5px',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                resize: 'vertical'
              }}
              required
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: isSubmitting ? '#6c757d' : '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {isSubmitting ? 'Declining...' : 'Decline Quote'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          border: '1px solid #ffeaa7'
        }}>
          <h4 style={{ color: '#856404', margin: '0 0 10px 0' }}>💡 What happens next?</h4>
          <ul style={{ color: '#856404', margin: '0', paddingLeft: '20px' }}>
            <li>The tradesperson will receive your reason for declining</li>
            <li>They can resubmit a revised quote based on your feedback</li>
            <li>The quote version will be incremented for tracking</li>
            <li>You'll receive a new quote for review when resubmitted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}