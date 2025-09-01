import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage'; // Ensure this component is imported

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: '👋 Welcome to Kiwi Trade! We\'ll ask a couple of quick questions to prepare your quote.',
      isUser: false // Use isUser consistently
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Unified function to add a message to the chat
  const addMessage = (content, isUser) => {
    const newMessage = {
      id: Date.now(),
      content,
      isUser,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // This function would contain your logic for handling backend communication
  const sendMessageToBackend = async (message) => {
    setIsLoading(true);
    addMessage(message, true); // Add user message immediately
    setInputValue('');

    // Simulate backend response
    setTimeout(() => {
      addMessage("Thank you for your message. We'll be in touch shortly.", false);
      setIsLoading(false);
    }, 1200);
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessageToBackend(inputValue.trim());
  };

  return (
    <div style={styles.chatbotContainer}>
      <div style={styles.chatbotHeader}>
        <h3>Kiwi Trade Chatbot</h3>
      </div>
      
      <div style={styles.chatbotMessages} ref={messagesEndRef}>
        {messages.map((message) => (
          // Use the ChatMessage component here
          <ChatMessage
            key={message.id}
            message={message.content}
            isUser={message.isUser}
          />
        ))}
        {isLoading && (
            <ChatMessage message="..." isUser={false} />
        )}
        <div ref={messagesEndRef} />
      </div>
      
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
    gap: '10px',
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
  }
};

export default Chatbot;
