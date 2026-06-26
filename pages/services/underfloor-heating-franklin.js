import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingFranklinPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Franklin",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Franklin",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Franklin, Auckland"
    },
    "serviceType": "Underfloor heating installation, installation",
    "description": "Professional underfloor heating installation and service in Franklin, including Pukekohe, Waiuku, and surrounding rural areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Franklin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Franklin rural properties?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in Franklin's rural properties, farms, and lifestyle blocks, understanding the unique requirements of country living and agricultural properties."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Franklin — Pukekohe & Waiuku Installation | Heat NZ"
        description="Professional underfloor heating installation in Franklin, Auckland. Pukekohe, Waiuku, rural properties & surrounding areas. Electric systems custom quote. Free quotes for Franklin homes."
        canonical="https://heat.nz/services/underfloor-heating-franklin"
        keywords="underfloor heating Franklin, heating installation Franklin, electric heating Franklin, electric heating Franklin, Pukekohe heating, Waiuku heating, rural heating Franklin, Franklin heating contractors, heating service Franklin"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Franklin — Pukekohe & Waiuku Specialists</h1>
            <p style={styles.heroSubtitle}>
              Among Franklin's experienced underfloor heating specialists. We serve Pukekohe, Waiuku, and all Franklin rural areas 
              with reliable electric heating installations for farms, lifestyle blocks, and rural properties.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>120+</strong> Franklin properties heated
              </div>
              <div style={styles.stat}>
                <strong>Rural</strong> property specialists
              </div>
              <div style={styles.stat}>
                <strong>Farm</strong> heating solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Franklin Quote
            </button>
          </div>
        </section>

        {/* Franklin Specific Content */}
        <section style={styles.section}>
          <h2>Why Franklin Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Rural Property Expertise</h3>
              <p>We specialize in installing underfloor heating in Franklin's rural properties, farms, and lifestyle blocks, understanding the unique requirements of agricultural and country living.</p>
            </div>
            <div style={styles.feature}>
              <h3>Agricultural Knowledge</h3>
              <p>Our team understands Franklin's agricultural landscape, from Pukekohe's farming communities to Waiuku's rural properties and lifestyle blocks.</p>
            </div>
            <div style={styles.feature}>
              <h3>Off-Grid Solutions</h3>
              <p>We provide heating solutions suitable for Franklin's rural properties, including off-grid systems and energy-efficient options for farms and lifestyle blocks.</p>
            </div>
            <div style={styles.feature}>
              <h3>Farm Building Focus</h3>
              <p>We understand the specific requirements of Franklin's farm buildings, including workshops, storage areas, and rural residences with appropriate heating solutions.</p>
            </div>
          </div>
        </section>

        {/* Franklin Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Franklin</h2>
          <p>We provide comprehensive underfloor heating services across all Franklin areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe</h3>
              <p>Farming properties, rural homes, lifestyle blocks, and agricultural buildings with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Waiuku</h3>
              <p>Rural properties, farm buildings, lifestyle blocks, and country homes with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Bombay</h3>
              <p>Rural properties, lifestyle blocks, farm buildings, and country residences with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Tuakau</h3>
              <p>Farming properties, rural homes, lifestyle blocks, and agricultural buildings with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Patumahoe</h3>
              <p>Rural properties, farm buildings, lifestyle blocks, and country homes with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Drury</h3>
              <p>Rural properties, lifestyle blocks, farm buildings, and country residences with comprehensive heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Franklin</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Franklin?</h3>
              <p>Contact us for a free custom quote based on your specific floor plan and project requirements."s rural properties, farms, and lifestyle blocks, understanding the unique requirements of country living and agricultural properties.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What heating system is best for Franklin farm buildings?</h3>
              <p>For Franklin farm buildings, we typically recommend electric systems for main residences or electric systems for workshops and storage areas. The choice depends on your building's use, insulation, and energy requirements.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your Franklin Property?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating in Franklin. Our specialists understand rural properties and farm building requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Franklin Consultation
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

export default UnderfloorHeatingFranklinPage;
