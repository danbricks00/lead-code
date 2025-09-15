import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const ContactPage = () => {
  const router = useRouter();
  const [formType, setFormType] = useState('general'); // 'general', 'quote', 'manual-quote'
  const [showManualQuote, setShowManualQuote] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    message: '',
    phone: '',
    projectType: 'Underfloor Heating',
    roomCount: '',
    timeline: '',
    location: ''
  });
  const [status, setStatus] = useState({ submitted: false, message: '', isError: false });

  // Check if user should see manual quote option (admin/tradesman access)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.success && data.authenticated && data.userType === 'tradesman') {
          setShowManualQuote(true);
          setIsAuthenticated(true);
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        setShowManualQuote(true);
        setShowLoginForm(false);
        setLoginData({ email: '', password: '' });
      } else {
        setStatus({ submitted: true, message: `❌ Login failed: ${result.error}`, isError: true });
      }
    } catch (error) {
      setStatus({ submitted: true, message: `❌ Login error: ${error.message}`, isError: true });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setUser(null);
      setShowManualQuote(false);
      setFormType('general');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        projectType: 'Underfloor Heating',
        roomCount: '',
        timeline: '',
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
          
          {/* Authentication Status */}
          {isAuthenticated && user && (
            <div style={styles.authStatus}>
              <p style={styles.authText}>
                🔧 Logged in as: <strong>{user.name}</strong> ({user.email})
                {user.businessName && ` - ${user.businessName}`}
              </p>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </div>
          )}
          
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
            {showManualQuote && (
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
            )}
            {!isAuthenticated && (
              <button 
                type="button"
                onClick={() => setShowLoginForm(true)}
                style={{
                  ...styles.formTypeButton,
                  backgroundColor: '#28a745',
                  color: 'white'
                }}
              >
                🔧 Tradesman Login
              </button>
            )}
          </div>

          {/* Form Description */}
          <div style={styles.formDescription}>
            {formType === 'general' && (
              <p>Have a question or need support? Send us a message and we'll get back to you.</p>
            )}
            {formType === 'quote' && (
              <p>For projects with 20 or more rooms, please provide your project details below for a detailed quote.</p>
            )}
            {formType === 'manual-quote' && showManualQuote && (
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
            {(formType === 'quote' || (formType === 'manual-quote' && showManualQuote)) && (
              <>
                <div style={styles.inputGroup}>
                  <label htmlFor="projectType">Project Type</label>
                  <input 
                    type="text" 
                    id="projectType" 
                    name="projectType" 
                    value="Underfloor Heating" 
                    style={{...styles.input, backgroundColor: '#f5f5f5', cursor: 'not-allowed'}} 
                    readOnly 
                  />
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

      {/* Login Form Modal */}
      {showLoginForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Tradesman Login</h2>
            <p style={styles.modalDescription}>
              Enter your email and password to access manual quote submission.
            </p>
            
            <form onSubmit={handleLogin} style={styles.loginForm}>
              <div style={styles.inputGroup}>
                <label htmlFor="loginEmail">Email *</label>
                <input 
                  type="email" 
                  id="loginEmail" 
                  name="email" 
                  value={loginData.email} 
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))} 
                  style={styles.input} 
                  required 
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label htmlFor="loginPassword">Password *</label>
                <input 
                  type="password" 
                  id="loginPassword" 
                  name="password" 
                  value={loginData.password} 
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))} 
                  style={styles.input} 
                  required 
                />
              </div>
              
              <div style={styles.modalButtons}>
                <button type="submit" style={styles.submitButton}>
                  Login
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowLoginForm(false)} 
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
            
            <div style={styles.loginHelp}>
              <p><strong>Default Password:</strong> tradesman123</p>
              <p><small>Your email must be registered in the Tradesmen database to login.</small></p>
            </div>
          </div>
        </div>
      )}
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
  authStatus: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#e8f5e8',
    borderRadius: '5px',
    borderLeft: '4px solid #28a745',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  authText: {
    margin: 0,
    fontSize: '14px',
    color: '#155724'
  },
  logoutButton: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '400px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '1.5rem',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center'
  },
  modalDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center'
  },
  loginForm: {
    marginBottom: '20px'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  cancelButton: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  loginHelp: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    borderLeft: '4px solid #17a2b8',
    fontSize: '12px',
    color: '#666'
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
