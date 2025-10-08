import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const UnderfloorHeatingMaintenancePage = () => {
  const articleData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Underfloor Heating Maintenance Tips for Auckland Homes",
    "description": "Essential maintenance tips for underfloor heating systems in Auckland. Learn how to keep your electric and hydronic heating running efficiently year-round.",
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
    "datePublished": "2024-01-20",
    "dateModified": "2024-01-20",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://heat.nz/blog/underfloor-heating-maintenance-tips"
    },
    "image": "https://heat.nz/social-share.png"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How often should I service my underfloor heating system in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Electric underfloor heating systems require minimal maintenance - just annual thermostat checks. Hydronic systems should be professionally serviced annually, including boiler maintenance, pump checks, and system flushing to prevent buildup."
        }
      },
      {
        "@type": "Question",
        "name": "What maintenance can I do myself for underfloor heating?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can clean thermostats, check for loose connections, monitor energy usage, and ensure proper insulation. For hydronic systems, check for leaks and ensure proper water pressure. Always consult a professional for electrical or plumbing work."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Underfloor Heating Maintenance Tips — Auckland Homeowners Guide | Heat NZ"
        description="Essential maintenance tips for underfloor heating systems in Auckland. Annual servicing, DIY checks, and troubleshooting guide for electric and hydronic heating systems."
        canonical="https://heat.nz/blog/underfloor-heating-maintenance-tips"
        keywords="underfloor heating maintenance Auckland, heating system servicing, electric heating maintenance, hydronic heating maintenance, heating system care Auckland"
        structuredData={[articleData]}
        faqData={faqData}
      />
      
      <article style={styles.container}>
        {/* Hero Section */}
        <header style={styles.hero}>
          <h1>Underfloor Heating Maintenance Tips for Auckland Homes</h1>
          <p style={styles.heroSubtitle}>
            Keep your underfloor heating system running efficiently year-round with our comprehensive maintenance guide. 
            Learn essential tips for electric and hydronic systems in Auckland's climate.
          </p>
          <div style={styles.articleMeta}>
            <span>Published: January 20, 2024</span>
            <span>Reading time: 6 minutes</span>
          </div>
        </header>

        <div style={styles.content}>
          <p style={styles.lead}>
            Proper maintenance is crucial for keeping your underfloor heating system operating efficiently and extending its lifespan. 
            Auckland's moderate climate and humidity levels require specific maintenance considerations for both electric and hydronic systems.
          </p>

          <h2 style={styles.heading}>Annual Maintenance Schedule</h2>
          <p>
            Creating a regular maintenance schedule helps prevent costly repairs and ensures optimal performance. 
            Here's what Auckland homeowners should do throughout the year:
          </p>

          <h3 style={styles.subHeading}>Pre-Winter Maintenance (April-May)</h3>
          <ul style={styles.list}>
            <li>Test all thermostats and heating zones</li>
            <li>Clean dust and debris from thermostats and controls</li>
            <li>Check for any visible damage to heating elements or pipes</li>
            <li>Verify proper insulation around heating systems</li>
            <li>Schedule professional inspection for hydronic systems</li>
          </ul>

          <h3 style={styles.subHeading}>Mid-Winter Check (July-August)</h3>
          <ul style={styles.list}>
            <li>Monitor energy consumption and heating efficiency</li>
            <li>Check for any unusual sounds or temperature variations</li>
            <li>Ensure proper air circulation around heating systems</li>
            <li>Clean air vents and ensure unobstructed airflow</li>
          </ul>

          <h3 style={styles.subHeading}>Post-Winter Maintenance (September-October)</h3>
          <ul style={styles.list}>
            <li>Clean and inspect all system components</li>
            <li>Check for any leaks or damage that occurred during heavy use</li>
            <li>Test system shutdown procedures</li>
            <li>Plan any necessary repairs or upgrades</li>
          </ul>

          <h2 style={styles.heading}>Electric Underfloor Heating Maintenance</h2>
          <p>
            Electric systems require minimal maintenance but benefit from regular checks:
          </p>

          <h3 style={styles.subHeading}>DIY Maintenance Tasks</h3>
          <ul style={styles.list}>
            <li><strong>Thermostat Cleaning:</strong> Gently clean thermostats with a dry cloth to remove dust</li>
            <li><strong>Connection Checks:</strong> Ensure all electrical connections are secure and undamaged</li>
            <li><strong>Floor Surface Care:</strong> Avoid placing heavy furniture directly over heating elements</li>
            <li><strong>Temperature Monitoring:</strong> Watch for uneven heating patterns that might indicate issues</li>
          </ul>

          <h3 style={styles.subHeading}>Professional Servicing</h3>
          <p>
            While electric systems are low-maintenance, professional checks every 2-3 years help ensure:
          </p>
          <ul style={styles.list}>
            <li>Proper electrical connections and safety</li>
            <li>Optimal thermostat calibration</li>
            <li>System efficiency and performance</li>
            <li>Early detection of potential issues</li>
          </ul>

          <h2 style={styles.heading}>Hydronic Underfloor Heating Maintenance</h2>
          <p>
            Hydronic systems require more regular maintenance due to their complex plumbing and boiler components:
          </p>

          <h3 style={styles.subHeading}>Annual Professional Servicing</h3>
          <ul style={styles.list}>
            <li><strong>Boiler Maintenance:</strong> Annual inspection, cleaning, and safety checks</li>
            <li><strong>Pump Servicing:</strong> Check pump operation and replace worn components</li>
            <li><strong>System Flushing:</strong> Remove sediment and mineral buildup from pipes</li>
            <li><strong>Pressure Testing:</strong> Ensure proper system pressure and identify leaks</li>
            <li><strong>Chemical Treatment:</strong> Add corrosion inhibitors and water treatment</li>
          </ul>

          <h3 style={styles.subHeading}>Regular Monitoring Tasks</h3>
          <ul style={styles.list}>
            <li>Check boiler pressure gauge weekly during heating season</li>
            <li>Monitor energy consumption and heating efficiency</li>
            <li>Listen for unusual sounds from pumps or boilers</li>
            <li>Watch for water leaks or pressure drops</li>
          </ul>

          <h2 style={styles.heading}>Common Maintenance Issues in Auckland</h2>
          
          <h3 style={styles.subHeading}>Humidity-Related Problems</h3>
          <p>
            Auckland's high humidity can cause:
          </p>
          <ul style={styles.list}>
            <li>Corrosion in hydronic systems</li>
            <li>Thermostat condensation issues</li>
            <li>Insulation degradation</li>
          </ul>

          <h3 style={styles.subHeading}>Prevention Strategies</h3>
          <ul style={styles.list}>
            <li>Ensure proper ventilation around heating systems</li>
            <li>Use dehumidifiers in areas with high moisture</li>
            <li>Regular inspection of pipes and connections</li>
            <li>Proper insulation to prevent condensation</li>
          </ul>

          <h2 style={styles.heading}>Troubleshooting Common Problems</h2>

          <h3 style={styles.subHeading}>System Not Heating</h3>
          <ul style={styles.list}>
            <li>Check thermostat settings and power supply</li>
            <li>Verify circuit breaker hasn't tripped</li>
            <li>Ensure heating zone is activated</li>
            <li>Check for error codes on digital thermostats</li>
          </ul>

          <h3 style={styles.subHeading}>Uneven Heating</h3>
          <ul style={styles.list}>
            <li>Check for furniture blocking heat distribution</li>
            <li>Verify proper floor covering installation</li>
            <li>Test individual heating zones</li>
            <li>Check for damaged heating elements or pipes</li>
          </ul>

          <h3 style={styles.subHeading}>High Energy Bills</h3>
          <ul style={styles.list}>
            <li>Check thermostat programming and settings</li>
            <li>Verify proper insulation levels</li>
            <li>Monitor heating patterns and usage</li>
            <li>Consider zone-specific temperature controls</li>
          </ul>

          <div style={styles.cta}>
            <h3>Need Professional Maintenance Service?</h3>
            <p>
              Heat NZ provides comprehensive underfloor heating maintenance services throughout Auckland. 
              Our certified technicians can help keep your system running efficiently and extend its lifespan.
            </p>
            <button 
              onClick={() => {
                const chatBubble = document.querySelector('[data-chat-bubble]');
                if (chatBubble) chatBubble.click();
              }}
              style={styles.ctaButton}
            >
              Book Maintenance Service
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

export default UnderfloorHeatingMaintenancePage;
