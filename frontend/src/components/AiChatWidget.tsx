'use client';

import { useState, useEffect } from 'react';
import { AiPanel } from '@/components/AiPanel';

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Small delay to ensure proper loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary via-green-600 to-primary-dark hover:from-primary-dark hover:to-primary-x-dark shadow-lg z-50 flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 border-2 border-gray-200 dark:border-white/20"
        aria-label="Open EggMind AI"
      >
        <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
      </button>

      {/* AI Panel with smooth transition */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-4 pointer-events-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="relative transform transition-all duration-300 ease-in-out w-full h-[80vh] sm:h-auto sm:w-full sm:max-w-[22rem]">
            <AiPanel onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

    </>
  );
}