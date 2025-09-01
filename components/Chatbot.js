import { useState, useEffect, useRef } from 'react';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'text',
      content: '👋 Welcome to Kiwi Trade! We\'ll ask a couple of quick questions to prepare your quote.',
      isBot: true
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
  }, [messages]);

  // Function to add a message to the chat
  const addMessage = (content, isBot = false, type = 'text', options = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      isBot,
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Function to handle option selection
  const handleOptionSelect = (value) => {
    console.log("✅ Selected option:", value);
    
    // Add user's selection as a message
    addMessage(value, false, 'text');
    
    // Send the selection to the backend
    sendMessageToBackend(value);
  };

  // Function to send message to backend
  const sendMessageToBackend = async (message) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      
      if (data.success) {
        // Handle different response types
        if (data.type === 'timeline' || data.type === 'options' || data.type === 'budget') {
          console.log("📋 Rendering option buttons for type:", data.type);
          addMessage(data.question, true, data.type, data.options);
        } else {
          addMessage(data.response, true);
        }
      } else {
        addMessage('Sorry, I encountered an error. Please try again.', true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I encountered an error. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    
    // Add user message
    addMessage(message, false);
    
    // Send to backend
    sendMessageToBackend(message);
  };

  // Function to render message content
  const renderMessage = (message) => {
    if (message.type === 'timeline' || message.type === 'options' || message.type === 'budget') {
      return (
        <div className="message-content">
          <div className="message-text">{message.content}</div>
          <div className="message-options">
            {message.options?.map((option, index) => (
              <button
                key={index}
                className="option-button"
                onClick={() => handleOptionSelect(option.value)}
                disabled={isLoading}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    
    return <div className="message-text">{message.content}</div>;
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>Kiwi Trade Chatbot</h3>
      </div>
      
      <div className="chatbot-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.isBot ? 'bot-message' : 'user-message'}`}
          >
            {renderMessage(message)}
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message">
            <div className="loading-spinner">⏳</div>
            <div className="message-text">Typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="chatbot-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          ➤
        </button>
      </form>

      <style jsx>{`
        .chatbot-container {
          width: 100%;
          max-width: 400px;
          height: 500px;
          border: 1px solid #ddd;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .chatbot-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }

        .chatbot-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message {
          max-width: 80%;
          padding: 10px 15px;
          border-radius: 18px;
          word-wrap: break-word;
        }

        .bot-message {
          align-self: flex-start;
          background: #f8f9fa;
          color: #2c3e50;
          border: 1px solid #e9ecef;
          border-radius: 18px 18px 18px 4px;
          padding: 12px 16px;
          margin: 4px 0;
          max-width: 70%;
          word-wrap: break-word;
        }

        .user-message {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
          padding: 12px 16px;
          margin: 4px 0;
          max-width: 70%;
          word-wrap: break-word;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message-text {
          margin-bottom: 5px;
        }

        .message-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-button {
          background: white;
          border: 2px solid #667eea;
          color: #667eea;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          text-align: left;
        }

        .option-button:hover {
          background: #667eea;
          color: white;
        }

        .option-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chatbot-input {
          display: flex;
          padding: 15px;
          gap: 10px;
          border-top: 1px solid #eee;
        }

        .chatbot-input input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }

        .chatbot-input button {
          width: 35px;
          height: 35px;
          border: none;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chatbot-input button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
          display: inline-block;
          font-size: 16px;
          margin-bottom: 4px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
