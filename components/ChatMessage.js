import React from 'react';

// Typing animation component
function TypingAnimation() {
  return (
    <div style={styles.typingContainer}>
      Typing<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
      <style jsx>{`
        .dot {
          animation: blink 1.4s infinite;
          margin-left: 2px;
        }
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Main ChatMessage component
export default function ChatMessage({ message, isUser, isTyping }) {
  console.log("Rendering ChatMessage:", { message, isUser, isTyping });
  if (isTyping) {
    return <TypingAnimation />;
  }

  const messageStyle = isUser ? styles.userMessage : styles.systemMessage;

  return (
    <div style={messageStyle}>
      {message}
    </div>
  );
}

// Styles object
const styles = {
  userMessage: {
    maxWidth: "70%",
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#4caf50", // Green background
    color: "#fff", // Correct white text
    alignSelf: "flex-end",
    fontSize: "16px",
    lineHeight: "1.4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    border: "1px solid #388e3c", // Subtle darker green border for visibility
  },
  systemMessage: {
    maxWidth: "70%",
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#333", // Dark gray
    color: "#fff", // White text
    alignSelf: "flex-start",
    fontSize: "16px",
    lineHeight: "1.4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  typingContainer: {
    color: "#aaa",
    fontStyle: "italic",
    margin: "8px",
    alignSelf: 'flex-start',
  }
};