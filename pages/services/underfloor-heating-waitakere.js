import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingWaitakerePage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in Waitākere",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Waitākere",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": [
      {
        "@type": "Place",
        "name": "Waitākere, Auckland"
      },
      {
        "@type": "Place",
        "name": "Henderson"
      },
      {
        "@type": "Place",
        "name": "New Lynn"
      },
      {
        "@type": "Place",
        "name": "Glen Eden"
      },
      {
        "@type": "Place",
        "name": "Avondale"
      },
      {
        "@type": "Place",
        "name": "Te Atatū"
      },
      {
        "@type": "Place",
        "name": "Massey"
      }
    ],
    "serviceType": "Underfloor heating installation, under floor heating installation, maintenance & repair",
    "description": "Professional underfloor heating and under floor heating installation and service in Waitākere, including Henderson, New Lynn, Glen Eden, Avondale, Te Atatū, Massey, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Waitākere?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating and under floor heating costs in Waitākere typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. Waitākere offers competitive pricing with excellent value for money."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in Waitākere?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for underfloor heating and under floor heating systems throughout Waitākere, including Henderson, New Lynn, Glen Eden, Avondale, Te Atatū, Massey, and all surrounding suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Waitākere | Under Floor Heating Henderson, New Lynn | Heat NZ"
        description="Professional underfloor heating & under floor heating in Waitākere, Auckland. Henderson, New Lynn, Glen Eden, Avondale, Te Atatū, Massey & surrounding areas. Electric & hydronic systems from $80/m². Free quotes for Waitākere homes."
        canonical="https://www.heat.nz/services/underfloor-heating-waitakere"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Waitākere, under floor heating Waitākere, under-floor heating Waitākere, underfloor heating Waitakere, under floor heating Waitakere, under-floor heating Waitakere, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating Waitākere, under tile heating Auckland, tile heating Waitākere, tile heating Auckland, floor heating Waitākere, floor heating Auckland, electric tile heating Waitākere, electric tile heating Auckland, electric under floor Waitākere, electric under floor Auckland, bathroom tile heating Waitākere, bathroom tile heating Auckland, bathroom heating Waitākere, bathroom heating Auckland, underfloor heating Henderson, under floor heating Henderson, under-floor heating Henderson, underfloor heating New Lynn, under floor heating New Lynn, under-floor heating New Lynn, underfloor heating Glen Eden, under floor heating Glen Eden, under-floor heating Glen Eden, underfloor heating Avondale, under floor heating Avondale, under-floor heating Avondale, heating installation Waitākere, electric heating Waitākere, hydronic heating Waitākere, Waitākere heating contractors, heating service Waitākere"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Waitākere | Under Floor Heating Henderson, New Lynn & All Waitākere</h1>
            <p style={styles.heroSubtitle}>
              Waitākere's trusted underfloor heating and under floor heating specialists. We serve Henderson, New Lynn, Glen Eden, Avondale, Te Atatū, Massey, and all Waitākere suburbs 
              with reliable electric and hydronic heating installations for family homes, rental properties, and commercial buildings.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>280+</strong> Waitakere properties heated
              </div>
              <div style={styles.stat}>
                <strong>Family</strong> home specialists
              </div>
              <div style={styles.stat}>
                <strong>Value</strong> for money solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Waitakere Quote
            </button>
          </div>
        </section>

        {/* Waitākere Specific Content */}
        <section style={styles.section}>
          <h2>Why Waitākere Homeowners Choose Heat NZ for Underfloor Heating & Under Floor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Family Home Expertise</h3>
              <p>We specialize in installing underfloor heating in Waitakere's family homes, understanding the needs of growing families and multi-generational households in the region.</p>
            </div>
            <div style={styles.feature}>
              <h3>Established Community Focus</h3>
              <p>Our team knows Waitakere's established communities, from Henderson's diverse housing to New Lynn's family homes and Glen Eden's residential areas.</p>
            </div>
            <div style={styles.feature}>
              <h3>Value for Money Solutions</h3>
              <p>We provide excellent value heating solutions for Waitakere, offering competitive pricing without compromising on quality or service standards.</p>
            </div>
            <div style={styles.feature}>
              <h3>Reliable Local Service</h3>
              <p>We're committed to serving Waitakere communities with dependable service, fast response times, and ongoing maintenance support.</p>
            </div>
          </div>
        </section>

        {/* Waitākere Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating & Under Floor Heating Services Throughout Waitākere</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all Waitākere areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Henderson</h3>
              <p>Family homes, modern developments, commercial properties, and rental properties with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>New Lynn</h3>
              <p>Diverse housing mix, apartments, residential properties, and family homes with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Glen Eden</h3>
              <p>Character homes, family properties, residential developments, and rental properties with reliable heating</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Avondale</h3>
              <p>Family homes, rental properties, residential buildings, and commercial properties with cost-effective heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Te Atatū Peninsula</h3>
              <p>Modern homes, waterfront properties, family residences, and premium properties with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Massey</h3>
              <p>New developments, family homes, residential properties, and rental accommodations with contemporary heating solutions</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating & Under Floor Heating Waitākere</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Waitākere?</h3>
              <p>Underfloor heating and under floor heating costs in Waitākere typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. Waitākere offers competitive pricing with excellent value for money throughout Henderson, New Lynn, Glen Eden, and all Waitākere suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you service underfloor heating systems in Waitākere?</h3>
              <p>Yes, we provide comprehensive maintenance and repair services for underfloor heating and under floor heating systems throughout Waitākere, including Henderson, New Lynn, Glen Eden, Avondale, Te Atatū, Massey, and all surrounding suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What's the best heating system for Waitākere family homes?</h3>
              <p>For Waitākere family homes, we typically recommend hydronic systems for whole-house heating or electric systems for specific rooms like bathrooms and kitchens. The choice depends on your home's size, insulation, and family heating needs throughout all Waitākere areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install under floor heating in Henderson?</h3>
              <p>Yes, we specialize in underfloor heating and under floor heating installation in Henderson, Waitākere. We serve all Henderson areas including Henderson Valley, providing expert installation for family homes, modern developments, and commercial properties.</p>
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
          <h2>Ready to Warm Your Waitākere Home?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating and under floor heating in Waitākere. Our specialists understand family home requirements and local community needs throughout Henderson, New Lynn, and all Waitākere suburbs.</p>
          <button style={styles.ctaButton}>
            Get Free Waitakere Consultation
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

export default UnderfloorHeatingWaitakerePage;
