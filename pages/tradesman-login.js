import React from 'react';
import Layout from '../components/Layout';

const TradesmanLoginPage = () => {
  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>🔥</span>
          </div>
          
          <h1 style={styles.title}>Tradesman Login</h1>
          <h2 style={styles.subtitle}>Coming Soon</h2>
          
          <p style={styles.description}>
            We're working hard to bring you a comprehensive tradesman portal where you can:
          </p>
          
          <div style={styles.featuresList}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📊</span>
              <span>Manage your quotes and leads</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📧</span>
              <span>Receive instant notifications</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>📈</span>
              <span>Track your business performance</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>⚙️</span>
              <span>Update your profile and services</span>
            </div>
          </div>
          
          <div style={styles.notifySection}>
            <p style={styles.notifyText}>
              Want to be notified when this feature launches?
            </p>
            <button style={styles.notifyButton}>
              Notify Me When Ready
            </button>
          </div>
          
          <div style={styles.backSection}>
            <a href="/" style={styles.backLink}>
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 140px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 20px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  content: {
    background: 'white',
    borderRadius: '20px',
    padding: '3rem 2rem',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    width: '100%',
  },
  iconContainer: {
    marginBottom: '2rem',
  },
  icon: {
    fontSize: '4rem',
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '1.8rem',
    fontWeight: '600',
    color: '#667eea',
    margin: '0 0 2rem 0',
  },
  description: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '2rem',
    lineHeight: '1.6',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2.5rem',
    textAlign: 'left',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    background: '#f8f9fa',
    borderRadius: '10px',
    fontSize: '1rem',
    color: '#333',
  },
  featureIcon: {
    fontSize: '1.5rem',
    minWidth: '2rem',
  },
  notifySection: {
    marginBottom: '2rem',
  },
  notifyText: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '1rem',
  },
  notifyButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)',
  },
  backSection: {
    marginTop: '1rem',
  },
  backLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'color 0.3s ease',
  },
};

export default TradesmanLoginPage;
