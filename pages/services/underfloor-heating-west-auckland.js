import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingWestAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in West Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "West Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "West Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service in West Auckland, including Henderson, New Lynn, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in West Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in West Auckland typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. Costs are competitive due to good access and established residential areas."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in West Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout West Auckland, including Henderson, New Lynn, and surrounding suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating West Auckland — Henderson & New Lynn Installation | Heat NZ"
        description="Professional underfloor heating installation in West Auckland. Henderson, New Lynn, Glen Eden & surrounding areas. Electric & hydronic systems from $80/m². Free quotes for West Auckland homes."
        canonical="https://heat.nz/services/underfloor-heating-west-auckland"
        keywords="underfloor heating West Auckland, heating installation West Auckland, electric heating West Auckland, hydronic heating West Auckland, Henderson heating, New Lynn heating, Glen Eden heating, West Auckland heating contractors, heating service West Auckland"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating West Auckland — Henderson & New Lynn Specialists</h1>
            <p style={styles.heroSubtitle}>
              West Auckland's trusted underfloor heating specialists. We serve Henderson, New Lynn, Glen Eden, and all western suburbs 
              with reliable electric and hydronic heating installations for family homes and commercial properties.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>250+</strong> West Auckland homes heated
              </div>
              <div style={styles.stat}>
                <strong>Family</strong> home specialists
              </div>
              <div style={styles.stat}>
                <strong>Reliable</strong> local service
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free West Auckland Quote
            </button>
          </div>
        </section>

        {/* West Auckland Specific Content */}
        <section style={styles.section}>
          <h2>Why West Auckland Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Family Home Expertise</h3>
              <p>We specialize in installing underfloor heating in West Auckland's family homes, understanding the needs of growing families and multi-generational households.</p>
            </div>
            <div style={styles.feature}>
              <h3>Established Suburb Knowledge</h3>
              <p>Our team knows West Auckland's established residential areas, from Henderson's family homes to New Lynn's diverse housing mix.</p>
            </div>
            <div style={styles.feature}>
              <h3>Reliable Local Service</h3>
              <p>We provide dependable service throughout West Auckland, with local knowledge and fast response times for maintenance and repairs.</p>
            </div>
            <div style={styles.feature}>
              <h3>Competitive Pricing</h3>
              <p>West Auckland's good access and established areas allow us to provide competitive pricing without compromising on quality.</p>
            </div>
          </div>
        </section>

        {/* West Auckland Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout West Auckland</h2>
          <p>We provide comprehensive underfloor heating services across all West Auckland areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Henderson</h3>
              <p>Family homes, modern developments, and commercial properties with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>New Lynn</h3>
              <p>Diverse housing mix, apartments, and residential properties with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Glen Eden</h3>
              <p>Character homes, family properties, and residential developments with reliable heating</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Avondale</h3>
              <p>Family homes, rental properties, and residential buildings with cost-effective heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Te Atatū</h3>
              <p>Modern homes, waterfront properties, and family residences with premium heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Massey</h3>
              <p>New developments, family homes, and residential properties with contemporary heating solutions</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating West Auckland</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in West Auckland?</h3>
              <p>Underfloor heating costs in West Auckland typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. Costs are competitive due to good access and established residential areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you service underfloor heating systems in West Auckland?</h3>
              <p>Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout West Auckland, including Henderson, New Lynn, and surrounding suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What's the best heating system for West Auckland family homes?</h3>
              <p>For West Auckland family homes, we typically recommend hydronic systems for whole-house heating or electric systems for specific rooms. The choice depends on your home's size, insulation, and family heating needs.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your West Auckland Home?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating in West Auckland. Our specialists understand family home requirements and local conditions.</p>
          <button style={styles.ctaButton}>
            Get Free West Auckland Consultation
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

export default UnderfloorHeatingWestAucklandPage;
