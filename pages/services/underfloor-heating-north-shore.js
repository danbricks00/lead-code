import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingNorthShorePage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in North Shore",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "North Shore",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "North Shore, Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Professional underfloor heating installation and service on the North Shore, including Takapuna, Devonport, and surrounding areas."
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
          "text": "Underfloor heating costs on the North Shore typically range from $90-$170 per square meter for electric systems and $125-$200 per square meter for hydronic systems, including installation. Premium locations like Takapuna and Devonport may have slightly higher costs."
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
        title="Underfloor Heating North Shore — Takapuna & Devonport Installation | Heat NZ"
        description="Professional underfloor heating installation on Auckland's North Shore. Takapuna, Devonport, Browns Bay & surrounding areas. Electric & hydronic systems from $90/m². Free quotes for North Shore homes."
        canonical="https://heat.nz/services/underfloor-heating-north-shore"
        keywords="underfloor heating North Shore, heating installation North Shore, electric heating North Shore, hydronic heating North Shore, Takapuna heating, Devonport heating, Browns Bay heating, North Shore heating contractors, heating service North Shore"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating North Shore — Takapuna & Devonport Specialists</h1>
            <p style={styles.heroSubtitle}>
              North Shore's premier underfloor heating specialists. We serve Takapuna, Devonport, Browns Bay, and all North Shore suburbs 
              with premium electric and hydronic heating installations for coastal homes, luxury properties, and family residences.
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
          <h2>Why North Shore Homeowners Choose Heat NZ for Underfloor Heating</h2>
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
              <p>We're the established North Shore heating specialists, providing reliable service and maintenance across all North Shore communities.</p>
            </div>
          </div>
        </section>

        {/* North Shore Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout the North Shore</h2>
          <p>We provide comprehensive underfloor heating services across all North Shore areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Takapuna</h3>
              <p>Luxury homes, premium apartments, and commercial properties with high-end heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Devonport</h3>
              <p>Heritage homes, character properties, and waterfront residences with period-appropriate heating</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Browns Bay</h3>
              <p>Family homes, coastal properties, and residential developments with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Albany</h3>
              <p>Modern homes, new developments, and commercial properties with contemporary heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Milford</h3>
              <p>Premium homes, waterfront properties, and luxury residences with sophisticated heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Glenfield</h3>
              <p>Family homes, rental properties, and residential developments with cost-effective heating solutions</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating North Shore</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost on the North Shore?</h3>
              <p>Underfloor heating costs on the North Shore typically range from $90-$170 per square meter for electric systems and $125-$200 per square meter for hydronic systems, including installation. Premium locations like Takapuna and Devonport may have slightly higher costs.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in North Shore coastal properties?</h3>
              <p>Yes, we specialize in installing underfloor heating in North Shore coastal properties, understanding the unique requirements of waterfront homes and managing salt air considerations.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>What heating system is best for North Shore luxury homes?</h3>
              <p>For North Shore luxury homes, we typically recommend hydronic systems for whole-house heating with smart controls, or electric systems for specific areas like bathrooms and kitchens. The choice depends on your home's size and heating requirements.</p>
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
