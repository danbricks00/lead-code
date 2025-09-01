import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function QuoteView() {
  const router = useRouter();
  const { leadId } = router.query;
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leadId) {
      setError('No quote ID provided');
      setLoading(false);
      return;
    }

    async function fetchQuote() {
      try {
        const response = await fetch(`/api/get-quote?leadId=${leadId}`);
        const data = await response.json();

        if (!data.ok) {
          setError(data.error || 'Failed to load quote');
          return;
        }

        setQuote(data.quote);
      } catch (error) {
        setError('Network error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchQuote();
  }, [leadId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <h2>Loading Quote...</h2>
        <p>Please wait while we fetch your quote details.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: '#f8d7da', 
        color: '#721c24', 
        padding: '15px', 
        borderRadius: '5px', 
        margin: '20px' 
      }}>
        <h3>Error Loading Quote</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{ 
        background: '#f8d7da', 
        color: '#721c24', 
        padding: '15px', 
        borderRadius: '5px', 
        margin: '20px' 
      }}>
        <h3>Quote Not Found</h3>
        <p>No quote found for the provided ID.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeStyle = (status) => {
    const statusLower = (status || 'pending').toLowerCase();
    switch (statusLower) {
      case 'accepted':
        return { background: '#d4edda', color: '#155724' };
      case 'declined':
        return { background: '#f8d7da', color: '#721c24' };
      default:
        return { background: '#fff3cd', color: '#856404' };
    }
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, Helvetica, sans-serif', 
      margin: 0, 
      padding: '20px', 
      backgroundColor: '#f5f5f5' 
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        background: 'white', 
        padding: '40px', 
        borderRadius: '10px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}>
        <div style={{ 
          textAlign: 'center', 
          borderBottom: '2px solid #007bff', 
          paddingBottom: '20px', 
          marginBottom: '30px' 
        }}>
          <h1 style={{ color: '#007bff', margin: 0 }}>Kiwi Trade Quote</h1>
          <p>Professional Trade Services</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            Quote Information
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Quote ID:</span>
            <span style={{ color: '#333' }}>{quote.leadId || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Customer Name:</span>
            <span style={{ color: '#333' }}>{quote.customerName || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Service Type:</span>
            <span style={{ color: '#333' }}>{quote.service || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Location:</span>
            <span style={{ color: '#333' }}>{`${quote.area || ''} ${quote.suburb || ''}`.trim() || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Timeline:</span>
            <span style={{ color: '#333' }}>{quote.timeline || 'Not specified'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Status:</span>
            <span style={{ color: '#333' }}>
              <span style={{
                display: 'inline-block',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.9em',
                fontWeight: 'bold',
                ...getStatusBadgeStyle(quote.status)
              }}>
                {quote.status || 'Pending'}
              </span>
            </span>
          </div>
        </div>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          textAlign: 'center', 
          margin: '20px 0', 
          border: '2px solid #007bff' 
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Total Quote Amount</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>
            {quote.quoteAmount ? `$${quote.quoteAmount}` : 'N/A'}
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            Project Details
          </h2>
          <div>
            {quote.details ? (
              <p>{quote.details}</p>
            ) : (
              <p>No additional details provided.</p>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            Tradesman Information
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Name:</span>
            <span style={{ color: '#333' }}>{quote.tradesmanName || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Email:</span>
            <span style={{ color: '#333' }}>{quote.tradesmanEmail || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Quote Date:</span>
            <span style={{ color: '#333' }}>{formatDate(quote.quoteDate)}</span>
          </div>
        </div>

        {(quote.status !== 'accepted' && quote.status !== 'declined') && (
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a 
              href={`/api/quote-decision?leadId=${quote.leadId}&action=accept`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                margin: '0 10px',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                background: '#28a745',
                color: 'white'
              }}
            >
              Accept Quote
            </a>
            <a 
              href={`/api/quote-decision?leadId=${quote.leadId}&action=decline`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                margin: '0 10px',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                background: '#dc3545',
                color: 'white'
              }}
            >
              Decline Quote
            </a>
            <a 
              href={`/api/quote-pdf?leadId=${quote.leadId}`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                margin: '0 10px',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                background: '#007bff',
                color: 'white'
              }}
            >
              Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
