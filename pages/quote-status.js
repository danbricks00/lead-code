import { useRouter } from 'next/router';
import React from 'react';

const QuoteStatusPage = () => {
  const router = useRouter();
  const { result, error } = router.query;

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
    },
    icon: {
      fontSize: '48px',
      marginBottom: '20px',
    },
    title: {
      fontSize: '28px',
      marginBottom: '10px',
    },
    message: {
      fontSize: '18px',
      color: '#555',
    },
  };

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.icon}>❌</div>
        <h1 style={styles.title}>Error</h1>
        <p style={styles.message}>{error}</p>
      </div>
    );
  }

  const isSuccess = result === 'accepted' || result === 'declined';
  const title = isSuccess ? `Quote ${result.charAt(0).toUpperCase() + result.slice(1)}` : 'Status';
  const message = `Your decision has been successfully recorded.`;

  return (
    <div style={styles.container}>
      <div style={styles.icon}>{isSuccess ? '✅' : 'ℹ️'}</div>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.message}>{message}</p>
    </div>
  );
};

export default QuoteStatusPage;
