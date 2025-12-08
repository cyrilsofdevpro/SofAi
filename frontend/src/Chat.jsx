import { useState, useRef, useEffect } from 'react';
import { sendMessage } from './api';
import './Chat.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const botReply = await sendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', text: botReply }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Error: Unable to connect to the backend. Make sure the Colab notebook is running.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="header-content">
          <h1>SofAi</h1>
          <p className="subtitle">Your AI Assistant</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-section">
            <div className="welcome-icon">✨</div>
            <h2>What can I help you with?</h2>
            <p>Ask me anything, and I'll do my best to help!</p>
            <div className="quick-prompts">
              <button onClick={() => setInput('What is machine learning?')} className="prompt-btn">
                <span className="prompt-icon">🤖</span>
                <span>Machine Learning</span>
              </button>
              <button onClick={() => setInput('What is the capital of France?')} className="prompt-btn">
                <span className="prompt-icon">🗺️</span>
                <span>Geography</span>
              </button>
              <button onClick={() => setInput('Explain quantum computing')} className="prompt-btn">
                <span className="prompt-icon">⚛️</span>
                <span>Quantum Computing</span>
              </button>
              <button onClick={() => setInput('Tell me a joke')} className="prompt-btn">
                <span className="prompt-icon">😄</span>
                <span>Make me Laugh</span>
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-section">
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={loading}
            className="message-input"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="send-button"
          >
            {loading ? (
              <span className="spinner">⟳</span>
            ) : (
              <span>➤</span>
            )}
          </button>
        </div>
        <p className="footer-text">SofAi v2.0</p>
      </div>
    </div>
  );
}
