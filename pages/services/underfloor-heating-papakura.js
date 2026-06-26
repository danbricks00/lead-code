import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingPapakuraPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation in Papakura",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Papakura",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Papakura, Auckland"
    },
    "serviceType": "Underfloor heating installation, installation",
    "description": "Professional underfloor heating installation and service in Papakura, including rural properties and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Papakura?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in Papakura?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive installation services for underfloor heating systems throughout Papakura, including rural properties and surrounding areas."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Papakura — Rural Properties Installation | Heat NZ"
        description="Professional underfloor heating installation in Papakura, Auckland. Rural properties & surrounding areas. Electric systems custom quote. Free quotes for Papakura homes."
        canonical="https://heat.nz/services/underfloor-heating-papakura"
        keywords="underfloor heating Papakura, heating installation Papakura, electric heating Papakura, electric heating Papakura, rural heating Papakura, Papakura heating contractors, heating service Papakura"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Papakura — Rural Properties Specialists</h1>
            <p style={styles.heroSubtitle}>
              Among Papakura's experienced underfloor heating specialists. We serve Papakura and surrounding rural areas 
              with reliable electric heating installations for rural properties, lifestyle blocks, and country homes.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>100+</strong> Papakura properties heated
              </div>
              <div style={styles.stat}>
                <strong>Rural</strong> property specialists
              </div>
              <div style={styles.stat}>
                <strong>Affordable</strong> heating solutions
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Papakura Quote
            </button>
          </div>
        </section>

        {/* Papakura Specific Content */}
        <section style={styles.section}>
          <h2>Why Papakura Homeowners Choose Heat NZ for Underfloor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>Rural Property Expertise</h3>
              <p>We specialize in installing underfloor heating in Papakura's rural properties and lifestyle blocks, understanding the unique requirements of country living.</p>
            </div>
            <div style={styles.feature}>
              <h3>Affordable Solutions</h3>
              <p>We provide cost-effective heating solutions for Papakura, offering excellent value for money without compromising on quality or service standards.</p>
            </div>
            <div style={styles.feature}>
              <h3>Lifestyle Block Focus</h3>
              <p>Our team understands Papakura's lifestyle blocks and rural properties, providing appropriate heating solutions for country homes and rural buildings.</p>
            </div>
            <div style={styles.feature}>
              <h3>Reliable Local Service</h3>
              <p>We're committed to serving Papakura communities with dependable service, fast response times, and ongoing customer support for rural properties.</p>
            </div>
          </div>
        </section>

        {/* Papakura Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating Services Throughout Papakura</h2>
          <p>We provide comprehensive underfloor heating services across all Papakura areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Papakura Central</h3>
              <p>Residential homes, commercial properties, and community buildings with reliable heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papakura Rural</h3>
              <p>Rural properties, lifestyle blocks, farm buildings, and country homes with efficient heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papakura East</h3>
              <p>Family homes, residential developments, and rural properties with comprehensive heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papakura West</h3>
              <p>Rural properties, lifestyle blocks, and country residences with reliable heating systems</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papakura South</h3>
              <p>Rural properties, farm buildings, and lifestyle blocks with efficient heating solutions</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Papakura North</h3>
              <p>Residential properties, rural homes, and lifestyle blocks with comprehensive heating systems</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating Papakura</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Papakura?</h3>
              <p>Contact us for a free custom quote based on your specific floor plan and project requirements."s size, insulation, and whether you're on-grid or off-grid.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Warm Your Papakura Property?</h2>
          <p>Get your free consultation and quote for reliable underfloor heating in Papakura. Our specialists understand rural properties and lifestyle block requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Papakura Consultation
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

export default UnderfloorHeatingPapakuraPage;
