import React from 'react';
import Layout from '../components/Layout';

const HomePage = ({ openChat }) => { // Receive openChat prop from Layout

  return (
    <Layout>
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Connect with Qualified Tradesmen Instantly</h1>
            <p>Our intelligent chatbot matches you with the perfect tradesman for your project. Get quotes, schedule work, and complete your projects with confidence.</p>
            <button style={styles.ctaButton} onClick={openChat}>
              Get Started Now
            </button>
          </div>
        </section>

        {/* Services Section */}
        <section style={styles.services}>
          <div style={styles.sectionHeader}>
            <h2>Why Choose Kiwi Trade?</h2>
            <p>We've revolutionized how customers connect with tradesmen, making the process faster, easier, and more reliable than ever before.</p>
          </div>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <span style={styles.serviceIcon}>🤖</span>
              <h3>Smart Chatbot</h3>
              <p>Our intelligent chatbot collects project details and matches you with the right tradesmen based on your specific needs and location.</p>
            </div>
            <div style={styles.serviceCard}>
              <span style={styles.serviceIcon}>⚡</span>
              <h3>Instant Notifications</h3>
              <p>Get immediate email notifications when new leads are generated, ensuring you never miss a potential customer.</p>
            </div>
            <div style={styles.serviceCard}>
              <span style={styles.serviceIcon}>📊</span>
              <h3>Professional Dashboard</h3>
              <p>Access your comprehensive dashboard to track leads, manage quotes, and monitor your business performance in real-time.</p>
            </div>
          </div>
        </section>

        {/* Chatbot is now managed by Layout.js, so we remove it from here */}
      </div>
    </Layout>
  );
};

// --- STYLES ---
const styles = {
  pageContainer: { fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', color: '#333' },
  hero: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '4rem 20px', textAlign: 'center' },
  heroContent: { maxWidth: '1200px', margin: '0 auto' },
  ctaButton: { background: 'white', color: '#667eea', border: 'none', padding: '1rem 2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  services: { padding: '4rem 20px', background: '#f8f9fa' },
  sectionHeader: { textAlign: 'center', marginBottom: '3rem' },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' },
  serviceCard: { background: 'white', padding: '2rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' },
  serviceIcon: { fontSize: '3rem', marginBottom: '1rem' },
  // Removed chatbotContainer and chatBubble styles as they are now in Layout.js
};

export default HomePage;
