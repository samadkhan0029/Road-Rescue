import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// System instructions for RoadRescue AI
const SYSTEM_INSTRUCTIONS = `You are RoadRescue AI assistant. Your goal is to help users with car trouble (towing, flat tires, dead batteries).

Be empathetic and calm.

Briefly explain how our services work.

If a user is in danger, tell them to click the red 'Emergency' button immediately.

Keep responses under 60 words.`;

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        sender: 'model',
        text: "Hi! I'm the **RoadRescue** assistant.\n\nAsk about towing, battery jumps, flat tires, fuel delivery, lockouts, or how to get help in the app."
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage = { sender: 'user', text };
    const nextThread = [...messages, userMessage];
    setMessages(nextThread);
    setInput('');
    setIsLoading(true);

    // Add typing indicator
    setMessages(prev => [...prev, { sender: 'model', text: '...', isTyping: true }]);

    try {
      // Format conversation history for Gemini
      const conversation = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Add current user message
      conversation.push({
        role: 'user',
        parts: [{ text: text }]
      });

      // Start chat with system instructions
      const chat = model.startChat({
        history: conversation,
        systemInstruction: SYSTEM_INSTRUCTIONS
      });

      // Send message and get response
      const result = await chat.sendMessage(text);
      const response = result.response;
      const aiText = response.text();

      // Remove typing indicator and add AI response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [...filtered, { sender: 'model', text: aiText }];
      });

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Remove typing indicator and add error response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        let fallbackResponse = 'I\'m here to help with roadside assistance. How can I assist you?';
        
        // Smart fallback responses
        if (text.toLowerCase().includes('emergency') || text.toLowerCase().includes('danger')) {
          fallbackResponse = 'Please click the red Emergency button immediately for immediate assistance!';
        } else if (text.toLowerCase().includes('tire')) {
          fallbackResponse = 'I can help with flat tires! Our providers can change your tire or tow you if needed.';
        } else if (text.toLowerCase().includes('battery')) {
          fallbackResponse = 'Battery issues? We offer jump-start services and battery replacement assistance.';
        } else if (text.toLowerCase().includes('tow')) {
          fallbackResponse = 'Need towing? Our providers offer reliable towing services for any situation.';
        }
        
        return [...filtered, { sender: 'model', text: fallbackResponse }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      {isOpen && (
        <div className="mb-4 w-[350px] max-h-[min(500px,85vh)] h-[500px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-bold">RoadRescue AI</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 hover:bg-white/15"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900 min-h-0">
            {messages.map((msg, index) => (
              <div
                key={`${index}-${msg.sender}-${msg.text?.slice(0, 12)}`}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : msg.isTyping 
                        ? 'bg-slate-700 text-slate-400 italic'
                        : 'bg-slate-800 text-slate-300'
                  } prose prose-invert prose-p:my-1 prose-sm max-w-none prose-headings:text-slate-200`}
                >
                  {msg.isTyping ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  ) : (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && !messages.find(msg => msg.isTyping) && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={isLoading}
              className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm border border-slate-700 placeholder:text-slate-500 disabled:opacity-60"
              placeholder="Ask about roadside help…"
              aria-label="Message to RoadRescue AI"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all"
          aria-label="Open RoadRescue AI"
        >
          <Sparkles size={24} />
        </button>
      )}
    </div>
  );
};

export default AIChatbot;
