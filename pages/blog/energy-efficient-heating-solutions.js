import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const EnergyEfficientHeatingPage = () => {
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Energy Efficient Heating Solutions for Auckland Homes",
    "description": "Discover the most energy-efficient heating solutions for Auckland homes. Compare underfloor heating, heat pumps, and other eco-friendly options for maximum comfort and savings.",
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
    "datePublished": "2024-01-25",
    "dateModified": "2024-01-25",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://heat.nz/blog/energy-efficient-heating-solutions"
    },
    "image": "https://heat.nz/social-share.png"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the most energy-efficient heating system for Auckland homes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For Auckland's moderate climate, hydronic underfloor heating with a heat pump is the most energy-efficient option, offering 300-400% efficiency. Electric underfloor heating with smart zoning is also highly efficient for targeted heating of specific areas."
        }
      },
      {
        "@type": "Question",
        "name": "How much can I save on energy bills with efficient heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Auckland homeowners typically save 30-50% on heating bills by switching to energy-efficient systems. Hydronic underfloor heating can save $400-800 annually compared to traditional heating, while proper zoning and smart controls can reduce costs by an additional 20-30%."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Energy Efficient Heating Solutions — Auckland Homeowners Guide | Heat NZ"
        description="Discover the most energy-efficient heating solutions for Auckland homes. Compare underfloor heating, heat pumps, and eco-friendly options for maximum comfort and savings."
        canonical="https://heat.nz/blog/energy-efficient-heating-solutions"
        keywords="energy efficient heating Auckland, eco-friendly heating, efficient heating systems, heating energy savings Auckland, sustainable heating solutions"
        structuredData={[articleData]}
        faqData={faqData}
      />
      
      <article style={styles.container}>
        {/* Hero Section */}
        <header style={styles.hero}>
          <h1>Energy Efficient Heating Solutions for Auckland Homes</h1>
          <p style={styles.heroSubtitle}>
            Discover the most energy-efficient heating options for Auckland's climate. 
            Learn how to maximize comfort while minimizing energy costs and environmental impact.
          </p>
          <div style={styles.articleMeta}>
            <span>Published: January 25, 2024</span>
            <span>Reading time: 8 minutes</span>
          </div>
        </header>

        <div style={styles.content}>
          <p style={styles.lead}>
            With rising energy costs and growing environmental awareness, Auckland homeowners are increasingly 
            seeking energy-efficient heating solutions. The right system can reduce energy bills by 30-50% 
            while providing superior comfort and environmental benefits.
          </p>

          <h2 style={styles.heading}>Why Energy Efficiency Matters in Auckland</h2>
          <p>
            Auckland's moderate climate makes it ideal for energy-efficient heating systems. With mild winters 
            and relatively stable temperatures, properly designed systems can provide year-round comfort without 
            excessive energy consumption.
          </p>

          <h3 style={styles.subHeading}>Energy Cost Savings</h3>
          <ul style={styles.list}>
            <li><strong>30-50% reduction</strong> in heating bills compared to traditional systems</li>
            <li><strong>Lower operating costs</strong> over the system's 5+ year lifespan</li>
            <li><strong>Reduced peak demand</strong> charges during winter months</li>
            <li><strong>Better ROI</strong> through energy savings and increased property value</li>
          </ul>

          <h3 style={styles.subHeading}>Environmental Benefits</h3>
          <ul style={styles.list}>
            <li>Reduced carbon footprint and greenhouse gas emissions</li>
            <li>Lower demand on Auckland's electricity grid</li>
            <li>Support for New Zealand's renewable energy goals</li>
            <li>Contribution to sustainable living practices</li>
          </ul>

          <h2 style={styles.heading}>Most Energy-Efficient Heating Options</h2>

          <h3 style={styles.subHeading}>1. Hydronic Underfloor Heating with Heat Pump</h3>
          <p>
            <strong>Efficiency Rating: 300-400%</strong>
          </p>
          <p>
            This combination offers the highest efficiency for Auckland homes:
          </p>
          <ul style={styles.list}>
            <li>Heat pumps extract heat from air, ground, or water</li>
            <li>Hydronic system distributes heat evenly through floors</li>
            <li>Operates at low temperatures (35-45°C) for maximum efficiency</li>
            <li>Can provide both heating and cooling</li>
            <li>Works excellently with solar panel systems</li>
          </ul>

          <h3 style={styles.subHeading}>2. Smart Electric Underfloor Heating</h3>
          <p>
            <strong>Efficiency Rating: 100% (with smart controls up to 95% effective)</strong>
          </p>
          <p>
            Modern electric systems with intelligent controls:
          </p>
          <ul style={styles.list}>
            <li>Zone-specific heating for targeted comfort</li>
            <li>Smart thermostats with learning capabilities</li>
            <li>App-based control and scheduling</li>
            <li>Integration with home automation systems</li>
            <li>Perfect for renovations and additions</li>
          </ul>

          <h3 style={styles.subHeading}>3. Heat Pump Systems</h3>
          <p>
            <strong>Efficiency Rating: 250-350%</strong>
          </p>
          <p>
            Standalone heat pump solutions:
          </p>
          <ul style={styles.list}>
            <li>Air-to-air heat pumps for quick heating</li>
            <li>Ducted systems for whole-house comfort</li>
            <li>Reverse cycle for year-round temperature control</li>
            <li>Lower installation costs than underfloor systems</li>
          </ul>

          <h2 style={styles.heading}>Energy Efficiency Features to Look For</h2>

          <h3 style={styles.subHeading}>Smart Controls and Zoning</h3>
          <ul style={styles.list}>
            <li><strong>Programmable thermostats:</strong> Schedule heating based on occupancy</li>
            <li><strong>Zone control:</strong> Heat only occupied areas</li>
            <li><strong>Learning algorithms:</strong> Adapt to your lifestyle patterns</li>
            <li><strong>Remote access:</strong> Control heating from anywhere</li>
            <li><strong>Energy monitoring:</strong> Track usage and optimize settings</li>
          </ul>

          <h3 style={styles.subHeading}>Insulation and Building Envelope</h3>
          <ul style={styles.list}>
            <li><strong>Proper insulation:</strong> R-3.0+ for Auckland climate</li>
            <li><strong>Thermal breaks:</strong> Prevent heat loss through structure</li>
            <li><strong>Air sealing:</strong> Eliminate drafts and heat loss</li>
            <li><strong>High-performance windows:</strong> Double or triple glazing</li>
            <li><strong>Thermal mass:</strong> Use materials that store and release heat</li>
          </ul>

          <h2 style={styles.heading}>Comparing Efficiency by System Type</h2>

          <div style={styles.comparisonTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>System Type</th>
                  <th style={styles.th}>Efficiency</th>
                  <th style={styles.th}>Annual Savings</th>
                  <th style={styles.th}>Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.td}>Hydronic + Heat Pump</td>
                  <td style={styles.td}>300-400%</td>
                  <td style={styles.td}>$600-1200</td>
                  <td style={styles.td}>New builds, whole house</td>
                </tr>
                <tr>
                  <td style={styles.td}>Smart Electric UF</td>
                  <td style={styles.td}>95% effective</td>
                  <td style={styles.td}>$400-800</td>
                  <td style={styles.td}>Renovations, bathrooms</td>
                </tr>
                <tr>
                  <td style={styles.td}>Heat Pump Only</td>
                  <td style={styles.td}>250-350%</td>
                  <td style={styles.td}>$300-600</td>
                  <td style={styles.td}>Existing homes</td>
                </tr>
                <tr>
                  <td style={styles.td}>Traditional Heating</td>
                  <td style={styles.td}>60-80%</td>
                  <td style={styles.td}>Baseline</td>
                  <td style={styles.td}>Legacy systems</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 style={styles.heading}>Maximizing Energy Efficiency</h2>

          <h3 style={styles.subHeading}>System Design Principles</h3>
          <ul style={styles.list}>
            <li><strong>Right-sizing:</strong> Match system capacity to actual heating needs</li>
            <li><strong>Proper zoning:</strong> Control heating in individual rooms or areas</li>
            <li><strong>Load balancing:</strong> Distribute heating load evenly</li>
            <li><strong>Thermal stratification:</strong> Use natural convection patterns</li>
          </ul>

          <h3 style={styles.subHeading}>Operational Efficiency</h3>
          <ul style={styles.list}>
            <li><strong>Temperature setbacks:</strong> Lower heating when away</li>
            <li><strong>Occupancy sensors:</strong> Heat only occupied spaces</li>
            <li><strong>Weather compensation:</strong> Adjust heating based on outdoor conditions</li>
            <li><strong>Maintenance schedules:</strong> Keep systems running optimally</li>
          </ul>

          <h2 style={styles.heading}>Integration with Renewable Energy</h2>

          <h3 style={styles.subHeading}>Solar Panel Integration</h3>
          <p>
            Auckland's excellent solar conditions make renewable energy integration highly beneficial:
          </p>
          <ul style={styles.list}>
            <li>Solar panels can power electric underfloor heating during daylight</li>
            <li>Excess solar energy can heat water for hydronic systems</li>
            <li>Battery storage extends solar benefits into evening hours</li>
            <li>Net metering provides credits for excess energy generation</li>
          </ul>

          <h3 style={styles.subHeading}>Heat Pump + Solar Combination</h3>
          <ul style={styles.list}>
            <li>Solar panels power heat pump operation</li>
            <li>Reduces grid electricity demand by 60-80%</li>
            <li>Payback period typically 6-8 years in Auckland</li>
            <li>Significant reduction in carbon footprint</li>
          </ul>

          <h2 style={styles.heading}>Financial Incentives and Rebates</h2>

          <h3 style={styles.subHeading}>Available Incentives</h3>
          <ul style={styles.list}>
            <li><strong>EECA funding:</strong> Energy Efficiency and Conservation Authority grants</li>
            <li><strong>Local council programs:</strong> Auckland Council sustainability initiatives</li>
            <li><strong>Bank financing:</strong> Green loans with favorable terms</li>
            <li><strong>Insurance benefits:</strong> Lower premiums for energy-efficient homes</li>
          </ul>

          <h3 style={styles.subHeading}>Long-term Value</h3>
          <ul style={styles.list}>
            <li>Increased property value (typically 3-5%)</li>
            <li>Faster sale times in competitive markets</li>
            <li>Lower maintenance costs over system lifetime</li>
            <li>Future-proofing against rising energy costs</li>
          </ul>

          <div style={styles.cta}>
            <h3>Ready to Upgrade to Energy-Efficient Heating?</h3>
            <p>
              Heat NZ specializes in energy-efficient underfloor heating solutions for Auckland homes. 
              Our experts can help you choose the most efficient system for your specific needs and budget.
            </p>
            <button 
              onClick={() => {
                const chatBubble = document.querySelector('[data-chat-bubble]');
                if (chatBubble) chatBubble.click();
              }}
              style={styles.ctaButton}
            >
              Get Free Energy Efficiency Quote
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
  list: {
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

export default EnergyEfficientHeatingPage;
