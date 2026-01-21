import React from 'react';
import Layout from '../../components/Layout';
import SEO from '../../components/SEO';

const TileHeatingNewmarketPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Tile Heating Newmarket - Electric Under Tile Heating Installation",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ",
      "url": "https://heat.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Newmarket",
        "addressRegion": "Auckland",
        "addressCountry": "NZ"
      }
    },
    "areaServed": {
      "@type": "Place",
      "name": "Newmarket, Auckland"
    },
    "serviceType": "Tile heating installation, under tile heating, electric tile heating",
    "description": "Professional tile heating installation in Newmarket, Auckland. Electric under tile heating perfect for bathrooms, kitchens & wet areas in this central Auckland suburb."
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does tile heating cost in Newmarket?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tile heating costs in Newmarket typically range from $85-$165 per square meter for electric systems, including installation. Newmarket's central location may have slightly higher costs due to access requirements and parking considerations."
        }
      },
      {
        "@type": "Question",
        "name": "Do you install tile heating in Newmarket apartments and apartments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we specialize in tile heating installation in Newmarket's high-rise apartments and commercial buildings. We work with body corporates and understand the specific requirements for apartment installations in this busy central suburb."
        }
      }
    ]
  };

  return (
    <Layout>
      <SEO
        title="Tile Heating Newmarket — Electric Under Tile Heating Installation | Heat NZ"
        description="Professional tile heating installation in Newmarket, Auckland. Electric under tile heating for bathrooms, kitchens & wet areas. From $85-$165/m². Free quotes for Newmarket properties."
        canonical="https://heat.nz/services/tile-heating-newmarket"
        keywords="tile heating Newmarket, under tile heating Newmarket, floor heating Newmarket, electric tile heating Newmarket, electric under tile heating Newmarket, tile heating Auckland Newmarket, under tile heating Auckland Newmarket, electric tile heating Auckland Newmarket, bathroom heating Newmarket, kitchen heating Newmarket, wet area heating Newmarket, tile floor heating Newmarket, electric under tile heating Auckland Newmarket, heating mats under tiles Newmarket, tile heating installation Newmarket, under tile heating installation Newmarket, electric heating mats Newmarket, tile heating cost Newmarket, bathroom tile heating Newmarket, kitchen tile heating Newmarket, wet area tile heating Newmarket, ceramic tile heating Newmarket, porcelain tile heating Newmarket, stone tile heating Newmarket, mosaic tile heating Newmarket, electric heating cables under tiles Newmarket, tile heating systems Newmarket, bathroom underfloor heating Newmarket, kitchen underfloor heating Newmarket, electric floor heating tiles Newmarket, radiant tile heating Newmarket, electric heating installation under tiles Newmarket, tile heating thermostat Newmarket, tile heating timer Newmarket, tile heating energy efficient Newmarket, tile heating insulation Newmarket, tile heating installation time Newmarket, tile heating warranty Newmarket, tile heating guarantee Newmarket, tile heating retrofit Newmarket, tile heating new build Newmarket, tile heating renovation Newmarket"
        structuredData={[structuredData, faqData]}
      />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '20px', textAlign: 'center' }}>
            Tile Heating Installation in Newmarket, Auckland
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            Transform your Newmarket home or business with our professional tile heating solutions. 
            Perfect for the thriving commercial and residential area of Newmarket in central Auckland.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', marginBottom: '50px' }}>
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>🏢 Newmarket Area Coverage</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '10px' }}>
              <div>Newmarket Central</div>
              <div>Broadway</div>
              <div>Carlton Gore Road</div>
              <div>Khyber Pass</div>
              <div>Remuera Road (Newmarket section)</div>
              <div>Gillies Avenue</div>
              <div>Great South Road (Newmarket)</div>
              <div>Mortimer Pass</div>
              <div>Teed Street</div>
              <div>Manukau Road (Newmarket)</div>
            </div>
          </div>
          
          <div style={{ background: '#f8f9fa', padding: '30px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>⚡ Tile Heating Solutions</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '10px' }}>✓ Electric tile heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Bathroom tile heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Kitchen tile heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Wet area heating</li>
              <li style={{ marginBottom: '10px' }}>✓ Commercial installations</li>
            </ul>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '40px' }}>
          <h2 style={{ color: '#333', marginBottom: '30px', textAlign: 'center' }}>Why Choose Tile Heating in Newmarket?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            <div>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🏢 Perfect for Newmarket Lifestyle</h3>
              <p>Our tile heating systems are ideal for Newmarket's mix of apartments, townhouses, and commercial properties, providing comfort in this busy central location.</p>
            </div>
            <div>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>⚡ Modern & Efficient</h3>
              <p>Energy-efficient systems designed for modern Newmarket properties with smart thermostats and precise temperature control.</p>
            </div>
            <div>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🔥 Expert Installation</h3>
              <p>Our experienced team understands Newmarket's unique challenges including parking, access, and working around busy commercial activities.</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '40px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '40px' }}>
          <h2 style={{ color: '#333', marginBottom: '30px', textAlign: 'center' }}>Newmarket Tile Heating Applications</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🏠 Residential Properties</h3>
              <p>Perfect for Newmarket apartments, townhouses, and houses, providing comfortable under-tile heating for bathrooms and kitchens.</p>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🏢 Commercial Spaces</h3>
              <p>Ideal for Newmarket's many cafes, restaurants, and retail spaces, creating comfortable environments for staff and customers.</p>
            </div>
            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>🛁 Bathroom Renovations</h3>
              <p>Essential for Newmarket bathroom renovations, providing luxurious warmth under tile floors in this high-end suburb.</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>Ready for Newmarket Comfort?</h2>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
            Contact our Newmarket tile heating specialists for a free consultation and quote.
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
            <a href="/services/underfloor-heating-central-auckland" style={{ textDecoration: 'none', color: '#333' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Underfloor Heating</h3>
                <p>Complete underfloor heating solutions for Central Auckland including Newmarket.</p>
              </div>
            </a>
            <a href="/services/tile-heating-central-auckland" style={{ textDecoration: 'none', color: '#333' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                <h3 style={{ color: '#007bff', marginBottom: '10px' }}>Tile Heating Central Auckland</h3>
                <p>Regional tile heating services covering all Central Auckland suburbs including Newmarket.</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TileHeatingNewmarketPage;
