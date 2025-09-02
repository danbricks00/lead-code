import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';

const CustomerQuoteView = () => {
  const router = useRouter();
  const { quoteId, ts, token } = router.query;
  const [quoteInfo, setQuoteInfo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      if (!quoteId || !ts || !token) {
        setError('This link is invalid or incomplete.');
        setIsLoading(false);
        return;
      }

      const fetchQuote = async () => {
        try {
          const response = await fetch(`/api/get-quote-for-customer?quoteId=${quoteId}&ts=${ts}&token=${token}`);
          const result = await response.json();

          if (result.success) {
            setQuoteInfo(result.data);
          } else {
            setError(result.error || 'Could not retrieve quote.');
          }
        } catch (err) {
          setError('An unexpected error occurred.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchQuote();
    }
  }, [router.isReady, quoteId, ts, token]);
  
  const acceptLink = `/api/quote-decision/accept?quoteId=${quoteId}&ts=${ts}&token=${token}`;
  const declineLink = `/api/quote-decision/decline?quoteId=${quoteId}&ts=${ts}&token=${token}`;

  const renderContent = () => {
    if (isLoading) {
      return <p>Loading quote...</p>;
    }
    if (error) {
      return <div>
        <h1>❌ Error</h1>
        <p>{error}</p>
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
            {quoteData.Decision ? (
                <div style={styles.decisionMade}>Decision Already Made: {quoteData.Decision}</div>
            ) : (
                <div style={styles.decisionButtons}>
                    <a href={acceptLink} style={{...styles.button, ...styles.acceptButton}}>Accept Quote</a>
                    <a href={declineLink} style={{...styles.button, ...styles.declineButton}}>Decline Quote</a>
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
    button: { textDecoration: 'none', color: 'white', padding: '12px 25px', borderRadius: '5px', fontWeight: 'bold' },
    acceptButton: { backgroundColor: '#4caf50' },
    declineButton: { backgroundColor: '#f44336' },
    decisionMade: { textAlign: 'center', marginTop: '40px', padding: '15px', borderRadius: '5px', backgroundColor: '#eee', fontWeight: 'bold' }
};

export default CustomerQuoteView;
