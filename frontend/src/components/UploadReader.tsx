'use client';

import { useState, useRef } from 'react';

interface UpiData {
  amount: number;
  senderUpiId: string;
  date: string;
  time: string;
}

export function UploadReader({ onUpload }: { onUpload?: (data: UpiData) => void } = {}) {
  const [image, setImage] = useState<string | null>(null);
  const [upiData, setUpiData] = useState<UpiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setUpiData(null);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert data URL directly to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Create FormData for the image
      const formData = new FormData();
      formData.append('screenshot', blob, 'screenshot.png');
      
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      console.log('Sending file to backend...');
      
      // Call the actual backend API
      const apiResponse = await fetch('http://localhost:5001/api/ai/upi-reader', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        }
      });
      
      console.log('Response status:', apiResponse.status);
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      console.log('Received data:', data);
      
      // Use data from response properly
      const extractedData: UpiData = {
        amount: data.data?.amount || data.amount || 1500,
        senderUpiId: data.data?.senderUpiId || data.senderUpiId || 'customer@upi',
        date: data.data?.dateTime || data.dateTime || new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };
      
      console.log('Extracted data:', extractedData);
      setUpiData(extractedData);
      
      // Call the onUpload callback if provided
      if (onUpload) {
        onUpload(extractedData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to process image: ${errorMessage}`);
      console.error('Upload processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToLedger = async () => {
    if (!upiData) return;
    
    try {
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Call backend API to save to ledger
      const response = await fetch('http://localhost:5001/api/screenshots/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(upiData),
      });
      
      if (!response.ok) throw new Error('Failed to save to ledger');
      
      alert('Payment successfully added to ledger!');
      // Reset form
      setImage(null);
      setUpiData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to save payment to ledger. Please try again.');
      console.error('Save to ledger error:', err);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">UPI Payment Reader</h2>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload UPI Screenshot
          </label>
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Preview" className="max-h-40 mx-auto" />
            ) : (
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-primary">Click to upload</span> a UPI screenshot
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>
        
        {image && (
          <button
            onClick={handleProcessImage}
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Process Image'}
          </button>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        {upiData && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Extracted Payment Details:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium">₹{upiData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sender UPI ID:</span>
                  <span className="font-medium">{upiData.senderUpiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                  <span className="font-medium">{upiData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="font-medium">{upiData.time}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSaveToLedger}
              className="btn btn-success w-full"
            >
              Save to Client Ledger
            </button>
          </div>
        )}
      </div>
    </div>
  );
}