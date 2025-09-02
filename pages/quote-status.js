import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const QuoteStatusPage = () => {
  const router = useRouter();
  const { status, message } = router.query;
  const [displayMessage, setDisplayMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setIsSuccess(true);
      setDisplayMessage(message || 'Your decision has been recorded.');
    } else if (status === 'error') {
      setIsSuccess(false);
      setDisplayMessage(message || 'An unexpected error occurred.');
    }
  }, [status, message]);

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={isSuccess ? styles.successHeader : styles.errorHeader}>
            {isSuccess ? '✅ Success!' : '❌ An Error Occurred'}
          </h1>
          <p style={styles.message}>{displayMessage}</p>
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
};

export default QuoteStatusPage;
