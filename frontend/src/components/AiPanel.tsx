'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AiPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m EggMind AI, your intelligent farming assistant. How can I help you with your egg farm management today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please try Chrome or Edge.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // Update messages state with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get the auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Call the actual AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add auth header if token exists
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        // Try to get the error message from the response body
        let errorMessage = 'Failed to get response';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse the error, use the status text
          errorMessage = `Failed to get response: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessageContent = 'Sorry, I encountered an error processing your request. Please try again.';
      
      // Handle specific error cases
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessageContent = 'Authentication required. Please log in to use AI features.';
      } else if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
        errorMessageContent = 'AI features are not enabled on this server.';
      } else if (error.message?.includes('Failed to fetch')) {
        errorMessageContent = 'Unable to connect to AI service. Please check your internet connection.';
      } else if (error.message) {
        // Display the actual error message from the server
        errorMessageContent = error.message;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessageContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl z-50 border border-gray-400/40 dark:border-gray-700/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-r from-lime-500 via-green-400 to-emerald-500 rounded-t-2xl relative overflow-hidden">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 dark:from-black/20 dark:via-transparent dark:to-black/20"></div>
        {/* Overlay for better text contrast in light mode */}
        <div className="absolute inset-0 bg-black/5 dark:bg-transparent rounded-t-2xl"></div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg ring-2 ring-white/20">
            {/* Replaced SVG with PNG logo */}
            <img 
              src="/logo/MindAilogo.png" 
              alt="EggMind AI Logo" 
              className="h-7 w-7 object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight uppercase tracking-wider">Egg Mind AI</h3>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-tight mt-1">Your Farming Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none transition-all relative z-10 p-1 rounded-lg"
          aria-label="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 bg-gradient-to-b from-white/40 via-white/30 to-white/40 dark:from-gray-800/40 dark:via-gray-800/30 dark:to-gray-800/40 backdrop-blur-sm">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-2xl p-3 shadow-md backdrop-blur-sm ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-lime-500 to-green-600 text-white rounded-br-none shadow-lg' 
                  : 'bg-white/50 dark:bg-gray-700/60 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200/40 dark:border-gray-600/40'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-light' : 'text-gray-500 dark:text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/40 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-none p-3 shadow-md backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary-dark rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-t from-white/60 to-white/40 dark:from-gray-900/60 dark:to-gray-800/40 backdrop-blur-xl">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask EggMind AI anything..."
              className="w-full px-4 py-2 pr-10 border border-gray-300/40 dark:border-gray-600/40 rounded-xl bg-white/70 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm placeholder-gray-400 dark:placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                isListening 
                  ? 'bg-red-500 text-white' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-gradient-to-r from-primary to-green-500 hover:from-primary-dark hover:to-green-600 text-gray-900 dark:text-white rounded-xl p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            aria-label="Send message"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 rotate-90 ${isLoading ? 'animate-spin' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {isListening ? 'Listening... Speak now' : 'Press microphone to speak'}
        </div>
      </form>
    </div>
  );
}