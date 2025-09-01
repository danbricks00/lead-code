import React from 'react';

function ChatMessage({ message, isUser }) {
  const messageStyle = {
    maxWidth: '70%',
    margin: '8px',
    padding: '12px 16px',
    borderRadius: '16px',
    backgroundColor: isUser ? '#DCF8C6' : '#333',
    color: isUser ? '#000' : '#fff',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    fontSize: '16px',
    lineHeight: '1.4',
    wordWrap: 'break-word',
  };

  return (
    <div style={messageStyle}>
      {message}
    </div>
  );
}

export default ChatMessage;
