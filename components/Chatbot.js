import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

const chatFlow = [
  { key: 'customerName', question: 'To start, what is your full name?', stepName: 'Name' },
  { key: 'customerEmail', question: 'Thanks! What is your email address?', stepName: 'Email' },
  { key: 'serviceType', question: 'What type of service are you looking for?', stepName: 'Service' },
  { key: 'specificDetails', question: 'Great. Please provide any specific details about the job.', stepName: 'Details' },
  { key: 'end', question: 'Thank you! We are submitting your request now...', stepName: 'Submit' }
];

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
            {isCompleted || index < currentStep ? '✔' : '●'} {step.stepName}
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
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "👋 Welcome to Kiwi Trade! We'll ask a couple of quick questions to prepare your quote.",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [leadData, setLeadData] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (currentStep === 0) {
      setTimeout(() => {
        setIsLoading(false);
        addMessage(chatFlow[0].question, false);
      }, 1200); // Give a moment for the user to see the typing animation
    }
  }, []);

  const addMessage = (content, isUser) => {
    setMessages(prev => [...prev, { id: Date.now(), content, isUser }]);
  };

  const handleLeadSubmission = async (data) => {
    // This function remains unchanged and will submit the lead
    setIsLoading(true);
    addMessage(chatFlow.find(step => step.key === 'end').question, false);

    try {
      const response = await fetch('/api/lead-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        addMessage('✅ Your lead has been submitted successfully! We will be in touch shortly.', false);
        setIsCompleted(true);
      } else {
        throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error("Lead submission failed:", error);
      addMessage(`❌ Sorry, there was an error: ${error.message}. Please try again later.`, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userInput = inputValue.trim();
    if (!userInput || isLoading) return;

    addMessage(userInput, true);
    setInputValue('');
    setIsLoading(true); // Show typing animation immediately

    const currentFlowStep = chatFlow[currentStep];
    const newLeadData = { ...leadData, [currentFlowStep.key]: userInput };
    setLeadData(newLeadData);

    const nextStep = currentStep + 1;
    if (nextStep < chatFlow.length - 1) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        setIsLoading(false); // Hide typing animation
        addMessage(chatFlow[nextStep].question, false);
      }, 1200); // Simulate bot thinking
    } else {
      setCurrentStep(nextStep);
      handleLeadSubmission(newLeadData);
    }
  };

  const isChatEnded = isCompleted || currentStep >= chatFlow.length - 1;

  return (
    <div style={styles.chatbotContainer}>
      <div style={styles.chatbotHeader}>
        <h3>Kiwi Trade Chatbot</h3>
        <small style={{color: '#aaa', marginTop: '4px'}}>v1.1 - Debug</small> {/* Visible change for deployment verification */}
        <ProgressBar steps={chatFlow} currentStep={currentStep} isCompleted={isCompleted} />
      </div>
      
      <div style={styles.chatbotMessages}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg.content} isUser={msg.isUser} />
        ))}
        {/* Render the ChatMessage component with the isTyping prop */}
        {isLoading && <ChatMessage isTyping={true} />}
        <div ref={messagesEndRef} />
      </div>
      
      {!isChatEnded && (
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
  chatbotContainer: {
    width: '100%',
    maxWidth: '400px',
    height: '600px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif'
  },
  chatbotHeader: {
    background: '#333',
    color: 'white',
    padding: '15px',
    borderRadius: '10px 10px 0 0',
    textAlign: 'center',
  },
  chatbotMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9f9f9'
  },
  chatbotInput: {
    display: 'flex',
    padding: '15px',
    gap: '10px',
    borderTop: '1px solid #eee',
  },
  inputField: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    outline: 'none',
    fontSize: '14px',
  },
  sendButton: {
    width: '35px',
    height: '35px',
    border: 'none',
    background: '#333',
    color: 'white',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Progress Bar Styles
  progressBarContainer: {
    marginTop: '10px',
  },
  progressBarSteps: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    marginBottom: '5px',
    color: '#ccc',
  },
  progressStep: {
    transition: 'color 0.4s ease',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#555',
    borderRadius: '5px',
    height: '8px',
  },
  progress: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: '5px',
    transition: 'width 0.4s ease-in-out',
  }
};

export default Chatbot;