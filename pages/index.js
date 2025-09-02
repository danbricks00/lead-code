import React, { useState } from 'react';
import Layout from '../components/Layout';
import Chatbot from '../components/Chatbot';

const HomePage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Layout>
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Connect with Qualified Tradesmen Instantly</h1>
            <p>Our intelligent chatbot matches you with the perfect tradesman for your project. Get quotes, schedule work, and complete your projects with confidence.</p>
            <button style={styles.ctaButton} onClick={() => setIsChatOpen(true)}>
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

        {/* Chatbot Integration */}
        {isChatOpen && (
          <div style={styles.chatbotContainer}>
            <Chatbot />
          </div>
        )}
        
        {!isChatOpen && (
           <button style={styles.chatBubble} onClick={() => setIsChatOpen(true)}>
             💬
           </button>
        )}
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
  chatbotContainer: { position: 'fixed', bottom: '20px', right: '20px', zIndex: 10001 },
  chatBubble: { position: 'fixed', right: '20px', bottom: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 9999 },
};

export default HomePage;
