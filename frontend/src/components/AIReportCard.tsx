'use client';

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useFarm } from '../contexts/FarmContext'; // Import the FarmContext

interface ReportData {
  type: string;
  title: string;
  description: string;
  lastGenerated?: string;
  status: 'available' | 'generating' | 'error';
}

export function AIReportCard() {
  const { selectedFarm } = useFarm(); // Get the selected farm from context
  const [reports, setReports] = useState<ReportData[]>([
    {
      type: 'daily',
      title: 'Daily Report',
      description: 'Summary of today\'s egg production, feed consumption, and expenses',
      status: 'available'
    },
    {
      type: 'weekly',
      title: 'Weekly Summary',
      description: 'Weekly overview of production trends and financial performance',
      status: 'available'
    },
    {
      type: 'monthly',
      title: 'Monthly Financial Report',
      description: 'Detailed monthly financial analysis with profit calculations',
      status: 'available'
    }
  ]);
  
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const generateReport = async (type: string) => {
    setGeneratingType(type);
    setError(null);
    
    try {
      // Update report status to generating
      setReports(reports.map(report => 
        report.type === type ? {...report, status: 'generating'} : report
      ));
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Check if a farm is selected
      if (!selectedFarm) {
        throw new Error('No farm selected. Please select a farm before generating a report.');
      }
      
      // Build the URL with farmId as query parameter
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/ai/generate-report/${type}?farmId=${selectedFarm._id}`;
      
      // Call the correct backend AI report endpoint directly
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      // Get the PDF blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const urlObj = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `${type}_report.pdf`;
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlObj);
      
      // Update report with generated timestamp
      const now = new Date().toLocaleString();
      setReports(reports.map(report => 
        report.type === type 
          ? {...report, status: 'available', lastGenerated: now} 
          : report
      ));
    } catch (err: any) {
      setError(`Failed to generate ${type} report: ${err.message}`);
      // Update report status to error
      setReports(reports.map(report => 
        report.type === type ? {...report, status: 'error'} : report
      ));
      console.error('Report generation error:', err);
    } finally {
      setGeneratingType(null);
    }
  };

  // Function to get API base URL (copied from frontend lib/api.ts)
  function getApiBaseUrl() {
    if (typeof window === 'undefined') {
      return 'http://localhost:5001/api';
    }
    
    // For localtunnel, use the same hostname but with port 5001
    if (window.location.hostname.includes('loca.lt')) {
      return 'https://clean-bears-make.loca.lt/api';
    }
    
    // For ngrok, use the proxy route to avoid CORS issues
    if (window.location.hostname.includes('ngrok')) {
      return '/api/proxy';
    }
    
    // For local development, use the same hostname but with port 5001
    return `${window.location.protocol}//${window.location.hostname}:5001/api`;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return (
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'generating': return 'Generating...';
      case 'error': return 'Error';
      default: return 'Available';
    }
  };

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <h2 className="card-title">AI-Powered Reports</h2>
        <button onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
        </button>
      </div>
      {!isMinimized && (
        <div className="card-body">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
          
          {selectedFarm ? (
            <div className="mb-4 p-3 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded-lg">
              Generating report for: <strong className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 dark:from-red-400 dark:via-purple-400 dark:to-blue-400 animate-rgb-text">{selectedFarm.name}</strong>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              Please select a farm to generate reports.
            </div>
          )}
          
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 dark:bg-gray-700/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-medium text-gray-900 dark:text-white">{report.title}</h3>
                      <span className="ml-2 flex items-center text-sm">
                        {getStatusIcon(report.status)}
                        <span className="ml-1 text-gray-500 dark:text-gray-400">
                          {getStatusText(report.status)}
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {report.description}
                    </p>
                    {report.lastGenerated && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Last generated: {report.lastGenerated}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => generateReport(report.type)}
                    disabled={report.status === 'generating' || generatingType === report.type || !selectedFarm}
                    className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      report.status === 'generating' || generatingType === report.type || !selectedFarm
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark text-gray-900 dark:text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {generatingType === report.type ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}