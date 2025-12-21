import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingHendersonPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in Henderson, West Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Henderson",
        "addressRegion": "West Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Henderson, West Auckland"
    },
    "serviceType": "Underfloor heating installation, under floor heating installation, maintenance & repair",
    "description": "Professional underfloor heating and under floor heating installation and service in Henderson, West Auckland. Expert installation for family homes, modern developments, and commercial properties."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Henderson?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating and under floor heating costs in Henderson typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. We provide free quotes for all Henderson properties."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Henderson?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in underfloor heating and under floor heating installation in Henderson, West Auckland. We serve all Henderson areas including Henderson Valley, providing expert installation for family homes, modern developments, and commercial properties."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Henderson | Under Floor Heating Henderson, West Auckland | Heat NZ"
        description="Professional underfloor heating & under floor heating in Henderson, West Auckland. Expert installation for Henderson family homes, modern developments & commercial properties. Electric & hydronic systems from $80/m². Free quotes for Henderson properties."
        canonical="https://www.heat.nz/services/underfloor-heating-henderson"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Henderson, under floor heating Henderson, under-floor heating Henderson, underfloor heating Henderson West Auckland, under floor heating Henderson West Auckland, under-floor heating Henderson West Auckland, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating Henderson, under tile heating Auckland, tile heating Henderson, tile heating Auckland, floor heating Henderson, floor heating Auckland, electric tile heating Henderson, electric tile heating Auckland, electric under floor Henderson, electric under floor Auckland, bathroom tile heating Henderson, bathroom tile heating Auckland, bathroom heating Henderson, bathroom heating Auckland, heating installation Henderson, electric heating Henderson, hydronic heating Henderson, Henderson heating contractors"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Henderson | Under Floor Heating Henderson, West Auckland</h1>
            <p style={styles.heroSubtitle}>
              Henderson's trusted underfloor heating and under floor heating specialists. We provide expert installation for Henderson family homes, 
              modern developments, and commercial properties throughout Henderson and Henderson Valley.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>100+</strong> Henderson properties heated
              </div>
              <div style={styles.stat}>
                <strong>Local</strong> Henderson specialists
              </div>
              <div style={styles.stat}>
                <strong>Free</strong> Henderson quotes
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Henderson Quote
            </button>
          </div>
        </section>

        {/* Henderson Specific Content */}
        <section style={styles.section}>
          <h2>Why Henderson Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Henderson Family Home Expertise</h3>
              <p>We specialize in installing underfloor heating and under floor heating in Henderson's family homes, understanding the needs of growing families and multi-generational households throughout Henderson and Henderson Valley.</p>
            </div>
            <div style={styles.feature}>
              <h3>Modern Development Experience</h3>
              <p>Our team has extensive experience installing underfloor heating in Henderson's modern developments and new housing estates, working with builders and developers.</p>
            </div>
            <div style={styles.feature}>
              <h3>Commercial Property Solutions</h3>
              <p>We provide reliable underfloor heating solutions for Henderson commercial properties, offices, and retail spaces with efficient, cost-effective systems.</p>
            </div>
            <div style={styles.feature}>
              <h3>Local Henderson Knowledge</h3>
              <p>As West Auckland specialists, we understand Henderson's unique housing mix, local conditions, and provide fast, reliable service throughout Henderson.</p>
            </div>
          </div>
        </section>

        {/* Henderson Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Henderson</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all Henderson areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Henderson Central</h3>
              <p>Family homes, apartments, and residential properties with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Henderson Valley</h3>
              <p>Rural properties, lifestyle blocks, and larger family homes with comprehensive heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Henderson Commercial</h3>
              <p>Offices, retail spaces, and commercial buildings with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Henderson New Developments</h3>
              <p>New housing estates and modern developments with integrated heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Henderson</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Henderson?</h3>
              <p>Underfloor heating and under floor heating costs in Henderson typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. We provide free quotes for all Henderson properties.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in Henderson?</h3>
              <p>Yes, we specialize in underfloor heating and under floor heating installation in Henderson, West Auckland. We serve all Henderson areas including Henderson Valley, providing expert installation for family homes, modern developments, and commercial properties.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What's the best heating system for Henderson homes?</h3>
              <p>For Henderson homes, we typically recommend hydronic systems for whole-house heating or electric systems for specific rooms like bathrooms and kitchens. The choice depends on your home's size, insulation, and heating needs.</p>
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
            <a href="/services/underfloor-heating-new-lynn" style={styles.relatedLink}>
              Underfloor Heating New Lynn
            </a>
            <a href="/services/underfloor-heating" style={styles.relatedLink}>
              All Auckland Heating Services
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your Henderson Home?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating and under floor heating in Henderson. Our specialists understand Henderson's unique housing requirements and local conditions.</p>
          <button style={styles.ctaButton}>
            Get Free Henderson Consultation
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

export default UnderfloorHeatingHendersonPage;

