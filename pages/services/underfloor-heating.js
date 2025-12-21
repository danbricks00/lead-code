import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingPage = () => {
  const handleGetQuote = () => {
    // Open chatbot for quote request
    const chatBubble = document.querySelector('[data-chat-bubble]');
    if (chatBubble) {
      chatBubble.click();
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in Auckland typically range from $80-$150 per square meter for electric systems and $120-$200 per square meter for hydronic systems, including installation. We provide free quotes for all projects."
        }
      },
      {
        "@type": "Question", 
        "name": "How long does underfloor heating installation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Installation time varies by system type and room size. Electric underfloor heating typically takes 1-3 days, while hydronic systems may take 3-7 days. We provide detailed timelines with every quote."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for both electric and hydronic underfloor heating systems throughout Auckland and surrounding areas."
        }
      }
    ]
  };

  const serviceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating & Under Floor Heating Installation Auckland",
    "description": "Professional underfloor heating and under floor heating installation and service in Auckland, including West Auckland, Henderson, New Lynn, and all Auckland suburbs. Electric and hydronic systems available with free quotes.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://www.heat.nz",
      "telephone": "+64-9-123-4567"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Auckland"
      },
      {
        "@type": "City",
        "name": "West Auckland"
      },
      {
        "@type": "City", 
        "name": "Henderson"
      },
      {
        "@type": "City",
        "name": "New Lynn"
      },
      {
        "@type": "City", 
        "name": "Remuera"
      },
      {
        "@type": "City",
        "name": "Ponsonby"
      },
      {
        "@type": "City",
        "name": "Parnell"
      }
    ],
    "serviceType": "Underfloor Heating Installation",
    "offers": {
      "@type": "Offer",
      "description": "Free quotes for underfloor heating installation",
      "priceCurrency": "NZD",
      "priceRange": "$80-$200 per square meter",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <Layout>
        <SEO
        title="Underfloor Heating Auckland | Under Floor Heating — Professional Installation & Service | Heat NZ"
        description="Auckland's leading underfloor heating & under floor heating specialists. Professional electric & hydronic heating installation, maintenance & repair. Free quotes for all Auckland suburbs including West Auckland, Henderson, New Lynn, Remuera, Ponsonby, Parnell, Takapuna, North Shore, East Auckland & more."
        canonical="https://www.heat.nz/services/underfloor-heating"
        keywords="underfloor heating, under floor heating, under-floor heating, under tile heating, tile heating, floor heating, electric tile heating, electric under floor, electric under-floor, bathroom tile heating, bathroom heating, underfloor heating Auckland, under floor heating Auckland, under-floor heating Auckland, underfloor heating West Auckland, under floor heating West Auckland, under-floor heating West Auckland, underfloor heating Henderson, under floor heating Henderson, under-floor heating Henderson, underfloor heating New Lynn, under floor heating New Lynn, under-floor heating New Lynn, tile heating Auckland, under tile heating Auckland, floor heating Auckland, electric tile heating Auckland, electric under tile heating Auckland, electric underfloor heating Auckland, electric under floor heating Auckland, electric under-floor heating Auckland, hydronic heating Auckland, heating installation Auckland, underfloor heating cost Auckland, bathroom heating Auckland, kitchen heating Auckland, heating contractors Auckland, radiant heating Auckland"
        structuredData={[serviceData]}
        faqData={faqData}
      />
      
      <div style={styles.pageContainer}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.container}>
            <h1 style={styles.h1}>Professional Underfloor Heating Auckland | Under Floor Heating — Electric & Hydronic Installation</h1>
            <p style={styles.lead}>
              Auckland's premier underfloor heating and under floor heating specialists with 15+ years experience. We install, service, and maintain electric and hydronic heating systems throughout Auckland. 
              From bathroom heating in West Auckland (Henderson, New Lynn) to whole-house systems in Remuera and Ponsonby, we provide energy-efficient heating solutions for every Auckland home.
            </p>
            <button 
              onClick={handleGetQuote}
              style={styles.ctaButton}
            >
              Get Free Quote
            </button>
          </div>
        </section>

        {/* Auckland Service Areas Section */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Underfloor Heating Services Across Auckland</h2>
            <p style={styles.lead}>
              We provide professional underfloor heating installation and service throughout Auckland, including:
            </p>
            <div style={styles.suburbsGrid}>
              <div style={styles.suburbGroup}>
                <h3>Central Auckland</h3>
                <p>Remuera, Parnell, Newmarket, Epsom, Grafton, Mount Eden</p>
              </div>
              <div style={styles.suburbGroup}>
                <h3>North Shore</h3>
                <p>Takapuna, Milford, Devonport, Browns Bay, Albany, Glenfield</p>
              </div>
              <div style={styles.suburbGroup}>
                <h3>East Auckland</h3>
                <p>Howick, Pakuranga, Botany, Flat Bush, Half Moon Bay</p>
              </div>
              <div style={styles.suburbGroup}>
                <h3>West Auckland</h3>
                <p>Henderson, New Lynn, Glen Eden, Te Atatū, Massey, Avondale, Waitakere, Swanson, Ranui</p>
              </div>
              <div style={styles.suburbGroup}>
                <h3>South Auckland</h3>
                <p>Manukau, Papatoetoe, Otahuhu, Mangere, Papakura</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Why Choose Heat NZ for Underfloor Heating?</h2>
            <div style={styles.grid}>
              <div style={styles.feature}>
                <h3>Expert Installation</h3>
                <p>Certified technicians with years of experience installing both electric and hydronic underfloor heating systems.</p>
              </div>
              <div style={styles.feature}>
                <h3>Free Quotes</h3>
                <p>No-obligation quotes with detailed pricing and timelines. Get your quote in minutes, not days.</p>
              </div>
              <div style={styles.feature}>
                <h3>Quality Products</h3>
                <p>We use only premium heating systems from trusted manufacturers with comprehensive warranties.</p>
              </div>
              <div style={styles.feature}>
                <h3>Local Service</h3>
                <p>Based in Auckland, we understand local conditions and provide fast, reliable service throughout the region.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Electric vs Hydronic Section */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Electric vs Hydronic Underfloor Heating</h2>
            <div style={styles.comparison}>
              <div style={styles.system}>
                <h3>Electric Underfloor Heating</h3>
                <ul style={styles.systemList}>
                  <li style={styles.systemListItem}>Lower upfront cost ($80-$150 per m²)</li>
                  <li style={styles.systemListItem}>Faster installation (1-3 days)</li>
                  <li style={styles.systemListItem}>Perfect for renovations</li>
                  <li style={styles.systemListItem}>Individual room control</li>
                  <li style={styles.systemListItem}>Low maintenance requirements</li>
                </ul>
              </div>
              <div style={styles.system}>
                <h3>Hydronic Underfloor Heating</h3>
                <ul style={styles.systemList}>
                  <li style={styles.systemListItem}>Lower running costs ($120-$200 per m²)</li>
                  <li style={styles.systemListItem}>Whole-home heating solution</li>
                  <li style={styles.systemListItem}>Works with heat pumps and gas</li>
                  <li style={styles.systemListItem}>Longer lifespan (25+ years)</li>
                  <li style={styles.systemListItem}>Ideal for new builds</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Costs & Timeline Section */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Typical Costs & Installation Timeline</h2>
            <div style={styles.costs}>
              <div style={styles.costItem}>
                <h3>Electric Systems</h3>
                <p><strong>Cost:</strong> $80 - $150 per square meter</p>
                <p><strong>Timeline:</strong> 1 - 3 days installation</p>
                <p><strong>Best for:</strong> Single rooms, renovations, bathrooms</p>
              </div>
              <div style={styles.costItem}>
                <h3>Hydronic Systems</h3>
                <p><strong>Cost:</strong> $120 - $200 per square meter</p>
                <p><strong>Timeline:</strong> 3 - 7 days installation</p>
                <p><strong>Best for:</strong> Whole homes, new builds, large areas</p>
              </div>
            </div>
            <p style={styles.note}>
              <em>Prices include installation, materials, and basic warranties. Final pricing depends on room size, system type, and specific requirements.</em>
            </p>
          </div>
        </section>

        {/* Areas We Serve Section */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Areas We Serve</h2>
            <p>Heat NZ provides underfloor heating services throughout Auckland and surrounding areas:</p>
            <div style={styles.areas}>
              <div style={styles.areaColumn}>
                <h3>Central Auckland</h3>
                <ul style={styles.areaList}>
                  <li style={styles.areaListItem}>Auckland CBD</li>
                  <li style={styles.areaListItem}>Parnell</li>
                  <li style={styles.areaListItem}>Ponsonby</li>
                  <li style={styles.areaListItem}>Grey Lynn</li>
                  <li style={styles.areaListItem}>Freemans Bay</li>
                </ul>
              </div>
              <div style={styles.areaColumn}>
                <h3>Eastern Suburbs</h3>
                <ul style={styles.areaList}>
                  <li style={styles.areaListItem}>Remuera</li>
                  <li style={styles.areaListItem}>St Heliers</li>
                  <li style={styles.areaListItem}>Kohimarama</li>
                  <li style={styles.areaListItem}>Mission Bay</li>
                  <li style={styles.areaListItem}>Glendowie</li>
                </ul>
              </div>
              <div style={styles.areaColumn}>
                <h3>North Shore</h3>
                <ul style={styles.areaList}>
                  <li style={styles.areaListItem}>Takapuna</li>
                  <li style={styles.areaListItem}>Devonport</li>
                  <li style={styles.areaListItem}>Milford</li>
                  <li style={styles.areaListItem}>Castor Bay</li>
                  <li style={styles.areaListItem}>Belmont</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={styles.section}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Frequently Asked Questions</h2>
            <div style={styles.faq}>
              <div style={styles.faqItem}>
                <h3>How much does underfloor heating cost in Auckland?</h3>
                <p>Underfloor heating costs in Auckland typically range from $80-$150 per square meter for electric systems and $120-$200 per square meter for hydronic systems, including installation. We provide free quotes for all projects.</p>
              </div>
              <div style={styles.faqItem}>
                <h3>How long does underfloor heating installation take?</h3>
                <p>Installation time varies by system type and room size. Electric underfloor heating typically takes 1-3 days, while hydronic systems may take 3-7 days. We provide detailed timelines with every quote.</p>
              </div>
              <div style={styles.faqItem}>
                <h3>Do you service underfloor heating systems in Auckland?</h3>
                <p>Yes, we provide comprehensive maintenance and repair services for both electric and hydronic underfloor heating systems throughout Auckland and surrounding areas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <div style={styles.container}>
            <h2 style={styles.h2}>Ready to Get Started?</h2>
            <p style={styles.ctaText}>Get your free underfloor heating quote today. Our experts will help you choose the perfect system for your Auckland home.</p>
            <button 
              onClick={handleGetQuote}
              style={styles.ctaButton}
            >
              Get Free Quote Now
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa'
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '80px 0',
    textAlign: 'center'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  h1: {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    lineHeight: '1.2'
  },
  h2: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#333',
    textAlign: 'center'
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '15px',
    color: '#333'
  },
  lead: {
    fontSize: '1.25rem',
    marginBottom: '30px',
    opacity: '0.9',
    maxWidth: '800px',
    margin: '0 auto 30px'
  },
  ctaButton: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    padding: '15px 30px',
    fontSize: '1.1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block'
  },
  section: {
    padding: '60px 0',
    backgroundColor: 'white'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginTop: '40px'
  },
  feature: {
    textAlign: 'center',
    padding: '20px'
  },
  comparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '40px',
    marginTop: '40px'
  },
  system: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px'
  },
  systemList: {
    listStyle: 'none',
    padding: 0
  },
  systemListItem: {
    padding: '8px 0',
    borderBottom: '1px solid #eee'
  },
  costs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginTop: '40px'
  },
  costItem: {
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px',
    textAlign: 'center'
  },
  note: {
    textAlign: 'center',
    marginTop: '30px',
    color: '#666',
    fontStyle: 'italic'
  },
  areas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '30px',
    marginTop: '30px'
  },
  suburbsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  },
  suburbGroup: {
    backgroundColor: '#f8f9fa',
    padding: '2rem',
    borderRadius: '10px',
    border: '1px solid #e9ecef'
  },
  areaColumn: {
    backgroundColor: '#f8f9fa',
    padding: '25px',
    borderRadius: '8px'
  },
  areaList: {
    listStyle: 'none',
    padding: 0
  },
  areaListItem: {
    padding: '5px 0',
    color: '#555'
  },
  faq: {
    maxWidth: '800px',
    margin: '0 auto',
    marginTop: '40px'
  },
  faqItem: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  ctaSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '80px 0',
    textAlign: 'center'
  },
  ctaText: {
    fontSize: '1.2rem',
    marginBottom: '30px',
    opacity: '0.9'
  }
};

export default UnderfloorHeatingPage;
