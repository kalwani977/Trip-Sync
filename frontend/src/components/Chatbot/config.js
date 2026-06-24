import React from 'react';
import { createChatBotMessage } from 'react-chatbot-kit';

const config = {
  botName: "Trekky ",
  initialMessages: [
    createChatBotMessage("Hi! I'm Trekky  How can I help with your journey?")
  ],
  customStyles: {
    botMessageBox: { backgroundColor: '#4A304D' },
    chatButton: { backgroundColor: '#D4AF37' },
  },
  customComponents: {
    // We use React.createElement instead of <div>
    header: () => React.createElement('div', {
      style: {
        background: 'linear-gradient(135deg, #2D1B2E 0%, #4A304D 100%)',
        padding: "15px",
        color: "#D4AF37",
        fontWeight: "bold",
        fontSize: "1.1rem",
        borderBottom: "1px solid rgba(212, 175, 55, 0.2)"
      }
    }, ' Trekky AI'),
    
    botAvatar: () => React.createElement('div', {
      style: {
        backgroundColor: '#D4AF37',
        width: "35px",
        height: "35px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px"
      }
    }, '')
  },
};

export default config;