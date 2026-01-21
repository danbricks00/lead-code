import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const ElectricUnderTileHeatingPage = () => {
  const features = [
    {
      title: "Electric Heating Cables",
      description: "Flexible electric heating cables installed directly under tile flooring for even heat distribution.",
      icon: "⚡"
    },
    {
      title: "Precise Temperature Control",
      description: "Digital thermostats with programmable schedules and precise temperature settings.",
      icon: "🌡️"
    },
    {
      title: "Rapid Warm-Up",
      description: "Quick heating response perfect for bathrooms and areas needing instant warmth.",
      icon: "⚡"
    },
    {
      title: "Wet Area Safe",
      description: "IP-rated electric systems designed for safe operation in wet environments.",
      icon: "💧"
    },
    {
      title: "Low Profile",
      description: "Minimal floor height increase ensures compatibility with existing doorways.",
      icon: "📏"
    },
    {
      title: "Zone Control",
      description: "Individual room heating control for energy efficiency and personalized comfort.",
      icon: "🎛️"
    }
  ];

  const benefits = [
    "Electric heating cables installed under tiles",
    "Perfect for bathrooms, ensuites, and wet areas",
    "Fast warm-up times for immediate comfort",
    "Zone-controlled heating for energy efficiency",
    "Compatible with all tile types and sizes",
    "Individual room temperature control",
    "Silent operation with no moving parts",
    "Long-lasting with minimal maintenance"
  ];

  const applications = [
    { 
      area: "Bathroom Floors", 
      description: "Luxury bathroom heating with quick warm-up for post-shower comfort",
      icon: "🛁"
    },
    { 
      area: "Kitchen Floors", 
      description: "Kitchen floor heating for added comfort while cooking and meal prep",
      icon: "🍳"
    },
    { 
      area: "Ensuite Areas", 
      description: "Compact ensuite heating perfect for master bathroom comfort",
      icon: "🚿"
    },
    { 
      area: "Wet Areas", 
      description: "Shower areas and wet rooms with IP-rated electric heating systems",
      icon: "💧"
    },
    { 
      area: "Powder Rooms", 
      description: "Small powder room heating for year-round comfort and luxury",
      icon: "🚰"
    },
    { 
      area: "Utility Rooms", 
      description: "Laundry and utility room heating for improved working conditions",
      icon: "🧺"
    }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Electric Under Tile Heating Auckland - Electric Heating Cables Under Tiles",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Electric under tile heating installation, electric heating cables under tiles, bathroom electric heating",
    "description": "Professional electric under tile heating installation in Auckland. Electric heating cables installed directly under tiles for bathrooms, kitchens, and wet areas.",
    "offers": {
      "@type": "Offer",
      "priceRange": "$80-$150 per square meter",
      "availability": "https://schema.org/InStock"
    },
    "category": "Home Improvement",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Electric Under Tile Heating Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Electric Heating Cable Under Tile Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Bathroom Electric Under Tile Heating"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Wet Area Electric Under Tile Heating"
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
        "name": "How deep under the tiles is the electric heating system installed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Electric under tile heating systems are typically installed in a thin layer (2-3mm) of tile adhesive directly under the tiles. This minimal depth ensures optimal heat transfer while maintaining the original floor height."
        }
      },
      {
        "@type": "Question",
        "name": "Can electric under tile heating be used with large format tiles?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, electric under tile heating works excellently with large format tiles. The heating system provides even heat distribution across the entire tile surface, regardless of tile size. We ensure proper installation techniques for optimal performance."
        }
      },
      {
        "@type": "Question",
        "name": "What thermostat options are available for electric under tile heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer various thermostat options including basic manual controls, programmable timers, and smart thermostats with WiFi connectivity. All thermostats include floor temperature sensors and safety features for reliable operation."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Electric Under Tile Heating Auckland — Electric Heating Cables Under Tiles | Heat NZ"
        description="Professional electric under tile heating installation in Auckland. Electric heating cables installed directly under tiles for bathrooms, kitchens & wet areas. From $80-$150/m². Free quotes."
        canonical="https://heat.nz/services/electric-under-tile-heating"
        keywords="under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, electric under tile heating Auckland, electric heating cables under tiles, electric underfloor heating tiles, bathroom electric heating under tiles, electric tile floor heating, wet area electric heating, electric heating under ceramic tiles"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Electric Under Tile Heating Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric heating cables installed directly under your tile flooring. 
              Perfect for bathrooms, kitchens, and wet areas with reliable, efficient heating.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> $80-$150/m²
              </div>
              <div style={styles.stat}>
                <strong>System:</strong> Electric Cables
              </div>
              <div style={styles.stat}>
                <strong>Installation:</strong> 1-2 days
              </div>
            </div>
          </div>
        </section>

        {/* What is Electric Under Tile Heating */}
        <section style={styles.section}>
          <div style={styles.contentGrid}>
            <div style={styles.textContent}>
              <h2>What is Electric Under Tile Heating?</h2>
              <p>
                Electric under tile heating uses specialized heating cables that are 
                embedded in tile adhesive directly under your tile flooring. These 
                cables use electrical resistance to generate controlled heat, 
                providing even warmth throughout your tiled areas.
              </p>
              <p>
                This system is perfect for bathrooms, kitchens, and wet areas where 
                you want reliable, efficient heating that's hidden beneath your 
                beautiful tile work.
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
                <span style={styles.imageText}>Electric Under Tile Heating Installation</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Electric Under Tile Heating?</h2>
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

        {/* Applications */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Perfect Applications</h2>
          <div style={styles.applicationsGrid}>
            {applications.map((application, index) => (
              <div key={index} style={styles.applicationCard}>
                <div style={styles.applicationIcon}>{application.icon}</div>
                <h3>{application.area}</h3>
                <p>{application.description}</p>
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
                <h3>Surface Preparation</h3>
                <p>Ensure subfloor is clean, level, and dry. Check electrical requirements and plan cable layout.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3>Cable Installation</h3>
                <p>Install electric heating cables in tile adhesive, ensuring proper spacing and coverage under tiles.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3>System Testing</h3>
                <p>Test electrical connections and heating response before tile installation begins.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3>Tile Installation</h3>
                <p>Install tiles over heating cables using appropriate adhesives and installation techniques.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>5</div>
              <div style={styles.stepContent}>
                <h3>System Commissioning</h3>
                <p>Install thermostat, final system testing, and provide operation instructions and warranty.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Technical Specifications</h2>
          <div style={styles.specsGrid}>
            <div style={styles.specCard}>
              <h3>Power Output</h3>
              <p>150-200 watts per square meter</p>
            </div>
            <div style={styles.specCard}>
              <h3>Operating Temperature</h3>
              <p>Up to 28°C floor temperature</p>
            </div>
            <div style={styles.specCard}>
              <h3>Warm-up Time</h3>
              <p>15-30 minutes typical</p>
            </div>
            <div style={styles.specCard}>
              <h3>Floor Height Increase</h3>
              <p>2-3mm total increase</p>
            </div>
            <div style={styles.specCard}>
              <h3>Warranty</h3>
              <p>5 years system warranty</p>
            </div>
            <div style={styles.specCard}>
              <h3>Thermostat Options</h3>
              <p>Manual, programmable & smart</p>
            </div>
          </div>
        </section>

        {/* Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Electric Under Tile Heating Throughout Auckland</h2>
          <div style={styles.suburbsGrid}>
            <div style={styles.suburbGroup}>
              <h4>Central Auckland</h4>
              <p>Remuera, Ponsonby, Parnell, Newmarket, Epsom, Mt Eden, Herne Bay, St Heliers</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>North Shore</h4>
              <p>Takapuna, Devonport, Albany, Northcote, Birkenhead, Milford, Browns Bay</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>East Auckland</h4>
              <p>Mission Bay, Kohimarama, Glendowie, Beachlands, Howick, Pakuranga</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>West Auckland</h4>
              <p>Henderson, New Lynn, Massey, Titirangi, Glen Eden, Te Atatu</p>
            </div>
            <div style={styles.suburbGroup}>
              <h4>South Auckland</h4>
              <p>Manukau, Papakura, Pukekohe, Franklin, Manurewa, Botany</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Transform Your Tiled Floors</h2>
          <p>Experience the luxury of electric under tile heating. Get your free quote from Auckland's heating specialists.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Electric Under Tile Heating Quote
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
  applicationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  applicationCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  applicationIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  processSteps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  specsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
  },
  specCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
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

export default ElectricUnderTileHeatingPage;
