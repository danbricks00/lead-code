import React from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const AboutPage = () => {
  return (
    <Layout>
      <SEO
        title="About Heat NZ | Professional Underfloor Heating Services"
        description="Learn about Heat NZ, Auckland's trusted underfloor heating specialists. Professional installation, maintenance, and service for electric and hydronic systems."
        canonical="https://heat.nz/about"
        keywords="about heat nz, underfloor heating company auckland, professional heating services"
      />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>About Heat.nz</h1>
          <p style={styles.paragraph}>
            Founded on the principle of bridging the gap between homeowners and skilled tradespeople, Heat.nz is dedicated to making property maintenance and improvement projects simpler, faster, and more transparent for everyone involved.
          </p>
          <h2 style={styles.subHeader}>Our Mission</h2>
          <p style={styles.paragraph}>
            Our mission is to revolutionize the trades industry by leveraging smart technology. We empower customers by providing a seamless connection to qualified, vetted professionals through our intelligent chatbot. For tradespeople, we offer a steady stream of qualified leads and a powerful dashboard to manage their business, helping them grow and succeed.
          </p>
          <h2 style={styles.subHeader}>Why We Started</h2>
          <p style={styles.paragraph}>
            We've all experienced the frustration of finding a reliable tradesperson. The endless phone calls, the uncertainty of quality, and the confusing quotes are pain points we wanted to eliminate. Heat.nz was born from a desire to create a trusted, efficient platform where quality workmanship and customer satisfaction are at the forefront.
          </p>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: { background: '#f7fafc', minHeight: 'calc(100vh - 120px)', padding: '40px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  card: { background: 'white', maxWidth: '800px', margin: 'auto', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  header: { fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: '#1a202c', borderBottom: '2px solid #e63946', paddingBottom: '15px', marginBottom: '20px', fontWeight: 800 },
  subHeader: { fontSize: 'clamp(1.5rem, 3vw, 1.8rem)', color: '#2d3748', marginTop: '30px', marginBottom: '15px', fontWeight: 700 },
  paragraph: { fontSize: '1.1rem', lineHeight: '1.7', color: '#4a5568' },
};

export default AboutPage;
