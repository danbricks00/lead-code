import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const TileHeatingCentralAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Tile Heating Central Auckland - Electric Under Tile Heating Installation",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Central Auckland"
    },
    "serviceType": "Tile heating installation, under tile heating, electric tile heating in Central Auckland",
    "description": "Professional tile heating installation in Central Auckland. Electric under tile heating perfect for bathrooms, kitchens & wet areas in Auckland CBD, Parnell, Ponsonby, and surrounding central suburbs.",
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do you install tile heating in Central Auckland heritage homes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in tile heating installation in Central Auckland's heritage properties including Parnell, Ponsonby, and character homes. We work carefully with heritage restrictions and use appropriate systems that complement the home's character."
        }
      },
      {
        "@type": "Question",
        "name": "What areas in Central Auckland do you service for tile heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide tile heating services throughout Central Auckland including Auckland CBD, Parnell, Ponsonby, Grey Lynn, Freemans Bay, Newmarket, Epsom, Mt Eden, Herne Bay, and all surrounding central suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Tile Heating Central Auckland — Electric Under Tile Heating | Heat NZ"
        description="Professional tile heating installation in Central Auckland. Electric under tile heating for bathrooms, kitchens & wet areas in CBD, Parnell, Ponsonby & central suburbs. From $80-$150/m². Free quotes."
        canonical="https://heat.nz/services/tile-heating-central-auckland"
        keywords="tile heating Central Auckland, under tile heating Central Auckland, floor heating Central Auckland, electric tile heating Central Auckland, electric under tile heating Central Auckland, tile heating Auckland CBD, tile heating Parnell, tile heating Ponsonby, under tile heating Auckland CBD, under tile heating Parnell, under tile heating Ponsonby, electric tile heating Auckland CBD, electric tile heating Parnell, electric tile heating Ponsonby, bathroom heating Central Auckland, kitchen heating Central Auckland, wet area heating Central Auckland, tile floor heating Central Auckland, electric under tile heating Auckland CBD, electric under tile heating Parnell, electric under tile heating Ponsonby, heating mats under tiles Central Auckland, tile heating installation Central Auckland, under tile heating installation Central Auckland, electric heating mats Central Auckland, tile heating cost Central Auckland, bathroom tile heating Central Auckland, kitchen tile heating Central Auckland, wet area tile heating Central Auckland, ceramic tile heating Central Auckland, porcelain tile heating Central Auckland, stone tile heating Central Auckland, mosaic tile heating Central Auckland, electric heating cables under tiles Central Auckland, tile heating systems Central Auckland, bathroom underfloor heating Central Auckland, kitchen underfloor heating Central Auckland, electric floor heating tiles Central Auckland, radiant tile heating Central Auckland, electric heating installation under tiles Central Auckland"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Tile Heating Central Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric tile heating installation throughout Central Auckland including 
              Auckland CBD, Parnell, Ponsonby, Grey Lynn, and surrounding central suburbs.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> $80-$150/m²
              </div>
              <div style={styles.stat}>
                <strong>Areas:</strong> All Central Auckland
              </div>
              <div style={styles.stat}>
                <strong>Installation:</strong> 1-2 days
              </div>
            </div>
          </div>
        </section>

        {/* Central Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Tile Heating Throughout Central Auckland</h2>
          <p style={{textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', color: '#666'}}>
            Heat NZ provides professional tile heating services across all 62 Central Auckland suburbs including:
          </p>
          <div style={styles.comprehensiveSuburbsList}>
            <div style={styles.suburbColumn}>
              <h4>Central & Inner Suburbs</h4>
              <p>Auckland CBD, Parnell, Ponsonby, Grey Lynn, Freemans Bay, Newmarket, Epsom, Mt Eden, Herne Bay, St Heliers, Remuera, Kohimarama, Mission Bay, Glendowie, Grafton, Eden Terrace, Newton, Kingsland, Parnell, Balmoral</p>
            </div>
            <div style={styles.suburbColumn}>
              <h4>Western & Southern Areas</h4>
              <p>Avondale, Blockhouse Bay, Point Chevalier, Sandringham, Mount Albert, Mount Roskill, Mount Wellington, Onehunga, Royal Oak, Three Kings, Greenlane, Ellerslie, One Tree Hill, New Windsor, Lynfield, Waikowhai</p>
            </div>
            <div style={styles.suburbColumn}>
              <h4>Eastern & Outlying Suburbs</h4>
              <p>Ōrākei, Meadowbank, Saint Heliers, Stonefields, St Johns, Point England, Panmure, Glen Innes, Greenwoods Corner, Tamaki, Tamaki Heights, Wai o Taiki Bay, Hillsborough, Waterview</p>
            </div>
            <div style={styles.suburbColumn}>
              <h4>Additional Areas</h4>
              <p>Arch Hill, Eden Valley, Western Springs, Westmere, Westfield, Mornington, Morningside, Ōtāhuhu, Penrose, Te Papapa, Wesley, Grey Lynn, Freemans Bay, Saint Marys Bay</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Related Tile Heating Services</h2>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <h3>Under Tile Heating</h3>
              <p>Electric heating systems installed directly under tile flooring for maximum efficiency and comfort.</p>
              <a href="/services/under-tile-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
            <div style={styles.serviceCard}>
              <h3>Electric Floor Heating</h3>
              <p>Complete electric floor heating solutions for tiles and other floor coverings throughout your home.</p>
              <a href="/services/floor-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
            <div style={styles.serviceCard}>
              <h3>Bathroom Heating</h3>
              <p>Specialized bathroom tile heating with fast warm-up times and wet area approved systems.</p>
              <a href="/services/electric-tile-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready for Tile Heating in Central Auckland?</h2>
          <p>Transform your tiled floors with professional electric heating. Get your free quote from Central Auckland's tile heating specialists.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Central Auckland Tile Heating Quote
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
  comprehensiveSuburbsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
  },
  suburbColumn: {
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

export default TileHeatingCentralAucklandPage;
