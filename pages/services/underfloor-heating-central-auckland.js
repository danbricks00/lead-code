import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingCentralAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation in Central Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Central Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": [
      {
        "@type": "Place",
        "name": "Central Auckland"
      },
      {
        "@type": "Place",
        "name": "Auckland CBD"
      },
      {
        "@type": "Place",
        "name": "Newmarket"
      },
      {
        "@type": "Place",
        "name": "Parnell"
      },
      {
        "@type": "Place",
        "name": "Grafton"
      },
      {
        "@type": "Place",
        "name": "Mount Eden"
      },
      {
        "@type": "Place",
        "name": "Epsom"
      }
    ],
    "serviceType": "Underfloor heating installation, under floor heating installation, maintenance & repair",
    "description": "Professional underfloor heating and under floor heating installation and service in Central Auckland, including CBD, Newmarket, Parnell, Grafton, Mount Eden, Epsom, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Central Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in Central Auckland typically range from $85-$165 per square meter for electric systems and $125-$195 per square meter for hydronic systems, including installation. CBD locations may have slightly higher costs due to access requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install underfloor heating in Central Auckland apartments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in installing underfloor heating in Central Auckland apartments and high-rise buildings. We work with body corporates and understand the specific requirements for apartment installations."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Central Auckland | Under Floor Heating CBD, Newmarket, Parnell | Heat NZ"
        description="Professional underfloor heating & under floor heating in Central Auckland. CBD, Newmarket, Parnell, Grafton, Mount Eden, Epsom & surrounding areas. Electric & hydronic systems from $85/m². Free quotes for Central Auckland homes & apartments."
        canonical="https://www.heat.nz/services/underfloor-heating-central-auckland"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Central Auckland, under floor heating Central Auckland, under-floor heating Central Auckland, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, under tile heating Central Auckland, under tile heating Auckland, tile heating Central Auckland, tile heating Auckland, floor heating Central Auckland, floor heating Auckland, electric tile heating Central Auckland, electric tile heating Auckland, electric under floor Central Auckland, electric under floor Auckland, bathroom tile heating Central Auckland, bathroom tile heating Auckland, bathroom heating Central Auckland, bathroom heating Auckland, underfloor heating CBD Auckland, under floor heating CBD Auckland, under-floor heating CBD Auckland, underfloor heating Newmarket, under floor heating Newmarket, under-floor heating Newmarket, underfloor heating Parnell, under floor heating Parnell, under-floor heating Parnell, underfloor heating Grafton, under floor heating Grafton, under-floor heating Grafton, underfloor heating Mount Eden, under floor heating Mount Eden, under-floor heating Mount Eden, underfloor heating Epsom, under floor heating Epsom, under-floor heating Epsom, heating installation Central Auckland, electric heating Central Auckland, hydronic heating Central Auckland, apartment heating Auckland, inner city heating Auckland"
        structuredData={[structuredData]}
        faqData={faqData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Professional Underfloor Heating Central Auckland | Under Floor Heating CBD, Newmarket, Parnell & All Central Auckland</h1>
            <p style={styles.heroSubtitle}>
              Central Auckland's leading underfloor heating and under floor heating specialists. We serve the CBD, Newmarket, Parnell, Grafton, Mount Eden, Epsom, and all inner-city areas 
              with professional electric and hydronic heating installations for homes, apartments, and commercial properties.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>300+</strong> Central Auckland properties heated
              </div>
              <div style={styles.stat}>
                <strong>CBD</strong> apartment specialists
              </div>
              <div style={styles.stat}>
                <strong>Fast</strong> inner-city installation
              </div>
            </div>
            <button style={styles.ctaButton}>
              Get Free Central Auckland Quote
            </button>
          </div>
        </section>

        {/* Central Auckland Specific Content */}
        <section style={styles.section}>
          <h2>Why Central Auckland Homeowners Choose Heat NZ for Underfloor Heating & Under Floor Heating</h2>
          <div style={styles.features}>
            <div style={styles.feature}>
              <h3>CBD & Apartment Expertise</h3>
              <p>We specialize in installing underfloor heating in Central Auckland's apartments and high-rise buildings, working with body corporates and managing complex access requirements.</p>
            </div>
            <div style={styles.feature}>
              <h3>Inner-City Installation</h3>
              <p>Our team understands the unique challenges of Central Auckland installations, from parking restrictions to building access, ensuring smooth project completion.</p>
            </div>
            <div style={styles.feature}>
              <h3>Commercial & Residential</h3>
              <p>We serve both residential and commercial properties in Central Auckland, from luxury apartments to office buildings and retail spaces.</p>
            </div>
            <div style={styles.feature}>
              <h3>Fast City Installation</h3>
              <p>We work efficiently in Central Auckland's busy environment, minimizing disruption while maintaining the highest installation standards.</p>
            </div>
          </div>
        </section>

        {/* Central Auckland Areas */}
        <section style={styles.section}>
          <h2>Underfloor Heating & Under Floor Heating Services Throughout Central Auckland</h2>
          <p>We provide comprehensive underfloor heating and under floor heating services across all Central Auckland areas, including:</p>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Auckland CBD</h3>
              <p>Professional underfloor heating and under floor heating in Auckland CBD. High-rise apartments, luxury penthouses, and commercial properties with specialized installation techniques. CBD heating specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Newmarket</h3>
              <p>Modern underfloor heating and under floor heating for Newmarket properties. Modern apartments, retail spaces, and contemporary homes with smart heating integration. Newmarket experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Parnell</h3>
              <p>Premium underfloor heating and under floor heating in Parnell. Heritage homes, luxury apartments, and boutique properties with period-appropriate solutions. Parnell specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Grafton</h3>
              <p>Reliable underfloor heating and under floor heating for Grafton properties. Medical district properties, student accommodation, and residential buildings. Grafton heating experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Mount Eden</h3>
              <p>Quality underfloor heating and under floor heating in Mount Eden. Character homes, modern apartments, and family properties with efficient heating solutions. Mount Eden specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Epsom</h3>
              <p>Comprehensive underfloor heating and under floor heating for Epsom homes. Residential homes, apartments, and commercial properties with comprehensive heating systems. Epsom experts.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Remuera</h3>
              <p>Luxury underfloor heating and under floor heating in Remuera. Premium homes, apartments, and residential properties with high-end heating solutions. Remuera specialists.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h3>Underfloor Heating Ponsonby</h3>
              <p>Contemporary underfloor heating and under floor heating for Ponsonby properties. Modern homes, apartments, and character properties with stylish heating solutions. Ponsonby experts.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <h2>Frequently Asked Questions - Underfloor Heating & Under Floor Heating Central Auckland</h2>
          <div style={styles.faq}>
            <div style={styles.faqItem}>
              <h3>How much does underfloor heating cost in Central Auckland?</h3>
              <p>Underfloor heating and under floor heating costs in Central Auckland typically range from $85-$165 per square meter for electric systems and $125-$195 per square meter for hydronic systems, including installation. CBD locations may have slightly higher costs due to access requirements.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install underfloor heating in Central Auckland apartments?</h3>
              <p>Yes, we specialize in installing underfloor heating and under floor heating in Central Auckland apartments and high-rise buildings. We work with body corporates and understand the specific requirements for apartment installations in the CBD, Newmarket, Parnell, and all Central Auckland areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you work around Central Auckland's parking restrictions?</h3>
              <p>Absolutely! We're experienced in working within Central Auckland's parking and access restrictions. We coordinate with building management and use efficient installation techniques to minimize disruption throughout the CBD and inner-city areas.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Do you install under floor heating in Newmarket?</h3>
              <p>Yes, we provide professional underfloor heating and under floor heating installation in Newmarket for modern apartments, retail spaces, and contemporary homes. Our team understands Newmarket's unique property mix and provides tailored solutions.</p>
            </div>
            <div style={styles.faqItem}>
              <h3>Can you install underfloor heating in Parnell heritage homes?</h3>
              <p>Absolutely! We specialize in installing underfloor heating and under floor heating in Parnell's heritage homes and character properties, providing period-appropriate solutions that respect the property's historic value while adding modern comfort.</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2>Related Heating Services</h2>
          <p>Explore our other Auckland heating services:</p>
          <div style={styles.relatedLinks}>
            <a href="/services/underfloor-heating-north-shore" style={styles.relatedLink}>
              Underfloor Heating North Shore
            </a>
            <a href="/services/underfloor-heating-west-auckland" style={styles.relatedLink}>
              Underfloor Heating West Auckland
            </a>
            <a href="/services/underfloor-heating-east-auckland" style={styles.relatedLink}>
              Underfloor Heating East Auckland
            </a>
            <a href="/services/electric-underfloor-heating" style={styles.relatedLink}>
              Electric Underfloor Heating
            </a>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready to Heat Your Central Auckland Property?</h2>
          <p>Get your free consultation and quote for professional underfloor heating in Central Auckland. Our specialists understand inner-city installation challenges and apartment requirements.</p>
          <button style={styles.ctaButton}>
            Get Free Central Auckland Consultation
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

export default UnderfloorHeatingCentralAucklandPage;
