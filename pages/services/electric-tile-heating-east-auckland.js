import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const ElectricTileHeatingEastAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Electric Tile Heating East Auckland - Electric Heating Under Tiles",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "East Auckland"
    },
    "serviceType": "Electric tile heating installation, electric heating under tiles in East Auckland",
    "description": "Professional electric tile heating installation in East Auckland. Electric heating systems for tiles in bathrooms, kitchens & wet areas in Howick, Pakuranga, Botany & surrounding East Auckland suburbs.",
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do you install electric tile heating in East Auckland new developments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we work extensively with East Auckland new developments including Botany, Flat Bush, and surrounding areas. We coordinate with builders and developers to ensure proper electric tile heating installation in new builds and subdivisions."
        }
      },
      {
        "@type": "Question",
        "name": "What East Auckland areas do you service for electric tile heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide electric tile heating services throughout East Auckland including Howick, Pakuranga, Botany, Flat Bush, Half Moon Bay, Bucklands Beach, and all surrounding East Auckland suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Electric Tile Heating East Auckland — Electric Heating Under Tiles | Heat NZ"
        description="Professional electric tile heating installation in East Auckland. Electric heating systems for tiles in bathrooms, kitchens & wet areas in Howick, Pakuranga, Botany & surrounding areas. From $80-$150/m²."
        canonical="https://heat.nz/services/electric-tile-heating-east-auckland"
        keywords="electric tile heating East Auckland, electric heating under tiles East Auckland, tile heating East Auckland, electric tile heating Howick, electric tile heating Pakuranga, electric tile heating Botany, electric tile heating Flat Bush, electric under tile heating East Auckland, electric heating mats East Auckland, electric heating cables under tiles East Auckland, bathroom heating East Auckland, kitchen heating East Auckland, wet area heating East Auckland, tile floor heating East Auckland, electric tile heating installation East Auckland, electric heating installation under tiles East Auckland, electric tile heating cost East Auckland, electric tile heating systems East Auckland, bathroom electric tile heating East Auckland, kitchen electric tile heating East Auckland, wet area electric tile heating East Auckland, ceramic tile heating East Auckland, porcelain tile heating East Auckland, stone tile heating East Auckland, mosaic tile heating East Auckland, electric heating mats under tiles East Auckland, tile heating contractors East Auckland, professional electric tile heating East Auckland, electric tile heating Half Moon Bay, electric tile heating Bucklands Beach, electric tile heating Dannemora, electric tile heating Somerville, electric heating under tiles Howick, electric heating under tiles Pakuranga, electric heating under tiles Botany"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Electric Tile Heating East Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric tile heating systems installed under tiles throughout 
              East Auckland including Howick, Pakuranga, Botany, and surrounding areas.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> $80-$150/m²
              </div>
              <div style={styles.stat}>
                <strong>Areas:</strong> All East Auckland
              </div>
              <div style={styles.stat}>
                <strong>Installation:</strong> 1-2 days
              </div>
            </div>
          </div>
        </section>

        {/* East Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Electric Tile Heating Throughout East Auckland</h2>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h4>Howick</h4>
              <p>Established homes, character properties, and modern developments with reliable electric tile heating systems perfect for family living and renovations.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>Pakuranga</h4>
              <p>Family homes, modern developments, and commercial properties with efficient electric tile heating systems and smart home integration options.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>Botany</h4>
              <p>New developments, shopping center area, and contemporary homes with modern electric tile heating solutions and energy-efficient systems.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>Flat Bush</h4>
              <p>New housing estates, modern homes, and residential developments with integrated electric tile heating systems perfect for new builds.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>Half Moon Bay</h4>
              <p>Waterfront properties, family homes, and residential buildings with premium electric tile heating systems designed for coastal environments.</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>Bucklands Beach</h4>
              <p>Coastal homes, luxury properties, and family residences with efficient electric tile heating systems perfect for seaside living.</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Related Electric Tile Heating Services</h2>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <h3>Under Tile Heating</h3>
              <p>Electric heating systems installed directly under tile flooring for maximum efficiency and comfort throughout East Auckland.</p>
              <a href="/services/under-tile-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
            <div style={styles.serviceCard}>
              <h3>Floor Heating</h3>
              <p>Complete electric floor heating solutions for tiles and other floor coverings throughout East Auckland homes and commercial properties.</p>
              <a href="/services/floor-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
            <div style={styles.serviceCard}>
              <h3>Bathroom Heating</h3>
              <p>Specialized bathroom electric tile heating with fast warm-up times and wet area approved systems for East Auckland bathrooms.</p>
              <a href="/services/electric-under-tile-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Experience Electric Tile Heating in East Auckland</h2>
          <p>Transform your tiled floors with professional electric heating systems. Get your free quote from East Auckland's electric tile heating specialists.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free East Auckland Electric Tile Heating Quote
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
    padding: '0 20px',
    fontFamily: 'Inter, sans-serif',
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '4rem 2rem',
    borderRadius: '15px',
    marginBottom: '3rem',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  stat: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '1rem',
    borderRadius: '8px',
  },
  section: {
    marginBottom: '4rem',
  },
  sectionTitle: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333',
  },
  suburbsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2rem',
  },
  suburbGroup: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
  serviceLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
  ctaSection: {
    background: '#f8f9fa',
    padding: '3rem 2rem',
    borderRadius: '15px',
    textAlign: 'center',
    marginBottom: '3rem',
  },
  ctaButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '25px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default ElectricTileHeatingEastAucklandPage;
