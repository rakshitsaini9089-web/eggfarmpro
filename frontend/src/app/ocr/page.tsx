'use client';

import { useState, useRef } from 'react';
import { useFarm } from '@/contexts/FarmContext';
import { dashboardAPI } from '@/lib/api';

interface UpiTransaction {
  transaction_type?: string;
  amount?: number;
  from?: string;
  upi_id?: string;
  ref_no?: string;
  source?: string;
  timestamp?: string;
  raw_text?: string;
  // For manual editing
  isEditing?: boolean;
}

export default function UpiReaderPage() {
  const { selectedFarm } = useFarm();
  const [activeTab, setActiveTab] = useState<'paste' | 'file' | 'screenshot'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [fileContent, setFileContent] = useState<File | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<UpiTransaction | UpiTransaction[] | null>(null);
  const [manualEditData, setManualEditData] = useState<UpiTransaction | UpiTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const handleProcessText = async () => {
    if (!pastedText.trim()) {
      setError('Please enter some text to process');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/ai-upi/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: pastedText }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process text');
      }

      setExtractedData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileContent(file);
      setError(null);
    }
  };

  const handleProcessFile = async () => {
    if (!fileContent) {
      setError('Please select a file to process');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', fileContent);

      const response = await fetch('/api/ai-upi/process-file', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process file');
      }

      setExtractedData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      setError(null);
    }
  };

  const handleProcessScreenshot = async () => {
    if (!screenshot) {
      setError('Please select a screenshot to process');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);

      const response = await fetch('/api/ai-upi/process-screenshot', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process screenshot');
      }

      setExtractedData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!extractedData) {
      setError('No transaction data to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/ai-upi/save-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          transaction: extractedData,
          rawText: pastedText || (await fileContent?.text()) || ''
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save transaction');
      }

      setSaveSuccess(true);
      
      // Refresh dashboard stats
      try {
        await dashboardAPI.getStats(selectedFarm?._id || '');
        
        // Show success notification
        // In a real implementation, you might want to use a toast notification library
        console.log('Dashboard updated successfully');
      } catch (refreshError) {
        console.error('Failed to refresh dashboard:', refreshError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTransactionCard = (transaction: UpiTransaction, index: number = 0) => {
    const isEditing = transaction.isEditing;
    
    return (
      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 border border-green-100 dark:border-green-900">
        {isEditing ? (
          // Edit mode
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Edit Transaction</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.transaction_type}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, transaction_type: e.target.value} : t)
                      : {...extractedData, transaction_type: e.target.value};
                    setExtractedData(updatedData);
                  }}
                >
                  <option value="received">Received</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.amount}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, amount: parseFloat(e.target.value) || 0} : t)
                      : {...extractedData, amount: parseFloat(e.target.value) || 0};
                    setExtractedData(updatedData);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From/Sender</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.from}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, from: e.target.value} : t)
                      : {...extractedData, from: e.target.value};
                    setExtractedData(updatedData);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.upi_id}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, upi_id: e.target.value} : t)
                      : {...extractedData, upi_id: e.target.value};
                    setExtractedData(updatedData);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source/App</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.source}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, source: e.target.value} : t)
                      : {...extractedData, source: e.target.value};
                    setExtractedData(updatedData);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference No</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.ref_no}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, ref_no: e.target.value} : t)
                      : {...extractedData, ref_no: e.target.value};
                    setExtractedData(updatedData);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timestamp</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={transaction.timestamp}
                  onChange={(e) => {
                    if (!extractedData) return;
                    const updatedData = Array.isArray(extractedData) 
                      ? extractedData.map((t, i) => i === index ? {...t, timestamp: e.target.value} : t)
                      : {...extractedData, timestamp: e.target.value};
                    setExtractedData(updatedData);
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => {
                  if (!extractedData) return;
                  const updatedData = Array.isArray(extractedData) 
                    ? extractedData.map((t, i) => i === index ? {...t, isEditing: false} : t)
                    : {...extractedData, isEditing: false};
                  setExtractedData(updatedData);
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!extractedData) return;
                  const updatedData = Array.isArray(extractedData) 
                    ? extractedData.map((t, i) => i === index ? {...t, isEditing: false} : t)
                    : {...extractedData, isEditing: false};
                  setExtractedData(updatedData);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          // View mode
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Transaction Details</h3>
              <button
                onClick={() => {
                  if (!extractedData) return;
                  const updatedData = Array.isArray(extractedData) 
                    ? extractedData.map((t, i) => i === index ? {...t, isEditing: true} : t)
                    : {...extractedData, isEditing: true};
                  setExtractedData(updatedData);
                }}
                className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
              >
                Edit
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Basic Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium capitalize">{transaction.transaction_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-lg text-green-600 dark:text-green-400">₹{(transaction.amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">From:</span>
                    <span className="font-medium">{transaction.from || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">UPI ID:</span>
                    <span className="font-medium">{transaction.upi_id || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Info</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Source:</span>
                    <span className="font-medium">{transaction.source || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Reference:</span>
                    <span className="font-medium break-all">{transaction.ref_no || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                    <span className="font-medium">{transaction.timestamp || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            {transaction.raw_text && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Raw Text:</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  {transaction.raw_text.substring(0, 200)}{transaction.raw_text.length > 200 ? '...' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered UPI Reader</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Extract payment information from pasted text, SMS files, or screenshots using advanced AI
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('paste')}
              className={`py-4 px-6 text-center flex-1 font-medium text-sm ${
                activeTab === 'paste'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50 dark:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`py-4 px-6 text-center flex-1 font-medium text-sm ${
                activeTab === 'file'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50 dark:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Upload SMS File
            </button>
            <button
              onClick={() => setActiveTab('screenshot')}
              className={`py-4 px-6 text-center flex-1 font-medium text-sm ${
                activeTab === 'screenshot'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50 dark:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Upload Screenshot
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'paste' && (
            <div className="space-y-6">
              <div>
                <label htmlFor="pastedText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste UPI Transaction Text
                </label>
                <textarea
                  id="pastedText"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Paste your UPI transaction text here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleProcessText}
                  disabled={isLoading || !pastedText.trim()}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Process with AI'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload SMS Text File
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt,.text"
                    onChange={handleFileChange}
                  />
                  {fileContent ? (
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{fileContent.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(fileContent.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Upload SMS Text File</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-green-600">Click to upload</span> a text file containing UPI transactions
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        TXT files only
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleProcessFile}
                  disabled={isLoading || !fileContent}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Process with AI'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'screenshot' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload UPI Screenshot
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                  onClick={() => screenshotInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={screenshotInputRef}
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleScreenshotChange}
                  />
                  {screenshot ? (
                    <div className="space-y-2">
                      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{screenshot.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(screenshot.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Upload UPI Screenshot</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-green-600">Click to upload</span> a UPI payment screenshot
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, JPEG files only (max 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleProcessScreenshot}
                  disabled={isLoading || !screenshot}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Process with AI'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-green-400 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-green-400 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-green-400 rounded"></div>
                  <div className="h-4 bg-green-400 rounded w-5/6"></div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">AI is analyzing your UPI data...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {extractedData && !isLoading && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Extracted Transactions</h2>
            <button
              onClick={handleSaveTransaction}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save to Records'
              )}
            </button>
          </div>

          {saveSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Transaction saved successfully!
                  </p>
                </div>
              </div>
            </div>
          )}

          {Array.isArray(extractedData) ? (
            <div>
              {extractedData.map((transaction, index) => renderTransactionCard(transaction, index))}
            </div>
          ) : (
            renderTransactionCard(extractedData)
          )}
        </div>
      )}
    </div>
  );
}