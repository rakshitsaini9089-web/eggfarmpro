'use client';

import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface BaseProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

type StyledInputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type StyledTextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>;
type StyledSelectProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement>;

export function StyledInput({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}: StyledInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        {...props}
        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 ${
          error 
            ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
        } ${className}`}
      />
      
      {helperText && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      
      {error && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function StyledTextarea({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}: StyledTextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        {...props}
        className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 ${
          error 
            ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
        } ${className}`}
      />
      
      {helperText && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      
      {error && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function StyledSelect({
  label,
  error,
  helperText,
  required,
  className = '',
  children,
  ...props
}: StyledSelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          {...props}
          className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 appearance-none ${
            error 
              ? 'border-red-300 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          } ${className}`}
        >
          {children}
        </select>
        
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      
      {helperText && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      
      {error && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}