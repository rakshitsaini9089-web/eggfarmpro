'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Import the AuthContext

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean; // Add this to track typing state
}

// Quick action types
type QuickAction = {
  id: string;
  title: string;
  prompt: string;
};

// Suggestion types
type Suggestion = {
  id: string;
  text: string;
};

// Simple markdown renderer for AI messages
const renderMessageContent = (content: string) => {
  if (!content) return null;
  
  // Split content into lines
  const lines = content.split('\n');
  const elements = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let keyCounter = 0;
  
  const addListIfNeeded = () => {
    if (listType && listItems.length > 0) {
      elements.push(
        listType === 'ul' ? 
        <ul key={`ul-${keyCounter++}`} className="list-disc pl-5 space-y-1">
          {listItems.map((item, i) => <li key={`li-${keyCounter++}-${i}`}>{item}</li>)}
        </ul> :
        <ol key={`ol-${keyCounter++}`} className="list-decimal pl-5 space-y-1">
          {listItems.map((item, i) => <li key={`li-${keyCounter++}-${i}`}>{item}</li>)}
        </ol>
      );
      listItems = [];
      listType = null;
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for headings
    if (line.startsWith('### ')) {
      addListIfNeeded();
      elements.push(<h3 key={`h3-${keyCounter++}`} className="font-semibold mt-3 mb-2">{line.substring(4)}</h3>);
    } else if (line.startsWith('## ')) {
      addListIfNeeded();
      elements.push(<h2 key={`h2-${keyCounter++}`} className="font-semibold text-base mt-3 mb-2">{line.substring(3)}</h2>);
    } else if (line.startsWith('# ')) {
      addListIfNeeded();
      elements.push(<h1 key={`h1-${keyCounter++}`} className="font-bold text-lg mt-3 mb-2">{line.substring(2)}</h1>);
    }
    // Check for unordered lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'ul') {
        addListIfNeeded();
        listType = 'ul';
      }
      listItems.push(line.substring(2));
    }
    // Check for ordered lists
    else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') {
        addListIfNeeded();
        listType = 'ol';
      }
      listItems.push(line.replace(/^\d+\.\s/, ''));
    }
    // Regular paragraph
    else {
      addListIfNeeded();
      if (line.trim() !== '') {
        // Handle bold text
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                 .replace(/\*(.*?)\*/g, '<em>$1</em>');
        elements.push(<p key={`p-${keyCounter++}`} dangerouslySetInnerHTML={{ __html: formattedLine }} />);
      } else {
        elements.push(<br key={`br-${keyCounter++}`} />);
      }
    }
  }
  
  // Add any remaining list
  addListIfNeeded();
  
  return elements;
};

export function AiPanel({ onClose }: { onClose: () => void }) {
  const { token } = useAuth(); // Get the token from AuthContext
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingContent, setTypingContent] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false); // New state to control when to show suggestions
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to store typing timeout

  // Quick actions
  const quickActions: QuickAction[] = [
    { id: 'report-today', title: 'Generate Today’s Report', prompt: 'Generate today\'s farm report with all key metrics' },
    { id: 'report-full', title: 'Download Full PDF', prompt: 'Generate a comprehensive PDF report of all farm activities' },
    { id: 'scan-upi', title: 'Scan UPI Screenshot', prompt: 'I want to scan a UPI payment screenshot' },
    { id: 'payments-today', title: 'View Today Payments', prompt: 'Show me all payments received today' },
    { id: 'ask-anything', title: 'Ask Anything', prompt: '' },
    { id: 'expense-summary', title: 'Expense Summary', prompt: 'Provide a summary of all expenses this month' },
    { id: 'flock-summary', title: 'Flock Summary', prompt: 'Show me the current flock status and health metrics' }
  ];

  // Suggestions that update based on context
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    { id: 'suggestion-1', text: 'Generate Today’s Report' },
    { id: 'suggestion-2', text: 'View Flock Summary' },
    { id: 'suggestion-3', text: 'Check Payments' }
  ]);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('aiChatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    } else {
      // Initial welcome message in streaming style
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Hello there!\n\nI\'m EggMind AI, your intelligent farming assistant.\n\n- Ready to help with your egg farm management\n- Instant reports and insights\n- UPI payment processing\n\n*Key features*:\n\n- *Farm Reports* - Detailed analytics\n- *Payment Tracking* - UPI screenshot analysis\n- *24/7 Support* - Always here to help\n\nHow can I assist with your farm today?',
          timestamp: new Date()
        }
      ]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiChatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    // Add a small delay to ensure DOM is updated before scrolling
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [messages, isTyping, typingContent]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Adjust textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

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

  // Handle quick action selection
  const handleQuickAction = (prompt: string, actionType?: string) => {
    if (actionType === 'scan-upi') {
      // Trigger file input for UPI scanning
      fileInputRef.current?.click();
      return;
    }
    
    if (actionType === 'report-today' || actionType === 'report-full') {
      // Handle report generation
      handleReportGeneration(actionType);
      return;
    }
    
    if (prompt) {
      setInputValue(prompt);
      // Auto-submit after a short delay to allow user to see the prompt
      setTimeout(() => {
        handleSubmitPrompt(prompt);
      }, 300);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (text: string) => {
    // Check if this is a report or UPI related suggestion
    if (text.includes('Report') || text.includes('PDF') || text.includes('Download')) {
      handleReportGeneration('report-today');
      return;
    }
    
    if (text.includes('UPI') || text.includes('Scan') || text.includes('Receipt')) {
      fileInputRef.current?.click();
      return;
    }
    
    if (text.includes('Payment') || text.includes('Expense')) {
      // For payment/expense related suggestions, add appropriate prompt
      const prompt = text.includes('Payment') ? 'Show me recent payments' : 'Show me expense details';
      setInputValue(prompt);
      // Auto-submit after a short delay
      setTimeout(() => {
        handleSubmitPrompt(prompt);
      }, 300);
      return;
    }
    
    setInputValue(text);
    // Auto-submit after a short delay
    setTimeout(() => {
      handleSubmitPrompt(text);
    }, 300);
  };

  // Handle report generation
  const handleReportGeneration = async (reportType: string) => {
    const reportMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Generate ${reportType === 'report-today' ? 'today\'s' : 'full'} report`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, reportMessage]);
    setIsLoading(true);
    
    try {
      // Add a progress message
      const progressMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Generating ${reportType === 'report-today' ? 'today\'s' : 'full'} report... Please wait.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, progressMessage]);
      
      // In a real implementation, this would call the report generation API
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add the report result
      const resultMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `✅ Your ${reportType === 'report-today' ? 'daily' : 'comprehensive'} report has been generated!\n\n📎 [Download Report PDF](#)`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, resultMessage]);
      
      // Update suggestions
      setSuggestions([
        { id: 's1', text: 'Export this report as PDF' },
        { id: 's2', text: 'Show me expense details' },
        { id: 's3', text: 'Email this report' }
      ]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error generating your report. Please try again later.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle UPI file selection
  const handleUpiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUpiImage(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Process UPI image
  const processUpiImage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Add user message about uploading
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `📁 Uploading UPI screenshot: ${file.name}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, uploadMessage]);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add processing message
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '🔍 Analyzing UPI payment details...',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add result message with extracted data
      const resultMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `✅ UPI payment details extracted successfully!

💰 Amount: ₹1,500.00
📱 Sender UPI ID: sender@upi
📅 Date: ${new Date().toLocaleDateString()}
⏰ Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
🧾 Transaction ID: TXN1234567890`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, resultMessage]);
      
      // Update suggestions
      setSuggestions([
        { id: 's1', text: 'Add this payment to records' },
        { id: 's2', text: 'Generate payment summary' },
        { id: 's3', text: 'Scan another receipt' }
      ]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your UPI screenshot. Please try again with a clear image.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Format AI response in streaming style
  const formatStreamingResponse = (content: string): string => {
    // If the content is already formatted in our style, return as is
    if (content.includes('*') || content.includes('\n\n') || content.includes('- ')) {
      return content;
    }
    
    // For unformatted content, apply our streaming style
    // Split into sentences and add line breaks for better readability
    const sentences = content.split('. ').filter(s => s.trim() !== '');
    
    if (sentences.length <= 1) {
      return content; // Return as is if it's a short response
    }
    
    // Add greeting and summary structure
    const greeting = "Hello there!";
    const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    
    // Format as bullet points
    const bulletPoints = sentences.slice(2).map(sentence => `- ${sentence.trim()}.`);
    
    // Combine with proper spacing
    let formattedContent = `${greeting}

${summary}

`;
    
    if (bulletPoints.length > 0) {
      formattedContent += bulletPoints.join('\n') + '\n\n';
    }
    
    // Add key points in bold
    formattedContent += '*Key insights*:\n\n';
    
    // Add some farming-specific key points based on content
    if (content.toLowerCase().includes('report')) {
      formattedContent += '- *Reports* are generated instantly\n';
      formattedContent += '- *Data* is analyzed in real-time\n';
      formattedContent += '- *PDF* download available\n\n';
      formattedContent += 'Would you like me to generate a specific report for your farm?';
    } else if (content.toLowerCase().includes('payment') || content.toLowerCase().includes('upi')) {
      formattedContent += '- *Payments* are securely processed\n';
      formattedContent += '- *UPI* screenshots are analyzed instantly\n';
      formattedContent += '- *Records* are automatically maintained\n\n';
      formattedContent += 'Would you like me to scan a payment receipt?';
    } else {
      formattedContent += '- *Farming* insights are personalized\n';
      formattedContent += '- *Data* is always up-to-date\n';
      formattedContent += '- *Support* is available 24/7\n\n';
      formattedContent += 'How can I assist with your egg farm management today?';
    }
    
    return formattedContent;
  };

  // Submit a prompt (used for both manual input and quick actions)
  const handleSubmitPrompt = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };

    // Update messages state with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    setTypingContent('');
    setShowSuggestions(false); // Hide suggestions when starting new message

    try {
      // Call the AI proxy API instead of the direct endpoint
      const response = await fetch('/api/ai-proxy/chat', {
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
      
      // Format the AI response in streaming style
      const formattedContent = formatStreamingResponse(data.content);
      
      // Add AI response directly without typing animation
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      setTypingContent('');
      
      // Show suggestions after a short delay
      setTimeout(() => {
        setShowSuggestions(true);
      }, 200);

    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessageContent = 'Sorry, I encountered an error processing your request. Please try again.';
      
      // Handle specific error cases
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        errorMessageContent = 'Authentication required. Please log in to use AI features.';
      } else if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
        errorMessageContent = 'Access denied. You do not have permission to use AI features.';
      } else if (error.message) {
        // Display the actual error message from the server
        errorMessageContent = error.message;
      }
      
      // Add error message to chat in streaming style
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Oops! Something went wrong.

${errorMessageContent}

*What you can do:*

- Try again in a moment
- Check your connection
- Contact support if this continues

Need help with something else?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Note: We don't set isTyping to false here because simulateTyping handles it
      setIsTyping(false);
      setTypingContent('');
      setShowSuggestions(true); // Show suggestions even on error
    }
  };

  // Simulate typing animation for AI messages
  const simulateTyping = (content: string, updatedMessages: Message[]) => {
    // Reset showSuggestions when starting to type
    setShowSuggestions(false);
    
    let i = 0;
    // Use 15-25ms per character for faster typing animation
    const speed = Math.floor(Math.random() * 11) + 15; // Random between 15-25ms
    
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    const typeWriter = () => {
      if (i < content.length) {
        setTypingContent(content.substring(0, i + 1));
        i++;
        
        // Scroll to bottom while typing
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
        
        typingTimeoutRef.current = setTimeout(typeWriter, speed);
      } else {
        // Finished typing, add to messages
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        setTypingContent('');
        
        // Show suggestions after typing is complete with fade-in animation
        setTimeout(() => {
          setShowSuggestions(true);
        }, 200);
      }
    };
    
    typeWriter();
  };

  // Update suggestions based on AI response content
  const updateSuggestions = (content: string) => {
    // Simple context-based suggestions
    if (content.toLowerCase().includes('report')) {
      setSuggestions([
        { id: 's1', text: 'Download PDF' },
        { id: 's2', text: 'View Expense Details' },
        { id: 's3', text: 'Compare with Last Week' }
      ]);
    } else if (content.toLowerCase().includes('payment') || content.toLowerCase().includes('income') || content.toLowerCase().includes('upi')) {
      setSuggestions([
        { id: 's1', text: 'Show All Payments' },
        { id: 's2', text: 'Generate Payment Summary' },
        { id: 's3', text: 'Scan Another Receipt' }
      ]);
    } else {
      setSuggestions([
        { id: 's1', text: 'Generate Today’s Report' },
        { id: 's2', text: 'View Flock Summary' },
        { id: 's3', text: 'Check Payments' }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitPrompt(inputValue);
  };

  // Clear chat history
  const clearChatHistory = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      localStorage.removeItem('aiChatMessages');
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! I\'m EggMind AI, your intelligent farming assistant. How can I help you with your egg farm management today?',
          timestamp: new Date()
        }
      ]);
      setSuggestions([
        { id: 's1', text: 'Generate Today’s Report' },
        { id: 's2', text: 'View Flock Summary' },
        { id: 's3', text: 'Check Payments' }
      ]);
    }
  };

  return (
    <div className="w-full h-[80vh] sm:h-[80vh] sm:max-h-[80vh] bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 border border-gray-400/40 dark:border-gray-700/50 flex flex-col overflow-hidden rounded-3xl sm:rounded-4xl">
      {/* Hidden file input for UPI uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleUpiFileSelect}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative overflow-hidden flex-shrink-0 rounded-t-3xl sm:rounded-t-4xl">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 dark:from-black/20 dark:via-transparent dark:to-black/20"></div>
        {/* Overlay for better text contrast in light mode */}
        <div className="absolute inset-0 bg-black/5 dark:bg-transparent"></div>
        <div className="flex items-center space-x-2 sm:space-x-3 relative z-10 min-w-0">
          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/95 flex items-center justify-center shadow-lg ring-2 ring-white/20 flex-shrink-0">
            {/* Replaced SVG with PNG logo */}
            <img 
              src="/logo/MindAilogo.png" 
              alt="EggMind AI Logo" 
              className="h-12 w-12 sm:h-13 sm:w-13 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-tight uppercase tracking-wider truncate">Egg Mind AI</h3>
            <p className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-medium leading-tight mt-0.5 hidden sm:block">Your Farming Assistant</p>
          </div>
        </div>
        <div className="flex space-x-1 sm:space-x-2 relative z-10 flex-shrink-0">
          <button 
            onClick={clearChatHistory}
            className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none transition-all p-1 rounded-lg text-sm"
            aria-label="Clear chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button 
            onClick={onClose}
            className="text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none transition-all p-1 rounded-lg"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Actions (only shown when no messages except welcome) */}
      {messages.length <= 1 && (
        <div className="p-2 sm:p-3 border-b border-gray-200/20 dark:border-gray-700/30 bg-white/70 dark:bg-gray-800/70 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.prompt, action.id.includes('scan') ? 'scan-upi' : action.id.includes('report') ? 'report' : undefined)}
                className="flex-shrink-0 bg-white dark:bg-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-600/80 border border-gray-200 dark:border-gray-600 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-gray-800 dark:text-gray-200 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md whitespace-nowrap"
              >
                {action.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 bg-gradient-to-b from-white/50 via-white/40 to-white/50 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-800/50 backdrop-blur-sm hide-scrollbar"
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full animate-fadeIn`}
          >
            <div 
              className={`w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%] rounded-[18px] p-3 shadow-md backdrop-blur-sm ${
                message.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none shadow-lg inline-block w-auto max-w-full' 
                  : 'bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.05)] dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              ) : (
                <div className="ai-message-content text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {renderMessageContent(message.content)}
                </div>
              )}
              <p className={`text-[10px] sm:text-xs mt-2 ${message.role === 'user' ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Upload progress indicator */}
        {isUploading && (
          <div className="flex justify-start w-full animate-fadeIn">
            <div className="bg-white rounded-[22px] rounded-bl-none p-4 shadow-md border border-[rgba(0,0,0,0.05)] w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-[#007CBA]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">Processing UPI Screenshot...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-[#007CBA] h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start w-full animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-[22px] rounded-bl-none p-4 shadow-md border border-[rgba(0,0,0,0.05)] dark:border-gray-700 w-full max-w-[95%] sm:max-w-[85%] md:max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div 
                    className="w-2 h-2 rounded-full opacity-60 animate-pulse"
                    style={{ 
                      background: 'linear-gradient(90deg, #00B492, #007CBA)',
                      animation: 'dotOpacity 1.4s infinite ease-in-out both'
                    }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full opacity-60 animate-pulse"
                    style={{ 
                      background: 'linear-gradient(90deg, #00B492, #007CBA)',
                      animation: 'dotOpacity 1.4s infinite ease-in-out both',
                      animationDelay: '0.2s'
                    }}
                  ></div>
                  <div 
                    className="w-2 h-2 rounded-full opacity-60 animate-pulse"
                    style={{ 
                      background: 'linear-gradient(90deg, #00B492, #007CBA)',
                      animation: 'dotOpacity 1.4s infinite ease-in-out both',
                      animationDelay: '0.4s'
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">EggMind AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Suggestions - Only show when typing is complete */}
        {messages.length > 0 && showSuggestions && !isLoading && !isUploading && !isTyping && (
          <div className="flex flex-wrap gap-2 pt-2 animate-fadeIn" style={{ animationDuration: '200ms' }}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.text)}
                className="bg-white dark:bg-gray-700/80 hover:bg-gray-100 dark:hover:bg-gray-600/80 border border-gray-200 dark:border-gray-600 rounded-[24px] px-[18px] py-2 text-sm text-[#2F3B52] dark:text-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSubmit}
        className="p-3 sm:p-4 border-t border-gray-200/20 dark:border-gray-700/30 bg-gradient-to-t from-white/50 to-white/30 dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl flex-shrink-0 rounded-b-3xl sm:rounded-b-4xl"
        style={{
          boxShadow: '0 4px 30px rgba(0, 119, 255, 0.1)',
          border: '1px solid rgba(0, 119, 255, 0.2)'
        }}
      >
        <div className="flex space-x-2 items-center">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              placeholder="Ask EggMind AI anything..."
              className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border border-gray-300/40 dark:border-gray-600/40 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-gray-700/60 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[40px] sm:min-h-[48px] max-h-[120px] sm:max-h-[150px] hide-scrollbar"
              disabled={isLoading || isUploading}
              rows={1}
            />
            <button
              type="button"
              onClick={toggleListening}
              disabled={isLoading || isUploading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
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
            disabled={isLoading || !inputValue.trim() || isUploading}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg h-[36px] sm:h-[40px] flex items-center justify-center -translate-y-1"
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
          {isListening ? 'Listening... Speak now' : 'Press microphone to speak • Shift+Enter for new line'}
        </div>
      </form>
      
      {/* Custom styles for animations and scrollbar */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* AI message content styling */
        .ai-message-content {
          line-height: 1.6;
          font-size: 14px;
        }
        
        .ai-message-content strong {
          font-weight: 600;
        }
        
        .ai-message-content ul, 
        .ai-message-content ol {
          margin: 8px 0;
          padding-left: 20px;
        }
        
        .ai-message-content li {
          margin: 4px 0;
        }
        
        .ai-message-content h1, 
        .ai-message-content h2, 
        .ai-message-content h3 {
          font-weight: 600;
          margin: 12px 0 6px 0;
        }
        
        .ai-message-content h1 {
          font-size: 18px;
        }
        
        .ai-message-content h2 {
          font-size: 16px;
        }
        
        .ai-message-content h3 {
          font-size: 15px;
        }
        
        /* Ensure proper sizing on mobile */
        @media (max-width: 640px) {
          .max-w-[95%] {
            max-width: 95%;
          }
        }
        
        /* Prevent text selection on mobile */
        .ai-message-content {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* Dot opacity animation for typing indicator */
        @keyframes dotOpacity {
          0%, 60%, 100% { opacity: 0.6; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}