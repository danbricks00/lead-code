import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const RenovationHeatingPage = () => {
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Renovation Heating Options for Auckland Homes",
    "description": "Complete guide to heating options for Auckland home renovations. Learn about electric underfloor heating, hydronic systems, and heating solutions for different renovation scenarios.",
    "author": {
      "@type": "Organization",
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Heat NZ",
      "logo": {
        "@type": "ImageObject",
        "url": "https://heat.nz/logo.png"
      }
    },
    "datePublished": "2024-01-30",
    "dateModified": "2024-01-30",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://heat.nz/blog/renovation-heating-options"
    },
    "image": "https://heat.nz/social-share.png"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What heating system is best for bathroom renovations in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Electric underfloor heating is ideal for bathroom renovations. It provides quick, even heating, minimal floor height increase (3-5mm), and can be installed in 1-2 days. Perfect for Auckland's humid climate as it reduces moisture and prevents cold tiles."
        }
      },
      {
        "@type": "Question",
        "name": "Can I install underfloor heating in an existing Auckland home?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Electric underfloor heating is perfect for existing homes. It requires minimal structural changes, can be installed under most floor coverings, and adds only 3-5mm to floor height. Hydronic systems are better for new builds or major renovations where you can access the subfloor."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Renovation Heating Options — Auckland Home Renovation Guide | Heat NZ"
        description="Complete guide to heating options for Auckland home renovations. Electric underfloor heating, hydronic systems, and heating solutions for bathrooms, kitchens, and whole-house renovations."
        canonical="https://heat.nz/blog/renovation-heating-options"
        keywords="renovation heating Auckland, bathroom heating renovation, kitchen heating renovation, electric underfloor heating renovation, heating options existing homes Auckland"
        structuredData={[articleData]}
        faqData={faqData}
      />
      
      <article style={styles.container}>
        {/* Hero Section */}
        <header style={styles.hero}>
          <h1>Renovation Heating Options for Auckland Homes</h1>
          <p style={styles.heroSubtitle}>
            Complete guide to choosing the right heating system for your Auckland home renovation. 
            From bathroom upgrades to whole-house renovations, find the perfect heating solution.
          </p>
          <div style={styles.articleMeta}>
            <span>Published: January 30, 2024</span>
            <span>Reading time: 7 minutes</span>
          </div>
        </header>

        <div style={styles.content}>
          <p style={styles.lead}>
            Renovating your Auckland home presents the perfect opportunity to upgrade your heating system. 
            Whether you're renovating a single room or undertaking a major home transformation, 
            the right heating choice can significantly improve comfort, energy efficiency, and property value.
          </p>

          <h2 style={styles.heading}>Heating Options by Renovation Type</h2>

          <h3 style={styles.subHeading}>Bathroom Renovations</h3>
          <p>
            Bathrooms are the most popular rooms for underfloor heating installation during renovations:
          </p>

          <h4 style={styles.subSubHeading}>Electric Underfloor Heating (Recommended)</h4>
          <ul style={styles.list}>
            <li><strong>Quick installation:</strong> 1-2 days for typical bathroom</li>
            <li><strong>Minimal floor height:</strong> Only 3-5mm increase</li>
            <li><strong>Perfect for tiles:</strong> Eliminates cold bathroom floors</li>
            <li><strong>Individual control:</strong> Separate thermostat for bathroom</li>
            <li><strong>Moisture benefits:</strong> Reduces humidity and condensation</li>
          </ul>

          <h4 style={styles.subSubHeading}>Installation Process</h4>
          <ol style={styles.numberedList}>
            <li>Floor preparation and leveling</li>
            <li>Insulation board installation</li>
            <li>Heating mat or cable installation</li>
            <li>Thermostat and electrical connection</li>
            <li>Tile or floor covering installation</li>
          </ol>

          <h3 style={styles.subHeading}>Kitchen Renovations</h3>
          <p>
            Kitchens benefit greatly from underfloor heating, especially with hard flooring:
          </p>

          <ul style={styles.list}>
            <li><strong>Comfort underfoot:</strong> Warm floors during food preparation</li>
            <li><strong>Even heat distribution:</strong> No cold spots in large kitchen areas</li>
            <li><strong>Space saving:</strong> No need for radiators or heating units</li>
            <li><strong>Easy cleaning:</strong> Smooth, uninterrupted floor surface</li>
            <li><strong>Child safety:</strong> No hot surfaces or sharp edges</li>
          </ul>

          <h3 style={styles.subHeading}>Whole House Renovations</h3>
          <p>
            Major renovations offer the opportunity for comprehensive heating upgrades:
          </p>

          <h4 style={styles.subSubHeading}>Hydronic Underfloor Heating</h4>
          <ul style={styles.list}>
            <li><strong>Whole-house coverage:</strong> Consistent heating throughout</li>
            <li><strong>Energy efficient:</strong> Lower operating costs long-term</li>
            <li><strong>Zone control:</strong> Different temperatures for different areas</li>
            <li><strong>Integration options:</strong> Can work with heat pumps or solar</li>
            <li><strong>High property value:</strong> Premium feature for resale</li>
          </ul>

          <h4 style={styles.subSubHeading}>Electric Underfloor Heating</h4>
          <ul style={styles.list}>
            <li><strong>Room-by-room installation:</strong> Install as needed</li>
            <li><strong>Individual control:</strong> Each room has its own thermostat</li>
            <li><strong>Flexible zoning:</strong> Heat only occupied areas</li>
            <li><strong>Quick response:</strong> Fast heating when needed</li>
            <li><strong>Lower upfront cost:</strong> More affordable per room</li>
          </ul>

          <h2 style={styles.heading}>Renovation-Specific Considerations</h2>

          <h3 style={styles.subHeading}>Floor Height Constraints</h3>
          <p>
            Different renovation scenarios have different floor height limitations:
          </p>

          <div style={styles.comparisonTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Floor Type</th>
                  <th style={styles.th}>Electric UF Height</th>
                  <th style={styles.th}>Hydronic UF Height</th>
                  <th style={styles.th}>Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.td}>Tile over concrete</td>
                  <td style={styles.td}>3-5mm</td>
                  <td style={styles.td}>50-80mm</td>
                  <td style={styles.td}>Electric for existing</td>
                </tr>
                <tr>
                  <td style={styles.td}>Timber subfloor</td>
                  <td style={styles.td}>8-12mm</td>
                  <td style={styles.td}>60-90mm</td>
                  <td style={styles.td}>Either system</td>
                </tr>
                <tr>
                  <td style={styles.td}>New concrete slab</td>
                  <td style={styles.td}>3-5mm</td>
                  <td style={styles.td}>Embedded in slab</td>
                  <td style={styles.td}>Hydronic preferred</td>
                </tr>
                <tr>
                  <td style={styles.td}>Upper floor renovation</td>
                  <td style={styles.td}>3-5mm</td>
                  <td style={styles.td}>Not recommended</td>
                  <td style={styles.td}>Electric only</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style={styles.subHeading}>Electrical Requirements</h3>
          <ul style={styles.list}>
            <li><strong>Existing wiring assessment:</strong> Check current electrical capacity</li>
            <li><strong>Circuit requirements:</strong> Dedicated circuits for heating zones</li>
            <li><strong>RCD protection:</strong> Safety switches for all heating circuits</li>
            <li><strong>Load calculations:</strong> Ensure adequate electrical supply</li>
            <li><strong>Professional installation:</strong> Licensed electrician required</li>
          </ul>

          <h3 style={styles.subHeading}>Timing and Coordination</h3>
          <ul style={styles.list}>
            <li><strong>Early planning:</strong> Include heating in initial design phase</li>
            <li><strong>Trade coordination:</strong> Schedule heating installation with other trades</li>
            <li><strong>Floor covering timing:</strong> Coordinate with tile/flooring installation</li>
            <li><strong>Electrical work:</strong> Plan wiring before wall finishes</li>
            <li><strong>Testing phase:</strong> Allow time for system commissioning</li>
          </ul>

          <h2 style={styles.heading}>Cost Considerations for Renovations</h2>

          <h3 style={styles.subHeading}>Electric Underfloor Heating Costs</h3>
          <ul style={styles.list}>
            <li><strong>Bathroom (4m²):</strong> $500-800 including installation</li>
            <li><strong>Kitchen (15m²):</strong> $1,500-2,500 including installation</li>
            <li><strong>Master bedroom (20m²):</strong> $2,000-3,200 including installation</li>
            <li><strong>Living area (30m²):</strong> $3,000-4,800 including installation</li>
          </ul>

          <h3 style={styles.subHeading}>Hydronic Underfloor Heating Costs</h3>
          <ul style={styles.list}>
            <li><strong>Whole house (100m²):</strong> $15,000-25,000 including boiler</li>
            <li><strong>Zone addition (20m²):</strong> $3,000-5,000 per zone</li>
            <li><strong>Boiler upgrade:</strong> $5,000-10,000 for high-efficiency unit</li>
            <li><strong>Heat pump integration:</strong> $8,000-15,000 additional</li>
          </ul>

          <h2 style={styles.heading}>Popular Renovation Scenarios</h2>

          <h3 style={styles.subHeading}>Heritage Home Renovations</h3>
          <p>
            Auckland's character homes require careful heating integration:
          </p>
          <ul style={styles.list}>
            <li><strong>Minimal disruption:</strong> Electric systems require less structural work</li>
            <li><strong>Heritage compliance:</strong> Maintain original floor levels where possible</li>
            <li><strong>Discrete installation:</strong> Hide controls and wiring in period-appropriate locations</li>
            <li><strong>Zone flexibility:</strong> Heat only renovated areas initially</li>
          </ul>

          <h3 style={styles.subHeading}>Modern Home Upgrades</h3>
          <p>
            Contemporary Auckland homes can accommodate advanced heating systems:
          </p>
          <ul style={styles.list}>
            <li><strong>Smart home integration:</strong> Connect to home automation systems</li>
            <li><strong>Energy efficiency:</strong> Combine with solar panels and heat pumps</li>
            <li><strong>Open-plan living:</strong> Consistent heating across large spaces</li>
            <li><strong>Premium finishes:</strong> Complement high-end renovation materials</li>
          </ul>

          <h3 style={styles.subHeading}>Apartment and Unit Renovations</h3>
          <p>
            Strata properties have specific considerations:
          </p>
          <ul style={styles.list}>
            <li><strong>Body corporate approval:</strong> May be required for major installations</li>
            <li><strong>Noise considerations:</strong> Electric systems are completely silent</li>
            <li><strong>Individual metering:</strong> Separate billing for heating costs</li>
            <li><strong>Space constraints:</strong> Electric systems ideal for compact spaces</li>
          </ul>

          <h2 style={styles.heading}>Planning Your Renovation Heating</h2>

          <h3 style={styles.subHeading}>Step-by-Step Planning Process</h3>
          <ol style={styles.numberedList}>
            <li><strong>Assess current heating:</strong> Evaluate existing system efficiency</li>
            <li><strong>Define heating zones:</strong> Plan which areas need heating</li>
            <li><strong>Choose system type:</strong> Electric vs hydronic based on renovation scope</li>
            <li><strong>Get professional quotes:</strong> Multiple quotes from qualified installers</li>
            <li><strong>Plan installation timing:</strong> Coordinate with other renovation work</li>
            <li><strong>Consider future needs:</strong> Plan for potential expansion</li>
          </ol>

          <h3 style={styles.subHeading}>Questions to Ask Your Installer</h3>
          <ul style={styles.list}>
            <li>What system is best for my specific renovation?</li>
            <li>How will installation affect my renovation timeline?</li>
            <li>What warranties and guarantees are provided?</li>
            <li>Can the system be expanded in the future?</li>
            <li>What maintenance will be required?</li>
            <li>How will heating costs compare to my current system?</li>
          </ul>

          <div style={styles.cta}>
            <h3>Planning a Heating Renovation?</h3>
            <p>
              Heat NZ specializes in heating solutions for Auckland home renovations. 
              Our experts can help you choose the perfect system for your renovation project, 
              whether it's a single room or whole-house upgrade.
            </p>
            <button 
              onClick={() => {
                const chatBubble = document.querySelector('[data-chat-bubble]');
                if (chatBubble) chatBubble.click();
              }}
              style={styles.ctaButton}
            >
              Get Renovation Heating Quote
            </button>
          </div>
        </div>
      </article>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Inter, sans-serif',
    lineHeight: '1.6',
    color: '#333'
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem 0',
    borderBottom: '2px solid #e9ecef'
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '1rem',
    maxWidth: '600px',
    margin: '0 auto 1rem auto'
  },
  articleMeta: {
    color: '#888',
    fontSize: '0.9rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem'
  },
  content: {
    fontSize: '1.1rem'
  },
  lead: {
    fontSize: '1.2rem',
    fontWeight: '500',
    color: '#444',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea'
  },
  heading: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginTop: '2.5rem',
    marginBottom: '1rem',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '0.5rem'
  },
  subHeading: {
    fontSize: '1.4rem',
    color: '#34495e',
    marginTop: '1.5rem',
    marginBottom: '0.8rem'
  },
  subSubHeading: {
    fontSize: '1.2rem',
    color: '#2c3e50',
    marginTop: '1rem',
    marginBottom: '0.5rem'
  },
  list: {
    marginBottom: '1.5rem',
    paddingLeft: '1.5rem'
  },
  numberedList: {
    marginBottom: '1.5rem',
    paddingLeft: '1.5rem'
  },
  comparisonTable: {
    margin: '2rem 0',
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  th: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '600'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #e9ecef'
  },
  cta: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '2rem',
    borderRadius: '10px',
    textAlign: 'center',
    marginTop: '3rem'
  },
  ctaButton: {
    background: 'white',
    color: '#667eea',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease'
  }
};

export default RenovationHeatingPage;
