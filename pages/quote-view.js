import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import crypto from 'crypto';

const QuoteViewPage = () => {
  const router = useRouter();
  const { query, isReady } = router;
  const { quoteId, ts, token } = query;

  const [quoteData, setQuoteData] = useState(null);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decisionMade, setDecisionMade] = useState(false);

  // Function to safely format dates
  const formatDate = (dateInput) => {
    try {
      if (!dateInput) return 'Not specified';
      
      let date;
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        // Handle various date formats
        date = new Date(dateInput);
      } else if (typeof dateInput === 'number') {
        date = new Date(dateInput);
      } else {
        return 'Not specified';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Not specified';
      }
      
      // Format as DD/MM/YYYY
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Not specified';
    }
  };

  // Verify token function (same as in backend)
  const verifyToken = (id, timestamp) => {
    const hmac = crypto.createHmac("sha256", process.env.QUOTE_LINK_SECRET || 'default-secret');
    hmac.update(`${id}|${timestamp}`);
    return hmac.digest("hex");
  };

  useEffect(() => {
    if (!isReady) return;

    // Verify the token on client-side (basic check)
    if (!quoteId || !ts || !token) {
      setError('Invalid quote link. Missing required parameters.');
      setLoading(false);
      return;
    }

    // For now, we'll fetch the quote data from the API
    // In a real implementation, you'd validate the token server-side
    fetchQuoteData();
  }, [isReady, quoteId, ts, token]);

  const fetchQuoteData = async () => {
    try {
      const response = await fetch(`/api/get-quote-details?quoteId=${quoteId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch quote details');
      }

      setQuoteData(result.quote);
      setLeadData(result.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (action) => {
    if (decisionMade) {
      alert('You have already made a decision on this quote.');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} this quote?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/quote-decision/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, ts, token })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} quote`);
      }

      setDecisionMade(true);
      router.push(`/quote-status?status=success&message=Quote ${action}ed successfully!`);
    } catch (err) {
      alert(`Error ${action}ing quote: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>Loading Quote...</h1>
          <p>Please wait while we load your quote details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>❌ Error</h1>
          <p style={styles.error}>{error}</p>
          <p>Please contact us if you continue to experience issues.</p>
        </div>
      </div>
    );
  }

  if (!quoteData || !leadData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>❌ Quote Not Found</h1>
          <p>The requested quote could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Header */}
        <div style={styles.headerSection}>
          <h1 style={styles.header}>📋 Your Quote</h1>
          <p style={styles.subHeader}>Professional quote for {leadData.ServiceType}</p>
          <p style={styles.quoteId}>Quote ID: {quoteId}</p>
          <div style={styles.dateInfo}>
            <p><strong>Quote Date:</strong> {formatDate(quoteData.QuoteDate || quoteData.quoteDate || new Date())}</p>
            <p><strong>Valid Until:</strong> {formatDate(quoteData.ValidUntil || quoteData.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))}</p>
          </div>
        </div>

        {/* Customer Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👤 Customer Details</h2>
          <div style={styles.detailsGrid}>
            <div><strong>Name:</strong> {leadData.CustomerName}</div>
            <div><strong>Email:</strong> {leadData.CustomerEmail}</div>
            <div><strong>Phone:</strong> {leadData.CustomerPhone}</div>
            <div><strong>Service:</strong> {leadData.ServiceType}</div>
            <div><strong>Location:</strong> {leadData.Area}, {leadData.Suburb}</div>
            <div><strong>Timeline:</strong> {leadData.Timeline || leadData.Timelline}</div>
          </div>
        </div>

        {/* Room Details */}
        {leadData.Rooms && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏠 Room Details</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Room Name</th>
                  <th style={styles.th}>Dimensions</th>
                </tr>
              </thead>
              <tbody>
                {JSON.parse(leadData.Rooms).map((room, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{room.name}</td>
                    <td style={styles.td}>{room.dimensions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quote Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Quote Breakdown</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={styles.td}>Labour</td>
                <td style={styles.td}>${(parseFloat(quoteData['Labour Cost'] || quoteData.LabourRate) || 0).toFixed(2)}/hr</td>
                <td style={styles.td}>{quoteData['Labour Hour'] || quoteData.LabourHours || 0} hrs</td>
                <td style={styles.td}>${((parseFloat(quoteData['Labour Cost'] || quoteData.LabourRate) || 0) * (parseFloat(quoteData['Labour Hour'] || quoteData.LabourHours) || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Materials</td>
                <td style={styles.td}>${(parseFloat(quoteData['Materials Cost'] || quoteData.MaterialsCost) || 0).toFixed(2)}/sqm</td>
                <td style={styles.td}>{quoteData['Materials Quanitity'] || quoteData.MaterialsQuantity || 0} sqm</td>
                <td style={styles.td}>${((parseFloat(quoteData['Materials Cost'] || quoteData.MaterialsCost) || 0) * (parseFloat(quoteData['Materials Quanitity'] || quoteData.MaterialsQuantity) || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Travel</td>
                <td style={styles.td}>${(parseFloat(quoteData['Travel Cost'] || quoteData.TravelCost) || 0).toFixed(2)}/km</td>
                <td style={styles.td}>{quoteData['Travel Distance'] || quoteData.TravelDistance || 0} km</td>
                <td style={styles.td}>${((parseFloat(quoteData['Travel Cost'] || quoteData.TravelCost) || 0) * (parseFloat(quoteData['Travel Distance'] || quoteData.TravelDistance) || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td style={styles.td}>Installation</td>
                <td style={styles.td}>${(parseFloat(quoteData['Installation Cost'] || quoteData.InstallationCost) || 0).toFixed(2)}</td>
                <td style={styles.td}>1</td>
                <td style={styles.td}>${(parseFloat(quoteData['Installation Cost'] || quoteData.InstallationCost) || 0).toFixed(2)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={styles.totalRow}>
                <td colSpan="3" style={styles.totalLabel}><strong>Total Quote:</strong></td>
                <td style={styles.totalAmount}><strong>${(parseFloat(quoteData['Total Quote'] || quoteData.TotalQuote) || 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {quoteData.Notes && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📝 Additional Notes</h2>
            <div style={styles.notesBox}>
              {quoteData.Notes}
            </div>
          </div>
        )}

        {/* Decision Buttons */}
        <div style={styles.decisionSection}>
          <h2 style={styles.sectionTitle}>🎯 Your Decision</h2>
          <p style={styles.decisionText}>
            Please review the quote details above and make your decision:
          </p>
          <div style={styles.buttonContainer}>
            <button 
              onClick={() => handleDecision('accept')} 
              style={styles.acceptButton}
              disabled={decisionMade}
            >
              ✅ Accept Quote
            </button>
            <button 
              onClick={() => handleDecision('decline')} 
              style={styles.declineButton}
              disabled={decisionMade}
            >
              ❌ Decline Quote
            </button>
          </div>
          <p style={styles.warningText}>
            ⚠️ Each button can only be used once for security purposes
          </p>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    background: '#f8f9fa',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    background: 'white',
    maxWidth: '800px',
    margin: 'auto',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  headerSection: {
    textAlign: 'center',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '20px',
    marginBottom: '30px'
  },
  header: {
    color: '#2c3e50',
    margin: '0 0 10px 0',
    fontSize: '2.5em'
  },
  subHeader: {
    color: '#6c757d',
    margin: '0 0 10px 0',
    fontSize: '1.2em'
  },
  quoteId: {
    color: '#495057',
    margin: '0',
    fontSize: '1em',
    fontWeight: 'bold'
  },
  dateInfo: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px'
  },
  sectionTitle: {
    color: '#495057',
    margin: '0 0 15px 0',
    fontSize: '1.3em',
    borderBottom: '1px solid #dee2e6',
    paddingBottom: '5px'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '10px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  },
  th: {
    background: '#e9ecef',
    border: '1px solid #dee2e6',
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold'
  },
  td: {
    border: '1px solid #dee2e6',
    padding: '12px'
  },
  totalRow: {
    backgroundColor: '#f1f3f4'
  },
  totalLabel: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: '1.1em'
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: '1.2em',
    color: '#28a745'
  },
  notesBox: {
    background: 'white',
    padding: '15px',
    borderRadius: '4px',
    border: '1px solid #dee2e6',
    whiteSpace: 'pre-wrap'
  },
  decisionSection: {
    background: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '6px',
    padding: '25px',
    textAlign: 'center',
    marginTop: '30px'
  },
  decisionText: {
    color: '#856404',
    marginBottom: '20px'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '15px'
  },
  acceptButton: {
    background: '#28a745',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '5px',
    fontSize: '1.1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '150px'
  },
  declineButton: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '5px',
    fontSize: '1.1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '150px'
  },
  warningText: {
    color: '#856404',
    fontSize: '0.9em',
    fontStyle: 'italic',
    margin: '0'
  },
  error: {
    color: '#dc3545',
    fontWeight: 'bold'
  }
};

export default QuoteViewPage;