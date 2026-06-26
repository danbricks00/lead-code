import React from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';

const PrivacyPage = ({ adminEmail }) => {
  return (
    <Layout>
      <SEO
        title="Privacy Policy | Heat NZ"
        description="Heat NZ Privacy Policy. Learn how we collect and use your personal information in compliance with the New Zealand Privacy Act 2020."
        canonical="https://www.heat.nz/privacy"
        keywords="privacy policy, heat nz privacy, NZ Privacy Act 2020"
      />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>Privacy Policy</h1>
          <p style={styles.updated}>Last updated: June 2026</p>

          <p style={styles.paragraph}>
            Heat.nz (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your personal information
            in accordance with the New Zealand Privacy Act 2020.
          </p>

          <h2 style={styles.subHeader}>Information We Collect</h2>
          <p style={styles.paragraph}>
            When you request a quote or contact us through our website or chatbot, we collect only the
            following personal information:
          </p>
          <ul style={styles.list}>
            <li>Your name (first and last)</li>
            <li>Your email address</li>
            <li>Your phone number</li>
            <li>Your suburb or general location area</li>
          </ul>
          <p style={styles.paragraph}>
            We do <strong>not</strong> collect full street addresses through our online enquiry forms.
            If a site visit is required, address details may be collected separately during direct
            communication with our team.
          </p>

          <h2 style={styles.subHeader}>How We Use Your Information</h2>
          <p style={styles.paragraph}>We use the information you provide to:</p>
          <ul style={styles.list}>
            <li>Respond to your enquiry and provide a quote for electric underfloor heating installation</li>
            <li>Contact you about your project via phone or email</li>
            <li>Improve our services and customer experience</li>
          </ul>

          <h2 style={styles.subHeader}>Information Sharing</h2>
          <p style={styles.paragraph}>
            We do not sell, rent, or trade your personal information to third parties. Your details may
            be shared with our qualified installation partners solely for the purpose of fulfilling your
            quote or project request.
          </p>

          <h2 style={styles.subHeader}>Data Storage and Security</h2>
          <p style={styles.paragraph}>
            Your information is stored securely and accessed only by authorised personnel. We take
            reasonable steps to protect your data from unauthorised access, loss, or misuse.
          </p>

          <h2 style={styles.subHeader}>Your Rights</h2>
          <p style={styles.paragraph}>
            Under the Privacy Act 2020, you have the right to access the personal information we hold
            about you and to request correction if it is inaccurate. To exercise these rights, please
            contact us using the details below.
          </p>

          <h2 style={styles.subHeader}>Cookies and Analytics</h2>
          <p style={styles.paragraph}>
            Our website may use cookies and analytics tools to understand how visitors use our site.
            These tools collect anonymous usage data and do not identify you personally.
          </p>

          <h2 style={styles.subHeader}>Contact Us</h2>
          <p style={styles.paragraph}>
            If you have any questions about this Privacy Policy or wish to make a privacy-related
            request, please contact us
            {adminEmail ? (
              <>
                {' '}at{' '}
                <a href={`mailto:${adminEmail}`} style={styles.link}>{adminEmail}</a>
                {' '}or via our{' '}
              </>
            ) : (
              ' via our '
            )}
            <a href="/contact" style={styles.link}>Contact page</a>.
          </p>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    background: '#f4f7f6',
    minHeight: 'calc(100vh - 120px)',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: 'white',
    maxWidth: '800px',
    margin: 'auto',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    fontSize: '2.5rem',
    color: '#333',
    borderBottom: '2px solid #667eea',
    paddingBottom: '15px',
    marginBottom: '10px',
  },
  updated: {
    color: '#888',
    fontSize: '0.95rem',
    marginBottom: '24px',
  },
  subHeader: {
    fontSize: '1.5rem',
    color: '#444',
    marginTop: '28px',
    marginBottom: '12px',
  },
  paragraph: {
    fontSize: '1.05rem',
    lineHeight: '1.7',
    color: '#444',
    marginBottom: '16px',
  },
  list: {
    fontSize: '1.05rem',
    lineHeight: '1.8',
    color: '#444',
    marginBottom: '16px',
    paddingLeft: '24px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
  },
};

export async function getServerSideProps() {
  return {
    props: {
      adminEmail: process.env.ADMIN_EMAIL || null,
    },
  };
}

export default PrivacyPage;
