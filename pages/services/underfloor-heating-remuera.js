import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingRemueraPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Remuera",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Remuera",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Remuera, Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service in Remuera, Auckland's premier suburb."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Remuera?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in Remuera typically range from $100-$180 per square meter for electric systems and $130-$220 per square meter for hydronic systems, including installation. Premium locations may have slightly higher costs due to luxury home requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Remuera heritage homes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in Remuera's heritage and luxury homes. We work carefully with heritage restrictions and use appropriate systems that complement the home's character."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Remuera — Luxury Home Heating Installation | Heat NZ"
        description="Premium underfloor heating installation in Remuera, Auckland. Specialists in luxury and heritage homes. Electric & hydronic systems with discreet installation. Free quotes for Remuera homeowners."
        canonical="https://heat.nz/services/underfloor-heating-remuera"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Remuera, under floor heating Remuera, under-floor heating Remuera, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating Remuera, under tile heating Auckland, tile heating Remuera, tile heating Auckland, floor heating Remuera, floor heating Auckland, electric tile heating Remuera, electric tile heating Auckland, electric under floor Remuera, electric under floor Auckland, bathroom tile heating Remuera, bathroom tile heating Auckland, bathroom heating Remuera, bathroom heating Auckland, heating installation Remuera, electric heating Remuera, hydronic heating Remuera, luxury home heating Remuera, heritage home heating Remuera, kitchen heating Remuera, heating contractors Remuera"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Premium Underfloor Heating Remuera — Luxury Home Heating Specialists</h1>
            <p style={styles.heroSubtitle}>
              Remuera's premier underfloor heating specialists. We understand the unique requirements of luxury and heritage homes, 
              providing discreet, efficient heating solutions that enhance your property's value and comfort.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>200+</strong> Remuera homes heated
              </div>
              <div style={styles.stat}>
                <strong>Premium</strong> heritage installations
              </div>
              <div style={styles.stat}>
                <strong>Free</strong> luxury home consultations
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Remuera Quote
            </button>
          </div>
        </section>

        {/* Remuera-Specific Content */}
        <section style={styles.section}>
          <h2>Why Remuera Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Heritage Home Expertise</h3>
              <p>We specialize in installing underfloor heating in Remuera's beautiful heritage homes, working within heritage guidelines while maintaining period character.</p>
            </div>
            <div style={styles.feature}>
              <h3>Luxury Installation Standards</h3>
              <p>Our installations meet the high standards expected in Remuera, with minimal disruption and superior finish quality.</p>
            </div>
            <div style={styles.feature}>
              <h3>Discreet Design Solutions</h3>
              <p>We provide heating solutions that complement your home's architecture, with hidden controls and seamless integration.</p>
            </div>
            <div style={styles.feature}>
              <h3>Local Remuera Knowledge</h3>
              <p>We understand Remuera's unique characteristics, from heritage restrictions to luxury home requirements.</p>
            </div>
          </div>
        </section>

        {/* Remuera Service Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Remuera</h2>
          <p>We provide comprehensive underfloor heating services across all areas of Remuera, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Upper Remuera</h3>
              <p>Luxury homes and heritage properties with premium heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Lower Remuera</h3>
              <p>Modern renovations and contemporary heating installations</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Remuera Village</h3>
              <p>Heritage homes and boutique heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Remuera Heights</h3>
              <p>Executive homes with whole-house heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Remuera</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Remuera?</h3>
              <p>Underfloor heating costs in Remuera typically range from $100-$180 per square meter for electric systems and $130-$220 per square meter for hydronic systems, including installation. Premium locations may have slightly higher costs due to luxury home requirements.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in Remuera heritage homes?</h3>
              <p>Yes, we specialize in installing underfloor heating in Remuera's heritage and luxury homes. We work carefully with heritage restrictions and use appropriate systems that complement the home's character.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What's the best underfloor heating system for Remuera homes?</h3>
              <p>For Remuera homes, we typically recommend hydronic systems for whole-house heating or electric systems for individual rooms like bathrooms and kitchens. The choice depends on your home's structure, heritage status, and heating requirements.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Upgrade Your Remuera Home with Underfloor Heating?</h2>
          <p>Get your free consultation and quote for premium underfloor heating in Remuera. Our specialists understand luxury homes and heritage requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Remuera Consultation
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

export default UnderfloorHeatingRemueraPage;
