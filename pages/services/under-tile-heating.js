import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderTileHeatingPage = () => {
  const features = [
    {
      title: "Hidden Installation",
      description: "Completely hidden under your tiles for invisible, uniform heating throughout the room.",
      icon: "👻"
    },
    {
      title: "Wet Area Approved",
      description: "Specially designed for bathrooms, showers, and wet areas with appropriate IP ratings.",
      icon: "💧"
    },
    {
      title: "Fast Response",
      description: "Quick warm-up times perfect for bathrooms where you need instant comfort.",
      icon: "⚡"
    },
    {
      title: "Zone Control",
      description: "Independent temperature control for different areas and rooms.",
      icon: "🎛️"
    },
    {
      title: "Low Maintenance",
      description: "Virtually maintenance-free with no moving parts or mechanical components.",
      icon: "🔧"
    },
    {
      title: "Energy Efficient",
      description: "Only heats when needed, with smart programmable controls for maximum efficiency.",
      icon: "💚"
    }
  ];

  const benefits = [
    "Installed directly under tile flooring",
    "Perfect for bathrooms and wet areas",
    "Compatible with all tile types and sizes",
    "Zone-controlled heating for energy efficiency",
    "Quick installation with minimal disruption",
    "Silent operation with no moving parts",
    "Individual room temperature control",
    "Long-lasting with minimal maintenance"
  ];

  const tileTypes = [
    { type: "Ceramic Tiles", description: "Most common choice for bathrooms and kitchens" },
    { type: "Porcelain Tiles", description: "Durable, low-maintenance option with excellent heat transfer" },
    { type: "Natural Stone", description: "Marble, granite, and travertine with proper installation techniques" },
    { type: "Mosaic Tiles", description: "Small format tiles requiring specialized heating mat installation" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Under Tile Heating Auckland - Electric Heating Under Tiles",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Under tile heating installation, electric heating under tiles, bathroom heating",
    "description": "Professional under tile heating installation in Auckland. Electric heating systems installed directly under tile flooring for bathrooms, kitchens, and wet areas.",
    "offers": {
      "@type": "Offer",
      "priceRange": "$80-$150 per square meter",
      "availability": "https://schema.org/InStock"
    },
    "category": "Home Improvement",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Under Tile Heating Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Bathroom Under Tile Heating"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Kitchen Under Tile Heating"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Wet Area Under Tile Heating"
          }
        }
      ]
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Can under tile heating be installed in existing bathrooms?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, under tile heating can be retrofitted into existing bathrooms during renovation. We remove existing tiles, install the heating system, and re-tile over the top. This adds minimal height to your floor."
        }
      },
      {
        "@type": "Question",
        "name": "How does under tile heating work with different tile materials?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Under tile heating works with all tile materials including ceramic, porcelain, natural stone, and mosaic tiles. We use appropriate installation techniques and adhesives for each tile type to ensure optimal heat transfer and longevity."
        }
      },
      {
        "@type": "Question",
        "name": "Is under tile heating safe in wet areas like showers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our under tile heating systems are specifically designed for wet areas with appropriate IP ratings and safety features. Proper installation and waterproofing ensure safe operation in bathrooms and showers."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Under Tile Heating Auckland — Electric Heating Under Tiles | Heat NZ"
        description="Professional under tile heating installation in Auckland. Electric heating systems installed directly under tiles for bathrooms, kitchens & wet areas. From $80-$150/m². Free quotes."
        canonical="https://heat.nz/services/under-tile-heating"
        keywords="under tile heating Auckland, electric heating under tiles, tile floor heating Auckland, bathroom heating under tiles, wet area heating Auckland, electric underfloor heating tiles, heating mats under tiles, tile heating installation, under tile heating installation Auckland, electric under tile heating, electric heating cables under tiles, bathroom under tile heating, kitchen under tile heating, wet area under tile heating, ceramic tile heating under, porcelain tile heating under, stone tile heating under, mosaic tile heating under, electric heating mats under tiles, tile heating cost Auckland, under tile heating systems, radiant heating under tiles, electric floor heating under tiles, bathroom floor heating under tiles, kitchen floor heating under tiles, shower heating under tiles, bathroom heating installation under tiles, wet area heating installation, electric heating installation under tiles, under tile heating contractors Auckland, professional under tile heating"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Under Tile Heating Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric heating systems installed directly under your tile flooring 
              for luxurious warmth in bathrooms, kitchens, and wet areas.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> $80-$150/m²
              </div>
              <div style={styles.stat}>
                <strong>Compatible:</strong> All tile types
              </div>
              <div style={styles.stat}>
                <strong>Wet Areas:</strong> Fully approved
              </div>
            </div>
          </div>
        </section>

        {/* What is Under Tile Heating */}
        <section style={styles.section}>
          <div style={styles.contentGrid}>
            <div style={styles.textContent}>
              <h2>What is Under Tile Heating?</h2>
              <p>
                Under tile heating is a specialized electric heating system designed to be 
                installed directly beneath tile floor coverings. It uses thin heating mats 
                or cables that provide even, radiant heat throughout your tiled areas.
              </p>
              <p>
                Perfect for bathrooms, kitchens, and wet areas, under tile heating transforms 
                cold tile surfaces into warm, comfortable floors that enhance your daily 
                living experience.
              </p>
              <ul style={styles.benefitsList}>
                {benefits.map((benefit, index) => (
                  <li key={index} style={styles.benefitItem}>
                    <span style={styles.benefitIcon}>✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div style={styles.imageContent}>
              <div style={styles.placeholderImage}>
                <span style={styles.imageText}>Under Tile Heating System Cross Section</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Under Tile Heating?</h2>
          <div style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Compatible Tile Types */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Compatible Tile Types</h2>
          <div style={styles.tileTypesGrid}>
            {tileTypes.map((tile, index) => (
              <div key={index} style={styles.tileTypeCard}>
                <h3>{tile.type}</h3>
                <p>{tile.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Installation Process */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Installation Process</h2>
          <div style={styles.processSteps}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3>Site Preparation</h3>
                <p>Prepare the subfloor, ensure it's level and dry, then lay insulation if required.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3>Heating System Installation</h3>
                <p>Install heating mats or cables, run cables to the thermostat location, and test the system.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3>Tile Installation</h3>
                <p>Your tiler uses appropriate adhesives and techniques to install tiles over the heating system.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3>System Commissioning</h3>
                <p>Install thermostat, test the complete system, and provide operation instructions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Under Tile Heating Throughout Auckland</h2>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h4>Central Auckland</h4>
              <p>Remuera, Ponsonby, Parnell, Newmarket, Epsom, Mt Eden, Herne Bay</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>North Shore</h4>
              <p>Takapuna, Devonport, Albany, Northcote, Birkenhead, Milford</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>East Auckland</h4>
              <p>Mission Bay, Kohimarama, Glendowie, Beachlands, Howick</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>West Auckland</h4>
              <p>Henderson, New Lynn, Massey, Titirangi, Glen Eden</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>South Auckland</h4>
              <p>Manukau, Papakura, Pukekohe, Franklin, Manurewa</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Transform Your Tile Floors Today</h2>
          <p>Experience the luxury of warm tiles underfoot. Get your free under tile heating quote from Auckland's experts.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Under Tile Heating Quote
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '3rem',
    alignItems: 'center',
  },
  textContent: {
    lineHeight: '1.6',
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
  },
  benefitItem: {
    padding: '0.5rem 0',
    position: 'relative',
    paddingLeft: '1.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  benefitIcon: {
    position: 'absolute',
    left: 0,
    color: '#667eea',
    fontWeight: 'bold',
    marginRight: '0.5rem',
  },
  imageContent: {
    textAlign: 'center',
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    height: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: '2px dashed #d1d5db',
  },
  imageText: {
    color: '#6b7280',
    fontSize: '1.1rem',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  tileTypesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  tileTypeCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  processSteps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  stepNumber: {
    backgroundColor: '#667eea',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  suburbsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  suburbGroup: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
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

export default UnderTileHeatingPage;
