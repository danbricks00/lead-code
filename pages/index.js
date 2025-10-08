import React, { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

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
      <SEO
        title="Underfloor Heating Auckland — Free Quote"
        description="Auckland's #1 underfloor heating specialists! Electric & hydronic installation from $80/m². 500+ homes heated. Free quotes, expert installation, 25-year warranty. Get your quote today!"
        canonical="https://heat.nz"
        keywords="underfloor heating Auckland, electric underfloor heating Auckland, hydronic heating Auckland, heating installation Auckland, underfloor heating quote Auckland, bathroom heating Auckland, kitchen heating Auckland, heating contractors Auckland"
      />
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Auckland — Get Your Free Quote Today</h1>
            <p>Heat NZ is Auckland's leading underfloor heating specialists. We install and service electric and hydronic heating systems throughout Auckland, providing warm, energy-efficient homes with expert installation and ongoing support.</p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>500+</strong> Auckland homes heated
              </div>
              <div style={styles.stat}>
                <strong>15+</strong> years experience
              </div>
              <div style={styles.stat}>
                <strong>Free</strong> quotes & consultations
              </div>
            </div>
            <button 
              style={{
                ...styles.ctaButton,
                ...(isButtonHovered ? styles.ctaButtonHover : {})
              }}
              onClick={handleOpenChat}
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
            >
              Get Free Underfloor Heating Quote
            </button>
          </div>
        </section>

        {/* Services Section */}
        <section style={styles.services}>
          <div style={styles.sectionHeader}>
            <h2>Professional Underfloor Heating Services in Auckland</h2>
            <p>We specialize in electric and hydronic underfloor heating systems, serving all Auckland suburbs with expert installation, maintenance, and repair services.</p>
          </div>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <h3>Electric Underfloor Heating</h3>
              <p>Perfect for bathrooms, kitchens, and renovations. Quick installation, precise temperature control, and minimal floor height increase.</p>
              <ul style={styles.serviceList}>
                <li>• From $80-$150 per m²</li>
                <li>• 1-3 day installation</li>
                <li>• Individual room control</li>
              </ul>
            </div>
            <div style={styles.serviceCard}>
              <h3>Hydronic Underfloor Heating</h3>
              <p>Ideal for whole-house heating and new builds. Energy-efficient water-based systems with excellent running costs.</p>
              <ul style={styles.serviceList}>
                <li>• From $120-$200 per m²</li>
                <li>• 3-7 day installation</li>
                <li>• Whole-house coverage</li>
              </ul>
            </div>
            <div style={styles.serviceCard}>
              <h3>Service & Maintenance</h3>
              <p>Keep your underfloor heating system running efficiently with our comprehensive maintenance and repair services.</p>
              <ul style={styles.serviceList}>
                <li>• Annual system checks</li>
                <li>• Emergency repairs</li>
                <li>• System upgrades</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={styles.testimonials}>
          <div style={styles.sectionHeader}>
            <h2>What Auckland Homeowners Say About Our Underfloor Heating</h2>
          </div>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"Our new underfloor heating has completely changed how we live. It's warm, efficient, and no more cold tiles in winter!"</p>
              <p><strong>– Sarah M., Remuera</strong></p>
            </div>
            <div style={styles.serviceCard}>
              <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"The whole process was simple! Heat.nz provided excellent service from quote to completion. Finished on time and within budget."</p>
              <p><strong>– James R., Ponsonby</strong></p>
            </div>
            <div style={styles.serviceCard}>
              <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"Worth every dollar. The system runs quietly, the house feels amazing, and our power bills actually went down."</p>
              <p><strong>– Anika P., Parnell</strong></p>
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
  serviceList: {
    listStyle: 'none',
    padding: 0,
    margin: '1rem 0',
    textAlign: 'left'
  },
  stars: { fontSize: '1.5rem', marginBottom: '1rem', color: '#FFD700' },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    margin: '2rem 0',
    flexWrap: 'wrap'
  },
  stat: {
    textAlign: 'center',
    padding: '1rem',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    minWidth: '150px'
  },
  testimonials: {
    padding: '4rem 20px',
    backgroundColor: '#f8f9fa'
  },
  // Removed chatbotContainer and chatBubble styles as they are now in Layout.js
};

export default HomePage;
