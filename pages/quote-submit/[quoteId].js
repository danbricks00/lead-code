import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

const QuoteSubmitPage = () => {
  const router = useRouter();
  const { query, isReady } = router;
  const { quoteId } = query;

  // Form state
  const [tradesperson, setTradesperson] = useState({ name: '', email: '', phone: '' });
  const [costs, setCosts] = useState({
    labourRate: '',
    labourHours: '',
    materialsCost: '',
    materialsQuantity: '',
    travelCost: '',
    travelDistance: '',
    installationCost: '',
  });
  const [notes, setNotes] = useState('');
  const [totals, setTotals] = useState({
    labour: 0,
    materials: 0,
    travel: 0,
    final: 0,
  });
  const [submissionStatus, setSubmissionStatus] = useState(null); // null | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate totals whenever costs change
  useEffect(() => {
    const getNum = (val) => parseFloat(val) || 0;

    const labourTotal = getNum(costs.labourRate) * getNum(costs.labourHours);
    const materialsTotal = getNum(costs.materialsCost) * getNum(costs.materialsQuantity);
    const travelTotal = getNum(costs.travelCost) * getNum(costs.travelDistance);
    const finalTotal = labourTotal + materialsTotal + travelTotal + getNum(costs.installationCost);

    setTotals({
      labour: labourTotal,
      materials: materialsTotal,
      travel: travelTotal,
      final: finalTotal,
    });
  }, [costs]);
  
  const handleCostChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string, otherwise store as number
    setCosts(prev => ({ ...prev, [name]: value }));
  };

  const handleTradespersonChange = (e) => {
    const { name, value } = e.target;
    setTradesperson(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('submitting');
    setErrorMessage('');

    const { token, ts } = query;
    const quoteDetails = {
      ...costs,
      notes,
      totalQuote: totals.final,
      tradespersonName: tradesperson.name,
      tradespersonEmail: tradesperson.email,
      tradespersonPhone: tradesperson.phone,
    };

    try {
      const response = await fetch('/api/quote-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          ts,
          token,
          quoteDetails,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit quote.');
      }

      setSubmissionStatus('success');
    } catch (error) {
      setSubmissionStatus('error');
      setErrorMessage(error.message);
      console.error("Quote submission failed:", error);
    }
  };

  if (!isReady) {
    return <div style={styles.container}><p>Loading...</p></div>;
  }
  
  if (submissionStatus === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>✅ Quote Submitted Successfully!</h1>
          <p>The quote has been sent to the customer. You will be notified when they make a decision.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.header}>Quote Submission Form</h1>
        <p><strong>Quote ID:</strong> {quoteId}</p>

        <div style={styles.section}>
          <h2 style={styles.subHeader}>Customer Details</h2>
          <p><strong>Name:</strong> {query.customerName}</p>
          <p><strong>Email:</strong> {query.customerEmail}</p>
          <p><strong>Service:</strong> {query.serviceType}</p>
          <p><strong>Details:</strong> {query.specificDetails}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.section}>
            <h2 style={styles.subHeader}>Your Details (Tradesperson)</h2>
            <div style={styles.inputGroup}>
              <label>Full Name</label>
              <input type="text" name="name" value={tradesperson.name} onChange={handleTradespersonChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label>Email</label>
              <input type="email" name="email" value={tradesperson.email} onChange={handleTradespersonChange} style={styles.input} required />
            </div>
            <div style={styles.inputGroup}>
              <label>Phone</label>
              <input type="tel" name="phone" value={tradesperson.phone} onChange={handleTradespersonChange} style={styles.input} required />
            </div>
          </div>
          
          <div style={styles.section}>
            <h2 style={styles.subHeader}>Quote Calculator</h2>
            
            {/* Labour */}
            <div style={styles.calcBox}>
              <div style={styles.calcInputGroup}>
                <label style={styles.calcLabel}>Labour Rate</label>
                <input type="number" name="labourRate" value={costs.labourRate} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
              </div>
              <span style={styles.calcSymbol}>x</span>
              <div style={styles.calcInputGroup}>
                <label style={styles.calcLabel}>Hours</label>
                <input type="number" name="labourHours" value={costs.labourHours} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
              </div>
              <span style={styles.calcSymbol}>=</span>
              <div style={styles.subtotalBox}>
                <label style={styles.calcLabel}>Subtotal</label>
                <span style={styles.subtotal}>${totals.labour.toFixed(2)}</span>
              </div>
            </div>

            {/* Materials */}
            <div style={styles.calcBox}>
                <div style={styles.calcInputGroup}>
                    <label style={styles.calcLabel}>Cost per Item</label>
                    <input type="number" name="materialsCost" value={costs.materialsCost} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
                </div>
                <span style={styles.calcSymbol}>x</span>
                <div style={styles.calcInputGroup}>
                    <label style={styles.calcLabel}>Quantity</label>
                    <input type="number" name="materialsQuantity" value={costs.materialsQuantity} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
                </div>
                <span style={styles.calcSymbol}>=</span>
                <div style={styles.subtotalBox}>
                    <label style={styles.calcLabel}>Subtotal</label>
                    <span style={styles.subtotal}>${totals.materials.toFixed(2)}</span>
                </div>
            </div>

            {/* Travel */}
            <div style={styles.calcBox}>
                <div style={styles.calcInputGroup}>
                    <label style={styles.calcLabel}>Cost per KM</label>
                    <input type="number" name="travelCost" value={costs.travelCost} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
                </div>
                <span style={styles.calcSymbol}>x</span>
                <div style={styles.calcInputGroup}>
                    <label style={styles.calcLabel}>Distance (KM)</label>
                    <input type="number" name="travelDistance" value={costs.travelDistance} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
                </div>
                <span style={styles.calcSymbol}>=</span>
                <div style={styles.subtotalBox}>
                    <label style={styles.calcLabel}>Subtotal</label>
                    <span style={styles.subtotal}>${totals.travel.toFixed(2)}</span>
                </div>
            </div>

             {/* Installation */}
            <div style={styles.calcBox}>
                <div style={styles.calcInputGroup}>
                    <label style={styles.calcLabel}>Installation Cost</label>
                    <input type="number" name="installationCost" value={costs.installationCost} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
                </div>
                <div style={styles.subtotalBox}>
                    <label style={styles.calcLabel}>Subtotal</label>
                    <span style={styles.subtotal}>${(parseFloat(costs.installationCost) || 0).toFixed(2)}</span>
                </div>
            </div>

            <hr style={styles.hr} />
            <div style={styles.totalRow}>
              <strong>Final Quote Total:</strong>
              <strong>${totals.final.toFixed(2)}</strong>
            </div>
          </div>

          <div style={styles.section}>
             <h2 style={styles.subHeader}>Notes for Customer</h2>
             <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.textarea} placeholder="e.g., This quote is valid for 14 days."></textarea>
          </div>

          <button type="submit" style={styles.button} disabled={submissionStatus === 'submitting'}>
            {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit Quote to Customer'}
          </button>
          {submissionStatus === 'error' && <p style={styles.error}>{errorMessage}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { background: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' },
  card: { background: 'white', maxWidth: '700px', margin: 'auto', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  header: { color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  subHeader: { color: '#555', fontSize: '1.1em', marginTop: '20px' },
  section: { marginBottom: '20px' },
  inputGroup: { marginBottom: '10px' },
  input: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px' },
  
  // New Calculator Styles
  calcBox: { border: '1px solid #eee', borderRadius: '6px', padding: '15px', display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '10px', background: '#fcfcfc' },
  calcInputGroup: { display: 'flex', flexDirection: 'column', flex: 1 },
  calcLabel: { fontSize: '0.8em', color: '#666', marginBottom: '4px' },
  calcInput: { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
  calcSymbol: { fontSize: '1.2em', paddingBottom: '8px' },
  subtotalBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px', paddingBottom: '8px' },
  subtotal: { fontWeight: 'bold', fontSize: '1.1em' },

  hr: { border: 'none', borderTop: '1px solid #eee', margin: '20px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold' },
  textarea: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' },
  button: { width: '100%', padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1em', cursor: 'pointer' },
  error: { color: 'red', marginTop: '10px', textAlign: 'center' },
};

export default QuoteSubmitPage;
