import React, { useState, useEffect, useRef } from 'react';
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

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState('welcome');
  const [leadData, setLeadData] = useState({ rooms: [] });
  const [zoneData, setZoneData] = useState({ areas: [], suburbs: {} });
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
          const response = await fetch('/api/zone');
          const data = await response.json();
          if (data.success && Array.isArray(data.rows)) {
            const areas = [...new Set(data.rows.map(row => row.area).filter(Boolean))];
            const suburbs = {};
            areas.forEach(area => {
              suburbs[area] = data.rows
                .filter(row => row.area === area && row.suburb)
                .map(row => row.suburb);
            });
            setZoneData({ areas, suburbs });
          } else {
            console.error("Zone API did not return a successful array of rows:", data);
          }
        } catch (error) {
          console.error("Failed to fetch zone data", error);
          addMessage("Sorry, I'm having trouble loading location data right now. Please try again in a moment.");
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

  const nextStep = (next, delay = 1200, context = {}) => {
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setStep(next);
        // Trigger the question for the new step
        const questions = {
            start_questions: "Let's get started with a few details about your project.",
            ask_room_count: "How many areas are you planning to install underfloor heating in?",
            ask_room_name: `What is the name of room ${leadData.rooms.length + 1}? (e.g., Kitchen, Lounge)`,
            ask_room_dimensions: `What are the dimensions of the ${context.roomName || leadData.rooms[leadData.rooms.length - 1]?.name}? (e.g., 12m² or 4m x 3m)`,
            pre_contact_details: "Great, that's all the project information we need. Now, let's get some contact details so we can send you the quote.",
            ask_name: "Perfect. What is your full name?",
            ask_phone: "What is your phone number?",
            ask_area: "Great. Now, please select your area from the options below.",
            ask_suburb: "Thanks. And now your suburb.",
            ask_email: "Finally, what is your email address?",
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
            setTimeout(() => nextStep('ask_name'), 1200);
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
            return value.trim().length > 1 ? null : "Please enter a valid name for the room.";
        case 'ask_room_dimensions':
            return value.trim().length > 1 ? null : "Please provide the dimensions (e.g., 12m² or 4m x 3m).";
        case 'ask_name':
            return /^[a-zA-Z\s'-]{2,}$/.test(value) ? null : "Please enter a valid name.";
        case 'ask_phone':
            return /^[\d\s()+-]{7,}$/.test(value) ? null : "Please enter a valid phone number.";
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
            break;
        case 'ask_room_dimensions':
            const updatedRooms = [...leadData.rooms];
            updatedRooms[updatedRooms.length - 1].dimensions = input;
            setLeadData(prev => ({ ...prev, rooms: updatedRooms }));

            if (updatedRooms.length < leadData.roomCount) {
                nextStep('ask_room_name');
            } else {
                setProgressStep(1);
                nextStep('pre_contact_details');
            }
            break;
        case 'ask_name':
            setLeadData(prev => ({ ...prev, customerName: input }));
            nextStep('ask_phone');
            break;
        case 'ask_phone':
            setLeadData(prev => ({ ...prev, customerPhone: input }));
            if (zoneData.areas.length > 0) {
                nextStep('ask_area');
            } else {
                addMessage("Location data isn't available, so we'll skip to the final step.");
                nextStep('ask_email');
            }
            break;
        case 'ask_area':
            setLeadData(prev => ({ ...prev, area: input }));
            nextStep('ask_suburb');
            break;
        case 'ask_suburb':
            setLeadData(prev => ({ ...prev, suburb: input }));
            nextStep('ask_email');
            break;
        case 'ask_email':
            const finalData = {
                ...leadData,
                customerEmail: input,
                serviceType: 'Underfloor Heating',
            };
            setLeadData(finalData);
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
    addMessage(selectedValue, true);
    processUserInput(selectedValue);
  }

  const isChatEnded = isCompleted || step === 'completed';
  const showTextInput = !isChatEnded && !['ask_area', 'ask_suburb'].includes(step);

  return (
    <div style={styles.chatbotContainer}>
      <div style={styles.chatbotHeader}>
        <h3>Kiwi Trade Chatbot</h3>
        <ProgressBar steps={progressSteps} currentStep={progressStep} isCompleted={isCompleted} />
      </div>
      
      <div style={styles.chatbotMessages}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg.content} isUser={msg.isUser} />
        ))}
        {isLoading && <ChatMessage isTyping={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      {step === 'ask_area' && !isLoading && zoneData.areas.length > 0 && (
        <div style={styles.optionsContainer}>
            {zoneData.areas.map(area => (
                <button key={area} onClick={() => handleOptionSelect(area)} style={styles.optionButton}>
                    {area}
                </button>
            ))}
        </div>
      )}

      {step === 'ask_suburb' && !isLoading && leadData.area && (
        <div style={styles.optionsContainer}>
            {(zoneData.suburbs[leadData.area] || []).map(suburb => (
                <button key={suburb} onClick={() => handleOptionSelect(suburb)} style={styles.optionButton}>
                    {suburb}
                </button>
            ))}
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
  chatbotContainer: { width: '100%', maxWidth: '400px', height: '600px', border: '1px solid #ddd', borderRadius: '10px', display: 'flex', flexDirection: 'column', background: 'white', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', fontFamily: 'Arial, sans-serif' },
  chatbotHeader: { background: '#333', color: 'white', padding: '15px', borderRadius: '10px 10px 0 0', textAlign: 'center' },
  chatbotMessages: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', backgroundColor: '#f9f9f9' },
  chatbotInput: { display: 'flex', padding: '15px', gap: '10px', borderTop: '1px solid #eee' },
  inputField: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '20px', outline: 'none', fontSize: '14px' },
  sendButton: { width: '35px', height: '35px', border: 'none', background: '#333', color: 'white', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  optionsContainer: { padding: '10px', borderTop: '1px solid #eee', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' },
  optionButton: { background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '15px', padding: '8px 12px', cursor: 'pointer', fontSize: '14px', '&:hover': { background: '#e0e0e0' } },
  progressBarContainer: { marginTop: '10px' },
  progressBarSteps: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px', color: '#ccc' },
  progressStep: { transition: 'color 0.4s ease' },
  progressBar: { width: '100%', backgroundColor: '#555', borderRadius: '5px', height: '8px' },
  progress: { height: '100%', backgroundColor: '#4caf50', borderRadius: '5px', transition: 'width 0.4s ease-in-out' }
};

export default Chatbot;