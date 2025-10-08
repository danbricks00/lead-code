import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingRodneyPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Rodney",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Rodney",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Rodney, Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service in Rodney, including Warkworth, Orewa, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Rodney?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in Rodney typically range from $85-$160 per square meter for electric systems and $120-$190 per square meter for hydronic systems, including installation. Rural properties may have slightly higher costs due to access requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Rodney rural properties?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in Rodney's rural properties, lifestyle blocks, and coastal homes, understanding the unique requirements of country living and off-grid systems."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Rodney — Warkworth & Orewa Installation | Heat NZ"
        description="Professional underfloor heating installation in Rodney, Auckland. Warkworth, Orewa, Silverdale & surrounding areas. Electric & hydronic systems from $85/m². Free quotes for Rodney homes."
        canonical="https://heat.nz/services/underfloor-heating-rodney"
        keywords="underfloor heating Rodney, heating installation Rodney, electric heating Rodney, hydronic heating Rodney, Warkworth heating, Orewa heating, Silverdale heating, Rodney heating contractors, heating service Rodney"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Rodney — Warkworth & Orewa Specialists</h1>
            <p style={styles.heroSubtitle}>
              Rodney's trusted underfloor heating specialists. We serve Warkworth, Orewa, Silverdale, and all Rodney areas 
              with reliable electric and hydronic heating installations for rural properties, lifestyle blocks, and coastal homes.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>150+</strong> Rodney properties heated
              </div>
              <div style={styles.stat}>
                <strong>Rural</strong> property specialists
              </div>
              <div style={styles.stat}>
                <strong>Lifestyle</strong> heating solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Rodney Quote
            </button>
          </div>
        </section>

        {/* Rodney Specific Content */}
        <section style={styles.section}>
          <h2>Why Rodney Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Rural Property Expertise</h3>
              <p>We specialize in installing underfloor heating in Rodney's rural properties, lifestyle blocks, and coastal homes, understanding the unique requirements of country living.</p>
            </div>
            <div style={styles.feature}>
              <h3>Lifestyle Block Knowledge</h3>
              <p>Our team understands Rodney's diverse landscape, from Warkworth's rural properties to Orewa's coastal homes and Silverdale's lifestyle blocks.</p>
            </div>
            <div style={styles.feature}>
              <h3>Off-Grid Solutions</h3>
              <p>We provide heating solutions suitable for Rodney's rural properties, including off-grid systems and energy-efficient options for lifestyle blocks.</p>
            </div>
            <div style={styles.feature}>
              <h3>Coastal Property Focus</h3>
              <p>We understand the specific requirements of Rodney's coastal properties, managing salt air considerations and waterfront home heating needs.</p>
            </div>
          </div>
        </section>

        {/* Rodney Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Rodney</h2>
          <p>We provide comprehensive underfloor heating services across all Rodney areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Warkworth</h3>
              <p>Rural properties, lifestyle blocks, family homes, and commercial properties with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Orewa</h3>
              <p>Coastal homes, beachfront properties, family residences, and holiday homes with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Silverdale</h3>
              <p>Lifestyle blocks, rural properties, family homes, and residential developments with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Hibiscus Coast</h3>
              <p>Coastal properties, beachfront homes, family residences, and holiday accommodations with premium heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Matakana</h3>
              <p>Rural properties, lifestyle blocks, vineyard homes, and country residences with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Snells Beach</h3>
              <p>Coastal homes, waterfront properties, family residences, and holiday homes with reliable heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Rodney</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Rodney?</h3>
              <p>Underfloor heating costs in Rodney typically range from $85-$160 per square meter for electric systems and $120-$190 per square meter for hydronic systems, including installation. Rural properties may have slightly higher costs due to access requirements.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in Rodney rural properties?</h3>
              <p>Yes, we specialize in installing underfloor heating in Rodney's rural properties, lifestyle blocks, and coastal homes, understanding the unique requirements of country living and off-grid systems.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What heating system is best for Rodney lifestyle blocks?</h3>
              <p>For Rodney lifestyle blocks, we typically recommend hydronic systems for whole-house heating or electric systems for specific areas. The choice depends on your property's size, insulation, and whether you're on-grid or off-grid.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your Rodney Property?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating in Rodney. Our specialists understand rural properties and lifestyle block requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Rodney Consultation
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

export default UnderfloorHeatingRodneyPage;
