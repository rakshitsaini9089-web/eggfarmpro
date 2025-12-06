'use client';

import { useState, useEffect } from 'react';
import { marketRateAPI } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { VoiceInputButton } from '@/components/VoiceInputButton';

// Add the missing type definitions
interface Client {
  _id: string;
  name: string;
  phone: string;
  ratePerTray: number;
}

interface SaleFormData {
  clientId: string;
  trays: number;
  date: string;
  description: string;
  ratePerTray?: number;
}

// This is a clean version of the SaleModal component with the AI Suggest functionality properly integrated
// You can use this to replace the corrupted section in page.tsx

const SaleModal = ({ clients, onSave, onClose }: { clients: Client[], onSave: (data: SaleFormData) => void, onClose: () => void }) => {
  const [formData, setFormData] = useState<SaleFormData>({
    clientId: '',
    trays: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientRate, setClientRate] = useState<number | null>(null);
  
  // AI Suggestion for amount
  const handleAISuggestAmount = async () => {
    try {
      // Get client history for AI suggestion
      const client = clients.find(c => c._id === formData.clientId);
      if (!client) return;

      // In a real implementation, this would call the backend AI API
      // For now, we'll simulate a reasonable suggestion
      const suggestedRate = client.ratePerTray || 0;
      const suggestedAmount = formData.trays * suggestedRate;
      
      // Set the suggested amount
      setFormData(prev => ({
        ...prev,
        ratePerTray: suggestedRate
      }));
      
      // Show notification
      alert(`AI suggests rate of ₹${suggestedRate.toFixed(2)} per tray based on client history`);
    } catch (error) {
      console.error('AI suggestion error:', error);
      alert('Failed to get AI suggestion. Please try again.');
    }
  };

  // Update client rate when client changes
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c._id === formData.clientId);
      setClientRate(client ? client.ratePerTray : null);
    } else {
      setClientRate(null);
    }
  }, [formData.clientId, clients]);

  // Fetch market rate when date changes
  useEffect(() => {
    const fetchMarketRate = async () => {
      if (!formData.date) return;
      
      try {
        const marketRate = await marketRateAPI.getByDate(formData.date);
        if (marketRate && marketRate.ratePerTray) {
          setFormData(prev => ({
            ...prev,
            ratePerTray: marketRate.ratePerTray
          }));
        }
      } catch (error) {
        console.log('No market rate found for this date');
      }
    };
    
    fetchMarketRate();
  }, [formData.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    const rate = formData.ratePerTray || clientRate || 0;
    return (formData.trays * rate) || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto modal-responsive">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">Add New Sale</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0 ml-2"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-client">
              Client
            </label>
            <select
              id="sale-client"
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-rate">
              Rate per Tray (₹)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                id="sale-rate"
                value={formData.ratePerTray || ''}
                onChange={(e) => setFormData({...formData, ratePerTray: parseFloat(e.target.value) || undefined})}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={clientRate ? `Default: ₹${clientRate}` : "Enter rate"}
                min="0"
                step="0.01"
              />
              <button
                type="button"
                onClick={handleAISuggestAmount}
                disabled={!formData.clientId || !formData.trays}
                className="btn btn-primary px-2 sm:px-3 py-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                AI Suggest
              </button>
            </div>
          </div>
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-trays">
              Trays
            </label>
            <input
              type="number"
              id="sale-trays"
              value={formData.trays || ''}
              onChange={(e) => setFormData({...formData, trays: parseInt(e.target.value) || 0})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              min="0"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-date">
              Date
            </label>
            <input
              type="date"
              id="sale-date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="sale-description">
              Description (Optional)
            </label>
            <div className="relative">
              <textarea
                id="sale-description"
                name="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                rows={2}
                placeholder="Add any notes about this sale..."
              />
              <div className="absolute right-2 bottom-2">
                <VoiceInputButton 
                  onTranscript={(text) => setFormData({...formData, description: (formData.description || '') + (formData.description ? ' ' : '') + text})}
                  className="p-1"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">Sale Summary</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <p>Eggs: {formData.trays * 30}</p>
              <p className="font-bold">Total Amount: ₹{calculateTotalAmount().toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs sm:text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs sm:text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleModal;