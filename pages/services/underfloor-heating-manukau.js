import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingManukauPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in Manukau",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Manukau",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": [
      {
        "@type": "Place",
        "name": "Manukau, Auckland"
      },
      {
        "@type": "Place",
        "name": "Papatoetoe"
      },
      {
        "@type": "Place",
        "name": "Otahuhu"
      },
      {
        "@type": "Place",
        "name": "Mangere"
      },
      {
        "@type": "Place",
        "name": "Manurewa"
      },
      {
        "@type": "Place",
        "name": "Flat Bush"
      }
    ],
    "serviceType": "Underfloor heating installation, under floor heating installation, maintenance & repair",
    "description": "Professional underfloor heating and under floor heating installation and service in Manukau, including Manukau City, Papatoetoe, Otahuhu, Mangere, Manurewa, Flat Bush, and surrounding areas."
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
        title="Underfloor Heating Manukau | Under Floor Heating Papatoetoe, Otahuhu, Mangere | Heat NZ"
        description="Professional underfloor heating & under floor heating in Manukau, Auckland. Manukau City, Papatoetoe, Otahuhu, Mangere, Manurewa, Flat Bush & surrounding areas. Electric & hydronic systems from $75/m². Free quotes for Manukau homes."
        canonical="https://www.heat.nz/services/underfloor-heating-manukau"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Manukau, under floor heating Manukau, under-floor heating Manukau, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating Manukau, under tile heating Auckland, tile heating Manukau, tile heating Auckland, floor heating Manukau, floor heating Auckland, electric tile heating Manukau, electric tile heating Auckland, electric under floor Manukau, electric under floor Auckland, bathroom tile heating Manukau, bathroom tile heating Auckland, bathroom heating Manukau, bathroom heating Auckland, underfloor heating Papatoetoe, under floor heating Papatoetoe, under-floor heating Papatoetoe, underfloor heating Otahuhu, under floor heating Otahuhu, under-floor heating Otahuhu, underfloor heating Mangere, under floor heating Mangere, under-floor heating Mangere, underfloor heating Manurewa, under floor heating Manurewa, under-floor heating Manurewa, underfloor heating Flat Bush, under floor heating Flat Bush, under-floor heating Flat Bush, heating installation Manukau, electric heating Manukau, hydronic heating Manukau, Manukau heating contractors, heating service Manukau"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Manukau | Under Floor Heating Papatoetoe, Otahuhu & All Manukau</h1>
            <p style={styles.heroSubtitle}>
              Manukau's trusted underfloor heating and under floor heating specialists. We serve Manukau City, Papatoetoe, Otahuhu, Mangere, Manurewa, Flat Bush, and all Manukau suburbs 
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
          <h2>Why Manukau Homeowners Choose Heat NZ for Underfloor Heating & Under Floor Heating</h2>
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
          <h2>Underfloor Heating & Under Floor Heating Services Throughout Manukau</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all Manukau areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Manukau City</h3>
              <p>Professional underfloor heating and under floor heating in Manukau City center. City center properties, commercial buildings, office spaces, and residential developments with comprehensive heating solutions. Manukau City specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Papatoetoe</h3>
              <p>Reliable underfloor heating and under floor heating for Papatoetoe properties. Family homes, rental properties, residential buildings, and commercial properties with reliable heating systems. Papatoetoe experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Otahuhu</h3>
              <p>Quality underfloor heating and under floor heating in Otahuhu. Character homes, modern developments, residential properties, and commercial buildings with efficient heating solutions. Otahuhu specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Mangere</h3>
              <p>Affordable underfloor heating and under floor heating for Mangere homes. Family homes, rental properties, residential developments, and community buildings with cost-effective heating systems. Mangere experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Manurewa</h3>
              <p>Cost-effective underfloor heating and under floor heating for Manurewa properties. Family homes, rental properties, residential buildings, and community facilities with affordable heating solutions. Manurewa specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Flat Bush</h3>
              <p>Modern underfloor heating and under floor heating for Flat Bush properties. New developments, modern homes, residential properties, and commercial buildings with contemporary heating solutions. Flat Bush experts.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating & Under Floor Heating Manukau</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Manukau?</h3>
              <p>Underfloor heating and under floor heating costs in Manukau typically range from $75-$145 per square meter for electric systems and $110-$175 per square meter for hydronic systems, including installation. Manukau offers excellent value with competitive pricing throughout Manukau City, Papatoetoe, Otahuhu, and all Manukau areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you service underfloor heating systems in Manukau?</h3>
              <p>Yes, we provide comprehensive maintenance and repair services for underfloor heating and under floor heating systems throughout Manukau, including Manukau City, Papatoetoe, Otahuhu, Mangere, Manurewa, Flat Bush, and all surrounding suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Are your heating solutions suitable for Manukau rental properties?</h3>
              <p>Absolutely! We provide heating solutions suitable for Manukau's rental market, including cost-effective electric systems and durable installations that appeal to both landlords and tenants throughout all Manukau suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install under floor heating in Papatoetoe?</h3>
              <p>Yes, we specialize in underfloor heating and under floor heating installation in Papatoetoe for family homes, rental properties, and residential buildings. Our team understands Papatoetoe's unique housing requirements and provides tailored solutions.</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2>Related Auckland Heating Services</h2>
          <p>Explore our other Auckland heating services:</p>
          <div style={styles.relatedLinks}>
            <a href="/services/underfloor-heating-south-auckland" style={styles.relatedLink}>
              Underfloor Heating South Auckland
            </a>
            <a href="/services/underfloor-heating-central-auckland" style={styles.relatedLink}>
              Underfloor Heating Central Auckland
            </a>
            <a href="/services/underfloor-heating" style={styles.relatedLink}>
              All Auckland Heating Services
            </a>
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

export default UnderfloorHeatingManukauPage;
