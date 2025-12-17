import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import SEO from '../../../components/SEO';

const SuburbPage = () => {
  const router = useRouter();
  const { suburb } = router.query;

  // Convert suburb slug to proper case
  const formatSuburbName = (slug) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const suburbName = formatSuburbName(suburb);

  const suburbData = {
    'remuera': {
      description: 'Premium underfloor heating solutions for Remuera\'s luxury homes. Professional installation in Auckland\'s most prestigious suburb.',
      features: ['Luxury home heating', 'Quiet operation', 'Energy efficient systems', 'Premium warranties'],
      averageCost: '$120-$180 per m²',
      serviceAreas: ['Remuera', 'Newmarket', 'Parnell', 'Epsom']
    },
    'ponsonby': {
      description: 'Modern underfloor heating for Ponsonby\'s stylish homes. Combining contemporary design with efficient heating solutions.',
      features: ['Contemporary heating design', 'Smart home integration', 'Fast installation', 'Modern aesthetics'],
      averageCost: '$100-$160 per m²',
      serviceAreas: ['Ponsonby', 'Grey Lynn', 'Herne Bay', 'Westmere']
    },
    'parnell': {
      description: 'Historic charm meets modern comfort with underfloor heating in Parnell. Perfect for heritage homes and modern renovations.',
      features: ['Heritage home compatibility', 'Restoration-friendly', 'Period-appropriate solutions', 'Expert consultation'],
      averageCost: '$110-$170 per m²',
      serviceAreas: ['Parnell', 'Newmarket', 'Grafton', 'Remuera']
    },
    'takapuna': {
      description: 'North Shore\'s premier underfloor heating service in Takapuna. Professional installation for beachside and suburban homes.',
      features: ['Beachside home heating', 'Salt air protection', 'Coastal warranties', 'Local expertise'],
      averageCost: '$100-$150 per m²',
      serviceAreas: ['Takapuna', 'Devonport', 'Milford', 'Castor Bay']
    }
  };

  const currentData = suburbData[suburb] || {
    description: `Professional underfloor heating installation in ${suburbName}, Auckland. Expert service for homes throughout the area.`,
    features: ['Local expertise', 'Free quotes', 'Quality installation', 'Comprehensive warranties'],
    averageCost: '$90-$150 per m²',
    serviceAreas: [suburbName, 'Auckland Central', 'Surrounding suburbs']
  };

  const testimonials = [
    {
      name: "Sarah M.",
      location: suburbName,
      text: `Our new underfloor heating has completely transformed our ${suburbName} home. It's warm, efficient, and no more cold tiles in winter!`,
      rating: 5
    },
    {
      name: "James R.",
      location: suburbName,
      text: `The whole process was simple! Heat.nz found us a reliable installer who finished on time and within budget.`,
      rating: 5
    }
  ];

  return (
    <Layout>
      <SEO
        title={`Underfloor Heating ${suburbName} - Professional Installation & Service`}
        description={currentData.description}
        canonical={`https://www.heat.nz/services/underfloor-heating/${suburb}`}
        keywords={`underfloor heating ${suburbName}, heating installation ${suburbName}, electric heating ${suburbName}, hydronic heating ${suburbName}`}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": `Underfloor Heating Installation in ${suburbName}`,
            "provider": {
              "name": "Heat NZ",
              "url": "https://www.heat.nz"
            },
            "areaServed": {
              "@type": "Place",
              "name": suburbName,
              "containedInPlace": {
                "@type": "Place",
                "name": "Auckland"
              }
            },
            "serviceType": "Underfloor heating installation, maintenance & repair",
            "description": currentData.description,
            "offers": {
              "@type": "Offer",
              "priceRange": currentData.averageCost,
              "availability": "https://schema.org/InStock"
            }
          }
        ]}
      />
      
      <div style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.heroContent}>
            <h1>Underfloor Heating in {suburbName}</h1>
            <p style={styles.heroDescription}>{currentData.description}</p>
            <div style={styles.heroStats}>
              <div style={styles.stat}>
                <strong>Average Cost:</strong> {currentData.averageCost}
              </div>
              <div style={styles.stat}>
                <strong>Service Areas:</strong> {currentData.serviceAreas.join(', ')}
              </div>
            </div>
            <button 
              style={styles.ctaButton}
              onClick={() => window.open('/', '_self')}
            >
              Get Free Quote for {suburbName}
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section style={styles.features}>
          <h2>Why Choose Heat NZ for {suburbName}?</h2>
          <div style={styles.featuresGrid}>
            {currentData.features.map((feature, index) => (
              <div key={index} style={styles.featureCard}>
                <div style={styles.featureIcon}>✓</div>
                <h3>{feature}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Local Testimonials */}
        <section style={styles.testimonials}>
          <h2>What {suburbName} Residents Say</h2>
          <div style={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <div key={index} style={styles.testimonialCard}>
                <div style={styles.stars}>
                  {'★'.repeat(testimonial.rating)}
                </div>
                <p style={styles.testimonialText}>"{testimonial.text}"</p>
                <p style={styles.testimonialAuthor}>– {testimonial.name}, {testimonial.location}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Service Areas */}
        <section style={styles.serviceAreas}>
          <h2>We Also Serve</h2>
          <div style={styles.areasList}>
            {currentData.serviceAreas.map((area, index) => (
              <span key={index} style={styles.areaTag}>{area}</span>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Ready for Underfloor Heating in {suburbName}?</h2>
          <p>Get your free quote today and join hundreds of satisfied Auckland homeowners.</p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Start Your Free Quote
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
  heroDescription: {
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
  ctaButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '25px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  features: {
    marginBottom: '3rem',
    textAlign: 'center',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  featureCard: {
    backgroundColor: '#f8f9fa',
    padding: '2rem',
    borderRadius: '10px',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: '2rem',
    color: '#667eea',
    marginBottom: '1rem',
  },
  testimonials: {
    marginBottom: '3rem',
    textAlign: 'center',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  },
  testimonialCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
  stars: {
    color: '#FFD700',
    fontSize: '1.2rem',
    marginBottom: '1rem',
  },
  testimonialText: {
    fontStyle: 'italic',
    marginBottom: '1rem',
    lineHeight: '1.6',
  },
  testimonialAuthor: {
    fontWeight: '600',
    color: '#667eea',
  },
  serviceAreas: {
    marginBottom: '3rem',
    textAlign: 'center',
  },
  areasList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  areaTag: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
  },
  ctaSection: {
    background: '#f8f9fa',
    padding: '3rem 2rem',
    borderRadius: '15px',
    textAlign: 'center',
    marginBottom: '3rem',
  },
};

export default SuburbPage;
