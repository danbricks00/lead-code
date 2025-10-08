import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const ElectricVsHydronicPage = () => {
  const comparisonData = [
    {
      feature: "Installation Cost",
      electric: "$80-$150/m²",
      hydronic: "$120-$200/m²",
      winner: "electric"
    },
    {
      feature: "Operating Cost",
      electric: "Higher (electricity rates)",
      hydronic: "Lower (gas/heat pump)",
      winner: "hydronic"
    },
    {
      feature: "Installation Time",
      electric: "1-3 days",
      hydronic: "3-7 days",
      winner: "electric"
    },
    {
      feature: "Floor Height Increase",
      electric: "Minimal (3-5mm)",
      hydronic: "More (50-80mm)",
      winner: "electric"
    },
    {
      feature: "Energy Efficiency",
      electric: "Good for small areas",
      hydronic: "Excellent for large areas",
      winner: "hydronic"
    },
    {
      feature: "Individual Room Control",
      electric: "Excellent",
      hydronic: "Good (with zoning)",
      winner: "electric"
    },
    {
      feature: "Maintenance",
      electric: "Minimal",
      hydronic: "Annual servicing recommended",
      winner: "electric"
    },
    {
      feature: "Heating Response Time",
      electric: "Fast (15-30 minutes)",
      hydronic: "Slower (1-2 hours)",
      winner: "electric"
    }
  ];

  const electricPros = [
    "Lower upfront installation cost",
    "Faster installation time",
    "Perfect for renovations",
    "Individual room control",
    "Minimal maintenance",
    "Fast heating response",
    "Easy to install in existing homes",
    "Ideal for bathrooms and kitchens"
  ];

  const hydronicPros = [
    "Lower operating costs long-term",
    "More energy efficient for large areas",
    "Provides whole-house heating",
    "Compatible with renewable energy sources",
    "Longer lifespan",
    "Better for new builds",
    "Can integrate with existing heating systems",
    "More comfortable radiant heat"
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Electric vs Hydronic Underfloor Heating: Complete Comparison Guide",
    "description": "Compare electric and hydronic underfloor heating systems for Auckland homes. Learn costs, benefits, and which system is right for your project.",
    "author": {
      "@type": "Organization",
      "name": "Heat NZ"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Heat NZ",
      "logo": {
        "@type": "ImageObject",
        "url": "https://heat.nz/logo.png"
      }
    },
    "datePublished": "2024-01-15",
    "dateModified": "2024-01-15",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://heat.nz/blog/electric-vs-hydronic-underfloor-heating"
    },
    "image": "https://heat.nz/social-share.png",
    "articleSection": "Home Improvement",
    "keywords": "electric underfloor heating, hydronic underfloor heating, heating comparison, Auckland heating"
  };

  return (
    <Layout>
      <SEO
        title="Electric vs Hydronic Underfloor Heating - Complete Comparison Guide"
        description="Compare electric and hydronic underfloor heating systems for Auckland homes. Learn costs, benefits, installation, and which system suits your needs."
        canonical="https://heat.nz/blog/electric-vs-hydronic-underfloor-heating"
        keywords="electric vs hydronic underfloor heating, heating comparison Auckland, electric heating cost, hydronic heating benefits, underfloor heating guide"
        structuredData={structuredData}
      />
      
      <article style={styles.container}>
        {/* Hero Section */}
        <header style={styles.hero}>
          <h1>Electric vs Hydronic Underfloor Heating: Complete Comparison Guide</h1>
          <p style={styles.heroSubtitle}>
            Choosing the right underfloor heating system for your Auckland home. 
            Compare costs, benefits, and installation requirements.
          </p>
          <div style={styles.articleMeta}>
            <span>Published: January 15, 2024</span>
            <span>Reading time: 8 minutes</span>
          </div>
        </header>

        {/* Introduction */}
        <section style={styles.section}>
          <p style={styles.introText}>
            When considering underfloor heating for your Auckland home, one of the most important decisions 
            is choosing between electric and hydronic systems. Both offer excellent heating solutions, but 
            they have different advantages depending on your specific needs, budget, and property type.
          </p>
        </section>

        {/* Quick Comparison Table */}
        <section style={styles.section}>
          <h2>Quick Comparison</h2>
          <div style={styles.comparisonTable}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>Feature</div>
              <div style={styles.tableCell}>Electric</div>
              <div style={styles.tableCell}>Hydronic</div>
            </div>
            {comparisonData.map((row, index) => (
              <div key={index} style={styles.tableRow}>
                <div style={styles.tableCell}>{row.feature}</div>
                <div style={{
                  ...styles.tableCell,
                  backgroundColor: row.winner === 'electric' ? '#e8f5e8' : '#f8f9fa'
                }}>
                  {row.electric}
                </div>
                <div style={{
                  ...styles.tableCell,
                  backgroundColor: row.winner === 'hydronic' ? '#e8f5e8' : '#f8f9fa'
                }}>
                  {row.hydronic}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Electric Underfloor Heating */}
        <section style={styles.section}>
          <h2>Electric Underfloor Heating</h2>
          <p>
            Electric underfloor heating uses heating cables or mats installed beneath your floor surface. 
            These systems convert electrical energy directly into heat, making them ideal for targeted heating 
            in specific areas.
          </p>
          
          <h3>How It Works</h3>
          <p>
            Electric heating elements are installed in a thin layer of self-leveling compound or directly 
            beneath floor tiles. When electricity passes through the heating cables, they warm up and 
            radiate heat upward through the floor surface.
          </p>

          <h3>Advantages of Electric Systems</h3>
          <ul style={styles.prosList}>
            {electricPros.map((pro, index) => (
              <li key={index}>{pro}</li>
            ))}
          </ul>

          <h3>Best For:</h3>
          <ul>
            <li>Bathrooms and kitchens</li>
            <li>Renovation projects</li>
            <li>Small to medium-sized rooms</li>
            <li>Supplementary heating</li>
            <li>Properties with limited space for pipework</li>
          </ul>
        </section>

        {/* Hydronic Underfloor Heating */}
        <section style={styles.section}>
          <h2>Hydronic Underfloor Heating</h2>
          <p>
            Hydronic systems use heated water circulated through pipes installed beneath the floor. 
            The water is heated by a boiler or heat pump and provides consistent, efficient heating 
            throughout the space.
          </p>
          
          <h3>How It Works</h3>
          <p>
            Hot water is circulated through a network of pipes embedded in the floor structure. 
            The pipes transfer heat to the floor surface, which then radiates warmth throughout the room.
          </p>

          <h3>Advantages of Hydronic Systems</h3>
          <ul style={styles.prosList}>
            {hydronicPros.map((pro, index) => (
              <li key={index}>{pro}</li>
            ))}
          </ul>

          <h3>Best For:</h3>
          <ul>
            <li>Whole-house heating</li>
            <li>New build projects</li>
            <li>Large open-plan areas</li>
            <li>Energy-efficient homes</li>
            <li>Properties with existing heating infrastructure</li>
          </ul>
        </section>

        {/* Cost Analysis */}
        <section style={styles.section}>
          <h2>Cost Analysis for Auckland Homes</h2>
          
          <h3>Installation Costs</h3>
          <div style={styles.costComparison}>
            <div style={styles.costCard}>
              <h4>Electric Systems</h4>
              <div style={styles.costAmount}>$80 - $150/m²</div>
              <p>Includes heating mats/cables, thermostat, and installation</p>
            </div>
            <div style={styles.costCard}>
              <h4>Hydronic Systems</h4>
              <div style={styles.costAmount}>$120 - $200/m²</div>
              <p>Includes pipework, boiler/heat pump, and installation</p>
            </div>
          </div>

          <h3>Operating Costs</h3>
          <p>
            While electric systems have lower upfront costs, hydronic systems typically offer lower 
            operating costs in the long term, especially for whole-house heating. The exact savings 
            depend on your electricity and gas rates, as well as usage patterns.
          </p>
        </section>

        {/* Making the Right Choice */}
        <section style={styles.section}>
          <h2>Making the Right Choice for Your Auckland Home</h2>
          
          <h3>Choose Electric If:</h3>
          <ul>
            <li>You're renovating an existing home</li>
            <li>You want to heat specific rooms (bathrooms, kitchens)</li>
            <li>You have budget constraints</li>
            <li>You need quick installation</li>
            <li>Floor height is a concern</li>
          </ul>

          <h3>Choose Hydronic If:</h3>
          <ul>
            <li>You're building a new home</li>
            <li>You want whole-house heating</li>
            <li>Energy efficiency is a priority</li>
            <li>You have access to gas or heat pump systems</li>
            <li>You're planning long-term residence</li>
          </ul>
        </section>

        {/* Auckland-Specific Considerations */}
        <section style={styles.section}>
          <h2>Auckland-Specific Considerations</h2>
          <p>
            Auckland's mild climate makes both electric and hydronic systems viable options. However, 
            consider these local factors:
          </p>
          <ul>
            <li><strong>Humidity:</strong> Both systems help reduce humidity in Auckland homes</li>
            <li><strong>Insulation:</strong> Proper insulation is crucial for efficiency in Auckland's variable climate</li>
            <li><strong>Power Supply:</strong> Auckland's reliable electricity grid supports electric systems well</li>
            <li><strong>Gas Availability:</strong> Hydronic systems work well with Auckland's gas infrastructure</li>
            <li><strong>Council Requirements:</strong> Check with Auckland Council for any specific requirements</li>
          </ul>
        </section>

        {/* CTA Section */}
        <section style={styles.ctaSection}>
          <h2>Need Help Choosing the Right System?</h2>
          <p>
            Our experienced team can assess your Auckland home and recommend the best underfloor 
            heating solution for your needs and budget.
          </p>
          <button 
            style={styles.ctaButton}
            onClick={() => window.open('/', '_self')}
          >
            Get Free Quote & Consultation
          </button>
        </section>
      </article>
    </Layout>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 20px 3rem',
    fontFamily: 'Inter, sans-serif',
    lineHeight: '1.7',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '2px solid #e5e7eb',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },
  articleMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    fontSize: '0.9rem',
    color: '#9ca3af',
  },
  section: {
    marginBottom: '3rem',
  },
  introText: {
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#374151',
    backgroundColor: '#f8f9fa',
    padding: '1.5rem',
    borderRadius: '10px',
    borderLeft: '4px solid #667eea',
  },
  comparisonTable: {
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    marginBottom: '2rem',
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
  tableCell: {
    padding: '1rem',
    borderRight: '1px solid #e5e7eb',
  },
  prosList: {
    backgroundColor: '#f0f9ff',
    padding: '1.5rem',
    borderRadius: '10px',
    borderLeft: '4px solid #0ea5e9',
  },
  costComparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
  },
  costCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '10px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  costAmount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '0.5rem',
  },
  ctaSection: {
    backgroundColor: '#f8f9fa',
    padding: '3rem 2rem',
    borderRadius: '15px',
    textAlign: 'center',
    marginTop: '3rem',
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

export default ElectricVsHydronicPage;
