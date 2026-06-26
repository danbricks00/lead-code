import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const FloorHeatingWestAucklandPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Floor Heating West Auckland - Professional Installation & Service",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "West Auckland",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "West Auckland"
    },
    "serviceType": "Floor heating installation, installation",
    "description": "Professional floor heating installation and service in West Auckland, including Henderson, New Lynn, Glen Eden, and surrounding areas."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does floor heating cost in West Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Floor heating costs in West Auckland typically range from custom quote based on your floor plan for electric systems and Contact us for a free custom quote based on your specific floor plan and project requirements."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install floor heating in West Auckland homes and businesses?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive floor heating installation services throughout West Auckland, including Henderson, New Lynn, Glen Eden, Avondale, and all surrounding suburbs for both residential and commercial properties."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Floor Heating West Auckland — Professional Installation & Service | Heat NZ"
        description="Professional floor heating installation in West Auckland. Electric floor heating for Henderson, New Lynn, Glen Eden & all West Auckland suburbs. Free custom quotes."
        canonical="https://heat.nz/services/floor-heating-west-auckland"
        keywords="floor heating West Auckland, floor heating Henderson, floor heating New Lynn, floor heating Glen Eden, floor heating Avondale, electric floor heating West Auckland, electric floor heating West Auckland, radiant floor heating West Auckland, floor heating installation West Auckland, bathroom floor heating West Auckland, kitchen floor heating West Auckland, tile floor heating West Auckland, wooden floor heating West Auckland, concrete floor heating West Auckland, floor heating cost West Auckland, floor heating quotes West Auckland, floor heating maintenance West Auckland, floor heating repair West Auckland, underfloor heating West Auckland, heated floors West Auckland, floor warming systems West Auckland, electric heating mats West Auckland, floor heating thermostat West Auckland, floor heating timer West Auckland, floor heating energy efficient West Auckland, floor heating insulation West Auckland, floor heating insulation requirements West Auckland, floor heating installation time West Auckland, floor heating warranty West Auckland, floor heating guarantee West Auckland, floor heating retrofit West Auckland, floor heating new build West Auckland, floor heating renovation West Auckland"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
            Professional Floor Heating Installation in West Auckland
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            Transform your West Auckland home or business with our professional floor heating solutions. 
            Perfect for year-round comfort in Henderson, New Lynn, Glen Eden, and throughout West Auckland.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '50px' }}>
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>🏢 West Auckland Service Areas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>Henderson</div>
              <div>New Lynn</div>
              <div>Glen Eden</div>
              <div>Avondale</div>
              <div>Blockhouse Bay</div>
              <div>Te Atatu</div>
              <div>Lincoln</div>
              <div>Oratia</div>
              <div>Swanson</div>
              <div>Waitakere</div>
            </div>
          </div>
          
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>⚡ Floor Heating Solutions</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>✓ Electric floor heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Electric floor heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Bathroom floor heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Kitchen floor heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Whole house floor heating</li>
            </ul>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '40px' }}>
          <h2 style={{ color: '#333', marginBottom: '30px', textAlign: 'center' }}>Why Choose Floor Heating in West Auckland?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            <div>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🏠 Perfect for West Auckland Homes</h3>
              <p>Our floor heating systems are ideal for West Auckland's diverse housing stock, from heritage homes in Avondale to modern developments in Te Atatu.</p>
            </div>
            <div>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>💡 Energy Efficient</h3>
              <p>Save on energy bills with our efficient floor heating systems designed for New Zealand's climate and West Auckland's specific requirements.</p>
            </div>
            <div>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🛠️ Professional Installation</h3>
              <p>Our experienced team ensures proper installation with quality materials and thorough testing for peace of mind.</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Ready to Get Started?</h2>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
            Contact our West Auckland floor heating specialists for a free consultation and quote.
          </p>
          <a 
            href="/contact" 
            style={{ 
              background: '#007bff', 
              color: 'white', 
              padding: '15px 30px', 
              textDecoration: 'none', 
              borderRadius: '5px', 
              fontSize: '1.1rem',
              display: 'inline-block'
            }}
          >
            Get Free Quote
          </a>
        </div>

        <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h2 style={{ color: '#333', marginBottom: '30px', textAlign: 'center' }}>Related Services</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <a href="/services/underfloor-heating-west-auckland" style={{ textDecoration: 'none', color: '#333' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Underfloor Heating</h3>
                <p>Complete underfloor heating solutions for West Auckland homes and businesses.</p>
              </div>
            </a>
            <a href="/services/electric-tile-heating" style={{ textDecoration: 'none', color: '#333' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Electric Tile Heating</h3>
                <p>Professional electric tile heating installation for bathrooms and kitchens.</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FloorHeatingWestAucklandPage;
