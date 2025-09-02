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

  return (
    <div style={messageStyle}>
      {message}
    </div>
  );
}

// Centralized styles object for clarity
const styles = {
  userMessage: {
    maxWidth: "70%",
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#4caf50", // User message: Green
    color: "#ffffff", // White text for contrast
    alignSelf: "flex-end",
    fontSize: "16px",
    lineHeight: "1.4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  systemMessage: {
    maxWidth: "70%",
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#333", // System message: Dark Gray
    color: "#fff",
    alignSelf: "flex-start",
    fontSize: "16px",
    lineHeight: "1.4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  typingContainer: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: '#f1f1f1',
  }
};