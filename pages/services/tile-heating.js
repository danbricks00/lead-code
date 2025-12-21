import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const TileHeatingPage = () => {
  const features = [
    {
      title: "Perfect for Bathrooms",
      description: "Provides luxurious warmth under tile floor coverings, ideal for bathrooms and wet areas.",
      icon: "🛁"
    },
    {
      title: "Fast Warm-Up",
      description: "Electric tile heating warms up quickly, providing instant comfort when you need it.",
      icon: "⚡"
    },
    {
      title: "Energy Efficient",
      description: "Zone-controlled heating allows you to heat only the areas you're using, saving energy.",
      icon: "💚"
    },
    {
      title: "Low Profile",
      description: "Minimal floor height increase means compatibility with existing door thresholds.",
      icon: "📏"
    },
    {
      title: "Silent Operation",
      description: "No moving parts means completely silent heating that won't disturb your peace.",
      icon: "🔇"
    },
    {
      title: "Easy Control",
      description: "Smart thermostats allow precise temperature control and programmable scheduling.",
      icon: "🎛️"
    }
  ];

  const benefits = [
    "Perfect heating solution for tile floors",
    "Ideal for bathrooms, kitchens, and wet areas",
    "Fast installation with minimal disruption",
    "Zone-controlled heating for energy efficiency",
    "Compatible with ceramic, porcelain, and stone tiles",
    "Low maintenance requirements",
    "Individual room temperature control",
    "Silent operation with no moving parts"
  ];

  const costs = [
    { area: "Bathroom (3-8m²)", cost: "$300-$1,000", time: "1 day" },
    { area: "Kitchen (10-20m²)", cost: "$800-$2,000", time: "1-2 days" },
    { area: "Ensuite (4-6m²)", cost: "$400-$800", time: "1 day" },
    { area: "Powder Room (2-4m²)", cost: "$200-$500", time: "1 day" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Tile Heating Installation Auckland - Electric Under Tile Heating",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Tile heating installation, under tile heating, electric floor heating",
    "description": "Professional tile heating installation in Auckland. Electric under tile heating perfect for bathrooms, kitchens, and wet areas with tile floor coverings.",
    "offers": {
      "@type": "Offer",
      "priceRange": "$80-$150 per square meter",
      "availability": "https://schema.org/InStock"
    },
    "category": "Home Improvement",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Tile Heating Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Electric Tile Heating Mat Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Under Tile Heating Cable Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Bathroom Tile Heating"
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
        "name": "How much does tile heating cost in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tile heating costs in Auckland typically range from $80-$150 per square meter, including installation. Smaller bathrooms may cost $300-$1,000, while larger areas like kitchens range from $800-$2,000 depending on size and complexity."
        }
      },
      {
        "@type": "Question",
        "name": "Can tile heating be installed under any type of tile?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, electric tile heating is compatible with ceramic tiles, porcelain tiles, natural stone, and most other tile materials. We ensure proper installation techniques for each tile type to maximize efficiency and longevity."
        }
      },
      {
        "@type": "Question",
        "name": "How long does tile heating installation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Most tile heating installations take 1-2 days. Small bathrooms typically take 1 day, while larger areas like kitchens may take 1-2 days. The actual tiling is done after the heating system is installed and tested."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Tile Heating Auckland — Electric Under Tile Heating Installation | Heat NZ"
        description="Professional tile heating installation in Auckland. Electric under tile heating perfect for bathrooms, kitchens & wet areas. From $80-$150/m² with fast 1-2 day installation. Free quotes."
        canonical="https://heat.nz/services/tile-heating"
        keywords="tile heating, under tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, tile heating Auckland, under tile heating Auckland, floor heating Auckland, electric tile heating Auckland, electric under tile heating Auckland, electric under tile, bathroom heating Auckland, tile floor heating Auckland, electric under tile heating, heating mats under tiles, wet area heating Auckland, bathroom floor heating, tile heating installation Auckland, under tile heating installation, electric heating mats Auckland, tile heating cost Auckland, bathroom tile heating, kitchen tile heating, wet area tile heating, ceramic tile heating Auckland, porcelain tile heating Auckland, stone tile heating Auckland, mosaic tile heating Auckland, electric heating cables under tiles, tile heating systems Auckland, bathroom underfloor heating, kitchen underfloor heating, electric floor heating tiles, radiant tile heating, electric heating installation under tiles"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Tile Heating Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric tile heating installation perfect for bathrooms, 
              kitchens, and wet areas with tile floor coverings.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> $80-$150/m²
              </div>
              <div style={styles.stat}>
                <strong>Installation:</strong> 1-2 days
              </div>
              <div style={styles.stat}>
                <strong>Compatible:</strong> All tile types
              </div>
            </div>
          </div>
        </section>

        {/* What is Tile Heating */}
        <section style={styles.section}>
          <div style={styles.contentGrid}>
            <div style={styles.textContent}>
              <h2>What is Electric Tile Heating?</h2>
              <p>
                Electric tile heating is a specialized form of underfloor heating designed 
                specifically for areas with tile floor coverings. It uses thin heating mats 
                or cables installed directly under your tiles to provide luxurious, even heat.
              </p>
              <p>
                Perfect for bathrooms, kitchens, and wet areas, tile heating transforms 
                cold tile floors into warm, comfortable surfaces that dry quickly and 
                provide year-round comfort.
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
                <span style={styles.imageText}>Tile Heating System Under Tiles</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Tile Heating?</h2>
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

        {/* Cost Guide */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Tile Heating Costs</h2>
          <div style={styles.costTable}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Room Size</div>
              <div style={styles.tableCell}>Typical Cost</div>
              <div style={styles.tableCell}>Installation Time</div>
            </div>
            {costs.map((cost, index) => (
              <div key={index} style={index === costs.length - 1 ? styles.tableRowLast : styles.tableRow}>
                <div style={styles.tableCell}>{cost.area}</div>
                <div style={styles.tableCell}>{cost.cost}</div>
                <div style={styles.tableCellLast}>{cost.time}</div>
              </div>
            ))}
          </div>
          <p style={styles.costNote}>
            *Prices include heating mats, installation, and thermostat. Final costs depend on 
            room size, tile type, and electrical requirements.
          </p>
        </section>

        {/* Installation Process */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Installation Process</h2>
          <div style={styles.processSteps}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3>Assessment & Planning</h3>
                <p>We assess your space, check electrical requirements, and plan the optimal heating layout for your tiles.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3>System Installation</h3>
                <p>Install heating mats or cables, connect to power supply, and test the system before tiling.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3>Tile Installation</h3>
                <p>Your tiler installs tiles over the heating system using appropriate adhesives and techniques.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3>Final Setup</h3>
                <p>Install thermostat, test final system, and provide user instructions and warranty documentation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Tile Heating Throughout Auckland</h2>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h4>Central Auckland</h4>
              <p>Remuera, Ponsonby, Parnell, Newmarket, Epsom, Mt Eden</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>North Shore</h4>
              <p>Takapuna, Devonport, Albany, Northcote, Birkenhead</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>East Auckland</h4>
              <p>Mission Bay, Kohimarama, Glendowie, Beachlands</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>West Auckland</h4>
              <p>Henderson, New Lynn, Massey, Titirangi</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>South Auckland</h4>
              <p>Manukau, Papakura, Pukekohe, Franklin</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready for Warm Tile Floors?</h2>
          <p>Transform your bathroom or kitchen with electric tile heating. Get your free quote today.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Tile Heating Quote
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
  costTable: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    marginBottom: '1rem',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    backgroundColor: '#667eea',
    color: 'white',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRowLast: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    borderBottom: 'none',
  },
  tableCell: {
    padding: '1rem',
    borderRight: '1px solid #e5e7eb',
  },
  tableCellLast: {
    padding: '1rem',
    borderRight: 'none',
  },
  costNote: {
    fontSize: '0.9rem',
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
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

export default TileHeatingPage;
