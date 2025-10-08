import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingManukauPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Manukau",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Manukau",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Manukau, Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service in Manukau, including Papatoetoe, Otahuhu, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Manukau?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in Manukau typically range from $75-$145 per square meter for electric systems and $110-$175 per square meter for hydronic systems, including installation. Manukau offers excellent value with competitive pricing."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in Manukau?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout Manukau, including Papatoetoe, Otahuhu, Mangere, and all surrounding suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Manukau — Papatoetoe & Otahuhu Installation | Heat NZ"
        description="Professional underfloor heating installation in Manukau, Auckland. Papatoetoe, Otahuhu, Mangere & surrounding areas. Electric & hydronic systems from $75/m². Free quotes for Manukau homes."
        canonical="https://heat.nz/services/underfloor-heating-manukau"
        keywords="underfloor heating Manukau, heating installation Manukau, electric heating Manukau, hydronic heating Manukau, Papatoetoe heating, Otahuhu heating, Mangere heating, Manukau heating contractors, heating service Manukau"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Manukau — Papatoetoe & Otahuhu Specialists</h1>
            <p style={styles.heroSubtitle}>
              Manukau's trusted underfloor heating specialists. We serve Papatoetoe, Otahuhu, Mangere, and all Manukau suburbs 
              with affordable electric and hydronic heating installations for homes, rental properties, and commercial buildings.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>320+</strong> Manukau properties heated
              </div>
              <div style={styles.stat}>
                <strong>Affordable</strong> heating solutions
              </div>
              <div style={styles.stat}>
                <strong>Reliable</strong> local service
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Manukau Quote
            </button>
          </div>
        </section>

        {/* Manukau Specific Content */}
        <section style={styles.section}>
          <h2>Why Manukau Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Affordable Solutions</h3>
              <p>We provide cost-effective underfloor heating solutions for Manukau, offering excellent value for money without compromising on quality or service standards.</p>
            </div>
            <div style={styles.feature}>
              <h3>Diverse Community Focus</h3>
              <p>Our team understands Manukau's diverse communities, from Papatoetoe's family homes to Otahuhu's residential areas and Mangere's growing suburbs.</p>
            </div>
            <div style={styles.feature}>
              <h3>Rental Property Expertise</h3>
              <p>We specialize in heating solutions suitable for Manukau's rental market, providing durable installations that appeal to both landlords and tenants.</p>
            </div>
            <div style={styles.feature}>
              <h3>Commercial Building Service</h3>
              <p>We serve Manukau's commercial sector, providing heating solutions for office buildings, retail spaces, and industrial properties.</p>
            </div>
          </div>
        </section>

        {/* Manukau Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Manukau</h2>
          <p>We provide comprehensive underfloor heating services across all Manukau areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Manukau City</h3>
              <p>City center properties, commercial buildings, office spaces, and residential developments with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papatoetoe</h3>
              <p>Family homes, rental properties, residential buildings, and commercial properties with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Otahuhu</h3>
              <p>Character homes, modern developments, residential properties, and commercial buildings with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Mangere</h3>
              <p>Family homes, rental properties, residential developments, and community buildings with cost-effective heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Manurewa</h3>
              <p>Family homes, rental properties, residential buildings, and community facilities with affordable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Flat Bush</h3>
              <p>New developments, modern homes, residential properties, and commercial buildings with contemporary heating solutions</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Manukau</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Manukau?</h3>
              <p>Underfloor heating costs in Manukau typically range from $75-$145 per square meter for electric systems and $110-$175 per square meter for hydronic systems, including installation. Manukau offers excellent value with competitive pricing.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you service underfloor heating systems in Manukau?</h3>
              <p>Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout Manukau, including Papatoetoe, Otahuhu, Mangere, and all surrounding suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Are your heating solutions suitable for Manukau rental properties?</h3>
              <p>Absolutely! We provide heating solutions suitable for Manukau's rental market, including cost-effective electric systems and durable installations that appeal to both landlords and tenants.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your Manukau Property?</h2>
          <p>Get your free consultation and quote for affordable underfloor heating in Manukau. Our specialists understand local property types and budget requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Manukau Consultation
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

export default UnderfloorHeatingManukauPage;
