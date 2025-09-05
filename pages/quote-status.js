import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const QuoteStatusPage = () => {
  const router = useRouter();
  const { status, message } = router.query;
  const [displayMessage, setDisplayMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setIsSuccess(true);
      setDisplayMessage(message || 'Your decision has been recorded.');
    } else if (status === 'error') {
      setIsSuccess(false);
      setDisplayMessage(message || 'An unexpected error occurred.');
      
      // Check if it's an expired quote error
      if (message && message.toLowerCase().includes('expired')) {
        setIsExpired(true);
      }
    }
  }, [status, message]);

  const isExpiredQuote = isExpired && message && message.toLowerCase().includes('expired');

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={isSuccess ? styles.successHeader : styles.errorHeader}>
            {isSuccess ? '✅ Success!' : isExpiredQuote ? '⏰ Quote Expired' : '❌ An Error Occurred'}
          </h1>
          <p style={styles.message}>{displayMessage}</p>
          
          {isExpiredQuote && (
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
    }
};

export default QuoteStatusPage;
