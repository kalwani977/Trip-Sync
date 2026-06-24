import React, { useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import './Chatbot.css';

import config from './config';
import MessageParser from './MessageParser';
import ActionProvider from './ActionProvider';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <Chatbot
            config={config}
            messageParser={MessageParser}
            actionProvider={ActionProvider}
          />
        </div>
      )}
      <button className="chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'X' : 'Chat'}
      </button>
    </div>
  );
};

export default ChatbotWidget;