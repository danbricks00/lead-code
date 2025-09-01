import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

// A simple "Typing..." indicator component
const TypingIndicator = () => (
  <div style={{ alignSelf: 'flex-start', margin: '8px' }}>
    <div style={{
      display: 'inline-block',
      padding: '12px 16px',
      borderRadius: '16px',
      backgroundColor: '#FFFFFF',
      border: "1px solid #E0E0E0",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={styles.typingDot}></span>
        <span style={styles.typingDot}></span>
        <span style={styles.typingDot}></span>
      </div>
    </div>
  </div>
);

const chatFlow = [
  { key: 'customerName', question: 'To start, what is your full name?' },
  { key: 'customerEmail', question: 'Thanks! What is your email address?' },
  { key: 'serviceType', question: 'What type of service are you looking for?' },
  { key: 'specificDetails', question: 'Great. Please provide any specific details about the job.' },
  { key: 'end', question: 'Thank you! We are submitting your request now...' }
];

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "👋 Welcome to Kiwi Trade! We'll ask a couple of quick questions to prepare your quote.",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading to show typing for first message
  const [currentStep, setCurrentStep] = useState(0);
  const [leadData, setLeadData] = useState({});
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
      }, 1000); // Increased delay to show animation
    }
  }, []);

  const addMessage = (content, isUser) => {
    setMessages(prev => [...prev, { id: Date.now(), content, isUser }]);
  };

  const handleLeadSubmission = async (data) => {
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
    setIsLoading(true); // Show typing indicator

    const currentFlowStep = chatFlow[currentStep];
    const newLeadData = { ...leadData, [currentFlowStep.key]: userInput };
    setLeadData(newLeadData);

    const nextStep = currentStep + 1;
    if (nextStep < chatFlow.length -1) {
      setCurrentStep(nextStep);
      setTimeout(() => {
        setIsLoading(false);
        addMessage(chatFlow[nextStep].question, false);
      }, 1000); // Delay for bot "thinking" time
    } else {
      // End of the flow, submit the data
      setCurrentStep(nextStep);
      handleLeadSubmission(newLeadData);
    }
  };

  const isChatEnded = currentStep >= chatFlow.length - 1;

  return (
    <div style={styles.chatbotContainer}>
      <div style={styles.chatbotHeader}>
        <h3>Kiwi Trade Chatbot</h3>
      </div>
      
      <div style={styles.chatbotMessages}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message.content} isUser={message.isUser} />
        ))}
        {isLoading && <TypingIndicator />}
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
    height: '500px',
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
  // Style for the typing indicator dots
  typingDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#8e8e8e',
    borderRadius: '50%',
    margin: '0 2px',
    animation: 'typing 1.4s infinite ease-in-out both',
    '@keyframes typing': {
      '0%, 80%, 100%': { transform: 'scale(0)' },
      '40%': { transform: 'scale(1.0)' },
    },
    '&:nth-child(1)': {
      animationDelay: '-0.32s',
    },
    '&:nth-child(2)': {
      animationDelay: '-0.16s',
    },
  }
};

export default Chatbot;

// We need to inject the keyframes for the animation into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
@keyframes typing {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}
.typing-dot {
  width: 8px;
  height: 8px;
  background-color: #8e8e8e;
  border-radius: 50%;
  margin: 0 2px;
  animation: typing 1.4s infinite ease-in-out both;
}
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
`;
document.head.appendChild(styleSheet);
