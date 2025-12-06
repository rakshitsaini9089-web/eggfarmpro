'use client';

import { useState } from 'react';

interface ReportData {
  type: string;
  title: string;
  description: string;
  lastGenerated?: string;
  status: 'available' | 'generating' | 'error';
}

export function AIReportCard() {
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

  const handleGenerateReport = async (type: string) => {
    setGeneratingType(type);
    setError(null);
    
    try {
      // Update report status to generating
      setReports(reports.map(report => 
        report.type === type ? {...report, status: 'generating'} : report
      ));
      
      // In a real implementation, this would call the backend API
      // const response = await fetch(`/api/ai/report/${type}`, {
      //   method: 'GET',
      // });
      
      // if (!response.ok) throw new Error('Failed to generate report');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update report with generated timestamp
      const now = new Date().toLocaleString();
      setReports(reports.map(report => 
        report.type === type 
          ? {...report, status: 'available', lastGenerated: now} 
          : report
      ));
      
      // Open PDF in new tab (simulated)
      // window.open(response.url, '_blank');
      alert(`Generated ${type} report! In a real implementation, this would open the PDF.`);
    } catch (err) {
      setError(`Failed to generate ${type} report. Please try again.`);
      // Update report status to error
      setReports(reports.map(report => 
        report.type === type ? {...report, status: 'error'} : report
      ));
      console.error('Report generation error:', err);
    } finally {
      setGeneratingType(null);
    }
  };

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
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
      <div className="card-header">
        <h2 className="card-title">AI-Powered Reports</h2>
      </div>
      <div className="card-body">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
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
                  onClick={() => handleGenerateReport(report.type)}
                  disabled={report.status === 'generating' || generatingType === report.type}
                  className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium ${
                    report.status === 'generating' || generatingType === report.type
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  {generatingType === report.type ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200">How it works</h3>
          <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• AI analyzes your farm data to create insightful reports</li>
            <li>• Reports include production metrics, financial summaries, and trend analysis</li>
            <li>• Generated PDFs can be downloaded and shared</li>
          </ul>
        </div>
      </div>
    </div>
  );
}