import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

// Enhanced dimension parsing function
function parseDimensions(input) {
  if (!input || typeof input !== 'string') return 0;
  
  const cleanInput = input.trim().toLowerCase();
  
  // Match patterns like "25", "25sqm", "25m²", "25 sqm", "25 m²"
  const singleNumberMatch = cleanInput.match(/^(\d+(?:\.\d+)?)\s*(?:sqm?|m²|square\s*meters?)?$/);
  if (singleNumberMatch) {
    return parseFloat(singleNumberMatch[1]);
  }
  
  // Match patterns like "4x3", "4 x 3", "4m x 3m", "5m x 5m", "4.5 x 6.2", "7mx8m"
  const dimensionsMatch = cleanInput.match(/^(\d+(?:\.\d+)?)\s*m?\s*[x×]\s*(\d+(?:\.\d+)?)\s*m?$/);
  if (dimensionsMatch) {
    const length = parseFloat(dimensionsMatch[1]);
    const width = parseFloat(dimensionsMatch[2]);
    console.log(`🔢 Parsing dimensions: "${input}" → ${length} x ${width} = ${length * width}m²`);
    return length * width;
  }
  
  // If no pattern matches, try to extract the first number
  const firstNumberMatch = cleanInput.match(/(\d+(?:\.\d+)?)/);
  if (firstNumberMatch) {
    console.log(`🔢 Parsing single number: "${input}" → ${parseFloat(firstNumberMatch[1])}m²`);
    return parseFloat(firstNumberMatch[1]);
  }
  
  console.log(`⚠️ Could not parse dimensions: "${input}"`);
  return 0;
}

const QuoteSubmitPage = () => {
  const router = useRouter();
  const { query, isReady } = router;
  const { quoteId } = query;

  // Form state
  const [tradesperson, setTradesperson] = useState({ name: '', email: '', phone: '' });
  const [costs, setCosts] = useState({
    labourRate: '50',
    labourHours: '',
    materialsCost: '',
    materialsQuantity: '',
    travelCost: '2',
    travelDistance: '',
    installationCost: '',
  });
  const [notes, setNotes] = useState('');
  const [totals, setTotals] = useState({
    labour: 0,
    materials: 0,
    travel: 0,
    subtotal: 0,
    gst: 0,
    final: 0,
  });
  const [submissionStatus, setSubmissionStatus] = useState(null); // null | 'submitting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [parsedRooms, setParsedRooms] = useState([]);
  const [leadDetails, setLeadDetails] = useState(null); // To store fetched lead data
  const [isEditing, setIsEditing] = useState(false); // New state for edit mode
  const [isResubmission, setIsResubmission] = useState(false); // Track if this is a resubmission
  const [declineReason, setDeclineReason] = useState(''); // Store admin's decline reason
  const [versionedQuoteId, setVersionedQuoteId] = useState(''); // Store the versioned quote ID from API
  
  // Set default expiry date to 2 weeks from now
  const defaultExpiryDate = new Date();
  defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 14);
  const [validUntil, setValidUntil] = useState(defaultExpiryDate.toISOString().split('T')[0]);


  // Load tradesperson details from localStorage on initial render
  useEffect(() => {
    const savedTradesperson = localStorage.getItem('tradespersonDetails');
    if (savedTradesperson) {
      setTradesperson(JSON.parse(savedTradesperson));
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save tradesperson details to localStorage whenever they change
  useEffect(() => {
    // We check if the name is not empty to avoid saving an empty initial object
    if (tradesperson.name) {
      localStorage.setItem('tradespersonDetails', JSON.stringify(tradesperson));
    }
  }, [tradesperson]);

  // Fetch lead details from API
  useEffect(() => {
    if (isReady && quoteId) {
      const fetchLeadDetails = async () => {
        console.log(`[FORM] useEffect triggered. Fetching details for leadId: ${quoteId}`);
        try {
        const response = await fetch(`/api/quote/init?leadId=${quoteId}`);
          const result = await response.json();
          
          console.log('[FORM] API Response received:', result);

          if (result.lead) {
            console.log('[FORM] Success. Setting lead details:', result.lead);
            setLeadDetails(result.lead);
            
            // Store the versioned quote ID for submission
            if (result.quoteId) {
              console.log('[FORM] Using versioned quote ID:', result.quoteId);
              setVersionedQuoteId(result.quoteId);
              
              // Check if this is a resubmission (has version suffix)
              const isVersioned = /^(.+)-([A-Z]|\d+)$/.test(result.quoteId);
              setIsResubmission(isVersioned);
              
              if (isVersioned) {
                console.log('[FORM] This is a resubmission with versioned quote ID:', result.quoteId);
              }
            }

            // Preload existing quote data if available (for resubmission)
            if (result.existingQuote) {
              console.log('[FORM] Preloading existing quote data:', result.existingQuote);
              setCosts(prev => ({
                ...prev,
                labourRate: result.existingQuote.labourRate || '',
                labourHours: result.existingQuote.labourHours || '',
                materialsCost: result.existingQuote.materialsCost || '',
                materialsQuantity: result.existingQuote.materialsQuantity || '',
                travelCost: result.existingQuote.travelCost || '',
                travelDistance: result.existingQuote.travelDistance || '',
                installationCost: result.existingQuote.installationCost || ''
              }));
              
              setNotes(result.existingQuote.notes || '');
              setValidUntil(result.existingQuote.validUntil || '');
              
              // Set tradesperson details if available
              if (result.existingQuote.TradePersonName) {
                setTradespersonDetails(prev => ({
                  ...prev,
                  name: result.existingQuote.TradePersonName,
                  email: result.existingQuote.tradePersonEmail,
                  phone: result.existingQuote.tradePersonPhone
                }));
              }
            }

            // Make room data lookup case-insensitive to handle inconsistencies
            const roomDataString = result.lead.rooms; 
            console.log('[FORM] Room data received:', roomDataString, 'Type:', typeof roomDataString);

            if (roomDataString) {
                try {
                    // Handle different data formats
                    let roomsData;
                    if (Array.isArray(roomDataString)) {
                        roomsData = roomDataString;
                    } else if (typeof roomDataString === 'string') {
                        // Check if it's a JSON string or just a string representation of an object
                        if (roomDataString.startsWith('[') || roomDataString.startsWith('{')) {
                            roomsData = JSON.parse(roomDataString);
                        } else {
                            console.log('[FORM] Room data is not valid JSON, skipping:', roomDataString);
                            roomsData = [];
                        }
                    } else {
                        console.log('[FORM] Room data is not array or string, skipping:', roomDataString);
                        roomsData = [];
                    }
                    console.log('[FORM] Parsed rooms data:', roomsData);
                    
                    // Parse dimensions and calculate sqm for each room
                    const parsedRoomsWithSqm = Array.isArray(roomsData) ? roomsData.map(room => {
                        const parsedRoom = { ...room };
                        if (room.dimensions && !room.sqm) {
                            parsedRoom.sqm = parseDimensions(room.dimensions);
                        }
                        return parsedRoom;
                    }) : [];
                    
                    setParsedRooms(parsedRoomsWithSqm);
                    
                    // Auto-populate materials quantity with total square meters if available
                    if (parsedRoomsWithSqm && Array.isArray(parsedRoomsWithSqm)) {
                        const totalSqm = parsedRoomsWithSqm.reduce((sum, room) => {
                            return sum + (parseFloat(room.sqm) || 0);
                        }, 0);
                        
                        if (totalSqm > 0) {
                            setCosts(prev => ({
                                ...prev,
                                materialsQuantity: totalSqm.toFixed(1).toString()
                            }));
                            console.log(`[FORM] Auto-populated materials quantity: ${totalSqm} sqm`);
                        }
                    }
                } catch (e) {
                    console.error("[FORM] Failed to parse rooms data:", e);
                    setParsedRooms([]);
                }
            }
          } else {
            console.error("[FORM] API Error:", result.error || "Data object not found. Enabling edit mode.");
            setLeadDetails({
                'CustomerName': '', 'CustomerEmail': '', 'CustomerPhone': '',
                'ServiceType': 'Underfloor Heating', 'Area': '', 'Suburb': '', 'Timelline': ''
            });
            setIsEditing(true);
          }

          // Note: Resubmission logic removed - using new unified system
          // The new system handles quote states through the Quotes tab directly

        } catch (error) {
          console.error("[FORM] Fatal fetch error, enabling edit mode.", error);
          setLeadDetails({
            'CustomerName': '', 'CustomerEmail': '', 'CustomerPhone': '',
            'ServiceType': 'Underfloor Heating', 'Area': '', 'Suburb': '', 'Timelline': ''
          });
          setIsEditing(true);
        }
      };
      fetchLeadDetails();
    }
  }, [isReady, quoteId]);


  // Calculate totals whenever costs change
  useEffect(() => {
    const getNum = (val) => parseFloat(val) || 0;

    const labourTotal = getNum(costs.labourRate) * getNum(costs.labourHours);
    const materialsTotal = getNum(costs.materialsCost) * getNum(costs.materialsQuantity);
    const travelTotal = getNum(costs.travelCost) * getNum(costs.travelDistance);
    const installationTotal = getNum(costs.installationCost);
    
    const subtotal = labourTotal + materialsTotal + travelTotal + installationTotal;
    const gst = subtotal * 0.15; // 15% GST
    const finalTotal = subtotal + gst;

    setTotals({
      labour: labourTotal,
      materials: materialsTotal,
      travel: travelTotal,
      subtotal: subtotal,
      gst: gst,
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

  const handleLeadDetailsChange = (e) => {
    const { name, value } = e.target;
    // Use a temporary object for the new state to handle different capitalizations
    const newDetails = { ...leadDetails };
    newDetails[name] = value;
    setLeadDetails(newDetails);
  };

  const handleRoomChange = (index, field, value) => {
    const updatedRooms = [...parsedRooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    
    // If dimensions field is changed, recalculate sqm
    if (field === 'dimensions') {
      updatedRooms[index].sqm = parseDimensions(value);
    }
    
    setParsedRooms(updatedRooms);
  };

  const removeRoom = (index) => {
    const updatedRooms = parsedRooms.filter((_, i) => i !== index);
    setParsedRooms(updatedRooms);
  };

  const addRoom = () => {
    const newRoom = { name: '', dimensions: '' };
    setParsedRooms([...parsedRooms, newRoom]);
  };


  // Add these lines to the existing component where state is defined
  const [isDraft, setIsDraft] = useState(false);
  
  // Modify the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('loading');
    
    // Use the versioned quote ID from the API response
    if (!versionedQuoteId) {
      setErrorMessage('Quote ID not available. Please refresh the page and try again.');
      setSubmissionStatus('error');
      return;
    }
    
    const quoteDetails = {
      ...costs,
      notes,
      subtotal: totals.subtotal,
      gst: totals.gst,
      totalQuote: totals.final,
      TradePersonName: tradesperson.name,
      tradespersonEmail: tradesperson.email,
      tradespersonPhone: tradesperson.phone,
      validUntil, // Add expiry date to submitted data
      isDraft, // Add draft flag
      // Add these fields for validation in the API
      customerEmail: leadDetails.customerEmail,
      customerName: leadDetails.customerName,
      serviceType: leadDetails.serviceType
    };
  
    try {
      // Update leadDetails with current room data before submitting
      const updatedLeadDetails = {
        ...leadDetails,
        Rooms: JSON.stringify(parsedRooms) // Update rooms with any edits made by tradesperson
      };
  
      const response = await fetch('/api/quote-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: versionedQuoteId, // Use the versioned quote ID
          leadId: quoteId, // The URL parameter is actually the leadId now
          ...quoteDetails, // Spread the quote details directly
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

  if (!isReady || !leadDetails) {
    return <div style={styles.container}><p>Loading lead details...</p></div>;
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
        <h1 style={styles.header}>
          {isResubmission ? '🔄 Quote Resubmission Form' : 'Quote Submission Form'}
        </h1>
        <p><strong>Lead ID:</strong> {quoteId}</p>
        {versionedQuoteId && (
          <p><strong>Quote ID:</strong> {versionedQuoteId}</p>
        )}
        
        {isResubmission && (
          <div style={styles.resubmissionBanner}>
            <h3 style={styles.bannerTitle}>⚠️ Quote Declined - Revision Required</h3>
            <p style={styles.bannerText}>
              <strong>Admin Feedback:</strong> {declineReason}
            </p>
            <p style={styles.bannerInstructions}>
              Please review the feedback above and update your quote accordingly before resubmitting.
            </p>
          </div>
        )}

        <div style={styles.section}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={styles.subHeader}>Customer & Project Details</h2>
            <button onClick={() => setIsEditing(!isEditing)} style={styles.editButton}>
              {isEditing ? 'Lock Details' : 'Edit Details'}
            </button>
          </div>
          
          {!isEditing ? (
            <div style={styles.detailsGrid}>
              {/* Display static details, now with consistent bracket notation and null checks */}
              <div><strong>Name:</strong> {leadDetails['customerName'] || leadDetails['CustomerName'] || 'N/A'}</div>
              <div><strong>Email:</strong> {leadDetails['customerEmail'] || leadDetails['CustomerEmail'] || 'N/A'}</div>
              <div><strong>Phone:</strong> {leadDetails['customerPhone'] || leadDetails['CustomerPhone'] || 'N/A'}</div>
              <div><strong>Service:</strong> {leadDetails['serviceType'] || leadDetails['ServiceType'] || 'Underfloor Heating'}</div>
              <div><strong>Address:</strong> {leadDetails['address'] || 'N/A'}</div>
              <div><strong>Area:</strong> {leadDetails['area'] || leadDetails['Area'] || 'N/A'}</div>
              <div><strong>Suburb:</strong> {leadDetails['suburb'] || leadDetails['Suburb'] || 'N/A'}</div>
              <div><strong>Timeline:</strong> {leadDetails['timeline'] || leadDetails['Timelline'] || 'N/A'}</div>
            </div>
          ) : (
            <div style={styles.detailsGrid}>
              {/* Display input fields, now with consistent bracket notation and null checks */}
              <div style={styles.inputGroup}><label>Name</label><input type="text" name="customerName" value={leadDetails['customerName'] || leadDetails['CustomerName'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Email</label><input type="email" name="customerEmail" value={leadDetails['customerEmail'] || leadDetails['CustomerEmail'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Phone</label><input type="tel" name="customerPhone" value={leadDetails['customerPhone'] || leadDetails['CustomerPhone'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Service</label><input type="text" name="serviceType" value={leadDetails['serviceType'] || leadDetails['ServiceType'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Address</label><input type="text" name="address" value={leadDetails['address'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Area</label><input type="text" name="area" value={leadDetails['area'] || leadDetails['Area'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Suburb</label><input type="text" name="suburb" value={leadDetails['suburb'] || leadDetails['Suburb'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
              <div style={styles.inputGroup}><label>Timeline</label><input type="text" name="timeline" value={leadDetails['timeline'] || leadDetails['Timelline'] || ''} onChange={handleLeadDetailsChange} style={styles.input}/></div>
            </div>
          )}
        </div>

        {parsedRooms.length > 0 && (
            <div style={styles.section}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h2 style={styles.subHeader}>Room Details</h2>
                    <span style={{fontSize: '0.9em', color: '#666', fontStyle: 'italic'}}>
                        {isEditing ? 'Click rows to edit room data' : 'Customer entered room information'}
                    </span>
                </div>
                
                {!isEditing ? (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Room Name</th>
                                <th style={styles.th}>Dimensions</th>
                                <th style={styles.th}>Square Meters</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parsedRooms.map((room, index) => (
                                <tr key={index}>
                                    <td style={styles.td}>{room.name}</td>
                                    <td style={styles.td}>
                                        {room.dimensions || room.originalInput || 'N/A'}
                                    </td>
                                    <td style={styles.td}>
                                        {room.sqm && !isNaN(room.sqm) && room.sqm > 0 ? `${parseFloat(room.sqm).toFixed(1)}m²` : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            <tr style={{backgroundColor: '#f0f8ff', fontWeight: 'bold'}}>
                                <td style={styles.td}>Total</td>
                                <td style={styles.td}>-</td>
                                <td style={styles.td}>
                                    {parsedRooms.reduce((sum, room) => sum + (parseFloat(room.sqm) || 0), 0).toFixed(1)}m²
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div style={styles.editableRooms}>
                        <div style={{marginBottom: '10px', fontWeight: 'bold', color: '#333'}}>
                            Edit room details below (clean up any unclear entries):
                        </div>
                        {parsedRooms.map((room, index) => (
                            <div key={index} style={styles.roomEditRow}>
                                <div style={styles.roomInputGroup}>
                                    <label style={styles.roomLabel}>Room Name</label>
                                    <input 
                                        type="text" 
                                        value={room.name} 
                                        onChange={(e) => handleRoomChange(index, 'name', e.target.value)}
                                        style={styles.roomInput}
                                        placeholder="e.g., Kitchen, Bathroom, Living Room"
                                    />
                                </div>
                                <div style={styles.roomInputGroup}>
                                    <label style={styles.roomLabel}>Dimensions / SQM</label>
                                    <input 
                                        type="text" 
                                        value={room.dimensions} 
                                        onChange={(e) => handleRoomChange(index, 'dimensions', e.target.value)}
                                        style={styles.roomInput}
                                        placeholder="e.g., 4x3m, 15 sqm, 12 square meters"
                                    />
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => removeRoom(index)}
                                    style={styles.removeRoomBtn}
                                    title="Remove this room"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button"
                            onClick={addRoom}
                            style={styles.addRoomBtn}
                        >
                            + Add Another Room
                        </button>
                    </div>
                )}
            </div>
        )}

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
                    <label style={styles.calcLabel}>Cost per Square Meter</label>
                    <input type="number" name="materialsCost" value={costs.materialsCost} onChange={handleCostChange} placeholder="0" style={styles.calcInput} />
                </div>
                <span style={styles.calcSymbol}>x</span>
                <div style={styles.calcInputGroup}>
                    <label style={styles.calcLabel}>Square Meters (m²)</label>
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
            
            {/* Subtotal, GST, and Final Total */}
            <div style={styles.totalSection}>
              <div style={styles.totalRow}>
                <span>Subtotal (excl. GST):</span>
                <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>GST (15%):</span>
                <span>${totals.gst.toFixed(2)}</span>
              </div>
              <hr style={{...styles.hr, margin: '10px 0'}} />
              <div style={{...styles.totalRow, ...styles.finalTotalRow}}>
                <strong>Total (incl. GST):</strong>
                <strong>${totals.final.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div style={styles.section}>
             <h2 style={styles.subHeader}>Notes for Customer</h2>
             <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.textarea} placeholder="e.g., This quote is valid for 14 days."></textarea>
          </div>

          <div style={styles.section}>
            <h2 style={styles.subHeader}>Quote Expiry</h2>
            <div style={styles.inputGroup}>
                <label>Quote Valid Until</label>
                <input 
                    type="date" 
                    value={validUntil} 
                    onChange={(e) => setValidUntil(e.target.value)} 
                    style={styles.input} 
                    required 
                />
            </div>
          </div>

          <div style={{
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            padding: '12px',
            borderTop: '1px solid #eee'
          }}>
            // Add this before the submit button in the form
            <div className="mb-4 p-4 border rounded bg-light">
              <h5>Submission Options</h5>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="submissionType"
                  id="finalSubmission"
                  checked={!isDraft}
                  onChange={() => setIsDraft(false)}
                />
                <label className="form-check-label" htmlFor="finalSubmission">
                  <strong>Final Submission</strong> - Send to customer with PDF
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="submissionType"
                  id="draftSubmission"
                  checked={isDraft}
                  onChange={() => setIsDraft(true)}
                />
                <label className="form-check-label" htmlFor="draftSubmission">
                  <strong>Save as Draft</strong> - Save to spreadsheet only (no customer email)
                </label>
              </div>
            </div>
            
            {/* Modify the submit button to show different text based on isDraft */}
            <button 
              type="submit" 
              className={`btn ${isDraft ? 'btn-secondary' : 'btn-primary'} btn-lg`}
              disabled={submissionStatus === 'loading'}
            >
              {submissionStatus === 'loading' ? (
                <span>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  {' '}Processing...
                </span>
              ) : isDraft ? 'Save as Draft' : 'Submit Quote to Customer'}
            </button>
          </div>
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
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
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

  table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
  th: { background: '#f9f9f9', border: '1px solid #ddd', padding: '8px', textAlign: 'left' },
  td: { border: '1px solid #ddd', padding: '8px' },

  hr: { border: 'none', borderTop: '1px solid #eee', margin: '20px 0' },
  totalSection: { background: '#f9f9f9', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1em', margin: '5px 0' },
  finalTotalRow: { fontSize: '1.2em', fontWeight: 'bold', color: '#2c5530' },
  textarea: { width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' },
  button: { width: '100%', padding: '12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1em', cursor: 'pointer' },
  error: { color: 'red', marginTop: '10px', textAlign: 'center' },
  editButton: {
    background: 'none',
    border: '1px solid #ddd',
    color: '#333',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  
  // Room editing styles
  editableRooms: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '15px',
    background: '#fafafa',
    marginTop: '10px'
  },
  roomEditRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    marginBottom: '10px',
    padding: '10px',
    background: 'white',
    borderRadius: '4px',
    border: '1px solid #e8e8e8'
  },
  roomInputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  roomLabel: {
    fontSize: '0.85em',
    color: '#555',
    marginBottom: '4px',
    fontWeight: '500'
  },
  roomInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  removeRoomBtn: {
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    height: '36px'
  },
  addRoomBtn: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px'
  },

  // Resubmission banner styles
  resubmissionBanner: {
    background: '#fff3cd',
    border: '2px solid #ffeaa7',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    borderLeft: '5px solid #f39c12'
  },
  bannerTitle: {
    color: '#856404',
    margin: '0 0 10px 0',
    fontSize: '1.2em'
  },
  bannerText: {
    color: '#856404',
    margin: '5px 0',
    lineHeight: '1.4'
  },
  bannerInstructions: {
    color: '#856404',
    margin: '10px 0 0 0',
    fontStyle: 'italic',
    fontSize: '0.9em'
  }
};

export default QuoteSubmitPage;
