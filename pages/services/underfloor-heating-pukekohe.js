import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingPukekohePage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Pukekohe",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Pukekohe",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Pukekohe, Auckland"
    },
    "serviceType": "Underfloor heating installation, installation",
    "description": "Professional underfloor heating installation and service in Pukekohe, including rural properties and surrounding farming areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Pukekohe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Pukekohe farm properties?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in Pukekohe's farm properties, rural homes, and agricultural buildings, understanding the unique requirements of farming communities."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Pukekohe — Farm Properties Installation | Heat NZ"
        description="Professional underfloor heating installation in Pukekohe, Auckland. Farm properties, rural homes & surrounding areas. Electric systems custom quote. Free quotes for Pukekohe homes."
        canonical="https://heat.nz/services/underfloor-heating-pukekohe"
        keywords="underfloor heating Pukekohe, heating installation Pukekohe, electric heating Pukekohe, electric heating Pukekohe, farm heating Pukekohe, rural heating Pukekohe, Pukekohe heating contractors, heating service Pukekohe"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Pukekohe — Farm Properties Specialists</h1>
            <p style={styles.heroSubtitle}>
              Among Pukekohe's experienced underfloor heating specialists. We serve Pukekohe and surrounding farming areas 
              with reliable electric heating installations for farm properties, rural homes, and agricultural buildings.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>80+</strong> Pukekohe properties heated
              </div>
              <div style={styles.stat}>
                <strong>Farm</strong> property specialists
              </div>
              <div style={styles.stat}>
                <strong>Rural</strong> heating solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Pukekohe Quote
            </button>
          </div>
        </section>

        {/* Pukekohe Specific Content */}
        <section style={styles.section}>
          <h2>Why Pukekohe Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Farm Property Expertise</h3>
              <p>We specialize in installing underfloor heating in Pukekohe's farm properties and rural homes, understanding the unique requirements of agricultural communities.</p>
            </div>
            <div style={styles.feature}>
              <h3>Agricultural Building Knowledge</h3>
              <p>Our team understands Pukekohe's farming landscape, providing heating solutions for farm buildings, workshops, and rural residences.</p>
            </div>
            <div style={styles.feature}>
              <h3>Rural Heating Solutions</h3>
              <p>We provide heating solutions suitable for Pukekohe's rural properties, including off-grid systems and energy-efficient options for farm buildings.</p>
            </div>
            <div style={styles.feature}>
              <h3>Farming Community Focus</h3>
              <p>We're committed to serving Pukekohe's farming communities with reliable service and understanding of agricultural property heating needs.</p>
            </div>
          </div>
        </section>

        {/* Pukekohe Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Pukekohe</h2>
          <p>We provide comprehensive underfloor heating services across all Pukekohe areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe Central</h3>
              <p>Residential homes, commercial properties, and community buildings with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe Rural</h3>
              <p>Farm properties, rural homes, agricultural buildings, and lifestyle blocks with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe East</h3>
              <p>Farming properties, rural homes, and agricultural buildings with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe West</h3>
              <p>Rural properties, farm buildings, and country residences with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe South</h3>
              <p>Farm properties, agricultural buildings, and rural homes with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Pukekohe North</h3>
              <p>Rural properties, farm buildings, and lifestyle blocks with comprehensive heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Pukekohe</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Pukekohe?</h3>
              <p>Contact us for a free custom quote based on your specific floor plan and project requirements."s farm properties, rural homes, and agricultural buildings, understanding the unique requirements of farming communities.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What heating system is best for Pukekohe farm buildings?</h3>
              <p>For Pukekohe farm buildings, we typically recommend electric systems for main residences or electric systems for workshops and storage areas. The choice depends on your building's use, insulation, and energy requirements.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your Pukekohe Property?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating in Pukekohe. Our specialists understand farm properties and rural building requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Pukekohe Consultation
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

export default UnderfloorHeatingPukekohePage;
