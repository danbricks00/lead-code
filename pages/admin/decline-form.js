import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import crypto from 'crypto';

const AdminDeclineForm = () => {
  const router = useRouter();
  const { query, isReady } = router;
  const { quoteId, ts, token } = query;

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Verify token function
  const verifyToken = (id, timestamp) => {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET || 'default-secret');
    hmac.update(`${id}|${timestamp}`);
    return hmac.digest("hex");
  };

  useEffect(() => {
    if (!isReady) return;

    // Basic validation
    if (!quoteId || !ts || !token) {
      setError('Invalid decline link. Missing required parameters.');
      return;
    }
  }, [isReady, quoteId, ts, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for declining the quote.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Redirect to the decline API with the reason
      const declineUrl = `/api/admin/decline?quoteId=${quoteId}&ts=${ts}&token=${token}&reason=${encodeURIComponent(reason)}`;
      window.location.href = declineUrl;
    } catch (err) {
      setError('An error occurred while declining the quote.');
      setSubmitting(false);
    }
  };

  if (error && !quoteId) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>❌ Invalid Link</h1>
          <p style={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.headerSection}>
          <h1 style={styles.header}>❌ Decline Quote</h1>
          <p style={styles.subHeader}>Provide feedback for revision</p>
          <p style={styles.quoteId}>Quote ID: {quoteId}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 Reason for Decline</h2>
            <p style={styles.instructions}>
              Please provide specific feedback to help the tradesperson improve their quote:
            </p>
            
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Example: Please reduce the material costs by 10% and provide a more detailed timeline. The installation cost seems too high for this project size."
              style={styles.textarea}
              required
              rows={6}
            />
            
            <div style={styles.exampleReasons}>
              <h3 style={styles.exampleTitle}>💡 Example decline reasons:</h3>
              <ul style={styles.exampleList}>
                <li>"Quote amount exceeds customer budget - please reduce by 15%"</li>
                <li>"Timeline too long - customer needs completion within 2 weeks"</li>
                <li>"Missing breakdown for materials - please provide detailed list"</li>
                <li>"Travel costs seem excessive for this location"</li>
                <li>"Installation method needs clarification"</li>
              </ul>
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.buttonContainer}>
            <button 
              type="submit" 
              style={styles.declineButton}
              disabled={submitting}
            >
              {submitting ? 'Declining Quote...' : '❌ Decline & Notify Tradesperson'}
            </button>
            
            <button 
              type="button"
              onClick={() => window.history.back()}
              style={styles.cancelButton}
              disabled={submitting}
            >
              📋 Back to Review
            </button>
          </div>

          <div style={styles.noteSection}>
            <p style={styles.note}>
              <strong>Note:</strong> The tradesperson will receive your feedback and can revise and resubmit the quote.
              The customer will NOT be notified at this stage.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    maxWidth: '700px',
    margin: 'auto',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  headerSection: {
    textAlign: 'center',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '20px',
    marginBottom: '30px'
  },
  header: {
    color: '#e74c3c',
    margin: '0 0 10px 0',
    fontSize: '2.2em'
  },
  subHeader: {
    color: '#6c757d',
    margin: '0 0 10px 0',
    fontSize: '1.1em'
  },
  quoteId: {
    color: '#495057',
    margin: '0',
    fontSize: '1em',
    fontWeight: 'bold'
  },
  form: {
    width: '100%'
  },
  section: {
    marginBottom: '30px'
  },
  sectionTitle: {
    color: '#495057',
    margin: '0 0 15px 0',
    fontSize: '1.3em',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '5px'
  },
  instructions: {
    color: '#6c757d',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  textarea: {
    width: '100%',
    padding: '15px',
    border: '2px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical',
    minHeight: '120px',
    marginBottom: '20px',
    boxSizing: 'border-box'
  },
  exampleReasons: {
    background: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    padding: '15px',
    marginTop: '15px'
  },
  exampleTitle: {
    color: '#495057',
    margin: '0 0 10px 0',
    fontSize: '1em'
  },
  exampleList: {
    margin: '0',
    paddingLeft: '20px',
    color: '#6c757d'
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  declineButton: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '15px 25px',
    borderRadius: '5px',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '200px'
  },
  cancelButton: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '15px 25px',
    borderRadius: '5px',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '150px'
  },
  noteSection: {
    background: '#d1ecf1',
    border: '1px solid #bee5eb',
    borderRadius: '6px',
    padding: '15px',
    textAlign: 'center'
  },
  note: {
    color: '#0c5460',
    margin: '0',
    fontSize: '0.9em',
    lineHeight: '1.4'
  },
  error: {
    color: '#e74c3c',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '15px 0'
  }
};

export default AdminDeclineForm;
