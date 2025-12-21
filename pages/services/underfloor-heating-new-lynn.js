import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingNewLynnPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in New Lynn, West Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "New Lynn",
        "addressRegion": "West Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "New Lynn, West Auckland"
    },
    "serviceType": "Underfloor heating installation, under floor heating installation, maintenance & repair",
    "description": "Professional underfloor heating and under floor heating installation and service in New Lynn, West Auckland. Expert installation for apartments, diverse housing, and residential properties."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in New Lynn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating and under floor heating costs in New Lynn typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. We provide free quotes for all New Lynn properties."
        }
      },
      {
        "@type": "Question",
        "name": "Can you install under floor heating in New Lynn?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! We provide professional underfloor heating and under floor heating installation in New Lynn for apartments, diverse housing, and residential properties. Our team understands New Lynn's unique housing mix and provides tailored solutions."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating New Lynn | Under Floor Heating New Lynn, West Auckland | Heat NZ"
        description="Professional underfloor heating & under floor heating in New Lynn, West Auckland. Expert installation for New Lynn apartments, diverse housing & residential properties. Electric & hydronic systems from $80/m². Free quotes for New Lynn properties."
        canonical="https://www.heat.nz/services/underfloor-heating-new-lynn"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating New Lynn, under floor heating New Lynn, under-floor heating New Lynn, underfloor heating New Lynn West Auckland, under floor heating New Lynn West Auckland, under-floor heating New Lynn West Auckland, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating New Lynn, under tile heating Auckland, tile heating New Lynn, tile heating Auckland, floor heating New Lynn, floor heating Auckland, electric tile heating New Lynn, electric tile heating Auckland, electric under floor New Lynn, electric under floor Auckland, bathroom tile heating New Lynn, bathroom tile heating Auckland, bathroom heating New Lynn, bathroom heating Auckland, heating installation New Lynn, electric heating New Lynn, hydronic heating New Lynn, New Lynn heating contractors"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating New Lynn | Under Floor Heating New Lynn, West Auckland</h1>
            <p style={styles.heroSubtitle}>
              New Lynn's trusted underfloor heating and under floor heating specialists. We provide expert installation for New Lynn apartments, 
              diverse housing, and residential properties throughout New Lynn and surrounding areas.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>80+</strong> New Lynn properties heated
              </div>
              <div style={styles.stat}>
                <strong>Apartment</strong> specialists
              </div>
              <div style={styles.stat}>
                <strong>Free</strong> New Lynn quotes
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free New Lynn Quote
            </button>
          </div>
        </section>

        {/* New Lynn Specific Content */}
        <section style={styles.section}>
          <h2>Why New Lynn Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Apartment & Unit Expertise</h3>
              <p>We specialize in installing underfloor heating and under floor heating in New Lynn's apartments and units, understanding space constraints and providing efficient solutions for compact living spaces.</p>
            </div>
            <div style={styles.feature}>
              <h3>Diverse Housing Experience</h3>
              <p>Our team has extensive experience with New Lynn's diverse housing mix, from modern apartments to character homes, providing tailored heating solutions for each property type.</p>
            </div>
            <div style={styles.feature}>
              <h3>Residential Property Solutions</h3>
              <p>We provide reliable underfloor heating solutions for New Lynn residential properties, including family homes, townhouses, and multi-unit developments.</p>
            </div>
            <div style={styles.feature}>
              <h3>Local New Lynn Knowledge</h3>
              <p>As West Auckland specialists, we understand New Lynn's unique character, local conditions, and provide fast, reliable service throughout New Lynn.</p>
            </div>
          </div>
        </section>

        {/* New Lynn Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout New Lynn</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all New Lynn areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>New Lynn Central</h3>
              <p>Apartments, units, and residential properties with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>New Lynn Residential</h3>
              <p>Family homes, townhouses, and residential developments with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>New Lynn Apartments</h3>
              <p>Modern apartments and units with space-efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>New Lynn Character Homes</h3>
              <p>Heritage and character properties with period-appropriate heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating New Lynn</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in New Lynn?</h3>
              <p>Underfloor heating and under floor heating costs in New Lynn typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. We provide free quotes for all New Lynn properties.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you install under floor heating in New Lynn?</h3>
              <p>Absolutely! We provide professional underfloor heating and under floor heating installation in New Lynn for apartments, diverse housing, and residential properties. Our team understands New Lynn's unique housing mix and provides tailored solutions.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What's the best heating system for New Lynn apartments?</h3>
              <p>For New Lynn apartments and units, we typically recommend electric underfloor heating systems due to their compact design, individual room control, and suitability for smaller spaces. Hydronic systems work well for larger apartments and whole-building solutions.</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2>Related West Auckland Heating Services</h2>
          <p>Explore our other West Auckland heating services:</p>
          <div style={styles.relatedLinks}>
            <a href="/services/underfloor-heating-west-auckland" style={styles.relatedLink}>
              Underfloor Heating West Auckland
            </a>
            <a href="/services/underfloor-heating-henderson" style={styles.relatedLink}>
              Underfloor Heating Henderson
            </a>
            <a href="/services/underfloor-heating" style={styles.relatedLink}>
              All Auckland Heating Services
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your New Lynn Property?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating and under floor heating in New Lynn. Our specialists understand New Lynn's unique housing requirements and local conditions.</p>
          <button style={styles.ctaButton}>
            Get Free New Lynn Consultation
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
  },
  relatedLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  },
  relatedLink: {
    display: 'block',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    border: '2px solid transparent',
    transition: 'all 0.3s ease'
  }
};

export default UnderfloorHeatingNewLynnPage;

