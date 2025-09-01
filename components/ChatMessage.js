import React from "react";

export default function ChatMessage({ message, isUser }) {
  const userStyle = {
    maxWidth: "70%",
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#DCF8C6",
    color: "#000",
    alignSelf: "flex-end",
    fontSize: "16px",
    lineHeight: "1.4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  };

  const systemStyle = {
    maxWidth: "70%",
    margin: "8px",
    padding: "12px 16px",
    borderRadius: "16px",
    backgroundColor: "#333",
    color: "#fff",
    alignSelf: "flex-start",
    fontSize: "16px",
    lineHeight: "1.4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  };

  return <div style={isUser ? userStyle : systemStyle}>{message}</div>;

