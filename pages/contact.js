import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ submitted: false, message: '', isError: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitted: true, message: 'Sending...', isError: false });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      setStatus({ submitted: true, message: '✅ Message sent successfully! We will get back to you soon.', isError: false });
      setFormData({ name: '', email: '', message: '' }); // Clear form
    } catch (error) {
      setStatus({ submitted: true, message: `❌ Error: ${error.message}`, isError: true });
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>Contact Us</h1>
          <p style={styles.paragraph}>
            Have a question or need support? Fill out the form below, and our team will get back to you as soon as possible.
          </p>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="message">Your Message</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} style={styles.textarea} rows="6" required></textarea>
            </div>
            <button type="submit" style={styles.button} disabled={status.submitted && !status.isError}>
              Send Message
            </button>
            {status.submitted && (
              <p style={status.isError ? styles.error : styles.success}>
                {status.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: { background: '#f4f7f6', minHeight: 'calc(100vh - 120px)', padding: '40px 20px', fontFamily: 'Arial, sans-serif' },
  card: { background: 'white', maxWidth: '800px', margin: 'auto', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  header: { fontSize: '2.5rem', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '15px', marginBottom: '10px' },
  paragraph: { fontSize: '1.1rem', lineHeight: '1.7', color: '#444', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' },
  textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', resize: 'vertical' },
  button: { padding: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', cursor: 'pointer' },
  success: { marginTop: '15px', color: 'green', textAlign: 'center' },
  error: { marginTop: '15px', color: 'red', textAlign: 'center' },
};

// Export with dynamic import and SSR disabled
export default dynamic(() => Promise.resolve(ContactPage), { ssr: false });

// Add this function to handle any build-time errors
export async function getStaticProps() {
  try {
    // You can add any data fetching here if needed
    // If it fails, it won't break the build
    return {
      props: {}
    };
  } catch (error) {
    console.error('Error in contact page getStaticProps:', error);
    // Return empty props to prevent build failure
    return {
      props: {}
    };
  }
}
