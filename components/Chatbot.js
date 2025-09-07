import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChatMessage from './ChatMessage';

const ProgressBar = ({ steps, currentStep, isCompleted }) => {
    const progressPercentage = isCompleted ? 100 : (currentStep / (steps.length - 1)) * 100;
    return (
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBarSteps}>
          {steps.map((step, index) => (
            <div key={index} style={{
              ...styles.progressStep,
              color: isCompleted || index <= currentStep ? '#4caf50' : '#ccc'
            }}>
              {isCompleted || index < currentStep ? '✔' : '●'} {step}
            </div>
          ))}
        </div>
        <div style={styles.progressBar}>
          <div style={{...styles.progress, width: `${progressPercentage}%`}}></div>
        </div>
      </div>
    );
  };

const Chatbot = ({ handleClose, handleReset }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState('welcome');
  const [leadData, setLeadData] = useState({ rooms: [] });
  const [zoneData, setZoneData] = useState([]); // Simplified to a single array of {suburb, area}
  const [suburbSearch, setSuburbSearch] = useState('');
  const [suburbSuggestions, setSuburbSuggestions] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef(null);

  const progressSteps = ["Project Details", "Your Details", "Submit"];
  const [progressStep, setProgressStep] = useState(0);

  // Initial welcome message
  useEffect(() => {
    // This effect runs only once on component mount
    const startConversation = () => {
        addMessage("👋 Welcome to Kiwi Trade! We'll ask a couple of quick questions to prepare your underfloor heating quote.");
        
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            nextStep('start_questions');
        }, 1200); // Wait a moment after the welcome message
    };

    startConversation();

    const fetchZones = async () => {
        try {
          const response = await fetch('/api/zone'); // Fetches ALL zones on init
          const data = await response.json();
          if (data.success && Array.isArray(data.rows)) {
            // Store as a flat array for easier searching
            setZoneData(data.rows); 
          } else {
            console.error("Zone API did not return a successful array of rows:", data);
          }
        } catch (error) {
          console.error("Failed to fetch zone data", error);
        }
      };
  
      fetchZones();
  }, []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const addMessage = (content, isUser = false) => {
    setMessages(prev => [...prev, { id: Date.now(), content, isUser }]);
  };

  // Smart dimension parsing function with validation to prevent phone numbers
  const parseDimensions = (input) => {
    const originalInput = input;
    const cleanInput = input.toLowerCase().trim();
    
    // VALIDATION: Only allow digits, decimal points, 'x', 'm', and spaces
    const allowedChars = /^[0-9\.\sxm²2]*$/;
    if (!allowedChars.test(cleanInput)) {
      return null; // Invalid characters
    }
    
    // VALIDATION: Check for phone number patterns (8+ digits in a row)
    const phonePattern = /\d{8,}/;
    if (phonePattern.test(cleanInput)) {
      return null; // Looks like a phone number
    }
    
    // Pattern 1: Square meter notation (e.g., "12m2", "12m²", "25.5m2", "25.5m²")
    const sqmNotationMatch = cleanInput.match(/^(\d+\.?\d*)\s*m[²2]\s*$/);
    if (sqmNotationMatch) {
      const sqm = parseFloat(sqmNotationMatch[1]);
      // VALIDATION: Maximum reasonable room size (1000 sqm)
      if (sqm > 1000) return null;
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: null,
        format: 'direct_sqm'
      };
    }
    
    // Pattern 2: Direct square meters (e.g., "25", "25.5", "25 sqm")
    const directSqmMatch = cleanInput.match(/^(\d+\.?\d*)\s*(?:sqm|sq\s*m|square\s*meters?)?\s*$/);
    if (directSqmMatch) {
      const sqm = parseFloat(directSqmMatch[1]);
      // VALIDATION: Maximum reasonable room size (1000 sqm)
      if (sqm > 1000) return null;
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: null,
        format: 'direct_sqm'
      };
    }
    
    // Pattern 3: Dimensions with units (e.g., "4m x 12m", "4.0m x 12.0m", "4.5m x 3.2m", "25.1m x 1.2m")
    const dimensionWithUnitsMatch = cleanInput.match(/^(\d+\.?\d*)\s*m\s*x\s*(\d+\.?\d*)\s*m\s*$/);
    if (dimensionWithUnitsMatch) {
      const width = parseFloat(dimensionWithUnitsMatch[1]);
      const length = parseFloat(dimensionWithUnitsMatch[2]);
      // VALIDATION: Maximum reasonable room dimensions (50m x 50m = 2500 sqm)
      if (width > 50 || length > 50) return null;
      const sqm = width * length;
      if (sqm > 1000) return null; // Additional total area check
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: { width, length },
        format: 'dimensions'
      };
    }
    
    // Pattern 4: Dimensions without units (e.g., "4 x 12", "4.0 x 12.0", "4.5 x 3.2", "25.01 x 1.02")
    const dimensionMatch = cleanInput.match(/^(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*$/);
    if (dimensionMatch) {
      const width = parseFloat(dimensionMatch[1]);
      const length = parseFloat(dimensionMatch[2]);
      // VALIDATION: Maximum reasonable room dimensions (50m x 50m = 2500 sqm)
      if (width > 50 || length > 50) return null;
      const sqm = width * length;
      if (sqm > 1000) return null; // Additional total area check
      return {
        originalInput: originalInput,
        sqm: Math.round(sqm * 1000) / 1000, // Round to 3 decimal places (mm precision)
        dimensions: { width, length },
        format: 'dimensions'
      };
    }
    
    return null; // Invalid format
  };

  const nextStep = (next, delay = 1200, context = {}) => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setStep(next);
        // Get the first name for personalization (from context or leadData)
        const firstName = context.firstName || leadData.firstName || '';
        
        // Trigger the question for the new step
        const questions = {
            start_questions: "Let's get started with a few details about your project.",
            ask_room_count: "How many areas are you planning to install underfloor heating in?",
            ask_room_name: `What is the name of room ${leadData.rooms.length + 1}? (e.g., Kitchen, Lounge)`,
            ask_room_dimensions: `What are the dimensions of the ${context.roomName || leadData.rooms[leadData.rooms.length - 1]?.name}?`,
            ask_room_dimensions_help: `Dimensions options:\n• Square meters: 25 (for 25m²)\n• Dimensions: 10 x 5 (for 50m²)\n• Metric dimensions: 7m x 7m (for 49m²)\n• Decimals welcome: 7.5 x 6.2, 25.01 x 1.02 (for precise measurements)\n• Maximum size: 50m x 50m (1000m²)\n• Only use: numbers, decimal points, 'x', 'm', and spaces`,
            ask_timeline: "What is your desired timeline for this project?",
            ask_timeline_details: "Could you please be more specific about your timeline?",
            ask_budget: "What is your budget range for this underfloor heating project?",
            pre_contact_details: "Great, that's all the project information we need. Now, let's get some contact details so we can send you the quote.",
            ask_first_name: "Perfect. What is your first name?",
            ask_last_name: firstName ? `Thanks ${firstName}! What is your last name?` : "What is your last name?",
            ask_phone: firstName ? `Great ${firstName}! What is your phone number?` : "What is your phone number?",
            ask_suburb: firstName ? `Awesome ${firstName}! What suburb is the job located in? Start typing and select from the list.` : "Great. What suburb is the job located in? Start typing and select from the list.",
            ask_email: firstName ? `Finally ${firstName}, what is your email address?` : "Finally, what is your email address?",
        };
        if (questions[next]) {
            addMessage(questions[next]);
        }
        // Automatically move to the next logical step if needed
        if (next === 'start_questions') {
            // No need for an extra delay here, nextStep already has one.
            nextStep('ask_room_count');
        }
        if (next === 'pre_contact_details') {
            setTimeout(() => nextStep('ask_first_name'), 1200);
        }
    }, delay);
  };
  
  const handleLeadSubmission = async (finalData) => {
    setProgressStep(2);
    setIsLoading(true);
    addMessage("Thank you! We are submitting your request now...");

    try {
      const response = await fetch('/api/lead-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        addMessage('✅ Your lead has been submitted successfully! We will be in touch shortly.');
        setIsCompleted(true);
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error("Lead submission failed:", error);
      addMessage(`❌ Sorry, there was an error: ${error.message}. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };

  const validateInput = (currentStep, value) => {
    switch (currentStep) {
        case 'ask_room_count':
            const count = parseInt(value, 10);
            return !isNaN(count) && count > 0 && count < 20 ? null : "Please enter a valid number between 1 and 20.";
        case 'ask_room_name':
            // Prevent dimension-like inputs (digits, "x", "m", etc.)
            const roomNameRegex = /^[a-zA-Z\s'-\.]{2,}$/;
            if (!roomNameRegex.test(value.trim())) {
                return "Please enter a valid room name (letters only, e.g., Kitchen, Lounge, Master Bedroom).";
            }
            // Prevent dimension-like patterns
            const dimensionPattern = /^\d+\.?\d*\s*(x|m|m²|m2|sqm|square\s*meters?)?\s*$/i;
            if (dimensionPattern.test(value.trim())) {
                return "Please enter a room name, not dimensions (e.g., Kitchen, Lounge, Master Bedroom).";
            }
            return value.trim().length > 1 ? null : "Please enter a valid name for the room.";
        case 'ask_room_dimensions':
            const parsed = parseDimensions(value);
            if (!parsed) {
                // Check for phone number pattern specifically
                const phonePattern = /\d{8,}/;
                if (phonePattern.test(value)) {
                    return "This looks like a phone number. Please enter room dimensions instead (e.g., 25 for 25m², 10 x 5 for 50m²).";
                }
                // Check for invalid characters
                const allowedChars = /^[0-9\.\sxm²2]*$/;
                if (!allowedChars.test(value.toLowerCase())) {
                    return "Please use only numbers (0-9), decimal points, 'x', 'm', and spaces.";
                }
                return "Please provide valid room dimensions (max 50m x 50m, 1000m²).";
            }
            return null;
        case 'ask_first_name':
            // Allow alphabet characters, hyphens, apostrophes, and periods (for initials like P.J)
            return /^[a-zA-Z'-\.]{2,}$/.test(value) ? null : "Please enter a valid first name (letters only, e.g., John, P.J, Mary-Jane).";
        case 'ask_last_name':
            // Allow alphabet characters, spaces, hyphens, apostrophes, and periods (for initials like P.J)
            return /^[a-zA-Z\s'-\.]{2,}$/.test(value) ? null : "Please enter a valid last name (letters only, e.g., Smith, P.J, O'Connor).";
        case 'ask_phone':
            // Allow only numbers and + sign, 6-10 digits total
            const cleanPhone = value.replace(/[\s()-]/g, ''); // Remove spaces, parentheses, hyphens
            const phoneRegex = /^\+?[0-9]{6,10}$/;
            return phoneRegex.test(cleanPhone) ? null : "Please enter a valid phone number (6-10 digits, + allowed for international).";
        case 'ask_suburb':
            // Validation now checks if the selected suburb exists in our initial list
            return zoneData.some(zone => zone.suburb.toLowerCase() === value.toLowerCase()) 
                ? null 
                : "Please select a valid suburb from the list.";
        case 'ask_email':
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Please enter a valid email address.";
        default:
            return null; // No validation for other steps like area/suburb selection
    }
  };

  const processUserInput = (input) => {
    const validationError = validateInput(step, input);
    if (validationError) {
        addMessage(validationError);
        return;
    }

    switch (step) {
        case 'ask_room_count':
            setLeadData(prev => ({ ...prev, roomCount: parseInt(input, 10) }));
            nextStep('ask_room_name');
            break;
        case 'ask_room_name':
            setLeadData(prev => ({
                ...prev,
                rooms: [...prev.rooms, { name: input, dimensions: '' }]
            }));
            nextStep('ask_room_dimensions', 1200, { roomName: input });
            // Show help message after a short delay
            setTimeout(() => {
                addMessage(questions.ask_room_dimensions_help, 'bot');
            }, 1500);
            break;
        case 'ask_room_dimensions':
            // Parse room dimensions intelligently
            const parsed = parseDimensions(input);
            
            if (!parsed) {
                addMessage(`Sorry, I couldn't understand that format. Please enter room dimensions using only numbers and 'x' for multiplication:
• Direct square meters: "25", "25.5", "12m2", "12m²"
• Length x Width: "10 x 5", "7.07 x 7.07", "4.0 x 12.0", "25.01 x 1.02"
• With units: "4m x 12m", "4.0m x 12.0m", "25.1m x 1.2m"
• Maximum room size: 50m x 50m (1000 sqm)
• Only use: numbers (0-9), decimal points, 'x', 'm', and spaces`);
                return;
            }
            
            const updatedRooms = [...leadData.rooms];
            const currentRoom = updatedRooms[updatedRooms.length - 1];
            currentRoom.dimensions = parsed.originalInput;
            currentRoom.sqm = parsed.sqm;
            currentRoom.parsedDimensions = parsed.dimensions;
            currentRoom.format = parsed.format;
            
            setLeadData(prev => ({ ...prev, rooms: updatedRooms }));
            
            // Provide confirmation
            if (parsed.format === 'direct_sqm') {
                addMessage(`✅ ${currentRoom.name}: ${parsed.sqm} square meters`);
            } else {
                addMessage(`✅ ${currentRoom.name}: ${parsed.dimensions.width}m x ${parsed.dimensions.length}m = ${parsed.sqm} square meters`);
            }

            if (updatedRooms.length < leadData.roomCount) {
                nextStep('ask_room_name');
            } else {
                nextStep('ask_timeline');
            }
            break;
        case 'ask_timeline':
            setLeadData(prev => ({ ...prev, timeline: input }));
            if (input === 'In a couple of months' || input === 'Other') {
                nextStep('ask_timeline_details');
            } else {
                nextStep('ask_budget');
            }
            break;
        case 'ask_timeline_details':
            setLeadData(prev => ({ ...prev, timeline: input })); // Overwrite with specific details
            nextStep('ask_budget');
            break;
        case 'ask_budget':
            setLeadData(prev => ({ ...prev, budget: input }));
            setProgressStep(1);
            nextStep('pre_contact_details');
            break;
        case 'ask_first_name':
            setLeadData(prev => ({ ...prev, firstName: input, name: input }));
            nextStep('ask_last_name', 1200, { firstName: input });
            break;
        case 'ask_last_name':
            setLeadData(prev => ({ 
                ...prev, 
                lastName: input, 
                customerName: `${prev.firstName} ${input}`,
                name: prev.firstName // Keep first name for personalization
            }));
            nextStep('ask_phone');
            break;
        case 'ask_phone':
            setLeadData(prev => ({ ...prev, customerPhone: input }));
            if (zoneData.length > 0) {
                nextStep('ask_suburb');
            } else {
                addMessage("Location data isn't available, so we'll skip to the final step.");
                nextStep('ask_email');
            }
            break;
        case 'ask_suburb':
            // Find the corresponding area for the selected suburb
            const selectedZone = zoneData.find(zone => zone.suburb.toLowerCase() === input.toLowerCase());
            setLeadData(prev => ({ 
                ...prev, 
                suburb: selectedZone.suburb,
                area: selectedZone.area 
            }));
            nextStep('ask_email');
            break;
        case 'ask_email':
            // CRITICAL FIX: Add email to existing leadData, don't create a new object
            const finalData = {
                ...leadData,
                customerEmail: input,
                serviceType: 'Underfloor Heating',
                // Ensure budget field is included (fallback to empty string if missing)
                budget: leadData.budget || '',
            };
            setLeadData(finalData); // This state update is for UI consistency if needed
            handleLeadSubmission(finalData);
            setStep('completed');
            break;
        default:
            break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userInput = inputValue.trim();
    if (!userInput || isLoading) return;

    addMessage(userInput, true);
    setInputValue('');
    processUserInput(userInput);
  };

  const handleOptionSelect = (selectedValue) => {
    if (isLoading) return;

    if (step === 'ask_suburb') {
        addMessage(selectedValue.suburb, true);
        setSuburbSearch(selectedValue.suburb);
        setSuburbSuggestions([]);
        processUserInput(selectedValue.suburb); // Pass just the suburb string
    } else { // Handle timeline and budget options
        addMessage(selectedValue, true);
        processUserInput(selectedValue);
    }
  }

  const handleSuburbSearchChange = (e) => {
    const value = e.target.value;
    setSuburbSearch(value);

    if (value.length > 1) { // Start searching after 1 character
        const suggestions = zoneData
            .filter(zone => zone.suburb.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 5); // Limit suggestions
        setSuburbSuggestions(suggestions);
    } else {
        setSuburbSuggestions([]);
    }
  };

  const isChatEnded = isCompleted || step === 'completed';
  // Show text input for all steps except suburb search, timeline options, and budget options
  const showTextInput = !isChatEnded && !['ask_suburb', 'ask_timeline', 'ask_budget'].includes(step);

  const timelineOptions = ["Immediately", "In a week", "In a couple of months", "Other"];
  
  // Calculate reasonable budget options based on room data (memoized for performance)
  const budgetOptions = useMemo(() => {
    const totalSqm = leadData.rooms.reduce((sum, room) => {
      const sqm = parseFloat(room.sqm) || 0;
      return sum + sqm;
    }, 0);
    
    return [
      `Under $5,000`,
      `$5,000 - $10,000`,
      `$10,000 - $20,000`,
      `$20,000 - $30,000`,
      `$30,000 - $50,000`,
      `Over $50,000`,
      `I'd like a quote first`
    ];
  }, [leadData.rooms]);

  return (
    <div style={styles.chatbotContainer}>
      <div style={styles.chatbotHeader}>
        <div style={styles.headerContent}>
          <h3>Kiwi Trade Chatbot</h3>
          <ProgressBar steps={progressSteps} currentStep={progressStep} isCompleted={isCompleted} />
        </div>
        <div style={styles.headerButtons}>
            <button onClick={handleClose} style={styles.headerBtn}>—</button>
            <button onClick={handleReset} style={styles.headerBtn}>✕</button>
        </div>
      </div>
      
      <div style={styles.chatbotMessages}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg.content} isUser={msg.isUser} />
        ))}
        {isLoading && <ChatMessage isTyping={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      {step === 'ask_timeline' && !isLoading && (
        <div style={styles.optionsContainer}>
            {timelineOptions.map(option => (
                <button key={option} onClick={() => handleOptionSelect(option)} style={styles.optionButton}>
                    {option}
                </button>
            ))}
        </div>
      )}

      {step === 'ask_budget' && !isLoading && (
        <div style={styles.optionsContainer}>
            {budgetOptions.map(option => (
                <button key={option} onClick={() => handleOptionSelect(option)} style={styles.optionButton}>
                    {option}
                </button>
            ))}
        </div>
      )}

      {step === 'ask_suburb' && !isLoading && (
        <div style={styles.suburbSearchContainer}>
            <input
                type="text"
                value={suburbSearch}
                onChange={handleSuburbSearchChange}
                style={styles.inputField}
                placeholder="Type your suburb..."
                autoFocus
            />
            {suburbSuggestions.length > 0 && (
                <div style={styles.suggestionsContainer}>
                    {suburbSuggestions.map(zone => (
                        <div 
                            key={`${zone.suburb}-${zone.area}`} 
                            onClick={() => handleOptionSelect(zone)} 
                            style={styles.suggestionItem}
                        >
                            {zone.suburb} <span style={{color: '#888'}}>({zone.area})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {showTextInput && (
        <form onSubmit={handleSubmit} style={styles.chatbotInput}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={styles.inputField}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button type="submit" style={styles.sendButton} disabled={isLoading || !inputValue.trim()}>
            ➤
          </button>
        </form>
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
  chatbotContainer: { width: '100%', maxWidth: '400px', height: '100%', border: '1px solid #ddd', borderRadius: '10px', display: 'flex', flexDirection: 'column', background: 'white', fontFamily: 'Arial, sans-serif' },
  chatbotHeader: { background: '#333', color: 'white', padding: '10px 15px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerContent: { flex: 1, textAlign: 'center', paddingLeft: '40px' /* Offset for buttons */ },
  headerButtons: { display: 'flex', gap: '5px' },
  headerBtn: { background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' },
  chatbotMessages: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9' },
  chatbotInput: { display: 'flex', padding: '15px', gap: '10px', borderTop: '1px solid #eee' },
  inputField: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', outline: 'none', fontSize: '14px' },
  sendButton: { width: '35px', height: '35px', border: 'none', background: '#333', color: 'white', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  optionsContainer: { padding: '10px', borderTop: '1px solid #eee', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' },
  optionButton: { background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '15px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px', '&:hover': { background: '#e0e0e0' } },
  suburbSearchContainer: { padding: '15px', borderTop: '1px solid #eee', position: 'relative' },
  suggestionsContainer: { position: 'absolute', bottom: '100%', left: '15px', right: '15px', background: 'white', border: '1px solid #ddd', borderRadius: '8px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' },
  suggestionItem: { padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' },
  progressBarContainer: { marginTop: '10px' },
  progressBarSteps: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px', color: '#ccc' },
  progressStep: { transition: 'color 0.4s ease' },
  progressBar: { width: '100%', backgroundColor: '#555', borderRadius: '5px', height: '8px' },
  progress: { height: '100%', backgroundColor: '#4caf50', borderRadius: '5px', transition: 'width 0.4s ease-in-out' }
};

export default Chatbot;