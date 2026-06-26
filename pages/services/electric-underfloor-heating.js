import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const ElectricUnderfloorHeatingPage = () => {
  const features = [
    {
      title: "Easy Installation",
      description: "Perfect for renovations and smaller spaces with minimal floor height increase.",
      icon: "⚡"
    },
    {
      title: "Individual Room Control",
      description: "Each room can be controlled independently with programmable thermostats.",
      icon: "🎛️"
    },
    {
      title: "Fast Response Time",
      description: "Heats up quickly and provides immediate warmth when you need it.",
      icon: "⚡"
    },
    {
      title: "Premium Quality",
      description: "Long-lasting heating elements backed by our 10-year warranty.",
      icon: "🔧"
    },
    {
      title: "Tailored Solutions",
      description: "Custom-designed systems quoted to suit your specific floor plan.",
      icon: "💰"
    },
    {
      title: "Silent Operation",
      description: "Completely silent operation with no moving parts or noise.",
      icon: "🔇"
    }
  ];

  const benefits = [
    "Perfect for bathrooms, kitchens, and living areas",
    "Ideal for renovations and retrofits",
    "Individual room temperature control",
    "Professional installation by experienced technicians",
    "Reliable, long-lasting performance",
    "Custom quote based on your floor plan",
    "Silent operation",
    "Compatible with most floor coverings"
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Electric Underfloor Heating Installation Auckland",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Electric underfloor heating installation",
    "description": "Professional electric underfloor heating installation in Auckland. Perfect for renovations, bathrooms, kitchens, and individual room heating.",
    "offers": {
      "@type": "Offer",
      "priceRange": "Custom quote",
      "availability": "https://schema.org/InStock"
    },
    "category": "Home Improvement",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Electric Underfloor Heating Services",
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
            "name": "Thermostat Installation"
          }
        }
      ]
    }
  };

  return (
    <Layout>
      <SEO
        title="Electric Underfloor Heating Auckland — Bathroom & Kitchen Heating Installation"
        description="Professional electric underfloor heating installation in Auckland. Perfect for bathrooms, kitchens & renovations. Free custom quotes for all Auckland suburbs. 10-year warranty."
        canonical="https://heat.nz/services/electric-underfloor-heating"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, electric underfloor heating Auckland, tile heating Auckland, under tile heating Auckland, floor heating Auckland, electric tile heating Auckland, electric under tile heating Auckland, bathroom heating Auckland, kitchen heating Auckland, electric floor heating Auckland, heating mats Auckland, electric heating installation Auckland, renovation heating Auckland, bathroom floor heating"
        structuredData={structuredData}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Electric Underfloor Heating Auckland</h1>
            <p style={styles.heroSubtitle}>
              Professional electric underfloor heating installation perfect for renovations, 
              bathrooms, kitchens, and individual room heating solutions.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>Pricing:</strong> Custom quote
              </div>
              <div style={styles.stat}>
                <strong>Experience:</strong> 25+ years
              </div>
              <div style={styles.stat}>
                <strong>Warranty:</strong> Up to 10 years
              </div>
            </div>
          </div>
        </section>

        {/* What is Electric Underfloor Heating */}
        <section style={styles.section}>
          <div style={styles.contentGrid}>
            <div style={styles.textContent}>
              <h2>What is Electric Underfloor Heating?</h2>
              <p>
                Electric underfloor heating uses heating cables or mats installed beneath your floor 
                surface to provide radiant heat throughout the room. It's perfect for targeted heating 
                in specific areas like bathrooms, kitchens, or living rooms.
              </p>
              <p>
                Unlike traditional radiators, electric underfloor heating distributes heat evenly 
                across the entire floor surface, eliminating cold spots and providing comfortable, 
                consistent warmth.
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
                <span style={styles.imageText}>Electric Heating System Diagram</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Electric Underfloor Heating?</h2>
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

        {/* Custom Quote Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Get a Custom Quote</h2>
          <p style={styles.costNote}>
            Every home is different. The cost of electric underfloor heating depends on your floor plan,
            room sizes, floor type, and system requirements. Contact us for a free, no-obligation custom
            quote tailored to your specific project — we&apos;ll assess your space and provide a detailed
            breakdown with no fixed pricing surprises.
          </p>
        </section>

        {/* Installation Process */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Installation Process</h2>
          <div style={styles.processSteps}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3>Site Assessment</h3>
                <p>We visit your property to assess the space, floor type, and electrical requirements.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3>System Design</h3>
                <p>Custom heating layout designed for optimal coverage and efficiency.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3>Installation</h3>
                <p>Professional installation of heating elements, thermostats, and electrical connections.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3>Testing & Handover</h3>
                <p>System testing, user training, and warranty documentation provided.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready for Electric Underfloor Heating?</h2>
          <p>Get your free quote today and experience the comfort of electric underfloor heating.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Quote
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

export default ElectricUnderfloorHeatingPage;
