import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const ElectricTileHeatingPage = () => {
  const features = [
    {
      title: "Electric Heating Mats",
      description: "Pre-manufactured heating mats for quick, reliable installation under tiles.",
      icon: "⚡"
    },
    {
      title: "Precise Control",
      description: "Digital thermostats with precise temperature control and programming features.",
      icon: "🎛️"
    },
    {
      title: "Fast Installation",
      description: "Quick installation process with minimal disruption to your daily routine.",
      icon: "🚀"
    },
    {
      title: "Zone Heating",
      description: "Individual room control allows you to heat only the areas you're using.",
      icon: "🏠"
    },
    {
      title: "Wet Area Approved",
      description: "IP-rated systems safe for bathrooms, showers, and wet areas.",
      icon: "💧"
    },
    {
      title: "Maintenance Free",
      description: "No moving parts means virtually maintenance-free operation for years.",
      icon: "🔥"
    }
  ];

  const benefits = [
    "Electric heating mats installed directly under tiles",
    "Perfect for bathrooms, ensuites, and wet areas",
    "Fast warm-up times for instant comfort",
    "Zone-controlled heating for energy efficiency",
    "Compatible with ceramic, porcelain, and stone tiles",
    "Individual room temperature control",
    "Silent operation with no moving parts",
    "Long warranty with reliable performance"
  ];

  const systemTypes = [
    { 
      type: "Heating Mats", 
      description: "Pre-manufactured mats perfect for regular-shaped areas like bathrooms",
      coverage: "Ideal for rectangular spaces",
      installation: "Fast and straightforward"
    },
    { 
      type: "Heating Cables", 
      description: "Flexible cable systems for irregular or complex room shapes",
      coverage: "Suitable for any room layout",
      installation: "Custom layout for optimal coverage"
    },
    { 
      type: "Loose Wire Systems", 
      description: "Individual heating wires for maximum flexibility and coverage",
      coverage: "Perfect for complex floor plans",
      installation: "Professional installation required"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Electric Tile Heating Auckland - Electric Heating Under Tiles",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Electric tile heating installation, electric heating under tiles, bathroom electric heating",
    "description": "Professional electric tile heating installation in Auckland. Electric heating mats and cables installed under tiles for bathrooms, kitchens, and wet areas.",
    "offers": {
      "@type": "Offer",
      "priceRange": "$80-$150 per square meter",
      "availability": "https://schema.org/InStock"
    },
    "category": "Home Improvement",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Electric Tile Heating Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Electric Heating Mat Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Electric Heating Cable Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Bathroom Electric Tile Heating"
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
        "name": "What is the difference between electric heating mats and cables?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Electric heating mats are pre-manufactured with heating cables attached to a mesh backing, making them ideal for regular-shaped areas. Heating cables are loose wires that can be laid in custom patterns, perfect for irregular room shapes or complex layouts."
        }
      },
      {
        "@type": "Question",
        "name": "How much electricity does electric tile heating use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Electric tile heating typically uses 150-200 watts per square meter when running. However, with proper insulation and thermostat control, the system only runs when needed, making it very energy efficient for zone heating applications like bathrooms."
        }
      },
      {
        "@type": "Question",
        "name": "Can electric tile heating be retrofitted into existing bathrooms?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, electric tile heating can be installed in existing bathrooms during renovation. We remove the existing tiles, install the heating system, and re-tile over the top. This process typically adds only 3-5mm to your floor height."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Electric Tile Heating Auckland — Electric Heating Under Tiles | Heat NZ"
        description="Professional electric tile heating installation in Auckland. Electric heating mats & cables under tiles for bathrooms, kitchens & wet areas. From $80-$150/m². Fast installation. Free quotes."
        canonical="https://heat.nz/services/electric-tile-heating"
        keywords="electric tile heating, tile heating, under tile heating, floor heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, electric tile heating Auckland, electric heating under tiles, electric heating mats Auckland, electric tile floor heating, electric underfloor heating tiles, bathroom electric heating, electric heating cables under tiles, tile heating Auckland, under tile heating Auckland, floor heating Auckland, electric under tile heating Auckland, bathroom tile heating Auckland, kitchen tile heating Auckland, wet area tile heating Auckland, ceramic tile heating Auckland, porcelain tile heating Auckland, stone tile heating Auckland, mosaic tile heating Auckland, electric heating installation under tiles Auckland, tile heating systems Auckland, bathroom underfloor heating Auckland, kitchen underfloor heating Auckland, electric floor heating tiles Auckland, radiant tile heating Auckland, electric heating mats under tiles Auckland, tile heating cost Auckland, tile heating installation Auckland, under tile heating installation Auckland, electric heating contractors Auckland, professional electric tile heating Auckland"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Electric Tile Heating Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric heating systems installed directly under tiles. 
              Perfect for bathrooms, kitchens, and wet areas with fast, reliable heating.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> $80-$150/m²
              </div>
              <div style={styles.stat}>
                <strong>Installation:</strong> 1-2 days
              </div>
              <div style={styles.stat}>
                <strong>Systems:</strong> Mats & Cables
              </div>
            </div>
          </div>
        </section>

        {/* What is Electric Tile Heating */}
        <section style={styles.section}>
          <div style={styles.contentGrid}>
            <div style={styles.textContent}>
              <h2>What is Electric Tile Heating?</h2>
              <p>
                Electric tile heating uses specialized heating mats or cables that are 
                installed directly under your tile flooring. These systems use electrical 
                resistance to generate heat, providing fast, even warming under tiles.
              </p>
              <p>
                Perfect for bathrooms, kitchens, and wet areas, electric tile heating 
                offers precise temperature control, quick warm-up times, and reliable 
                performance for year-round comfort.
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
                <span style={styles.imageText}>Electric Tile Heating System</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Electric Tile Heating?</h2>
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

        {/* System Types */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Electric Tile Heating Systems</h2>
          <div style={styles.systemsGrid}>
            {systemTypes.map((system, index) => (
              <div key={index} style={styles.systemCard}>
                <h3>{system.type}</h3>
                <p>{system.description}</p>
                <div style={styles.systemDetails}>
                  <div style={styles.detailItem}>
                    <strong>Coverage:</strong> {system.coverage}
                  </div>
                  <div style={styles.detailItem}>
                    <strong>Installation:</strong> {system.installation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Installation Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Perfect for These Areas</h2>
          <div style={styles.areasGrid}>
            <div style={styles.areaCard}>
              <h3>🛁 Bathrooms</h3>
              <p>Luxury bathroom heating with quick warm-up for comfort after showering or bathing.</p>
            </div>
            <div style={styles.areaCard}>
              <h3>🚿 Ensuites</h3>
              <p>Compact ensuite heating systems perfect for smaller master bathroom areas.</p>
            </div>
            <div style={styles.areaCard}>
              <h3>🍳 Kitchens</h3>
              <p>Kitchen floor heating for added comfort while cooking and preparing meals.</p>
            </div>
            <div style={styles.areaCard}>
              <h3>🚰 Utility Rooms</h3>
              <p>Laundry and utility room heating for year-round comfort in work areas.</p>
            </div>
          </div>
        </section>

        {/* Installation Process */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Installation Process</h2>
          <div style={styles.processSteps}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3>Site Assessment</h3>
                <p>Measure area, check electrical supply, and plan optimal heating layout for your tiles.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3>System Installation</h3>
                <p>Install heating mats or cables, connect to electrical supply, and test system before tiling.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3>Tile Installation</h3>
                <p>Professional tiler installs tiles over heating system using proper techniques and adhesives.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3>System Commissioning</h3>
                <p>Install thermostat, final testing, and provide user instructions and warranty documentation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Electric Tile Heating Throughout Auckland</h2>
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
          <h2>Experience Electric Tile Heating</h2>
          <p>Transform your tiled floors with electric heating. Get your free quote from Auckland's electric tile heating specialists.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Electric Tile Heating Quote
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
  systemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  systemCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
  systemDetails: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  detailItem: {
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  },
  areasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  areaCard: {
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

export default ElectricTileHeatingPage;
