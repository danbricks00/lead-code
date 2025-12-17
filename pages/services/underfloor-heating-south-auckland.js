import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingSouthAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in South Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "South Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "South Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service in South Auckland, including Manukau, Papatoetoe, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in South Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in South Auckland typically range from $75-$145 per square meter for electric systems and $110-$175 per square meter for hydronic systems, including installation. South Auckland offers competitive pricing with excellent value for money."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in South Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout South Auckland, including Manukau, Papatoetoe, Otahuhu, and surrounding areas."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating South Auckland — Manukau & Papatoetoe Installation | Heat NZ"
        description="Professional underfloor heating installation in South Auckland. Manukau, Papatoetoe, Otahuhu & surrounding areas. Electric & hydronic systems from $75/m². Free quotes for South Auckland homes."
        canonical="https://www.heat.nz/services/underfloor-heating-south-auckland"
        keywords="underfloor heating South Auckland, heating installation South Auckland, electric heating South Auckland, hydronic heating South Auckland, Manukau heating, Papatoetoe heating, Otahuhu heating, South Auckland heating contractors, heating service South Auckland"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating South Auckland — Manukau & Papatoetoe Specialists</h1>
            <p style={styles.heroSubtitle}>
              South Auckland's trusted underfloor heating specialists. We serve Manukau, Papatoetoe, Otahuhu, and all southern suburbs 
              with affordable electric and hydronic heating installations for homes, rental properties, and commercial buildings.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>300+</strong> South Auckland properties heated
              </div>
              <div style={styles.stat}>
                <strong>Affordable</strong> heating solutions
              </div>
              <div style={styles.stat}>
                <strong>Reliable</strong> local service
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free South Auckland Quote
            </button>
          </div>
        </section>

        {/* South Auckland Specific Content */}
        <section style={styles.section}>
          <h2>Why South Auckland Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Affordable Solutions</h3>
              <p>We provide cost-effective underfloor heating solutions for South Auckland, offering excellent value for money without compromising on quality or service.</p>
            </div>
            <div style={styles.feature}>
              <h3>Diverse Property Expertise</h3>
              <p>Our team understands South Auckland's diverse housing mix, from family homes to rental properties and commercial buildings, providing appropriate heating solutions for each.</p>
            </div>
            <div style={styles.feature}>
              <h3>Local Community Focus</h3>
              <p>We're committed to serving South Auckland communities, providing reliable service and building long-term relationships with local homeowners and businesses.</p>
            </div>
            <div style={styles.feature}>
              <h3>Competitive Pricing</h3>
              <p>South Auckland offers competitive pricing for underfloor heating installations, making quality heating solutions accessible to all property types and budgets.</p>
            </div>
          </div>
        </section>

        {/* South Auckland Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout South Auckland</h2>
          <p>We provide comprehensive underfloor heating services across all South Auckland areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Manukau</h3>
              <p>City center properties, commercial buildings, and residential developments with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papatoetoe</h3>
              <p>Family homes, rental properties, and residential buildings with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Otahuhu</h3>
              <p>Character homes, modern developments, and commercial properties with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Mangere</h3>
              <p>Family homes, rental properties, and residential developments with cost-effective heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papakura</h3>
              <p>Rural properties, family homes, and residential developments with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Manurewa</h3>
              <p>Family homes, rental properties, and residential buildings with affordable heating solutions</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating South Auckland</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in South Auckland?</h3>
              <p>Underfloor heating costs in South Auckland typically range from $75-$145 per square meter for electric systems and $110-$175 per square meter for hydronic systems, including installation. South Auckland offers competitive pricing with excellent value for money.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you service underfloor heating systems in South Auckland?</h3>
              <p>Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout South Auckland, including Manukau, Papatoetoe, Otahuhu, and surrounding areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Are your heating solutions suitable for South Auckland rental properties?</h3>
              <p>Absolutely! We provide heating solutions suitable for South Auckland's rental market, including cost-effective electric systems and durable installations that appeal to both landlords and tenants.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your South Auckland Property?</h2>
          <p>Get your free consultation and quote for affordable underfloor heating in South Auckland. Our specialists understand local property types and budget requirements.</p>
          <button style={styles.ctaButton}>
            Get Free South Auckland Consultation
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

export default UnderfloorHeatingSouthAucklandPage;
