import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingSouthAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in South Auckland",
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
    "areaServed": [
      {
        "@type": "Place",
        "name": "South Auckland"
      },
      {
        "@type": "Place",
        "name": "Manukau"
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
        "name": "Papakura"
      }
    ],
    "serviceType": "Underfloor heating installation, under floor heating installation, installation",
    "description": "Professional underfloor heating and under floor heating installation and service in South Auckland, including Manukau, Papatoetoe, Otahuhu, Mangere, Manurewa, Papakura, and surrounding areas."
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
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in South Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive installation services for underfloor heating systems throughout South Auckland, including Manukau, Papatoetoe, Otahuhu, and surrounding areas."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating South Auckland | Under Floor Heating Manukau, Papatoetoe | Heat NZ"
        description="Professional underfloor heating & under floor heating in South Auckland. Manukau, Papatoetoe, Otahuhu, Mangere, Manurewa, Papakura & surrounding areas. Electric systems custom quote. Free quotes for South Auckland homes."
        canonical="https://www.heat.nz/services/underfloor-heating-south-auckland"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating South Auckland, under floor heating South Auckland, under-floor heating South Auckland, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating South Auckland, under tile heating Auckland, tile heating South Auckland, tile heating Auckland, floor heating South Auckland, floor heating Auckland, electric tile heating South Auckland, electric tile heating Auckland, electric under floor South Auckland, electric under floor Auckland, bathroom tile heating South Auckland, bathroom tile heating Auckland, bathroom heating South Auckland, bathroom heating Auckland, underfloor heating Manukau, under floor heating Manukau, under-floor heating Manukau, underfloor heating Papatoetoe, under floor heating Papatoetoe, under-floor heating Papatoetoe, underfloor heating Otahuhu, under floor heating Otahuhu, under-floor heating Otahuhu, underfloor heating Mangere, under floor heating Mangere, under-floor heating Mangere, underfloor heating Manurewa, under floor heating Manurewa, under-floor heating Manurewa, underfloor heating Papakura, under floor heating Papakura, under-floor heating Papakura, heating installation South Auckland, electric heating South Auckland, electric heating South Auckland, South Auckland heating contractors, heating service South Auckland"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating South Auckland | Under Floor Heating Manukau, Papatoetoe & All South Auckland</h1>
            <p style={styles.heroSubtitle}>
              Among South Auckland's experienced underfloor heating and under floor heating specialists. We serve Manukau, Papatoetoe, Otahuhu, Mangere, Manurewa, Papakura, and all southern suburbs 
              with affordable electric heating installations for homes, rental properties, and commercial buildings.
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
          <h2>Why South Auckland Homeowners Choose Heat NZ for Underfloor Heating & Under Floor Heating</h2>
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
          <h2>Underfloor Heating & Under Floor Heating Services Throughout South Auckland</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all South Auckland areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Manukau</h3>
              <p>Professional underfloor heating and under floor heating in Manukau. City center properties, commercial buildings, and residential developments with comprehensive heating solutions. Expert Manukau service.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Papatoetoe</h3>
              <p>Reliable underfloor heating and under floor heating for Papatoetoe properties. Family homes, rental properties, and residential buildings with reliable heating systems. Local Papatoetoe specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Otahuhu</h3>
              <p>Quality underfloor heating and under floor heating in Otahuhu. Character homes, modern developments, and commercial properties with efficient heating solutions. Otahuhu heating experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Mangere</h3>
              <p>Affordable underfloor heating and under floor heating for Mangere homes. Family homes, rental properties, and residential developments with cost-effective heating systems. Mangere specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Papakura</h3>
              <p>Professional underfloor heating and under floor heating in Papakura. Rural properties, family homes, and residential developments with reliable heating solutions. Papakura heating experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Manurewa</h3>
              <p>Cost-effective underfloor heating and under floor heating for Manurewa properties. Family homes, rental properties, and residential buildings with affordable heating solutions. Manurewa specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Takanini</h3>
              <p>Modern underfloor heating and under floor heating for Takanini homes. New developments, family homes, and residential properties with contemporary heating solutions. Takanini experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Wiri</h3>
              <p>Commercial and residential underfloor heating and under floor heating in Wiri. Industrial properties, family homes, and commercial buildings with efficient heating systems. Wiri specialists.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating & Under Floor Heating South Auckland</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in South Auckland?</h3>
              <p>Contact us for a free custom quote based on your specific floor plan and project requirements.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in Manukau?</h3>
              <p>Yes, we specialize in underfloor heating and under floor heating installation in Manukau, including Manukau City center, commercial buildings, and residential developments. We provide expert service throughout all Manukau areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you install under floor heating in Papatoetoe?</h3>
              <p>Absolutely! We provide professional underfloor heating and under floor heating installation in Papatoetoe for family homes, rental properties, and residential buildings. Our team understands Papatoetoe's unique housing requirements.</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2>Related Auckland Heating Services</h2>
          <p>Explore our other Auckland heating services:</p>
          <div style={styles.relatedLinks}>
            <a href="/services/underfloor-heating-manukau" style={styles.relatedLink}>
              Underfloor Heating Manukau
            </a>
            <a href="/services/underfloor-heating-central-auckland" style={styles.relatedLink}>
              Underfloor Heating Central Auckland
            </a>
            <a href="/services/underfloor-heating-west-auckland" style={styles.relatedLink}>
              Underfloor Heating West Auckland
            </a>
            <a href="/services/underfloor-heating" style={styles.relatedLink}>
              All Auckland Heating Services
            </a>
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

export default UnderfloorHeatingSouthAucklandPage;
