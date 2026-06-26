import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingPonsonbyPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Ponsonby",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Ponsonby",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Ponsonby, Auckland"
    },
    "serviceType": "Underfloor heating installation, installation",
    "description": "Modern underfloor heating installation and service in Ponsonby, Auckland's trendy inner-city suburb."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Ponsonby?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Ponsonby villas?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in Ponsonby's character villas and modern homes. We work with both heritage and contemporary properties to provide the best heating solution."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Ponsonby — Modern Villa Heating Installation | Heat NZ"
        description="Contemporary underfloor heating installation in Ponsonby, Auckland. Specialists in character villas and modern homes. Electric systems with smart controls. Free quotes for Ponsonby homeowners."
        canonical="https://heat.nz/services/underfloor-heating-ponsonby"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Ponsonby, under floor heating Ponsonby, under-floor heating Ponsonby, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating Ponsonby, under tile heating Auckland, tile heating Ponsonby, tile heating Auckland, floor heating Ponsonby, floor heating Auckland, electric tile heating Ponsonby, electric tile heating Auckland, electric under floor Ponsonby, electric under floor Auckland, bathroom tile heating Ponsonby, bathroom tile heating Auckland, bathroom heating Ponsonby, bathroom heating Auckland, heating installation Ponsonby, electric heating Ponsonby, electric heating Ponsonby, villa heating Ponsonby, character home heating Ponsonby, kitchen heating Ponsonby, heating contractors Ponsonby"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Contemporary Underfloor Heating Ponsonby — Modern Villa Heating Specialists</h1>
            <p style={styles.heroSubtitle}>
              Among Ponsonby's experienced underfloor heating specialists. We combine modern heating technology with the character of Ponsonby's 
              beautiful villas and contemporary homes, providing efficient, stylish heating solutions.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>150+</strong> Ponsonby homes heated
              </div>
              <div style={styles.stat}>
                <strong>Modern</strong> villa installations
              </div>
              <div style={styles.stat}>
                <strong>Smart</strong> heating controls
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Ponsonby Quote
            </button>
          </div>
        </section>

        {/* Ponsonby-Specific Content */}
        <section style={styles.section}>
          <h2>Why Ponsonby Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Character Villa Expertise</h3>
              <p>We understand Ponsonby's mix of character villas and modern homes, providing heating solutions that enhance both heritage and contemporary properties.</p>
            </div>
            <div style={styles.feature}>
              <h3>Smart Home Integration</h3>
              <p>Our modern heating systems integrate seamlessly with smart home technology, perfect for Ponsonby's tech-savvy residents.</p>
            </div>
            <div style={styles.feature}>
              <h3>Contemporary Design</h3>
              <p>We provide heating solutions that complement Ponsonby's trendy aesthetic, with sleek controls and modern installation techniques.</p>
            </div>
            <div style={styles.feature}>
              <h3>Local Ponsonby Knowledge</h3>
              <p>We understand Ponsonby's unique character, from heritage villas to modern apartments, providing tailored heating solutions.</p>
            </div>
          </div>
        </section>

        {/* Ponsonby Service Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Ponsonby</h2>
          <p>We provide comprehensive underfloor heating services across all areas of Ponsonby, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Ponsonby Central</h3>
              <p>Character villas and modern apartments with contemporary heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Ponsonby Road</h3>
              <p>Heritage homes and boutique heating installations</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Ponsonby Heights</h3>
              <p>Executive homes with whole-house heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Ponsonby Gardens</h3>
              <p>Modern developments with smart heating integration</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Ponsonby</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Ponsonby?</h3>
              <p>Contact us for a free custom quote based on your specific floor plan and project requirements."s character villas and modern homes. We work with both heritage and contemporary properties to provide the best heating solution.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you integrate underfloor heating with smart home systems in Ponsonby?</h3>
              <p>Absolutely! We specialize in smart heating integration, perfect for Ponsonby's modern homes. Our systems can be controlled via smartphone apps and integrate with popular smart home platforms.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Modernize Your Ponsonby Home with Underfloor Heating?</h2>
          <p>Get your free consultation and quote for contemporary underfloor heating in Ponsonby. Our specialists understand both heritage and modern home requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Ponsonby Consultation
          </button>
        </section>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '4rem 0',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 20px'
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    opacity: 0.9
  },
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
  ctaButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '50px',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '1rem',
    boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease'
  },
  section: {
    padding: '4rem 0',
    backgroundColor: '#fff'
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  },
  feature: {
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e9ecef'
  },
  suburbsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  },
  suburbGroup: {
    backgroundColor: '#f8f9fa',
    padding: '2rem',
    borderRadius: '10px',
    border: '1px solid #e9ecef'
  },
  faq: {
    marginTop: '2rem'
  },
  faqItem: {
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  ctaSection: {
    padding: '4rem 0',
    backgroundColor: '#667eea',
    color: 'white',
    textAlign: 'center'
  }
};

export default UnderfloorHeatingPonsonbyPage;
