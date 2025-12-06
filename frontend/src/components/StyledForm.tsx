'use client';

import React, { ReactNode } from 'react';

interface StyledFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  title?: string;
  description?: string;
  isSubmitting?: boolean;
}

export default function StyledForm({
  children,
  onSubmit,
  onCancel,
  submitButtonText = 'Save',
  cancelButtonText = 'Cancel',
  title,
  description,
  isSubmitting = false
}: StyledFormProps) {
  return (
    <form 
      onSubmit={onSubmit}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      {(title || description) && (
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          {title && (
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="px-4 sm:px-6 py-4">
        <div className="space-y-4">
          {children}
        </div>
      </div>
      
      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelButtonText}
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs sm:text-sm">Saving…</span>
            </span>
          ) : (
            <span className="text-xs sm:text-sm">{submitButtonText}</span>
          )}
        </button>
      </div>
    </form>
  );
}