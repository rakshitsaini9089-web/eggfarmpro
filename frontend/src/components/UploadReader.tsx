'use client';

import { useState, useRef } from 'react';

interface UpiData {
  amount: string;
  upi_id: string;
  txnid: string;
  raw_text: string;
}

export function UploadReader({ onUpload }: { onUpload?: (data: UpiData) => void } = {}) {
  console.log('UploadReader component initialized with onUpload:', !!onUpload);
  console.log('onUpload function:', onUpload);
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [upiData, setUpiData] = useState<UpiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload only JPG, JPEG, or PNG files');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
          setFileName(file.name);
          setUpiData(null);
          setError(null);
          setLoading(false); // Ensure loading is reset when new image is uploaded
        }
      };
      reader.readAsDataURL(file);
      
      // Don't automatically process the image - let the user click the Process Image button
      // This ensures the button stays visible for manual processing
    }
  };

  const handleProcessImage = async () => {
    // Make sure we have an image before processing
    if (!image) {
      console.log('No image to process');
      return;
    }
    
    console.log('Starting image processing');
    setLoading(true);
    setError(null);
    
    try {
      // Convert data URL directly to blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Create FormData for the image
      const formData = new FormData();
      formData.append("file", blob, fileName || 'screenshot.png');
      
      // Get token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('Token:', token);
      
      // Check if we're using ngrok and need to use the proxy
      const isNgrok = typeof window !== 'undefined' && window.location.hostname.includes('ngrok');
      console.log('Is Ngrok:', isNgrok);
      
      let apiResponse;
      let responseText;
      
      if (isNgrok) {
        // Use proxy route for ngrok
        console.log('Making request to proxy endpoint');
        apiResponse = await fetch("/api/proxy?endpoint=/upi/scan", {
          method: "POST",
          body: formData,
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        
        console.log('Proxy response status:', apiResponse.status);
        responseText = await apiResponse.text();
        console.log('Proxy response text:', responseText);
      } else {
        // Direct API call for local development
        console.log('Making direct API call to /api/upi/scan');
        apiResponse = await fetch("/api/upi/scan", {
          method: "POST",
          body: formData,
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });
        
        console.log('Direct API response status:', apiResponse.status);
        responseText = await apiResponse.text();
        console.log('Direct API response text:', responseText);
      }
      
      // Try to parse as JSON, show error if it fails
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Successfully parsed JSON response:', data);
        
        // Validate the response structure
        if (!data.hasOwnProperty('success')) {
          console.warn('Response missing success property');
        }
        if (!data.hasOwnProperty('amount')) {
          console.warn('Response missing amount property');
        }
        if (!data.hasOwnProperty('upi_id')) {
          console.warn('Response missing upi_id property');
        }
        if (!data.hasOwnProperty('txnid')) {
          console.warn('Response missing txnid property');
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error(`Invalid response from server. Status: ${apiResponse.status}. Response: ${responseText}`);
      }

      if (!data.success) {
        console.log('UPI processing failed:', data);
        setError("Could not read UPI details: " + (data.message || "Unknown error"));
        setLoading(false);
        return;
      }

      console.log('UPI data received:', data);
      setUpiData(data);
      setLoading(false);
      
      // Call the onUpload callback if provided
      if (onUpload) {
        console.log('Calling onUpload callback with data:', data);
        console.log('onUpload function type:', typeof onUpload);
        console.log('onUpload function value:', onUpload);
        try {
          onUpload(data);
          console.log('onUpload callback executed successfully');
        } catch (callbackError) {
          console.error('Error in onUpload callback:', callbackError);
        }
      } else {
        console.log('No onUpload callback provided');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to process image: ${errorMessage}`);
      console.error('Upload processing error:', err);
      setLoading(false);
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
                  PNG, JPG, JPEG files only (max 5MB)
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageUpload}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleProcessImage}
          disabled={!image || loading}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Process Image'}
        </button>
        
        {loading && (
          <div className="flex items-center justify-center p-4">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing image...</span>
          </div>
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
                  <span className="font-medium">₹{upiData?.amount || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">UPI ID:</span>
                  <span className="font-medium">{upiData?.upi_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-medium">{upiData?.txnid || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}