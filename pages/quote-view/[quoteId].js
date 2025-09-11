import React from 'react';
import { useRouter } from 'next/router';
import { google } from 'googleapis';

export default function QuoteView({ quote, error }) {
  const router = useRouter();
  const { quoteId } = router.query;

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.error}>Quote Not Available</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quote Details</h1>
      </div>
      
      <div style={styles.content}>
        {/* Company Logo and Info */}
        <div style={styles.companyHeader}>
          <h1 style={styles.companyName}>Underfloor Heating NZ</h1>
          <p style={styles.tagline}>Professional Underfloor Heating Solutions</p>
        </div>

        {/* Quote Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quote Information</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Quote ID:</strong> {quote.quoteData.QuoteID}
            </div>
            <div style={styles.infoItem}>
              <strong>Date:</strong> {quote.quoteData.Date || new Date().toLocaleDateString('en-NZ')}
            </div>
            <div style={styles.infoItem}>
              <strong>Valid Until:</strong> {quote.quoteData['Expiry Date'] || 
                new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NZ')}
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Customer Details</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Name:</strong> {quote.leadData['Customer Name'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>Email:</strong> {quote.leadData['Email'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>Phone:</strong> {quote.leadData['Phone'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>Address:</strong> {quote.leadData['Address'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>Service:</strong> {quote.quoteData['Service Type'] || 'Underfloor Heating'}
            </div>
          </div>
        </div>

        {/* Tradesperson Details */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Tradesperson Details</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <strong>Name:</strong> {quote.quoteData['Tradesperson Name'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>Email:</strong> {quote.quoteData['Tradesperson Email'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>Phone:</strong> {quote.quoteData['Tradesperson Phone'] || 'N/A'}
            </div>
            <div style={styles.infoItem}>
              <strong>License:</strong> {quote.quoteData['Tradesperson License'] || 'N/A'}
            </div>
          </div>
        </div>

        {/* Room Details */}
        {quote.leadData.Rooms && (
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
                {JSON.parse(quote.leadData.Rooms || '[]').map((room, index) => (
                  <tr key={index}>
                    <td>{room.name}</td>
                    <td>{room.dimensions}</td>
                    <td>{room.sqm ? `${room.sqm}m²` : 'N/A'}</td>
                    <td>{room.labourHours}</td>
                    <td>${parseFloat(room.labourCost || 0).toFixed(2)}</td>
                    <td>${parseFloat(room.materialsCost || 0).toFixed(2)}</td>
                    <td>${(parseFloat(room.labourCost || 0) + parseFloat(room.materialsCost || 0)).toFixed(2)}</td>
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
              <div style={styles.summaryValue}>${parseFloat(quote.quoteData['Labour Cost'] || 0).toFixed(2)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Materials</div>
              <div style={styles.summaryValue}>${parseFloat(quote.quoteData['Materials Cost'] || 0).toFixed(2)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Travel</div>
              <div style={styles.summaryValue}>${parseFloat(quote.quoteData['Travel Cost'] || 0).toFixed(2)}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Installation</div>
              <div style={styles.summaryValue}>${parseFloat(quote.quoteData['Installation Cost'] || 0).toFixed(2)}</div>
            </div>
          </div>
          <div style={styles.totalSection}>
            <div style={styles.totalRow}>
              <span>Subtotal (excl. GST):</span>
              <span>${parseFloat(quote.quoteData['Subtotal'] || 0).toFixed(2)}</span>
            </div>
            <div style={styles.totalRow}>
              <span>GST (15%):</span>
              <span>${parseFloat(quote.quoteData['GST'] || 0).toFixed(2)}</span>
            </div>
            <div style={styles.finalTotalRow}>
              <span>Total (incl. GST):</span>
              <span>${parseFloat(quote.quoteData['Total'] || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Decision Buttons */}
        <div style={styles.decisionButtons}>
          <a 
            href={`/api/customer-accept?quoteId=${quoteId}`}
            style={{...styles.button, ...styles.acceptButton}}
          >
            Accept Quote
          </a>
          <a 
            href={`/api/customer-decline?quoteId=${quoteId}`}
            style={{...styles.button, ...styles.declineButton}}
          >
            Decline Quote
          </a>
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

export async function getServerSideProps(context) {
  const { params } = context;
  const { quoteId } = params;
  
  // Normalize quoteId
  const normalizedQuoteId = (quoteId || "").trim().toLowerCase();
  console.log("Looking for quoteId:", normalizedQuoteId);
  
  try {
    // Initialize Google Sheets
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

    // Fetch all rows from the "Quotes" sheet
    const quotesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Quotes!A:AJ'
    });

    const rows = quotesResponse.data.values;
    if (!rows || rows.length === 0) {
      console.log(`No quote data found in sheets`);
      return {
        props: {
          error: true
        }
      };
    }

    const headers = rows[0];
    // Find QuoteID column index (should be column B, index 1)
    const quoteIdColIndex = headers.indexOf('QuoteID');
    const quoteIdCol = quoteIdColIndex !== -1 ? quoteIdColIndex : 1; // Default to column B (index 1) if not found
    
    // Find quote row with case-insensitive comparison
    let quoteRow = null;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[quoteIdCol]) {
        const sheetId = row[quoteIdCol].trim().toLowerCase();
        console.log("Comparing with row[1]:", sheetId);
        if (sheetId === normalizedQuoteId) {
          quoteRow = row;
          break;
        }
      }
    }

    if (!quoteRow) {
      console.log(`Quote not found: ${normalizedQuoteId}`);
      return {
        props: {
          error: true
        }
      };
    }

    // Convert row to object
    const quoteData = headers.reduce((obj, key, index) => {
      obj[key] = quoteRow[index] || '';
      return obj;
    }, {});

    // Get Lead ID from quote data
    const leadId = quoteData['Lead ID'];
    if (!leadId) {
      console.log(`Lead ID missing from quote data for quote ID: ${quoteId}`);
      return {
        props: {
          error: true
        }
      };
    }

    // Fetch lead data
    const leadsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Leads!A:AJ'
    });

    const leadRows = leadsResponse.data.values;
    if (!leadRows || leadRows.length === 0) {
      console.log(`No lead data found in sheets`);
      return {
        props: {
          error: true
        }
      };
    }

    const leadHeaders = leadRows[0];
    // Find Lead ID column index
    const leadIdColIndex = leadHeaders.indexOf('Lead ID');
    const leadIdCol = leadIdColIndex !== -1 ? leadIdColIndex : 0; // Default to column A (index 0) if not found
    
    // Find lead row with case-insensitive comparison
    let leadRow = null;
    for (let i = 1; i < leadRows.length; i++) {
      const row = leadRows[i];
      if (row[leadIdCol]) {
        const sheetLeadId = row[leadIdCol].trim().toLowerCase();
        if (sheetLeadId === leadId.trim().toLowerCase()) {
          leadRow = row;
          break;
        }
      }
    }

    if (!leadRow) {
      console.log(`Lead not found for ID: ${leadId}`);
      return {
        props: {
          error: true
        }
      };
    }

    // Convert lead row to object
    const leadData = leadHeaders.reduce((obj, key, index) => {
      obj[key] = leadRow[index] || '';
      return obj;
    }, {});

    console.log(`QuoteID ${normalizedQuoteId} found at index ${rows.indexOf(quoteRow)}.`);
    
    // Return the data as props
    return {
      props: {
        quote: {
          quoteData,
          leadData
        },
        error: false
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        error: true
      }
    };
  }
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
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  companyHeader: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  companyName: {
    color: '#667eea',
    fontSize: '24px',
    marginBottom: '5px'
  },
  tagline: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '20px'
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
  decisionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '40px'
  },
  button: { 
    textDecoration: 'none', 
    color: 'white', 
    padding: '12px 25px', 
    borderRadius: '5px', 
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    display: 'inline-block',
    textAlign: 'center'
  },
  acceptButton: { 
    backgroundColor: '#4caf50',
    '&:hover': {
      backgroundColor: '#3d8b40'
    }
  },
  declineButton: { 
    backgroundColor: '#f44336',
    '&:hover': {
      backgroundColor: '#d32f2f'
    }
  },
  error: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#dc3545',
    padding: '50px'
  }
};
