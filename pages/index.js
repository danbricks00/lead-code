import React, { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const HomePage = ({ openChat }) => {
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handleOpenChat = () => {
    if (openChat && typeof openChat === 'function') {
      openChat();
    } else {
      const chatBubble = document.querySelector('[data-chat-bubble]');
      if (chatBubble) {
        chatBubble.click();
      }
    }
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Auckland | Under Floor Heating — Free Quote"
        description="Auckland's #1 underfloor heating & under floor heating specialists! Electric & hydronic installation from $80/m². 500+ homes heated. Serving West Auckland, Henderson, New Lynn & all Auckland. Free quotes, expert installation, 25-year warranty. Get your quote today!"
        canonical="https://www.heat.nz"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, underfloor heating West Auckland, under floor heating West Auckland, under-floor heating West Auckland, underfloor heating Henderson, under floor heating Henderson, under-floor heating Henderson, underfloor heating New Lynn, under floor heating New Lynn, under-floor heating New Lynn, tile heating Auckland, under tile heating Auckland, floor heating Auckland, electric tile heating Auckland, electric under tile heating Auckland, electric underfloor heating Auckland, electric under floor heating Auckland, electric under-floor heating Auckland, hydronic heating Auckland, heating installation Auckland, underfloor heating quote Auckland, bathroom heating Auckland, kitchen heating Auckland, heating contractors Auckland"
      />
      <div style={styles.pageContainer}>
        {/* Modern Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroOverlay}></div>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>Premium Underfloor Heating Solutions</div>
            <h1 style={styles.heroTitle}>Transform Your Home with Professional Underfloor Heating</h1>
            <p style={styles.heroSubtitle}>
              Auckland's trusted specialists for electric and hydronic underfloor heating systems. 
              Experience ultimate comfort with energy-efficient solutions designed for New Zealand homes.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <div style={styles.statNumber}>500+</div>
                <div style={styles.statLabel}>Homes Heated</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>25 Year</div>
                <div style={styles.statLabel}>Warranty</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>15+</div>
                <div style={styles.statLabel}>Years Experience</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statNumber}>Free</div>
                <div style={styles.statLabel}>Quotes</div>
              </div>
            </div>
            <div style={styles.heroButtons}>
              <button 
                style={{
                  ...styles.ctaButtonPrimary,
                  ...(isButtonHovered ? styles.ctaButtonPrimaryHover : {})
                }}
                onClick={handleOpenChat}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
              >
                Get Your Free Quote
              </button>
              <a href="/about" style={styles.ctaButtonSecondary}>
                Learn More
              </a>
            </div>
            <div style={styles.trustBadges}>
              <div style={styles.badge}>✓ 25-Year Warranty</div>
              <div style={styles.badge}>✓ Certified Installers</div>
              <div style={styles.badge}>✓ Free Consultations</div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section style={styles.whyChooseUs}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Why Choose Heat NZ?</h2>
              <p style={styles.sectionSubtitle}>
                Leading Auckland underfloor heating specialists with proven expertise, exceptional service, and unbeatable warranties
              </p>
            </div>
            <div style={styles.featuresGrid}>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>🏆</div>
                <h3 style={styles.featureTitle}>Premium Quality</h3>
                <p style={styles.featureText}>Only the highest-grade materials and systems. Our 25-year warranty demonstrates our confidence in our work.</p>
              </div>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>⚡</div>
                <h3 style={styles.featureTitle}>Energy Efficient</h3>
                <p style={styles.featureText}>Reduce your heating costs with our smart, energy-efficient systems designed for New Zealand conditions.</p>
              </div>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>👷</div>
                <h3 style={styles.featureTitle}>Expert Installation</h3>
                <p style={styles.featureText}>Certified, experienced installers who take pride in every project. Clean, professional, on-time completion.</p>
              </div>
              <div style={styles.featureCard}>
                <div style={styles.featureIcon}>🔧</div>
                <h3 style={styles.featureTitle}>Ongoing Support</h3>
                <p style={styles.featureText}>Comprehensive maintenance services and 24/7 support to keep your system running perfectly for years to come.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section style={styles.services}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Our Underfloor Heating Services</h2>
              <p style={styles.sectionSubtitle}>
                Comprehensive heating solutions tailored to your home and budget
              </p>
            </div>
            <div style={styles.servicesGrid}>
              <div style={styles.serviceCard}>
                <div style={styles.serviceIcon}>⚡</div>
                <h3 style={styles.serviceCardTitle}>Electric Underfloor Heating</h3>
                <p style={styles.serviceCardText}>
                  Perfect for bathrooms, kitchens, and renovations. Quick installation with precise temperature control and minimal floor height increase.
                </p>
                <ul style={styles.serviceList}>
                  <li>✓ From $80-$150 per m²</li>
                  <li>✓ 1-3 day installation</li>
                  <li>✓ Individual room control</li>
                  <li>✓ Suitable for all floor types</li>
                </ul>
                <button style={styles.serviceButton} onClick={handleOpenChat}>
                  Get Quote
                </button>
              </div>
              <div style={styles.serviceCard}>
                <div style={styles.serviceIcon}>💧</div>
                <h3 style={styles.serviceCardTitle}>Hydronic Underfloor Heating</h3>
                <p style={styles.serviceCardText}>
                  Ideal for whole-house heating and new builds. Energy-efficient water-based systems with excellent running costs and uniform heat distribution.
                </p>
                <ul style={styles.serviceList}>
                  <li>✓ From $120-$200 per m²</li>
                  <li>✓ 3-7 day installation</li>
                  <li>✓ Whole-house coverage</li>
                  <li>✓ Lowest running costs</li>
                </ul>
                <button style={styles.serviceButton} onClick={handleOpenChat}>
                  Get Quote
                </button>
              </div>
              <div style={styles.serviceCard}>
                <div style={styles.serviceIcon}>🔧</div>
                <h3 style={styles.serviceCardTitle}>Service & Maintenance</h3>
                <p style={styles.serviceCardText}>
                  Keep your underfloor heating system running efficiently with our comprehensive maintenance and emergency repair services.
                </p>
                <ul style={styles.serviceList}>
                  <li>✓ Annual system checks</li>
                  <li>✓ Emergency repairs</li>
                  <li>✓ System upgrades</li>
                  <li>✓ Expert troubleshooting</li>
                </ul>
                <button style={styles.serviceButton} onClick={handleOpenChat}>
                  Book Service
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={styles.howItWorks}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>How It Works</h2>
              <p style={styles.sectionSubtitle}>Simple, straightforward process from quote to installation</p>
            </div>
            <div style={styles.stepsGrid}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <h3 style={styles.stepTitle}>Free Consultation</h3>
                <p style={styles.stepText}>Contact us for a free, no-obligation quote. We'll discuss your needs and recommend the best solution.</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <h3 style={styles.stepTitle}>Site Visit</h3>
                <p style={styles.stepText}>Our expert team visits your property to assess requirements and provide a detailed quote.</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <h3 style={styles.stepTitle}>Professional Installation</h3>
                <p style={styles.stepText}>Our certified installers complete the work efficiently with minimal disruption to your home.</p>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <h3 style={styles.stepTitle}>Enjoy Your Comfort</h3>
                <p style={styles.stepText}>Start enjoying warm floors and energy-efficient heating with ongoing support from our team.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section style={styles.testimonials}>
          <div style={styles.container}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>What Our Customers Say</h2>
              <p style={styles.sectionSubtitle}>Real feedback from Auckland homeowners</p>
            </div>
            <div style={styles.testimonialsGrid}>
              <div style={styles.testimonialCard}>
                <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.testimonialText}>
                  "Our new underfloor heating has completely changed how we live. It's warm, efficient, and no more cold tiles in winter! The installation team was professional and the whole process was stress-free."
                </p>
                <div style={styles.testimonialAuthor}>
                  <strong>Sarah M.</strong>
                  <span>Remuera, Auckland</span>
                </div>
              </div>
              <div style={styles.testimonialCard}>
                <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.testimonialText}>
                  "The whole process was simple! Heat.nz provided excellent service from quote to completion. Finished on time and within budget. Couldn't be happier with the results."
                </p>
                <div style={styles.testimonialAuthor}>
                  <strong>James R.</strong>
                  <span>Ponsonby, Auckland</span>
                </div>
              </div>
              <div style={styles.testimonialCard}>
                <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.testimonialText}>
                  "Worth every dollar. The system runs quietly, the house feels amazing, and our power bills actually went down. Highly recommend Heat.nz to anyone considering underfloor heating."
                </p>
                <div style={styles.testimonialAuthor}>
                  <strong>Anika P.</strong>
                  <span>Parnell, Auckland</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <div style={styles.container}>
            <div style={styles.ctaContent}>
              <h2 style={styles.ctaTitle}>Ready to Transform Your Home?</h2>
              <p style={styles.ctaSubtitle}>
                Get your free, no-obligation quote today and discover why 500+ Auckland homeowners trust Heat NZ
              </p>
              <button 
                style={styles.ctaButtonLarge}
                onClick={handleOpenChat}
              >
                Get Your Free Quote Now
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

// --- MODERN STYLES ---
const styles = {
  pageContainer: { 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
    color: '#2d3748',
    overflowX: 'hidden'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  // Hero Section
  hero: { 
    position: 'relative',
    background: 'linear-gradient(135deg, #e63946 0%, #f77f00 50%, #fcbf49 100%)',
    color: 'white', 
    padding: '120px 20px 100px',
    textAlign: 'center',
    overflow: 'hidden',
    minHeight: '600px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.2)',
    zIndex: 1
  },
  heroContent: { 
    position: 'relative',
    zIndex: 2,
    maxWidth: '900px', 
    margin: '0 auto' 
  },
  heroBadge: {
    display: 'inline-block',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    padding: '8px 20px',
    borderRadius: '30px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '20px',
    letterSpacing: '0.5px'
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: 800,
    lineHeight: '1.1',
    marginBottom: '24px',
    letterSpacing: '-0.02em'
  },
  heroSubtitle: {
    fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
    lineHeight: '1.6',
    marginBottom: '40px',
    opacity: 0.95,
    maxWidth: '700px',
    margin: '0 auto 40px'
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '24px',
    margin: '40px 0',
    maxWidth: '800px',
    margin: '40px auto'
  },
  stat: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '0.9rem',
    opacity: 0.9,
    fontWeight: 500
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '40px'
  },
  ctaButtonPrimary: { 
    background: 'white', 
    color: '#e63946', 
    border: 'none', 
    padding: '16px 32px', 
    borderRadius: '50px', 
    fontSize: '1.1rem', 
    fontWeight: 700, 
    cursor: 'pointer', 
    transition: 'all 0.3s ease', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    transform: 'translateY(0)',
    letterSpacing: '0.3px'
  },
  ctaButtonPrimaryHover: {
    transform: 'translateY(-3px)',
    boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
  },
  ctaButtonSecondary: {
    background: 'transparent',
    color: 'white',
    border: '2px solid white',
    padding: '14px 32px',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  trustBadges: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '40px'
  },
  badge: {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 600
  },
  // Why Choose Us
  whyChooseUs: {
    padding: '100px 20px',
    background: '#ffffff'
  },
  sectionHeader: {
    textAlign: 'center',
    marginBottom: '60px'
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    color: '#1a202c',
    marginBottom: '16px',
    letterSpacing: '-0.02em'
  },
  sectionSubtitle: {
    fontSize: '1.2rem',
    color: '#718096',
    maxWidth: '700px',
    margin: '0 auto',
    lineHeight: '1.6'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px'
  },
  featureCard: {
    textAlign: 'center',
    padding: '40px 24px',
    background: '#f7fafc',
    borderRadius: '20px',
    transition: 'all 0.3s ease',
    border: '1px solid #e2e8f0'
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '20px'
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: '12px'
  },
  featureText: {
    fontSize: '1rem',
    color: '#4a5568',
    lineHeight: '1.6'
  },
  // Services
  services: {
    padding: '100px 20px',
    background: 'linear-gradient(to bottom, #f7fafc 0%, #edf2f7 100%)'
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px'
  },
  serviceCard: {
    background: 'white',
    padding: '40px 32px',
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column'
  },
  serviceIcon: {
    fontSize: '3.5rem',
    marginBottom: '24px'
  },
  serviceCardTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: '16px'
  },
  serviceCardText: {
    fontSize: '1rem',
    color: '#4a5568',
    lineHeight: '1.7',
    marginBottom: '24px',
    flexGrow: 1
  },
  serviceList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px 0',
    textAlign: 'left',
    fontSize: '1rem',
    color: '#2d3748',
    lineHeight: '1.8'
  },
  serviceButton: {
    background: 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '50px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    alignSelf: 'flex-start',
    marginTop: 'auto'
  },
  // How It Works
  howItWorks: {
    padding: '100px 20px',
    background: '#ffffff'
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    position: 'relative'
  },
  step: {
    textAlign: 'center',
    position: 'relative'
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: '0 auto 24px'
  },
  stepTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: '12px'
  },
  stepText: {
    fontSize: '1rem',
    color: '#4a5568',
    lineHeight: '1.6'
  },
  // Testimonials
  testimonials: {
    padding: '100px 20px',
    background: 'linear-gradient(to bottom, #edf2f7 0%, #f7fafc 100%)'
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '32px'
  },
  testimonialCard: {
    background: 'white',
    padding: '40px 32px',
    borderRadius: '24px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  },
  stars: {
    fontSize: '1.5rem',
    marginBottom: '20px',
    color: '#fbbf24'
  },
  testimonialText: {
    fontSize: '1.05rem',
    color: '#4a5568',
    lineHeight: '1.7',
    marginBottom: '24px',
    fontStyle: 'italic'
  },
  testimonialAuthor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  testimonialAuthor strong: {
    color: '#1a202c',
    fontSize: '1.1rem'
  },
  testimonialAuthor span: {
    color: '#718096',
    fontSize: '0.9rem'
  },
  // CTA Section
  ctaSection: {
    padding: '100px 20px',
    background: 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)',
    color: 'white'
  },
  ctaContent: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto'
  },
  ctaTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    marginBottom: '20px',
    letterSpacing: '-0.02em'
  },
  ctaSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '40px',
    opacity: 0.95,
    lineHeight: '1.6'
  },
  ctaButtonLarge: {
    background: 'white',
    color: '#e63946',
    border: 'none',
    padding: '18px 40px',
    borderRadius: '50px',
    fontSize: '1.2rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    letterSpacing: '0.3px'
  }
};

export default HomePage;
