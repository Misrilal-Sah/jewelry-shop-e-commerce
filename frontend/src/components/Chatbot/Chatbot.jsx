import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/api';
import './Chatbot.css';

const Chatbot = () => {
  const { token } = useAuth();
  const location = useLocation();
  
  // Hide chatbot on admin pages
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hello! 👋 I'm Aabhar's assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      fetchQuickActions();
    }
  }, [isOpen]);

  const fetchQuickActions = async () => {
    try {
      const res = await apiFetch('/api/chatbot/quick-actions');
      if (res.ok) {
        const data = await res.json();
        setQuickActions(data.actions || []);
      }
    } catch (error) {
      console.error('Failed to fetch quick actions:', error);
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || inputValue.trim();
    if (!text || isLoading) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Build conversation history for context
    const history = messages
      .filter(m => m.type !== 'system')
      .slice(-5)
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await apiFetch('/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          history
        })
      });

      const data = await res.json();

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.response,
        responseType: data.type,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "Sorry, I'm having trouble connecting. Please try again.",
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Don't render on admin pages
  if (isAdminPage) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && <span className="chat-badge">💬</span>}
      </button>

      {/* Chat Window */}
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <Bot size={20} />
            </div>
            <div>
              <h3>Aabhar Assistant</h3>
              <span className="status">
                <Sparkles size={12} /> AI-powered
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.type} ${message.isError ? 'error' : ''}`}
            >
              <div className="message-avatar">
                {message.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="message bot loading">
              <div className="message-avatar">
                <Bot size={16} />
              </div>
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

        {/* Quick Actions */}
        {quickActions.length > 0 && messages.length <= 2 && (
          <div className="quick-actions">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="quick-action-btn"
                onClick={() => handleQuickAction(action.prompt)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about orders, products, or policies..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
