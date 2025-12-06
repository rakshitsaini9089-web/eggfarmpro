'use client';

import { useState } from 'react';
import { StyledInput, StyledSelect, StyledTextarea } from '@/components/StyledInput';

interface ExpenseFormData {
  category: string;
  subCategory?: string;
  amount: string;
  description: string;
  date: string;
  farm: string;
}

const EXPENSE_CATEGORIES = {
  'FEED EXPENSE': [
    'Feed bag', 'LC', 'Maki', 'Bajara', 'Stone', 
    'Stone dust', 'DORB', 'DOC', 'Protein (soya)', 'Medicine'
  ],
  'CONSTRUCTION MATERIAL': [
    'Cement', 'Sand', 'Bricks', 'Steel', 'Wood', 
    'Paint', 'Tiles', 'Pipes', 'Electrical', 'Other'
  ],
  'CONSTRUCTION LABOUR': [],
  'OTHER': []
};

export function SmartExpenseForm() {
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    farm: ''
  });
  
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setFormData({
      ...formData,
      category,
      subCategory: ''
    });
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      subCategory: e.target.value
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleVoiceCommand = async () => {
    if (!voiceCommand.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch('/api/ai/expenses', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ command: voiceCommand }),
      // });
      
      // if (!response.ok) throw new Error('Failed to process command');
      
      // const data = await response.json();
      
      // Simulate API response for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock parsing of voice command
      // Example: "Add 40 feed bags at ₹1450 for ARNB farm"
      const amountMatch = voiceCommand.match(/(?:₹|rs|rupees)\s*(\d+)/i) || voiceCommand.match(/(\d+)\s*(?:₹|rs|rupees)/i);
      const categoryMatch = voiceCommand.match(/feed\s*bags?/i);
      const farmMatch = voiceCommand.match(/(ARNB|NR)\s*farm/i);
      
      setFormData({
        ...formData,
        amount: amountMatch ? amountMatch[1] : formData.amount,
        category: categoryMatch ? 'FEED EXPENSE' : formData.category,
        subCategory: categoryMatch ? 'Feed bag' : formData.subCategory,
        farm: farmMatch ? farmMatch[1] : formData.farm,
        description: voiceCommand
      });
      
      setVoiceCommand('');
    } catch (err) {
      setError('Failed to process voice command. Please try again.');
      console.error('Voice command error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch('/api/expenses', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData),
      // });
      
      // if (!response.ok) throw new Error('Failed to save expense');
      
      alert('Expense saved successfully!');
      // Reset form
      setFormData({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        farm: ''
      });
    } catch (err) {
      setError('Failed to save expense. Please try again.');
      console.error('Save expense error:', err);
    }
  };

  const subCategories = formData.category ? EXPENSE_CATEGORIES[formData.category as keyof typeof EXPENSE_CATEGORIES] || [] : [];

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Smart Expense Entry</h2>
      </div>
      <div className="card-body">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">Voice Command</h3>
            <button
              type="button"
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isVoiceMode 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              }`}
            >
              {isVoiceMode ? 'Disable Voice' : 'Enable Voice'}
            </button>
          </div>
          
          {isVoiceMode && (
            <div className="space-y-3">
              <div className="flex">
                <input
                  type="text"
                  value={voiceCommand}
                  onChange={(e) => setVoiceCommand(e.target.value)}
                  placeholder="Say something like: 'Add 40 feed bags at ₹1450 for ARNB farm'"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  onClick={handleVoiceCommand}
                  disabled={isProcessing || !voiceCommand.trim()}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Process'}
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI will automatically fill the form based on your voice command
              </p>
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <StyledSelect
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleCategoryChange}
            required
          >
            <option value="">Select a category</option>
            {Object.keys(EXPENSE_CATEGORIES).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </StyledSelect>
          
          {subCategories.length > 0 && (
            <StyledSelect
              label="Sub-category"
              name="subCategory"
              value={formData.subCategory || ''}
              onChange={handleSubCategoryChange}
              required={subCategories.length > 0}
            >
              <option value="">Select a sub-category</option>
              {subCategories.map(subCategory => (
                <option key={subCategory} value={subCategory}>{subCategory}</option>
              ))}
            </StyledSelect>
          )}
          
          <StyledInput
            label="Amount (₹)"
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
          />
          
          <StyledInput
            label="Date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
          
          <StyledSelect
            label="Farm"
            name="farm"
            value={formData.farm}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a farm</option>
            <option value="ARNB">ARNB Enterprises</option>
            <option value="NR">NR Enterprises</option>
          </StyledSelect>
          
          <StyledTextarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter expense details..."
            rows={3}
          />
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}