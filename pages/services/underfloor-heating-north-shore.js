import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingNorthShorePage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in North Shore",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "North Shore",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": [
      {
        "@type": "Place",
        "name": "North Shore, Auckland"
      },
      {
        "@type": "Place",
        "name": "Takapuna"
      },
      {
        "@type": "Place",
        "name": "Devonport"
      },
      {
        "@type": "Place",
        "name": "Browns Bay"
      },
      {
        "@type": "Place",
        "name": "Albany"
      },
      {
        "@type": "Place",
        "name": "Milford"
      },
      {
        "@type": "Place",
        "name": "Glenfield"
      }
    ],
    "serviceType": "Underfloor heating installation, under floor heating installation, installation",
    "description": "Professional underfloor heating and under floor heating installation and service on the North Shore, including Takapuna, Devonport, Browns Bay, Albany, Milford, Glenfield, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost on the North Shore?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in North Shore coastal properties?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in North Shore coastal properties, understanding the unique requirements of waterfront homes and managing salt air considerations."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating North Shore | Under Floor Heating Takapuna, Devonport | Heat NZ"
        description="Professional underfloor heating & under floor heating on Auckland's North Shore. Takapuna, Devonport, Browns Bay, Albany, Milford, Glenfield & surrounding areas. Electric systems custom quote. Free quotes for North Shore homes."
        canonical="https://www.heat.nz/services/underfloor-heating-north-shore"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating North Shore, under floor heating North Shore, under-floor heating North Shore, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating North Shore, under tile heating Auckland, tile heating North Shore, tile heating Auckland, floor heating North Shore, floor heating Auckland, electric tile heating North Shore, electric tile heating Auckland, electric under floor North Shore, electric under floor Auckland, bathroom tile heating North Shore, bathroom tile heating Auckland, bathroom heating North Shore, bathroom heating Auckland, underfloor heating Takapuna, under floor heating Takapuna, under-floor heating Takapuna, underfloor heating Devonport, under floor heating Devonport, under-floor heating Devonport, underfloor heating Browns Bay, under floor heating Browns Bay, under-floor heating Browns Bay, underfloor heating Albany, under floor heating Albany, under-floor heating Albany, underfloor heating Milford, under floor heating Milford, under-floor heating Milford, heating installation North Shore, electric heating North Shore, electric heating North Shore, North Shore heating contractors, heating service North Shore"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating North Shore | Under Floor Heating Takapuna, Devonport & All North Shore</h1>
            <p style={styles.heroSubtitle}>
              Among North Shore's experienced underfloor heating and under floor heating specialists. We serve Takapuna, Devonport, Browns Bay, Albany, Milford, Glenfield, and all North Shore suburbs 
              with premium electric heating installations for coastal homes, luxury properties, and family residences.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>350+</strong> North Shore properties heated
              </div>
              <div style={styles.stat}>
                <strong>Coastal</strong> property specialists
              </div>
              <div style={styles.stat}>
                <strong>Premium</strong> heating solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free North Shore Quote
            </button>
          </div>
        </section>

        {/* North Shore Specific Content */}
        <section style={styles.section}>
          <h2>Why North Shore Homeowners Choose Heat NZ for Underfloor Heating & Under Floor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Coastal Property Expertise</h3>
              <p>We specialize in installing underfloor heating in North Shore coastal properties, understanding salt air considerations and waterfront home requirements.</p>
            </div>
            <div style={styles.feature}>
              <h3>Premium Suburb Knowledge</h3>
              <p>Our team knows North Shore's premium suburbs, from Takapuna's luxury homes to Devonport's character properties and Browns Bay's family residences.</p>
            </div>
            <div style={styles.feature}>
              <h3>Luxury Home Solutions</h3>
              <p>We provide premium heating solutions that complement North Shore's high-end properties with smart controls and energy-efficient systems.</p>
            </div>
            <div style={styles.feature}>
              <h3>Established Local Service</h3>
              <p>We provide electric underfloor heating across North Shore communities, providing reliable service and maintenance across all North Shore communities.</p>
            </div>
          </div>
        </section>

        {/* North Shore Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating & Under Floor Heating Services Throughout the North Shore</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all North Shore areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Takapuna</h3>
              <p>Premium underfloor heating and under floor heating in Takapuna. Luxury homes, premium apartments, and commercial properties with high-end heating solutions. Takapuna specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Devonport</h3>
              <p>Heritage underfloor heating and under floor heating for Devonport properties. Heritage homes, character properties, and waterfront residences with period-appropriate heating. Devonport experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Browns Bay</h3>
              <p>Reliable underfloor heating and under floor heating in Browns Bay. Family homes, coastal properties, and residential developments with reliable heating systems. Browns Bay specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Albany</h3>
              <p>Modern underfloor heating and under floor heating for Albany properties. Modern homes, new developments, and commercial properties with contemporary heating solutions. Albany experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Milford</h3>
              <p>Luxury underfloor heating and under floor heating in Milford. Premium homes, waterfront properties, and luxury residences with sophisticated heating systems. Milford specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Glenfield</h3>
              <p>Affordable underfloor heating and under floor heating for Glenfield homes. Family homes, rental properties, and residential developments with cost-effective heating solutions. Glenfield experts.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating & Under Floor Heating North Shore</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost on the North Shore?</h3>
              <p>Contact us for a free custom quote based on your specific floor plan and project requirements.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install under floor heating in Takapuna?</h3>
              <p>Yes, we provide premium underfloor heating and under floor heating installation in Takapuna for luxury homes, premium apartments, and commercial properties. Our team understands Takapuna's high-end property requirements and provides tailored solutions.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you install underfloor heating in Devonport heritage homes?</h3>
              <p>Absolutely! We specialize in installing underfloor heating and under floor heating in Devonport's heritage homes and character properties, providing period-appropriate solutions that respect the property's historic value while adding modern comfort.</p>
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
            <a href="/services/underfloor-heating-west-auckland" style={styles.relatedLink}>
              Underfloor Heating West Auckland
            </a>
            <a href="/services/underfloor-heating-remuera" style={styles.relatedLink}>
              Underfloor Heating Remuera
            </a>
            <a href="/services/underfloor-heating" style={styles.relatedLink}>
              All Auckland Heating Services
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your North Shore Property?</h2>
          <p>Get your free consultation and quote for premium underfloor heating on the North Shore. Our specialists understand coastal properties and luxury home requirements.</p>
          <button style={styles.ctaButton}>
            Get Free North Shore Consultation
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

export default UnderfloorHeatingNorthShorePage;
