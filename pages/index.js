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
        title="Underfloor Heating Auckland | Under Floor Heating — Free Quote"
        description="Among Auckland's experienced electric underfloor heating specialists. 500+ homes heated, 25+ years in business. Serving West Auckland, Henderson, New Lynn & all Auckland. Free custom quotes, expert installation, 10-year warranty. Get your quote today!"
        canonical="https://www.heat.nz"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, underfloor heating West Auckland, under floor heating West Auckland, under-floor heating West Auckland, underfloor heating Henderson, under floor heating Henderson, under-floor heating Henderson, underfloor heating New Lynn, under floor heating New Lynn, under-floor heating New Lynn, tile heating Auckland, under tile heating Auckland, floor heating Auckland, electric tile heating Auckland, electric under tile heating Auckland, electric underfloor heating Auckland, electric under floor heating Auckland, electric under-floor heating Auckland, heating installation Auckland, underfloor heating quote Auckland, bathroom heating Auckland, kitchen heating Auckland, heating contractors Auckland"
      />
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>Among Auckland&apos;s Experienced Underfloor Heating Specialists</div>
            <h1 style={styles.heroTitle}>Warm, Comfortable Floors All Year Round</h1>
            <p style={styles.heroDescription}>Transform your home with professional electric underfloor heating. With over 25 years serving Auckland, we deliver professional installation, energy-efficient systems, and reliable service throughout the region.</p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <div style={styles.statNumber}>500+</div>
                <div style={styles.statLabel}>Homes Heated</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>25+</div>
                <div style={styles.statLabel}>Years in Business</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>10 Year</div>
                <div style={styles.statLabel}>Warranty</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>Free</div>
                <div style={styles.statLabel}>Quotes</div>
              </div>
            </div>
            <div style={styles.heroButtons}>
              <button 
                style={{
                  ...styles.ctaButton,
                  ...(isButtonHovered ? styles.ctaButtonHover : {})
                }}
                onClick={handleOpenChat}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
              >
                Get Free Quote
              </button>
              <a href="/about" style={styles.secondaryButton}>
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section style={styles.services}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionBadge}>Our Services</div>
            <h2 style={styles.sectionTitle}>Professional Underfloor Heating Solutions</h2>
            <p style={styles.sectionDescription}>We specialise in premium electric underfloor heating systems, serving all Auckland suburbs with expert new installations.</p>
          </div>
          <div style={styles.servicesGrid}>
            <div 
              style={styles.serviceCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(255,107,53,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.08)';
              }}
            >
              <div style={styles.serviceIcon}>⚡</div>
              <h3 style={styles.serviceCardTitle}>Electric Underfloor Heating</h3>
              <p style={styles.serviceCardDescription}>Perfect for bathrooms, kitchens, and renovations. Quick installation, precise temperature control, and minimal floor height increase.</p>
              <ul style={styles.serviceList}>
                <li style={styles.serviceListItem}>✓ Custom quote for your floor plan</li>
                <li style={styles.serviceListItem}>✓ Individual room control</li>
                <li style={styles.serviceListItem}>✓ Smart thermostat compatible</li>
                <li style={styles.serviceListItem}>✓ 10-year warranty</li>
              </ul>
            </div>
            <div 
              style={styles.serviceCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(255,107,53,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.08)';
              }}
            >
              <div style={styles.serviceIcon}>🛁</div>
              <h3 style={styles.serviceCardTitle}>Electric Under-Tile Heating</h3>
              <p style={styles.serviceCardDescription}>Ideal for bathrooms, ensuites, and wet areas. Heating mats installed directly beneath tiles for luxurious warm floors.</p>
              <ul style={styles.serviceList}>
                <li style={styles.serviceListItem}>✓ Perfect for wet areas</li>
                <li style={styles.serviceListItem}>✓ Works with all tile types</li>
                <li style={styles.serviceListItem}>✓ Energy-efficient zone heating</li>
                <li style={styles.serviceListItem}>✓ Free custom quote</li>
              </ul>
            </div>
            <div 
              style={styles.serviceCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(255,107,53,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.08)';
              }}
            >
              <div style={styles.serviceIcon}>🏠</div>
              <h3 style={styles.serviceCardTitle}>Whole-Home Electric Heating</h3>
              <p style={styles.serviceCardDescription}>Multi-zone electric systems for living areas, bedrooms, and open-plan spaces. Designed and quoted to suit your specific layout.</p>
              <ul style={styles.serviceList}>
                <li style={styles.serviceListItem}>✓ Multi-room zoning</li>
                <li style={styles.serviceListItem}>✓ New builds & renovations</li>
                <li style={styles.serviceListItem}>✓ Premium components</li>
                <li style={styles.serviceListItem}>✓ 25+ years experience</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={styles.testimonials}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionBadge}>Testimonials</div>
            <h2 style={styles.sectionTitle}>Trusted by Auckland Homeowners</h2>
            <p style={styles.sectionDescription}>See what our customers have to say about their underfloor heating experience with Heat.nz</p>
          </div>
          <div style={styles.testimonialsGrid}>
            <div style={styles.testimonialCard}>
              <div style={styles.stars}>★★★★★</div>
              <p style={styles.testimonialText}>"Our new underfloor heating has completely changed how we live. It's warm, efficient, and no more cold tiles in winter! The installation was quick and professional."</p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.testimonialAvatar}>SM</div>
                <div>
                  <div style={styles.testimonialName}>Sarah M.</div>
                  <div style={styles.testimonialLocation}>Remuera, Auckland</div>
                </div>
              </div>
            </div>
            <div style={styles.testimonialCard}>
              <div style={styles.stars}>★★★★★</div>
              <p style={styles.testimonialText}>"The whole process was simple! Heat.nz provided excellent service from quote to completion. Finished on time and within budget. Couldn't be happier!"</p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.testimonialAvatar}>JR</div>
                <div>
                  <div style={styles.testimonialName}>James R.</div>
                  <div style={styles.testimonialLocation}>Ponsonby, Auckland</div>
                </div>
              </div>
            </div>
            <div style={styles.testimonialCard}>
              <div style={styles.stars}>★★★★★</div>
              <p style={styles.testimonialText}>"Worth every dollar. The system runs quietly, the house feels amazing, and our power bills actually went down. Highly recommend!"</p>
              <div style={styles.testimonialAuthor}>
                <div style={styles.testimonialAvatar}>AP</div>
                <div>
                  <div style={styles.testimonialName}>Anika P.</div>
                  <div style={styles.testimonialLocation}>Parnell, Auckland</div>
                </div>
              </div>
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
  pageContainer: { 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", 
    color: '#1a1a1a',
    overflowX: 'hidden'
  },
  hero: { 
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFB347 100%)', 
    color: 'white', 
    padding: '6rem 20px 5rem', 
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  heroContent: { 
    maxWidth: '1200px', 
    margin: '0 auto',
    position: 'relative',
    zIndex: 2
  },
  heroBadge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    padding: '0.5rem 1.25rem',
    borderRadius: '50px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 800,
    marginBottom: '1.5rem',
    lineHeight: '1.1',
    letterSpacing: '-1px',
    fontFamily: "'Poppins', sans-serif",
    maxWidth: '900px',
    margin: '0 auto 1.5rem',
  },
  heroDescription: {
    fontSize: '1.25rem',
    lineHeight: '1.7',
    marginBottom: '2.5rem',
    maxWidth: '700px',
    margin: '0 auto 2.5rem',
    opacity: 0.95,
    fontFamily: "'Inter', sans-serif",
  },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    margin: '3rem 0',
    flexWrap: 'wrap'
  },
  stat: {
    textAlign: 'center',
    padding: '1.5rem 2rem',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    minWidth: '160px',
    border: '1px solid rgba(255,255,255,0.2)',
    transition: 'transform 0.3s ease',
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    fontFamily: "'Poppins', sans-serif",
  },
  statLabel: {
    fontSize: '0.9rem',
    opacity: 0.9,
    fontFamily: "'Inter', sans-serif",
  },
  heroButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '2.5rem',
  },
  ctaButton: { 
    background: 'white', 
    color: '#FF6B35', 
    border: 'none', 
    padding: '1.1rem 2.5rem', 
    borderRadius: '50px', 
    fontSize: '1.1rem', 
    fontWeight: 700, 
    cursor: 'pointer', 
    transition: 'all 0.3s ease', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    transform: 'translateY(0)',
    fontFamily: "'Inter', sans-serif",
  },
  ctaButtonHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
    background: '#f8f9fa'
  },
  secondaryButton: {
    background: 'transparent',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.8)',
    padding: '1.1rem 2.5rem',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
    display: 'inline-block',
  },
  services: { 
    padding: '6rem 20px', 
    background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)'
  },
  sectionHeader: { 
    textAlign: 'center', 
    marginBottom: '4rem',
    maxWidth: '800px',
    margin: '0 auto 4rem',
  },
  sectionBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    color: 'white',
    padding: '0.5rem 1.25rem',
    borderRadius: '50px',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '1rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    marginBottom: '1rem',
    color: '#1a1a1a',
    fontFamily: "'Poppins', sans-serif",
    lineHeight: '1.2',
  },
  sectionDescription: {
    fontSize: '1.125rem',
    color: '#666',
    lineHeight: '1.7',
    fontFamily: "'Inter', sans-serif",
  },
  servicesGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
    gap: '2.5rem', 
    maxWidth: '1400px', 
    margin: '0 auto' 
  },
  serviceCard: { 
    background: 'white', 
    padding: '2.5rem', 
    borderRadius: '20px', 
    textAlign: 'left', 
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default',
  },
  serviceIcon: {
    fontSize: '3rem',
    marginBottom: '1.5rem',
    display: 'block',
  },
  serviceCardTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#1a1a1a',
    fontFamily: "'Poppins', sans-serif",
  },
  serviceCardDescription: {
    fontSize: '1rem',
    lineHeight: '1.7',
    color: '#666',
    marginBottom: '1.5rem',
    fontFamily: "'Inter', sans-serif",
  },
  serviceList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  serviceListItem: {
    padding: '0.75rem 0',
    fontSize: '0.95rem',
    color: '#333',
    fontFamily: "'Inter', sans-serif",
    borderBottom: '1px solid #f0f0f0',
  },
  testimonials: {
    padding: '6rem 20px',
    backgroundColor: '#1a1a1a',
    color: 'white',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  testimonialCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    padding: '2.5rem',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  stars: { 
    fontSize: '1.25rem', 
    marginBottom: '1.5rem', 
    color: '#FFD700',
    letterSpacing: '2px',
  },
  testimonialText: {
    fontSize: '1.05rem',
    lineHeight: '1.7',
    marginBottom: '2rem',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    fontFamily: "'Inter', sans-serif",
  },
  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  testimonialAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1rem',
    fontFamily: "'Inter', sans-serif",
  },
  testimonialName: {
    fontWeight: 600,
    marginBottom: '0.25rem',
    fontFamily: "'Inter', sans-serif",
  },
  testimonialLocation: {
    fontSize: '0.875rem',
    opacity: 0.7,
    fontFamily: "'Inter', sans-serif",
  },
};

export default HomePage;
