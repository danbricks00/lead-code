import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const QuoteStatusPage = () => {
  const router = useRouter();
  const { status, message } = router.query;
  const [displayMessage, setDisplayMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    if (!status) return;
    
    setStatusType(status);
    
    switch(status) {
      case 'accepted':
        setDisplayMessage('You\'ve accepted the quote.');
        break;
      case 'declined':
        setDisplayMessage('You\'ve declined the quote.');
        break;
      case 'expired':
        setDisplayMessage('This quote has expired. Request a new quote.');
        break;
      case 'locked':
        setDisplayMessage('A decision was already recorded for this quote. No changes allowed.');
        break;
      case 'error':
        setDisplayMessage(message || 'Something went wrong, please contact support.');
        break;
      default:
        setDisplayMessage('Quote status updated.');
    }
    
    // Set timestamp if available
    if (message && message.includes('timestamp:')) {
      const timestampPart = message.split('timestamp:')[1].trim();
      setTimestamp(timestampPart);
    }
  }, [status, message]);

  const getStatusIcon = () => {
    switch(statusType) {
      case 'accepted': return '✅';
      case 'declined': return '❌';
      case 'expired': return '⏳';
      case 'locked': return '🔒';
      case 'error': return '⚠️';
      default: return '📄';
    }
  };

  const getStatusColor = () => {
    switch(statusType) {
      case 'accepted': return '#28a745';
      case 'declined': return '#dc3545';
      case 'expired': return '#ffc107';
      case 'locked': return '#6c757d';
      case 'error': return '#dc3545';
      default: return '#007bff';
    }
  };

  const getStatusTitle = () => {
    switch(statusType) {
      case 'accepted': return 'Quote Accepted';
      case 'declined': return 'Quote Declined';
      case 'expired': return 'Quote Expired';
      case 'locked': return 'Decision Already Made';
      case 'error': return 'Error';
      default: return 'Quote Status';
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{...styles.statusIcon, backgroundColor: getStatusColor()}}>
            {getStatusIcon()}
          </div>
          <h1 style={{...styles.header, color: getStatusColor()}}>
            {getStatusTitle()}
          </h1>
          <p style={styles.message}>{displayMessage}</p>
          
          {timestamp && (
            <div style={styles.timestamp}>on {timestamp}</div>
          )}
          
          {statusType === 'expired' && (
            <div style={styles.contactInfo}>
              <p style={styles.contactTitle}>Need a new quote?</p>
              <p style={styles.contactText}>Contact us to request a fresh quote:</p>
              <div style={styles.contactMethods}>
                <p><strong>📧 Email:</strong> <a href="mailto:info@kiwitrade.co.nz" style={styles.link}>info@kiwitrade.co.nz</a></p>
                <p><strong>📞 Phone:</strong> <a href="tel:+6421234567" style={styles.link}>+64 21 234 567</a></p>
              </div>
            </div>
          )}
          
          <button onClick={() => router.push('/')} style={styles.button}>
            Return to Homepage
          </button>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', background: '#f4f7f6', fontFamily: 'Arial, sans-serif' },
    card: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px', width: '100%' },
    successHeader: { color: '#4caf50' },
    errorHeader: { color: '#f44336' },
    message: { fontSize: '1.1em', color: '#555', margin: '20px 0' },
    button: { background: '#667eea', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '5px', fontSize: '1em', cursor: 'pointer' },
    contactInfo: { 
        background: '#f8f9fa', 
        border: '1px solid #e9ecef', 
        borderRadius: '8px', 
        padding: '20px', 
        margin: '20px 0',
        textAlign: 'left'
    },
    contactTitle: { 
        fontSize: '1.2em', 
        fontWeight: 'bold', 
        color: '#333', 
        margin: '0 0 10px 0',
        textAlign: 'center'
    },
    contactText: { 
        color: '#666', 
        margin: '0 0 15px 0',
        textAlign: 'center'
    },
    contactMethods: { 
        textAlign: 'left' 
    },
    link: { 
        color: '#667eea', 
        textDecoration: 'none' 
    },
    statusIcon: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      fontSize: '24px',
      color: 'white'
    },
    header: {
      margin: '0 0 20px 0',
      fontSize: '24px'
    },
    timestamp: {
      fontSize: '0.9em',
      color: '#666',
      marginBottom: '20px',
      fontStyle: 'italic'
    }
};

export default QuoteStatusPage;
