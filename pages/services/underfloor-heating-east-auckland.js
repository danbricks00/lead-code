import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingEastAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in East Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "East Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "East Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service in East Auckland, including Howick, Pakuranga, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in East Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in East Auckland typically range from $85-$155 per square meter for electric systems and $120-$190 per square meter for hydronic systems, including installation. Costs may vary based on property type and access requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in East Auckland new builds?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in East Auckland's new builds and developments, working with builders and developers to provide integrated heating solutions."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating East Auckland — Howick & Pakuranga Installation | Heat NZ"
        description="Professional underfloor heating installation in East Auckland. Howick, Pakuranga, Botany & surrounding areas. Electric & hydronic systems from $85/m². Free quotes for East Auckland homes."
        canonical="https://heat.nz/services/underfloor-heating-east-auckland"
        keywords="underfloor heating East Auckland, heating installation East Auckland, electric heating East Auckland, hydronic heating East Auckland, Howick heating, Pakuranga heating, Botany heating, East Auckland heating contractors, heating service East Auckland"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating East Auckland — Howick & Pakuranga Specialists</h1>
            <p style={styles.heroSubtitle}>
              East Auckland's premier underfloor heating specialists. We serve Howick, Pakuranga, Botany, and all eastern suburbs 
              with modern electric and hydronic heating installations for homes, new builds, and commercial properties.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>200+</strong> East Auckland properties heated
              </div>
              <div style={styles.stat}>
                <strong>New build</strong> specialists
              </div>
              <div style={styles.stat}>
                <strong>Modern</strong> heating solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free East Auckland Quote
            </button>
          </div>
        </section>

        {/* East Auckland Specific Content */}
        <section style={styles.section}>
          <h2>Why East Auckland Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>New Build Expertise</h3>
              <p>We specialize in installing underfloor heating in East Auckland's new builds and developments, working with builders to provide integrated heating solutions.</p>
            </div>
            <div style={styles.feature}>
              <h3>Modern Suburb Knowledge</h3>
              <p>Our team understands East Auckland's growing suburbs, from Howick's established areas to Botany's modern developments and new housing estates.</p>
            </div>
            <div style={styles.feature}>
              <h3>Contemporary Solutions</h3>
              <p>We provide modern heating solutions that complement East Auckland's contemporary homes and new developments with smart controls and energy efficiency.</p>
            </div>
            <div style={styles.feature}>
              <h3>Developer Partnerships</h3>
              <p>We work with East Auckland developers and builders to provide heating solutions for new developments, ensuring seamless integration and quality installation.</p>
            </div>
          </div>
        </section>

        {/* East Auckland Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout East Auckland</h2>
          <p>We provide comprehensive underfloor heating services across all East Auckland areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Howick</h3>
              <p>Established homes, character properties, and residential developments with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Pakuranga</h3>
              <p>Family homes, modern developments, and commercial properties with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Botany</h3>
              <p>New developments, shopping center area, and contemporary homes with modern heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Flat Bush</h3>
              <p>New housing estates, modern homes, and residential developments with integrated heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Half Moon Bay</h3>
              <p>Waterfront properties, family homes, and residential buildings with premium heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Bucklands Beach</h3>
              <p>Coastal homes, luxury properties, and family residences with efficient heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating East Auckland</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in East Auckland?</h3>
              <p>Underfloor heating costs in East Auckland typically range from $85-$155 per square meter for electric systems and $120-$190 per square meter for hydronic systems, including installation. Costs may vary based on property type and access requirements.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in East Auckland new builds?</h3>
              <p>Yes, we specialize in installing underfloor heating in East Auckland's new builds and developments, working with builders and developers to provide integrated heating solutions.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you work with East Auckland builders and developers?</h3>
              <p>Absolutely! We have established relationships with East Auckland builders and developers, providing heating solutions for new developments and ensuring seamless integration with construction timelines.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Heat Your East Auckland Home?</h2>
          <p>Get your free consultation and quote for modern underfloor heating in East Auckland. Our specialists understand new builds and contemporary home requirements.</p>
          <button style={styles.ctaButton}>
            Get Free East Auckland Consultation
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

export default UnderfloorHeatingEastAucklandPage;
