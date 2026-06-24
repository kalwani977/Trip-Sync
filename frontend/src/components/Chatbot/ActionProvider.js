import axios from 'axios';

class ActionProvider {
  constructor(createChatBotMessage, setStateFunc) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  handleChat = async (message) => {
    // 1. Add "Thinking" message
    const thinkingMsg = this.createChatBotMessage("Trekky is checking... ");
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, thinkingMsg],
    }));

    try {
      // 2. Call your Node.js backend
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/chatbot/chat`, { 
        message: message 
      });

      const botMessage = this.createChatBotMessage(response.data.reply);

      // 3. Replace "Thinking" with actual data
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages.slice(0, -1), botMessage],
      }));
    } catch (error) {
      const errorMsg = this.createChatBotMessage("Service is currently offline. Please try again later. ");
      this.setState((prev) => ({
        ...prev,
        messages: [...prev.messages.slice(0, -1), errorMsg],
      }));
    }
  };
}

export default ActionProvider;