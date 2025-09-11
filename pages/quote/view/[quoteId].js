import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';

const CustomerQuoteView = () => {
  const router = useRouter();
  const { quoteId, ts, token } = router.query;
  const [quoteInfo, setQuoteInfo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionMade, setDecisionMade] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      if (!quoteId || !ts || !token) {
        setError('This link is invalid or incomplete.');
        setIsLoading(false);
        return;
      }

      const fetchQuote = async () => {
        try {
          // Normalize quoteId before sending to API
          const normalizedQuoteId = quoteId.trim().toLowerCase();
          const response = await fetch(`/api/get-quote-for-customer?quoteId=${normalizedQuoteId}&ts=${ts}&token=${token}`);
          const result = await response.json();

          if (result.success) {
            setQuoteInfo(result.data);
            // Check if decision was already made
            if (result.data.quoteData.Decision) {
              setDecisionMade(true);
            }
          } else {
            setError(result.error || 'Could not retrieve quote.');
          }
        } catch (err) {
          console.error('Error fetching quote:', err);
          setError('An unexpected error occurred while retrieving your quote.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchQuote();
    }
  }, [router.isReady, quoteId, ts, token]);

  // Handle decision with client-side protection
  const handleDecision = async (decision) => {
    if (isProcessing || decisionMade) {
      console.log('🚫 Decision already processing or made');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Normalize quoteId before sending to API
      const normalizedQuoteId = quoteId.trim().toLowerCase();
      const decisionUrl = `/api/quote-decision/${decision}?quoteId=${normalizedQuoteId}&ts=${ts}&token=${token}`;
      
      // Open in new window to prevent double-clicking
      const newWindow = window.open(decisionUrl, '_blank');
      
      // Set decision as made immediately to prevent double-clicking
      setDecisionMade(true);
      
      // Close the new window after a short delay
      setTimeout(() => {
        if (newWindow) {
          newWindow.close();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error processing decision:', error);
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your quote...</p>
      </div>;
    }
    if (error) {
      return <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>❌</div>
        <h1 style={styles.errorTitle}>Quote Not Available</h1>
        <p style={styles.errorMessage}>{error}</p>
        <div style={styles.errorHelp}>
          <p>If you believe this is a mistake, please:</p>
          <ul>
            <li>Check that you've copied the entire link from your email</li>
            <li>Contact our customer support for assistance</li>
          </ul>
        </div>
      </div>;
    }
    if (quoteInfo) {
      const { quoteData, leadData } = quoteInfo;
      const parsedRooms = JSON.parse(leadData.Rooms || '[]');
      
      return (
        <div style={styles.invoiceBox}>
            {/* Header */}
            <div style={styles.header}>
                <div className="company-details"><h1>Kiwi Trade</h1></div>
                <div style={styles.quoteDetails}>
                    <strong>Quote #: {quoteData['Quote ID']}</strong><br />
                    Valid Until: {new Date(quoteData['Quote Valid Until']).toLocaleDateString('en-NZ')}
                </div>
            </div>
            
            {/* Customer/Tradesperson Details */}
            <div style={styles.detailsGrid}>
                <div><h2>For:</h2>{leadData['Customer Name']}<br />{leadData['Customer Email']}</div>
                <div><h2>From:</h2>{quoteData['Tradesperson Name']}<br />{quoteData['Tradesperson Email']}</div>
            </div>
            
            {/* Cost Breakdown */}
            <h2>Cost Breakdown</h2>
            <table style={styles.itemsTable}>
                <thead style={{backgroundColor: '#f9f9f9'}}>
                    <tr><th>Description</th><th>Rate</th><th>Unit(s)</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                    <tr><td>Labour</td><td>${quoteData['Labour Cost']} / hr</td><td>{quoteData['Labour Hours']}</td><td>${(quoteData['Labour Cost'] * quoteData['Labour Hours']).toFixed(2)}</td></tr>
                    <tr><td>Materials</td><td>${quoteData['Materials Cost']} / m²</td><td>{quoteData['Materials Quantity']}</td><td>${(quoteData['Materials Cost'] * quoteData['Materials Quantity']).toFixed(2)}</td></tr>
                    <tr><td>Travel</td><td>${quoteData['Travel Cost']} / km</td><td>{quoteData['Travel Distance']}</td><td>${(quoteData['Travel Cost'] * quoteData['Travel Distance']).toFixed(2)}</td></tr>
                    <tr><td>Installation</td><td colSpan="2"></td><td>${parseFloat(quoteData['Installation Cost']).toFixed(2)}</td></tr>
                </tbody>
            </table>
            
            {/* Total */}
            <div style={styles.totalSection}>
                <div style={{fontWeight: 'bold', fontSize: '1.2em'}}>Total: ${parseFloat(quoteData['Total Quote']).toFixed(2)}</div>
            </div>

            {/* Decision Buttons */}
            {quoteData.Decision || decisionMade ? (
                <div style={styles.decisionMade}>
                    <div style={styles.decisionIcon}>✅</div>
                    <div style={styles.decisionText}>
                        <strong>Decision Already Made: {quoteData.Decision || 'Processing...'}</strong>
                        {quoteData['Decision Timestamp'] && (
                            <div style={styles.decisionTimestamp}>
                                Made on: {new Date(quoteData['Decision Timestamp']).toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland' })} NZT
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={styles.decisionButtons}>
                    <button 
                        onClick={() => handleDecision('accept')} 
                        disabled={isProcessing}
                        style={{
                            ...styles.button, 
                            ...styles.acceptButton,
                            ...(isProcessing ? styles.disabledButton : {})
                        }}
                    >
                        {isProcessing ? 'Processing...' : 'Accept Quote'}
                    </button>
                    <button 
                        onClick={() => handleDecision('decline')} 
                        disabled={isProcessing}
                        style={{
                            ...styles.button, 
                            ...styles.declineButton,
                            ...(isProcessing ? styles.disabledButton : {})
                        }}
                    >
                        {isProcessing ? 'Processing...' : 'Decline Quote'}
                    </button>
                </div>
            )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Layout>
      <div style={styles.container}>
        {renderContent()}
      </div>
    </Layout>
  );
};

const styles = {
    container: { fontFamily: 'Arial, sans-serif', padding: '20px', backgroundColor: '#f4f7f6', display: 'flex', justifyContent: 'center' },
    invoiceBox: { maxWidth: '800px', width: '100%', margin: 'auto', padding: '30px', border: '1px solid #eee', boxShadow: '0 0 10px rgba(0, 0, 0, 0.15)', backgroundColor: 'white' },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' },
    quoteDetails: { textAlign: 'right' },
    detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' },
    itemsTable: { width: '100%', borderCollapse: 'collapse', '& th, & td': { padding: '8px', border: '1px solid #ddd' } },
    totalSection: { display: 'flex', justifyContent: 'flex-end', marginTop: '20px' },
    decisionButtons: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '40px' },
    button: { 
        textDecoration: 'none', 
        color: 'white', 
        padding: '12px 25px', 
        borderRadius: '5px', 
        fontWeight: 'bold',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'all 0.3s ease'
    },
    acceptButton: { backgroundColor: '#4caf50' },
    declineButton: { backgroundColor: '#f44336' },
    disabledButton: { 
        backgroundColor: '#ccc', 
        cursor: 'not-allowed',
        opacity: 0.6
    },
    decisionMade: { 
        textAlign: 'center', 
        marginTop: '40px', 
        padding: '20px', 
        borderRadius: '10px', 
        backgroundColor: '#e8f5e8', 
        border: '2px solid #4caf50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px'
    },
    decisionIcon: { fontSize: '24px' },
    decisionText: { 
        fontWeight: 'bold',
        color: '#2e7d32'
    },
    decisionTimestamp: {
        fontSize: '14px',
        color: '#666',
        marginTop: '5px',
        fontWeight: 'normal'
    },
    // New styles for improved error display
    errorContainer: { 
        maxWidth: '600px', 
        margin: '40px auto', 
        padding: '30px', 
        backgroundColor: '#fff8f8', 
        borderRadius: '10px', 
        border: '2px solid #ffcdd2', 
        textAlign: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    errorIcon: { 
        fontSize: '48px', 
        color: '#f44336', 
        marginBottom: '20px' 
    },
    errorTitle: { 
        color: '#d32f2f', 
        marginBottom: '15px' 
    },
    errorMessage: { 
        fontSize: '18px', 
        color: '#555', 
        marginBottom: '25px' 
    },
    errorHelp: { 
        backgroundColor: '#fff', 
        padding: '15px', 
        borderRadius: '5px', 
        textAlign: 'left' 
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
    },
    loadingSpinner: {
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
    }
};

export default CustomerQuoteView;
