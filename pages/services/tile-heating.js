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
      "priceRange": "custom quote based on your floor plan",
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
          "text": "Contact us for a free custom quote based on your specific floor plan and project requirements."
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
          "text": "Installation timeframes vary depending on room size and layout. We provide a detailed timeline with every custom quote."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Tile Heating Auckland — Electric Under Tile Heating Installation | Heat NZ"
        description="Professional tile heating installation in Auckland. Electric under tile heating perfect for bathrooms, kitchens & wet areas. Free custom quotes."
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
                <strong>Pricing:</strong> Custom quote
              </div>
              <div style={styles.stat}>
                <strong>Experience:</strong> 25+ years
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

        {/* Custom Quote */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Get a Custom Quote</h2>
          <p style={styles.costNote}>
            Tile heating costs depend on your room sizes, tile type, and layout. Contact us for a free,
            no-obligation custom quote based on your specific floor plan.
          </p>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready for Warm Tile Floors?</h2>
          <p>Get your free custom quote today and experience the comfort of electric tile heating.</p>
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
