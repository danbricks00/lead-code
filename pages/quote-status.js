import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const QuoteStatusPage = () => {
  const router = useRouter();
  const { status, message, decision, timestamp } = router.query;
  const [displayMessage, setDisplayMessage] = useState('');
  const [statusType, setStatusType] = useState('');
  const [displayTimestamp, setDisplayTimestamp] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');

  useEffect(() => {
    if (!status) return;
    
    setStatusType(status);
    setDisplayTimestamp(timestamp || '');
    
    switch(status) {
      case 'accepted':
        setDisplayMessage('You have accepted this quote.');
        setAdditionalMessage('Please await our next contact. We will be in touch shortly to discuss the next steps.');
        break;
      case 'declined':
        setDisplayMessage('You have declined this quote.');
        setAdditionalMessage('If this was a mistake, please contact the tradesperson or admin for assistance.');
        break;
      case 'expired':
        setDisplayMessage('This quote has expired. Request a new quote.');
        break;
      case 'locked':
        const formattedDecision = decision ? decision.charAt(0).toUpperCase() + decision.slice(1).toLowerCase() : 'Processed';
        setDisplayMessage(`Decision already made.`);
        setAdditionalMessage(`This quote was ${formattedDecision} on ${timestamp} NZST.`);
        break;
      case 'error':
        setDisplayMessage('Error');
        setAdditionalMessage(message || 'Something went wrong. Please check your email link or contact support.');
        break;
      default:
        setDisplayMessage('Quote Status');
        setAdditionalMessage('The status of your quote has been updated.');
    }
  }, [status, message, decision, timestamp]);

  const getStatusIcon = () => {
    switch(statusType) {
      case 'accepted': return '✅';
      case 'declined': return '❌';
      case 'expired': return '⏳';
      case 'locked': return '🔒';
      case 'error': return '🚨';
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
          
          {additionalMessage && (
            <p style={styles.additionalMessage}>{additionalMessage}</p>
          )}
          
          {displayTimestamp && statusType !== 'locked' && (
            <p style={styles.timestamp}>Timestamp: {displayTimestamp} NZST</p>
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
    message: { fontSize: '1.2em', fontWeight: 'bold', color: '#333', margin: '20px 0 10px' },
    additionalMessage: { fontSize: '1.1em', color: '#555', margin: '0 0 20px' },
    button: { background: '#667eea', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '5px', fontSize: '1em', cursor: 'pointer', marginTop: '20px' },
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
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      fontSize: '32px',
      color: 'white'
    },
    header: {
      margin: '0 0 20px 0',
      fontSize: '26px'
    },
    timestamp: {
      fontSize: '0.9em',
      color: '#666',
      marginBottom: '20px',
      fontStyle: 'italic'
    }
};

export default QuoteStatusPage;
