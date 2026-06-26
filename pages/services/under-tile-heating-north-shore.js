import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderTileHeatingNorthShorePage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Under Tile Heating North Shore - Electric Heating Under Tiles",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "North Shore Auckland"
    },
    "serviceType": "Under tile heating installation, electric heating under tiles in North Shore Auckland",
    "description": "Professional under tile heating installation in North Shore Auckland. Electric heating systems installed directly under tiles for bathrooms, kitchens & wet areas in Takapuna, Devonport, Albany & surrounding North Shore suburbs.",
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do you install under tile heating in North Shore new builds?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we work extensively with North Shore new builds including Albany, Takapuna, and surrounding areas. We coordinate with builders and tilers to ensure proper installation timing and techniques for new construction projects."
        }
      },
      {
        "@type": "Question",
        "name": "What North Shore areas do you service for under tile heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We provide under tile heating services throughout North Shore including Takapuna, Devonport, Albany, Northcote, Birkenhead, Milford, Browns Bay, and all surrounding North Shore suburbs."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Under Tile Heating North Shore — Electric Heating Under Tiles | Heat NZ"
        description="Professional under tile heating installation in North Shore Auckland. Electric heating under tiles for bathrooms, kitchens & wet areas in Takapuna, Devonport, Albany & surrounding areas. Custom quote."
        canonical="https://heat.nz/services/under-tile-heating-north-shore"
        keywords="under tile heating North Shore, electric heating under tiles North Shore, tile floor heating North Shore, bathroom heating under tiles North Shore, wet area heating North Shore, electric underfloor heating tiles North Shore, heating mats under tiles North Shore, tile heating installation North Shore, under tile heating installation North Shore, electric under tile heating North Shore, electric heating cables under tiles North Shore, bathroom under tile heating North Shore, kitchen under tile heating North Shore, wet area under tile heating North Shore, ceramic tile heating under North Shore, porcelain tile heating under North Shore, stone tile heating under North Shore, mosaic tile heating under North Shore, electric heating mats under tiles North Shore, tile heating cost North Shore, under tile heating systems North Shore, radiant heating under tiles North Shore, electric floor heating under tiles North Shore, bathroom floor heating under tiles North Shore, kitchen floor heating under tiles North Shore, shower heating under tiles North Shore, bathroom heating installation under tiles North Shore, wet area heating installation North Shore, electric heating installation under tiles North Shore, under tile heating contractors North Shore, professional under tile heating North Shore, under tile heating Takapuna, under tile heating Devonport, under tile heating Albany, under tile heating Milford, under tile heating Browns Bay, electric heating under tiles Takapuna, electric heating under tiles Devonport, electric heating under tiles Albany"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Under Tile Heating North Shore</h1>
            <p style={styles.heroSubtitle}>
              Professional electric heating systems installed directly under tiles throughout 
              North Shore Auckland including Takapuna, Devonport, Albany, and surrounding areas.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> custom quote
              </div>
              <div style={styles.stat}>
                <strong>Areas:</strong> All North Shore
              </div>
              <div style={styles.stat}>
                <strong>Experience:</strong> 15+ years
              </div>
            </div>
          </div>
        </section>

        {/* North Shore Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Under Tile Heating Throughout North Shore</h2>
          <p style={{textAlign: 'center', marginBottom: '3rem', fontSize: '1.1rem', color: '#666'}}>
            Heat NZ provides professional under tile heating services across all 50 North Shore suburbs including:
          </p>
          <div style={styles.comprehensiveSuburbsList}>
            <div style={styles.suburbColumn}>
              <h4>Coastal & Waterfront Areas</h4>
              <p>Takapuna, Devonport, Milford, Browns Bay, Castor Bay, Campbells Bay, Bayswater, Bayview, Fairview Heights, Murrays Bay, Narrow Neck, Stanley Bay, Stanley Point, Torbay, Waiake</p>
            </div>
            <div style={styles.suburbColumn}>
              <h4>Central & Established Suburbs</h4>
              <p>Albany, Northcote, Birkenhead, Birkdale, Beach Haven, Belmont, Chatswood, Cheltenham, Crown Hill, Forrest Hill, Glenfield, Hauraki, Highbury, Hillcrest, Lucas Height</p>
            </div>
            <div style={styles.suburbColumn}>
              <h4>Northern & Newer Areas</h4>
              <p>Greenhithe, Long Bay, Mairangi Bay, Marlborough, North Harbour, Northcote Point, Northcross, Okura, Oteha, Paremoremo, Pinehill, Rosedale, Rothesay Bay, Schnapper Rock, Sunnynook</p>
            </div>
            <div style={styles.suburbColumn}>
              <h4>Additional Areas</h4>
              <p>Totara Vale, Unsworth Heights, Wairau Valley, Westlake, Windsor Park</p>
            </div>
          </div>
        </section>

        {/* Related Services Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Related Under Tile Heating Services</h2>
          <div style={styles.servicesGrid}>
            <div style={styles.serviceCard}>
              <h3>Electric Tile Heating</h3>
              <p>Complete electric tile heating solutions including heating mats and cable systems for North Shore properties.</p>
              <a href="/services/electric-tile-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
            <div style={styles.serviceCard}>
              <h3>Bathroom Heating</h3>
              <p>Specialized bathroom under tile heating with fast warm-up times and wet area approved systems for North Shore bathrooms.</p>
              <a href="/services/tile-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
            <div style={styles.serviceCard}>
              <h3>Floor Heating</h3>
              <p>Complete floor heating solutions for tiles and other floor coverings throughout North Shore homes and commercial properties.</p>
              <a href="/services/floor-heating" style={styles.serviceLink}>Learn More →</a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Transform Your North Shore Tiled Floors</h2>
          <p>Experience the luxury of under tile heating throughout North Shore. Get your free custom quote for under tile heating in Auckland.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free North Shore Under Tile Heating Quote
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

export default UnderTileHeatingNorthShorePage;
