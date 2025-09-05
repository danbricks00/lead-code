import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function QuoteView() {
  const router = useRouter();
  const { quoteId } = router.query;
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (quoteId) {
      fetchQuoteData();
    }
  }, [quoteId]);

  const fetchQuoteData = async () => {
    try {
      const response = await fetch(`/api/get-quote-details?quoteId=${quoteId}`);
      const data = await response.json();
      
      if (data.success) {
        setQuoteData(data.quoteData);
      } else {
        setError(data.error || 'Failed to load quote');
      }
    } catch (err) {
      setError('Failed to load quote');
      console.error('Error fetching quote:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const response = await fetch('/api/generate-quote-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quoteId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading quote...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Quote not found</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quote #{quoteData.quoteId}</h1>
        <button onClick={generatePDF} style={styles.pdfButton}>
          📄 Download PDF
        </button>
      </div>

      <div style={styles.content}>
        {/* Company Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Kiwi Trade</h2>
          <p style={styles.tagline}>Professional Underfloor Heating Solutions</p>
        </div>

        {/* Quote Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quote Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Quote ID:</strong> {quoteData.quoteId}
            </div>
            <div style={styles.infoItem}>
              <strong>Date:</strong> {new Date(quoteData.quoteDate).toLocaleDateString('en-NZ')}
            </div>
            <div style={styles.infoItem}>
              <strong>Valid Until:</strong> {new Date(quoteData.validUntil).toLocaleDateString('en-NZ')}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Customer Details</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Name:</strong> {quoteData.customerName}
            </div>
            <div style={styles.infoItem}>
              <strong>Email:</strong> {quoteData.customerEmail}
            </div>
            <div style={styles.infoItem}>
              <strong>Phone:</strong> {quoteData.customerPhone}
            </div>
            <div style={styles.infoItem}>
              <strong>Address:</strong> {quoteData.customerAddress}
            </div>
            <div style={styles.infoItem}>
              <strong>Service:</strong> {quoteData.serviceType}
            </div>
          </div>
        </div>

        {/* Tradesperson Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Tradesperson Details</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Name:</strong> {quoteData.tradespersonName}
            </div>
            <div style={styles.infoItem}>
              <strong>Email:</strong> {quoteData.tradespersonEmail}
            </div>
            <div style={styles.infoItem}>
              <strong>Phone:</strong> {quoteData.tradespersonPhone}
            </div>
            <div style={styles.infoItem}>
              <strong>License:</strong> {quoteData.tradespersonLicense}
            </div>
          </div>
        </div>

        {/* Room Details */}
        {quoteData.rooms && quoteData.rooms.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Project Details</h2>
            <table style={styles.roomTable}>
              <thead>
                <tr>
                  <th>Room Name</th>
                  <th>Dimensions</th>
                  <th>Square Meters</th>
                  <th>Labour Hours</th>
                  <th>Labour Cost</th>
                  <th>Materials</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quoteData.rooms.map((room, index) => (
                  <tr key={index}>
                    <td>{room.name}</td>
                    <td>{room.dimensions}</td>
                    <td>{room.sqm ? `${room.sqm}m²` : 'N/A'}</td>
                    <td>{room.labourHours}</td>
                    <td>${room.labourCost?.toFixed(2) || '0.00'}</td>
                    <td>${room.materialsCost?.toFixed(2) || '0.00'}</td>
                    <td>${((room.labourCost || 0) + (room.materialsCost || 0)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quote Summary */}
        <div style={styles.summarySection}>
          <h2 style={styles.sectionTitle}>Quote Summary</h2>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Labour</div>
              <div style={styles.summaryValue}>${quoteData.totals?.labour?.toFixed(2) || '0.00'}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Materials</div>
              <div style={styles.summaryValue}>${quoteData.totals?.materials?.toFixed(2) || '0.00'}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Travel</div>
              <div style={styles.summaryValue}>${quoteData.totals?.travel?.toFixed(2) || '0.00'}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Installation</div>
              <div style={styles.summaryValue}>${quoteData.totals?.installation?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          <div style={styles.totalSection}>
            <div style={styles.totalRow}>
              <span>Subtotal (excl. GST):</span>
              <span>${quoteData.totals?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div style={styles.totalRow}>
              <span>GST (15%):</span>
              <span>${quoteData.totals?.gst?.toFixed(2) || '0.00'}</span>
            </div>
            <div style={styles.finalTotalRow}>
              <span>Total (incl. GST):</span>
              <span>${quoteData.totals?.final?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div style={styles.termsSection}>
          <h3 style={styles.termsTitle}>Terms & Conditions</h3>
          <div style={styles.termsText}>
            • This quote is valid for 14 days from the date of issue.<br/>
            • Payment terms: 50% deposit required to commence work, balance due upon completion.<br/>
            • All work is covered by our comprehensive warranty.<br/>
            • Installation includes all necessary materials and labor unless otherwise specified.<br/>
            • Any changes to the scope of work may result in additional charges.<br/>
            • We are fully licensed and insured for your peace of mind.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#333',
    margin: 0,
    fontSize: '28px'
  },
  pdfButton: {
    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)'
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #eee'
  },
  sectionTitle: {
    color: '#667eea',
    fontSize: '20px',
    marginBottom: '15px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  tagline: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '20px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '4px solid #667eea'
  },
  roomTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  summarySection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '25px',
    borderRadius: '8px',
    marginTop: '20px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '20px'
  },
  summaryItem: {
    textAlign: 'center'
  },
  summaryLabel: {
    fontSize: '12px',
    opacity: '0.9',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  totalSection: {
    textAlign: 'center',
    marginTop: '20px'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '16px'
  },
  finalTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '20px',
    fontWeight: 'bold',
    borderTop: '2px solid rgba(255,255,255,0.3)',
    paddingTop: '10px',
    marginTop: '10px'
  },
  termsSection: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #28a745'
  },
  termsTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  termsText: {
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.5'
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    padding: '50px'
  },
  error: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#dc3545',
    padding: '50px'
  }
};
