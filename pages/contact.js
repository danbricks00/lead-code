import React, { useState } from 'react';
import Layout from '../components/Layout';

const ContactPage = () => {
  const [formType, setFormType] = useState('general'); // 'general', 'quote', 'manual-quote'
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '',
    phone: '',
    projectType: '',
    roomCount: '',
    timeline: '',
    budget: '',
    location: ''
  });
  const [status, setStatus] = useState({ submitted: false, message: '', isError: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitted: true, message: 'Sending...', isError: false });

    try {
      // Use different API endpoints based on form type
      const apiEndpoint = formType === 'quote' ? '/api/quote-enquiry' : '/api/contact';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, formType }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'An unknown error occurred.');
      }

      // Different success messages based on form type
      let successMessage;
      if (formType === 'quote') {
        successMessage = `✅ Quote enquiry submitted successfully! Quote Reference: ${result.quoteId}. We'll get back to you soon with a detailed quote.`;
      } else if (formType === 'manual-quote') {
        successMessage = '✅ Manual quote submitted successfully! The quote has been logged in our system.';
      } else {
        successMessage = '✅ Message sent successfully! We will get back to you soon.';
      }

      setStatus({ submitted: true, message: successMessage, isError: false });
      setFormData({ 
        name: '', 
        email: '', 
        message: '',
        phone: '',
        projectType: '',
        roomCount: '',
        timeline: '',
        budget: '',
        location: ''
      }); // Clear form
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
            Choose the type of enquiry below, and our team will get back to you as soon as possible.
          </p>
          
          {/* Form Type Selector */}
          <div style={styles.formTypeSelector}>
            <button 
              type="button"
              onClick={() => setFormType('general')}
              style={{
                ...styles.formTypeButton,
                ...(formType === 'general' ? styles.formTypeButtonActive : {})
              }}
            >
              General Enquiry
            </button>
            <button 
              type="button"
              onClick={() => setFormType('quote')}
              style={{
                ...styles.formTypeButton,
                ...(formType === 'quote' ? styles.formTypeButtonActive : {})
              }}
            >
              Quote Enquiry (20+ Rooms)
            </button>
            <button 
              type="button"
              onClick={() => setFormType('manual-quote')}
              style={{
                ...styles.formTypeButton,
                ...(formType === 'manual-quote' ? styles.formTypeButtonActive : {})
              }}
            >
              Manual Quote Submission
            </button>
          </div>

          {/* Form Description */}
          <div style={styles.formDescription}>
            {formType === 'general' && (
              <p>Have a question or need support? Send us a message and we'll get back to you.</p>
            )}
            {formType === 'quote' && (
              <p>For projects with 20 or more rooms, please provide your project details below for a detailed quote.</p>
            )}
            {formType === 'manual-quote' && (
              <p>Admin/Tradesmen: Submit a manual quote for a customer. This will create a quote entry in the system.</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Common Fields */}
            <div style={styles.inputGroup}>
              <label htmlFor="name">Full Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="email">Email Address *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} />
            </div>

            {/* Quote Enquiry Specific Fields */}
            {(formType === 'quote' || formType === 'manual-quote') && (
              <>
                <div style={styles.inputGroup}>
                  <label htmlFor="projectType">Project Type *</label>
                  <select id="projectType" name="projectType" value={formData.projectType} onChange={handleChange} style={styles.input} required>
                    <option value="">Select project type</option>
                    <option value="Underfloor Heating">Underfloor Heating</option>
                    <option value="Heat Pump Installation">Heat Pump Installation</option>
                    <option value="Insulation">Insulation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="roomCount">Number of Rooms/Areas *</label>
                  <input type="number" id="roomCount" name="roomCount" value={formData.roomCount} onChange={handleChange} style={styles.input} min="1" required />
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="location">Location (Suburb/City) *</label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="timeline">Desired Timeline</label>
                  <select id="timeline" name="timeline" value={formData.timeline} onChange={handleChange} style={styles.input}>
                    <option value="">Select timeline</option>
                    <option value="Immediately">Immediately</option>
                    <option value="In a week">In a week</option>
                    <option value="In a couple of months">In a couple of months</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label htmlFor="budget">Budget Range</label>
                  <select id="budget" name="budget" value={formData.budget} onChange={handleChange} style={styles.input}>
                    <option value="">Select budget range</option>
                    <option value="Under $10,000">Under $10,000</option>
                    <option value="$10,000 - $20,000">$10,000 - $20,000</option>
                    <option value="$20,000 - $50,000">$20,000 - $50,000</option>
                    <option value="$50,000 - $100,000">$50,000 - $100,000</option>
                    <option value="Over $100,000">Over $100,000</option>
                    <option value="I'd like a quote first">I'd like a quote first</option>
                  </select>
                </div>
              </>
            )}

            {/* Message Field */}
            <div style={styles.inputGroup}>
              <label htmlFor="message">
                {formType === 'general' ? 'Your Message *' : 
                 formType === 'quote' ? 'Additional Project Details *' : 
                 'Quote Details & Customer Information *'}
              </label>
              <textarea 
                id="message" 
                name="message" 
                value={formData.message} 
                onChange={handleChange} 
                style={styles.textarea} 
                rows="6" 
                placeholder={
                  formType === 'general' ? 'Tell us how we can help you...' :
                  formType === 'quote' ? 'Please provide details about your project, room types, special requirements, etc.' :
                  'Enter customer details, project specifications, quote amount, and any special notes...'
                }
                required 
              />
            </div>

            <button type="submit" style={styles.button} disabled={status.submitted && !status.isError}>
              {formType === 'general' ? 'Send Message' : 
               formType === 'quote' ? 'Request Quote' : 
               'Submit Manual Quote'}
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
  formTypeSelector: { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '20px', 
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  formTypeButton: {
    padding: '12px 20px',
    border: '2px solid #667eea',
    borderRadius: '6px',
    background: 'white',
    color: '#667eea',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '500'
  },
  formTypeButtonActive: {
    background: '#667eea',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(102, 126, 234, 0.3)'
  },
  formDescription: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '25px',
    borderLeft: '4px solid #667eea'
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column' },
  input: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' },
  textarea: { padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem', resize: 'vertical' },
  button: { padding: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.1rem', cursor: 'pointer' },
  success: { marginTop: '15px', color: 'green', textAlign: 'center' },
  error: { marginTop: '15px', color: 'red', textAlign: 'center' },
};

export default ContactPage;
