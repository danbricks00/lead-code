import React, { useState } from 'react';
import Layout from '../components/Layout';

const HomePage = ({ openChat }) => { // Receive openChat prop from Layout
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  // Fallback function to open chat if prop is not available
  const handleOpenChat = () => {
    console.log('handleOpenChat called');
    if (openChat && typeof openChat === 'function') {
      console.log('Using openChat prop');
      openChat();
    } else {
      console.log('openChat prop not available, trying alternative method');
      // Try to find and click the chat bubble button
      const chatBubble = document.querySelector('[data-chat-bubble]');
      if (chatBubble) {
        console.log('Found chat bubble, clicking it');
        chatBubble.click();
      } else {
        console.error('Could not find chat bubble button');
      }
    }
  };

  return (
    <Layout>
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Connect with Qualified Tradesmen Instantly</h1>
            <p>Our intelligent chatbot matches you with the perfect tradesman for your project. Get quotes, schedule work, and complete your projects with confidence.</p>
            <button 
              style={{
                ...styles.ctaButton,
                ...(isButtonHovered ? styles.ctaButtonHover : {})
              }}
              onClick={handleOpenChat}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
            >
              Get Started Now
            </button>
          </div>
        </section>

        {/* Testimonials Section (previously Services Section) */}
        <section style={styles.services}>
          <div style={styles.sectionHeader}>
            <h2>What Our Customers Say About Our Underfloor Heating</h2>
            <p>We've revolutionized how customers connect with tradesmen, making the process faster, easier, and more reliable than ever before.</p>
          </div>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"Our new underfloor heating has completely changed how we live. It's warm, efficient, and no more cold tiles in winter!"</p>
              <p><strong>– Sarah M.</strong></p>
            </div>
            <div style={styles.serviceCard}>
              <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"The whole process was simple! Kiwi Trade found us a reliable installer who finished on time and within budget."</p>
              <p><strong>– James R.</strong></p>
            </div>
            <div style={styles.serviceCard}>
              <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"Worth every dollar. The system runs quietly, the house feels amazing, and our power bills actually went down."</p>
              <p><strong>– Anika P.</strong></p>
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
  ctaButton: { 
    background: 'white', 
    color: '#667eea', 
    border: 'none', 
    padding: '1rem 2rem', 
    borderRadius: '50px', 
    fontSize: '1.1rem', 
    fontWeight: 600, 
    cursor: 'pointer', 
    transition: 'all 0.3s ease', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    transform: 'translateY(0)',
  },
  ctaButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
    background: '#f8f9fa'
  },
  services: { padding: '4rem 20px', background: '#f8f9fa' },
  sectionHeader: { textAlign: 'center', marginBottom: '3rem' },
  servicesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' },
  serviceCard: { background: 'white', padding: '2rem', borderRadius: '15px', textAlign: 'center', boxShadow: '0 5px 20px rgba(0,0,0,0.1)' },
  stars: { fontSize: '1.5rem', marginBottom: '1rem', color: '#FFD700' },
  // Removed chatbotContainer and chatBubble styles as they are now in Layout.js
};

export default HomePage;
