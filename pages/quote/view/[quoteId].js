import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout';
import { google } from 'googleapis';

const CustomerQuoteView = ({ initialQuoteInfo, initialError }) => {
  const router = useRouter();
  const { quoteId, ts, token } = router.query;
  const [quoteInfo, setQuoteInfo] = useState(initialQuoteInfo);
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(!initialQuoteInfo && !initialError);
  const [isProcessing, setIsProcessing] = useState(false);
  const [decisionMade, setDecisionMade] = useState(initialQuoteInfo?.quoteData?.Decision ? true : false);

  useEffect(() => {
    if (router.isReady && !initialQuoteInfo && !initialError) {
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
  }, [router.isReady, quoteId, ts, token, initialQuoteInfo, initialError]);

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
      const decisionUrl = `/api/customer-${decision}?quoteId=${normalizedQuoteId}`;
      
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

// Add server-side rendering
export async function getServerSideProps(context) {
  const { params } = context;
  const { quoteId } = params;
  
  console.log("[SERVER] Quote view requested for ID:", quoteId);
  
  // If we don't have ts and token, we can't use the get-quote-for-customer API
  // Instead, we'll directly query the Google Sheets
  try {
    // Initialize Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs'
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

    // Normalize quoteId
    const normalizedQuoteId = quoteId.trim().toLowerCase();
    console.log("[SERVER] Normalized QuoteID:", normalizedQuoteId);
    
    // Fetch all rows from the "Quotes" sheet
    const quotesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Quotes!A:AJ'
    });

    const rows = quotesResponse.data.values;
    if (!rows || rows.length === 0) {
      console.log(`[SERVER] No quote data found in sheets`);
      return {
        props: {
          initialError: 'No quote data found.',
          initialQuoteInfo: null
        }
      };
    }

    const headers = rows[0];
    // Find QuoteID column index
    const quoteIdColIndex = headers.indexOf('QuoteID');
    const quoteIdCol = quoteIdColIndex !== -1 ? quoteIdColIndex : 1; // Default to column B (index 1) if not found
    
    // Find quote row with case-insensitive comparison
    let foundRow = null;
    let foundIndex = -1;
    
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];
      if (row && row[quoteIdCol] && row[quoteIdCol].trim().toLowerCase() === normalizedQuoteId) {
        foundRow = row;
        foundIndex = index;
        console.log("[SERVER] Quote match FOUND for ID:", normalizedQuoteId, "at row", index + 1);
        break;
      }
    }
    
    if (!foundRow) {
      console.warn("[SERVER] No matching quote found for ID:", normalizedQuoteId);
      return {
        props: {
          initialError: 'Quote not found.',
          initialQuoteInfo: null
        }
      };
    }

    // Check for existing decision in Column Z (index 25)
    const existingDecision = (foundRow[25] || "").trim().toLowerCase();
    const existingTimestamp = foundRow[26] || "";
    
    if (existingDecision === "accepted" || existingDecision === "declined") {
      console.log(`[SERVER] Quote ${normalizedQuoteId} already has decision: ${existingDecision} at ${existingTimestamp}`);
    }

    // Convert row to object
    const quoteData = headers.reduce((obj, key, index) => {
      obj[key] = foundRow[index] || '';
      return obj;
    }, {});

    // Get Lead ID from quote data
    const leadId = quoteData['Lead ID'];
    if (!leadId) {
      console.log(`[SERVER] Lead ID missing from quote data for quote ID: ${quoteId}`);
      return {
        props: {
          initialError: 'Quote information is incomplete.',
          initialQuoteInfo: null
        }
      };
    }

    // Fetch lead data
    const leadsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A:AL'
    });

    const leadRows = leadsResponse.data.values;
    if (!leadRows || leadRows.length === 0) {
      console.log(`[SERVER] No lead data found in sheets`);
      return {
        props: {
          initialError: 'Lead information not found.',
          initialQuoteInfo: null
        }
      };
    }

    const leadHeaders = leadRows[0];
    // Find Lead ID column index
    const leadIdColIndex = leadHeaders.indexOf('Lead ID');
    const leadIdCol = leadIdColIndex !== -1 ? leadIdColIndex : 0; // Default to column A (index 0) if not found
    
    // Find lead row with case-insensitive comparison
    let foundLeadRow = null;
    let foundLeadIndex = -1;
    
    for (let index = 1; index < leadRows.length; index++) {
      const row = leadRows[index];
      console.log("Checking lead row", index, "LeadID in sheet:", row[leadIdCol]);
      
      if (row[leadIdCol] && row[leadIdCol].trim().toLowerCase() === leadId.trim().toLowerCase()) {
        foundLeadRow = row;
        foundLeadIndex = index;
        console.log("Lead match FOUND for ID:", leadId, "at row", index);
        break;
      }
    }

    if (!foundLeadRow) {
      console.warn("No matching lead found for ID:", leadId);
      return {
        props: {
          initialError: 'Customer information not found.',
          initialQuoteInfo: null
        }
      };
    }

    // Convert lead row to object
    const leadData = leadHeaders.reduce((obj, key, index) => {
      obj[key] = foundLeadRow[index] || '';
      return obj;
    }, {});

    console.log(`[SERVER] QuoteID ${normalizedQuoteId} searched, row found at index ${foundIndex}.`);
    
    // Create structured quote object from row data
    const quote = { 
      quoteId: foundRow[1] || "", 
      leadId: (foundRow[2] || "").toString().trim() || " ",    
      tradePersonName: foundRow[3] || "", 
      tradePersonEmail: foundRow[4] || "", 
      tradePersonPhone: foundRow[5] || "", 
      customerStatus: foundRow[6] || "", 
      tradePersonStatus: foundRow[7] || "", 
      adminPersonStatus: foundRow[8] || "", 
      labourRate: foundRow[9] || "", 
      labourHours: foundRow[10] || "", 
      labourTotal: foundRow[11] || "", 
      materialsCost: foundRow[12] || "", 
      materialsQuantity: foundRow[13] || "", 
      materialsTotal: foundRow[14] || "", 
      travelCost: foundRow[15] || "", 
      travelDistance: foundRow[16] || "", 
      travelTotal: foundRow[17] || "", 
      installationCost: foundRow[18] || "", 
      subtotal: foundRow[19] || "", 
      gst: foundRow[20] || "", 
      totalQuote: foundRow[21] || "", 
      notes: foundRow[22] || "", 
      validUntil: foundRow[23] || "", 
      resubmissionAllowed: foundRow[24] || "", 
      customerDecision: foundRow[25] || "", 
      customerDecisionTimeStamp: foundRow[26] || "", 
      customerName: foundRow[27] || "", 
      customerEmail: foundRow[28] || "", 
      customerPhone: foundRow[29] || "", 
      serviceType: foundRow[30] || "", 
      location: foundRow[31] || "", 
      timeline: foundRow[32] || "", 
      budget: foundRow[33] || "", 
      rooms: foundRow[34] || "", 
      breakDown: foundRow[35] || "", 
      adminDecisionTimeStamp: foundRow[36] || "", 
      adminDecision: foundRow[37] || "" 
    };
    
    // Add debug logging
    console.log("[SERVER] Quote object created:", quote.quoteId, quote.leadId);
    
    // Return the data as props
    return {
      props: {
        initialQuoteInfo: {
          quoteData,
          leadData,
          quote // Include the structured quote object
        },
        initialError: ''
      }
    };
  } catch (error) {
    console.error("Error fetching quote from Sheets:", error);
    return {
      props: {
        initialError: 'An error occurred while retrieving the quote.',
        initialQuoteInfo: null
      }
    };
  }
}

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
