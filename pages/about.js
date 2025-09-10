import React from 'react';
import Layout from '../components/Layout';

const AboutPage = () => {
  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>About Kiwi Trade</h1>
          <p style={styles.paragraph}>
            Founded on the principle of bridging the gap between homeowners and skilled tradespeople, Kiwi Trade is dedicated to making property maintenance and improvement projects simpler, faster, and more transparent for everyone involved.
          </p>
          <h2 style={styles.subHeader}>Our Mission</h2>
          <p style={styles.paragraph}>
            Our mission is to revolutionize the trades industry by leveraging smart technology. We empower customers by providing a seamless connection to qualified, vetted professionals through our intelligent chatbot. For tradespeople, we offer a steady stream of qualified leads and a powerful dashboard to manage their business, helping them grow and succeed.
          </p>
          <h2 style={styles.subHeader}>Why We Started</h2>
          <p style={styles.paragraph}>
            We've all experienced the frustration of finding a reliable tradesperson. The endless phone calls, the uncertainty of quality, and the confusing quotes are pain points we wanted to eliminate. Kiwi Trade was born from a desire to create a trusted, efficient platform where quality workmanship and customer satisfaction are at the forefront.
          </p>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: { background: '#f4f7f6', minHeight: 'calc(100vh - 120px)', padding: '40px 20px', fontFamily: 'Arial, sans-serif' },
  card: { background: 'white', maxWidth: '800px', margin: 'auto', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { fontSize: '2.5rem', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '15px', marginBottom: '20px' },
  subHeader: { fontSize: '1.8rem', color: '#555', marginTop: '30px', marginBottom: '15px' },
  paragraph: { fontSize: '1.1rem', lineHeight: '1.7', color: '#444' },
};

export default AboutPage;

export async function getStaticProps() {
  try {
    return {
      props: {}
    };
  } catch (error) {
    console.error('Error in about page getStaticProps:', error);
    return {
      props: {}
    };
  }
}
