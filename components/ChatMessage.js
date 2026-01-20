import React from 'react';

// A separate component for the typing animation for clarity
function TypingAnimation() {
  return (
    <div style={styles.typingContainer}>
      <style jsx>{`
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #aaa;
          border-radius: 50%;
          margin: 0 2px;
          animation: blink 1.4s infinite both;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
}

export default function ChatMessage({ message, isUser, isTyping }) {
  // --- DIAGNOSTIC LOG ---
  // This will print the received props to your browser's developer console.
  console.log('ChatMessage Component received props:', { message, isUser, isTyping });

  // If the isTyping prop is true, render the animation
  if (isTyping) {
    return <TypingAnimation />;
  }

  // Determine the style based on the isUser prop
  const messageStyle = isUser ? styles.userMessage : styles.systemMessage;

  // For user messages, use modern gradient styling
  if (isUser) {
    return (
      <div style={{
        ...messageStyle,
        background: 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)',
        backgroundColor: '#e63946',
        color: '#ffffff',
      }}>
        {message}
      </div>
    );
  }

  return (
    <div style={messageStyle}>
      {message}
    </div>
  );
}

// Centralized styles object for clarity
const styles = {
  userMessage: {
    maxWidth: "75%",
    margin: "4px 0",
    padding: "14px 18px",
    borderRadius: "20px 20px 4px 20px",
    background: "linear-gradient(135deg, #e63946 0%, #f77f00 100%)",
    backgroundColor: "#e63946",
    color: "#ffffff",
    alignSelf: "flex-end",
    fontSize: "15px",
    lineHeight: "1.5",
    boxShadow: "0 2px 8px rgba(230, 57, 70, 0.25)",
    fontWeight: 400,
    wordWrap: "break-word",
  },
  systemMessage: {
    maxWidth: "75%",
    margin: "4px 0",
    padding: "14px 18px",
    borderRadius: "20px 20px 20px 4px",
    backgroundColor: "white",
    color: "#2d3748",
    alignSelf: "flex-start",
    fontSize: "15px",
    lineHeight: "1.5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    fontWeight: 400,
    wordWrap: "break-word",
  },
  typingContainer: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    margin: "4px 0",
    padding: "14px 18px",
    borderRadius: "20px 20px 20px 4px",
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  }
};