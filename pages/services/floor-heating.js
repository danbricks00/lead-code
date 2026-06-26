import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const FloorHeatingPage = () => {
  const features = [
    {
      title: "Whole House Solution",
      description: "Provides consistent heating throughout entire homes and buildings.",
      icon: "🏠"
    },
    {
      title: "Energy Efficient",
      description: "Lower operating temperatures and better heat distribution than traditional heating.",
      icon: "💚"
    },
    {
      title: "Invisible Comfort",
      description: "Hidden under floor coverings for clean, uncluttered living spaces.",
      icon: "🎭"
    },
    {
      title: "Zone Control",
      description: "Independent temperature control for different areas and rooms.",
      icon: "🎛️"
    },
    {
      title: "Allergy Friendly",
      description: "No forced air circulation means better air quality for allergy sufferers.",
      icon: "🌬️"
    },
    {
      title: "Quiet Operation",
      description: "Silent heating with no moving parts, fans, or mechanical noise.",
      icon: "🔇"
    }
  ];

  const benefits = [
    "Complete floor heating solutions for any space",
    "Works with tile, carpet, vinyl, and hardwood floors",
    "electric heating options available",
    "Zone-controlled heating for energy efficiency",
    "Professional installation and maintenance",
    "Long-term warranty and support",
    "Individual room temperature control",
    "Suitable for new builds and renovations"
  ];

  const applications = [
    { area: "Residential Homes", description: "Complete home heating with electric or electric systems" },
    { area: "Bathrooms", description: "Luxury bathroom heating with quick warm-up times" },
    { area: "Kitchens", description: "Kitchen floor heating for added comfort while cooking" },
    { area: "Living Areas", description: "Living room and bedroom heating for year-round comfort" },
    { area: "Commercial Spaces", description: "Office buildings, retail spaces, and healthcare facilities" },
    { area: "Outdoor Areas", description: "Heated driveways, walkways, and outdoor entertainment areas" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Floor Heating Auckland - Complete Floor Heating Solutions",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Floor heating installation, electric floor heating, electric floor heating",
    "description": "Complete floor heating solutions in Auckland. Professional installation of electric floor heating systems for residential and commercial applications.",
    "offers": {
      "@type": "Offer",
      "priceRange": "Custom quote",
      "availability": "https://schema.org/InStock"
    },
    "category": "Home Improvement",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Floor Heating Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Electric Floor Heating"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Electric Floor Heating"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Commercial Floor Heating"
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
        "name": "What types of floor heating systems do you install?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We install both electric floor heating systems. Electric systems use heating cables or mats for targeted heating, while electric systems use hot water pipes for whole-home heating. We'll recommend the best option based on your needs and budget."
        }
      },
      {
        "@type": "Question",
        "name": "Can floor heating be installed under any type of floor covering?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Floor heating is compatible with most floor coverings including tiles, engineered timber, vinyl, laminate, and even carpet (with some restrictions). We ensure proper installation techniques for each floor type to maximize efficiency and prevent damage."
        }
      },
      {
        "@type": "Question",
        "name": "How energy efficient is floor heating compared to traditional heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Floor heating is generally more energy efficient than traditional heating because it operates at lower temperatures, provides even heat distribution, and can be zone-controlled. Electric systems are particularly efficient for targeted heating, while electric systems offer excellent efficiency for whole-home heating."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Floor Heating Auckland — Complete Floor Heating Solutions | Heat NZ"
        description="Complete floor heating solutions in Auckland. Electric floor heating installation for homes & commercial spaces. From custom quote. Professional installation & maintenance. Free quotes."
        canonical="https://heat.nz/services/floor-heating"
        keywords="floor heating Auckland, floor heating installation Auckland, electric floor heating Auckland, electric floor heating Auckland, radiant floor heating, whole house heating, home heating systems Auckland, commercial floor heating, tile heating Auckland, under tile heating Auckland, electric tile heating Auckland, electric under tile heating Auckland, electric floor heating systems, electric floor heating systems, radiant heating Auckland, floor heating contractors Auckland, electric heating installation Auckland, electric heating installation Auckland, whole home heating Auckland, residential floor heating, commercial floor heating Auckland, floor heating cost Auckland, floor heating maintenance Auckland, floor heating repairs Auckland, electric heating mats Auckland, heating cables Auckland, floor heating thermostats, zone heating Auckland, energy efficient floor heating, eco friendly floor heating, heat pump floor heating, solar floor heating Auckland, floor heating design Auckland, floor heating planning, floor heating consultation, floor heating quote Auckland, floor heating installation service, professional floor heating installers"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Floor Heating Auckland</h1>
            <p style={styles.heroSubtitle}>
              Complete floor heating solutions for residential and commercial spaces. 
              electric systems installed by experienced Auckland heating installers.
            </p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>From:</strong> custom quote
              </div>
              <div style={styles.stat}>
                <strong>Systems:</strong> Electric
              </div>
              <div style={styles.stat}>
                <strong>Coverage:</strong> All Auckland
              </div>
            </div>
          </div>
        </section>

        {/* What is Floor Heating */}
        <section style={styles.section}>
          <div style={styles.contentGrid}>
            <div style={styles.textContent}>
              <h2>What is Floor Heating?</h2>
              <p>
                Floor heating, also known as radiant floor heating, provides warm, even heat 
                throughout your space by heating from the floor upward. Unlike traditional 
                radiators that create hot and cold spots, floor heating distributes heat 
                evenly across the entire floor surface.
              </p>
              <p>
                We offer both electric floor heating solutions, each designed 
                for different applications and budgets, providing year-round comfort in 
                homes, offices, and commercial spaces.
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
                <span style={styles.imageText}>Floor Heating System Installation</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Floor Heating?</h2>
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
          <h2 style={styles.sectionTitle}>Floor Heating Applications</h2>
          <div style={styles.applicationsGrid}>
            {applications.map((application, index) => (
              <div key={index} style={styles.applicationCard}>
                <h3>{application.area}</h3>
                <p>{application.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Electric Floor Heating */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why Choose Electric Floor Heating?</h2>
          <div style={styles.comparisonGrid}>
            <div style={styles.comparisonCard}>
              <h3>Premium Electric Floor Heating</h3>
              <div style={styles.comparisonList}>
                <p>✓ Custom quote based on your floor plan</p>
                <p>✓ Perfect for targeted and whole-home heating</p>
                <p>✓ Zone-controlled heating</p>
                <p>✓ Ideal for renovations and new builds</p>
                <p>✓ 10-year warranty</p>
                <p>✓ 25+ years serving Auckland</p>
              </div>
              <div style={styles.priceRange}>Request a custom quote</div>
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
                <h3>Design & Planning</h3>
                <p>Site survey, heat load calculations, and custom system design for your specific requirements.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <div style={styles.stepContent}>
                <h3>Subfloor Preparation</h3>
                <p>Ensure subfloor is level, dry, and properly prepared for heating system installation.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <div style={styles.stepContent}>
                <h3>System Installation</h3>
                <p>Install heating elements, connect electrical or plumbing systems, and test all components.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>4</div>
              <div style={styles.stepContent}>
                <h3>Floor Covering & Testing</h3>
                <p>Install floor covering over heating system, commission controls, and provide user training.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Auckland Service Areas */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Floor Heating Throughout Auckland</h2>
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
          <h2>Ready for Complete Floor Heating?</h2>
          <p>Transform your space with professional floor heating installation. Get your free quote from Auckland's heating experts.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Floor Heating Quote
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
  },
  applicationCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '2rem',
  },
  comparisonCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  comparisonList: {
    textAlign: 'left',
    margin: '1.5rem 0',
  },
  priceRange: {
    fontWeight: 'bold',
    color: '#667eea',
    fontSize: '1.1rem',
    marginTop: '1rem',
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

export default FloorHeatingPage;
