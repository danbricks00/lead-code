import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingWestAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in West Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "West Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": [
      {
        "@type": "Place",
        "name": "West Auckland"
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
        "name": "Te Atatū"
      },
      {
        "@type": "Place",
        "name": "Massey"
      },
      {
        "@type": "Place",
        "name": "Avondale"
      }
    ],
    "serviceType": "Underfloor heating installation, under floor heating installation, maintenance & repair",
    "description": "Professional underfloor heating and under floor heating installation and service in West Auckland, including Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in West Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in West Auckland typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. Costs are competitive due to good access and established residential areas."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in West Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for underfloor heating systems throughout West Auckland, including Henderson, New Lynn, and surrounding suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating West Auckland | Under Floor Heating Henderson, New Lynn | Heat NZ"
        description="Professional underfloor heating & under floor heating in West Auckland. Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale & all West Auckland suburbs. Electric & hydronic systems from $80/m². Free quotes for West Auckland homes."
        canonical="https://www.heat.nz/services/underfloor-heating-west-auckland"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating West Auckland, under floor heating West Auckland, under-floor heating West Auckland, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating West Auckland, under tile heating Auckland, tile heating West Auckland, tile heating Auckland, floor heating West Auckland, floor heating Auckland, electric tile heating West Auckland, electric tile heating Auckland, electric under floor West Auckland, electric under floor Auckland, bathroom tile heating West Auckland, bathroom tile heating Auckland, bathroom heating West Auckland, bathroom heating Auckland, underfloor heating Henderson, under floor heating Henderson, under-floor heating Henderson, underfloor heating New Lynn, under floor heating New Lynn, under-floor heating New Lynn, underfloor heating Glen Eden, under floor heating Glen Eden, under-floor heating Glen Eden, underfloor heating Te Atatū, under floor heating Te Atatū, under-floor heating Te Atatū, underfloor heating Massey, under floor heating Massey, under-floor heating Massey, underfloor heating Avondale, under floor heating Avondale, under-floor heating Avondale, heating installation West Auckland, electric heating West Auckland, hydronic heating West Auckland, West Auckland heating contractors, heating service West Auckland"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating West Auckland — Under Floor Heating Henderson, New Lynn & All West Auckland</h1>
            <p style={styles.heroSubtitle}>
              West Auckland's trusted underfloor heating and under floor heating specialists. We serve Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale, and all western suburbs 
              with reliable electric and hydronic heating installations for family homes and commercial properties. Expert installation throughout West Auckland.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>250+</strong> West Auckland homes heated
              </div>
              <div style={styles.stat}>
                <strong>Family</strong> home specialists
              </div>
              <div style={styles.stat}>
                <strong>Reliable</strong> local service
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free West Auckland Quote
            </button>
          </div>
        </section>

        {/* West Auckland Specific Content */}
        <section style={styles.section}>
          <h2>Why West Auckland Homeowners Choose Heat NZ for Underfloor Heating & Under Floor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Family Home Expertise</h3>
              <p>We specialize in installing underfloor heating and under floor heating in West Auckland's family homes, understanding the needs of growing families and multi-generational households throughout Henderson, New Lynn, and all West Auckland suburbs.</p>
            </div>
            <div style={styles.feature}>
              <h3>Established Suburb Knowledge</h3>
              <p>Our team knows West Auckland's established residential areas, from Henderson's family homes to New Lynn's diverse housing mix, Glen Eden's character properties, Te Atatū's waterfront homes, Massey's new developments, and Avondale's residential areas.</p>
            </div>
            <div style={styles.feature}>
              <h3>Reliable Local Service</h3>
              <p>We provide dependable underfloor heating service throughout West Auckland, with local knowledge and fast response times for maintenance and repairs in Henderson, New Lynn, Glen Eden, and all surrounding suburbs.</p>
            </div>
            <div style={styles.feature}>
              <h3>Competitive Pricing</h3>
              <p>West Auckland's good access and established areas allow us to provide competitive pricing for underfloor heating and under floor heating installations without compromising on quality.</p>
            </div>
          </div>
        </section>

        {/* West Auckland Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating & Under Floor Heating Services Throughout West Auckland</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all West Auckland areas, including Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale, and surrounding suburbs:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Henderson</h3>
              <p>Professional underfloor heating and under floor heating installation in Henderson. Family homes, modern developments, and commercial properties with comprehensive heating solutions. Expert service for all Henderson properties.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating New Lynn</h3>
              <p>Reliable underfloor heating and under floor heating for New Lynn homes. Diverse housing mix, apartments, and residential properties with efficient heating systems. Serving all New Lynn areas.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Glen Eden</h3>
              <p>Quality underfloor heating and under floor heating in Glen Eden. Character homes, family properties, and residential developments with reliable heating. Local Glen Eden specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Avondale</h3>
              <p>Affordable underfloor heating and under floor heating for Avondale properties. Family homes, rental properties, and residential buildings with cost-effective heating solutions. Expert Avondale service.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Te Atatū</h3>
              <p>Premium underfloor heating and under floor heating in Te Atatū. Modern homes, waterfront properties, and family residences with premium heating systems. Te Atatū heating specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Massey</h3>
              <p>Modern underfloor heating and under floor heating for Massey homes. New developments, family homes, and residential properties with contemporary heating solutions. Serving all Massey areas.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Waitakere</h3>
              <p>Comprehensive underfloor heating and under floor heating services in Waitakere. Residential and commercial properties with reliable heating solutions. Expert Waitakere installation.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Swanson</h3>
              <p>Professional underfloor heating and under floor heating for Swanson properties. Rural and residential homes with efficient heating systems. Local Swanson expertise.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Ranui</h3>
              <p>Quality underfloor heating and under floor heating in Ranui. Family homes and residential properties with cost-effective heating solutions. Ranui heating specialists.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating & Under Floor Heating West Auckland</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in West Auckland?</h3>
              <p>Underfloor heating and under floor heating costs in West Auckland typically range from $80-$150 per square meter for electric systems and $115-$185 per square meter for hydronic systems, including installation. Costs are competitive due to good access and established residential areas in Henderson, New Lynn, Glen Eden, and all West Auckland suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you service underfloor heating systems in West Auckland?</h3>
              <p>Yes, we provide comprehensive maintenance and repair services for underfloor heating and under floor heating systems throughout West Auckland, including Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale, and all surrounding suburbs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What's the best heating system for West Auckland family homes?</h3>
              <p>For West Auckland family homes in Henderson, New Lynn, Glen Eden, and other suburbs, we typically recommend hydronic systems for whole-house heating or electric systems for specific rooms. The choice depends on your home's size, insulation, and family heating needs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in Henderson?</h3>
              <p>Yes, we specialize in underfloor heating and under floor heating installation in Henderson. We serve all Henderson areas including Henderson Valley, providing expert installation for family homes, modern developments, and commercial properties.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you install under floor heating in New Lynn?</h3>
              <p>Absolutely! We provide professional underfloor heating and under floor heating installation in New Lynn for apartments, diverse housing, and residential properties. Our team understands New Lynn's unique housing mix and provides tailored solutions.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What areas of West Auckland do you cover?</h3>
              <p>We provide underfloor heating and under floor heating services throughout all of West Auckland, including Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale, Waitakere, Swanson, Ranui, and all surrounding suburbs.</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2>Related Auckland Heating Services</h2>
          <p>Explore our other Auckland heating services:</p>
          <div style={styles.relatedLinks}>
            <a href="/services/underfloor-heating-central-auckland" style={styles.relatedLink}>
              Underfloor Heating Central Auckland
            </a>
            <a href="/services/underfloor-heating-north-shore" style={styles.relatedLink}>
              Underfloor Heating North Shore
            </a>
            <a href="/services/underfloor-heating-east-auckland" style={styles.relatedLink}>
              Underfloor Heating East Auckland
            </a>
            <a href="/services/underfloor-heating" style={styles.relatedLink}>
              All Auckland Heating Services
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your West Auckland Home?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating and under floor heating in West Auckland. Our specialists understand family home requirements and local conditions in Henderson, New Lynn, Glen Eden, and all West Auckland suburbs.</p>
          <button style={styles.ctaButton}>
            Get Free West Auckland Consultation
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

export default UnderfloorHeatingWestAucklandPage;
