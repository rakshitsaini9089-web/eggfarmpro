'use client';

import { useState, useEffect } from 'react';
import { marketRateAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MarketRateRecord {
  _id: string;
  date: string;
  ratePerTray: number;
  notes: string;
  previousRate: number;
  rateChange: number;
  rateChangePercentage: number;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

interface MarketRateTrend {
  trendData: {
    date: string;
    ratePerTray: number;
    rateChange: number;
    rateChangePercentage: number;
  }[];
  avgRate: number;
  latestRate: number;
  rateCount: number;
}

export default function MarketRatePage() {
  const [marketRates, setMarketRates] = useState<MarketRateRecord[]>([]);
  const [currentRate, setCurrentRate] = useState<MarketRateRecord | null>(null);
  const [trend, setTrend] = useState<MarketRateTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMarketRate, setEditingMarketRate] = useState<MarketRateRecord | null>(null);
  const [alerts, setAlerts] = useState<MarketRateRecord[]>([]);
  const { selectedFarm } = useFarm();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ratePerTray: '',
    notes: ''
  });

  const fetchMarketRates = async () => {
    try {
      setLoading(true);
      const data = await marketRateAPI.getAll(selectedFarm?._id);
      setMarketRates(data);
    } catch (error) {
      console.error('Failed to fetch market rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentRate = async () => {
    try {
      const data = await marketRateAPI.getCurrent(selectedFarm?._id);
      setCurrentRate(data);
    } catch (error) {
      console.error('Failed to fetch current rate:', error);
    }
  };

  const fetchTrend = async () => {
    try {
      const data = await marketRateAPI.getTrend(30, selectedFarm?._id); // Last 30 days
      setTrend(data);
    } catch (error) {
      console.error('Failed to fetch market rate trend:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await marketRateAPI.getAlerts(5.0); // 5% threshold
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch rate change alerts:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchMarketRates(),
      fetchCurrentRate(),
      fetchTrend(),
      fetchAlerts()
    ]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const marketRateData = {
        ...formData,
        ratePerTray: parseFloat(formData.ratePerTray),
        farmId: selectedFarm?._id
      };

      if (editingMarketRate) {
        await marketRateAPI.update(editingMarketRate._id, marketRateData);
      } else {
        await marketRateAPI.create(marketRateData);
      }

      // Reset form and refresh data
      setFormData({
        date: new Date().toISOString().split('T')[0],
        ratePerTray: '',
        notes: ''
      });
      setEditingMarketRate(null);
      setShowModal(false);
      
      // Refresh data
      fetchMarketRates();
      fetchCurrentRate();
      fetchTrend();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save market rate:', error);
      alert('Failed to save market rate. Please try again.');
    }
  };

  const handleEdit = (marketRate: MarketRateRecord) => {
    setEditingMarketRate(marketRate);
    setFormData({
      date: marketRate.date.split('T')[0],
      ratePerTray: marketRate.ratePerTray.toString(),
      notes: marketRate.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this market rate?')) {
      return;
    }

    try {
      await marketRateAPI.delete(id);
      fetchMarketRates();
      fetchCurrentRate();
      fetchTrend();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete market rate:', error);
      alert('Failed to delete market rate. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingMarketRate(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ratePerTray: '',
      notes: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMarketRate(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dynamic Egg Market Rate</h1>
        <button
          onClick={handleAddNew}
          className="btn btn-primary text-xs sm:text-sm"
        >
          Add Market Rate
        </button>
      </div>

      {/* Current Rate Card */}
      {currentRate && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Current Market Rate</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Current Rate</h3>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                {formatCurrency(currentRate.ratePerTray)}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">per tray</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Previous Rate</h3>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                {currentRate.previousRate ? formatCurrency(currentRate.previousRate) : 'N/A'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">per tray</p>
            </div>
            
            <div className={`p-4 rounded-lg ${
              currentRate.rateChangePercentage && currentRate.rateChangePercentage > 0 
                ? 'bg-green-50 dark:bg-green-900' 
                : currentRate.rateChangePercentage && currentRate.rateChangePercentage < 0 
                  ? 'bg-red-50 dark:bg-red-900' 
                  : 'bg-gray-50 dark:bg-gray-700'
            }`}>
              <h3 className="text-sm font-medium ${
                currentRate.rateChangePercentage && currentRate.rateChangePercentage > 0 
                  ? 'text-green-800 dark:text-green-200' 
                  : currentRate.rateChangePercentage && currentRate.rateChangePercentage < 0 
                    ? 'text-red-800 dark:text-red-200' 
                    : 'text-gray-800 dark:text-gray-200'
              }">
                Change
              </h3>
              <p className={`text-2xl font-bold ${
                currentRate.rateChangePercentage && currentRate.rateChangePercentage > 0 
                  ? 'text-green-800 dark:text-green-200' 
                  : currentRate.rateChangePercentage && currentRate.rateChangePercentage < 0 
                    ? 'text-red-800 dark:text-red-200' 
                    : 'text-gray-800 dark:text-gray-200'
              }`}>
                {currentRate.rateChangePercentage 
                  ? `${currentRate.rateChangePercentage > 0 ? '+' : ''}${currentRate.rateChangePercentage.toFixed(2)}%` 
                  : 'N/A'}
              </p>
              <p className="text-sm ${
                currentRate.rateChangePercentage && currentRate.rateChangePercentage > 0 
                  ? 'text-green-700 dark:text-green-300' 
                  : currentRate.rateChangePercentage && currentRate.rateChangePercentage < 0 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-gray-700 dark:text-gray-300'
              }">
                {currentRate.rateChange 
                  ? `${currentRate.rateChange > 0 ? '+' : ''}${formatCurrency(currentRate.rateChange)}` 
                  : 'No change'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Rate Change Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert._id} className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-200">
                      {formatDate(alert.date)}
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Rate: {formatCurrency(alert.ratePerTray)} | 
                      Change: {alert.rateChangePercentage > 0 ? '+' : ''}{alert.rateChangePercentage.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trend && trend.trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Market Rate Trend (Last 30 Days)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Rate</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(trend.avgRate)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Latest Rate</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {formatCurrency(trend.latestRate)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Data Points</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {trend.rateCount}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">days tracked</p>
            </div>
          </div>
          
          <div className="h-64 flex items-end space-x-2 overflow-x-auto">
            {trend.trendData.map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className={`w-8 rounded-t hover:bg-green-700 transition-colors ${
                    point.rateChangePercentage && point.rateChangePercentage > 0 
                      ? 'bg-green-500' 
                      : point.rateChangePercentage && point.rateChangePercentage < 0 
                        ? 'bg-red-500' 
                        : 'bg-primary'
                  }`}
                  style={{ height: `${Math.max(10, ((point.ratePerTray - (trend.avgRate * 0.8)) / (trend.avgRate * 0.4)) * 100)}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500">
                  {formatCurrency(point.ratePerTray)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Rates Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Market Rate History</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
          </div>
        ) : marketRates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No market rates found. Add a new rate to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rate per Tray</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Change %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {marketRates.map((marketRate) => (
                  <tr key={marketRate._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(marketRate.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatCurrency(marketRate.ratePerTray)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        marketRate.rateChange && marketRate.rateChange > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : marketRate.rateChange && marketRate.rateChange < 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {marketRate.rateChange 
                          ? `${marketRate.rateChange > 0 ? '+' : ''}${formatCurrency(marketRate.rateChange)}` 
                          : 'No change'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        marketRate.rateChangePercentage && marketRate.rateChangePercentage > 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : marketRate.rateChangePercentage && marketRate.rateChangePercentage < 0 
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {marketRate.rateChangePercentage 
                          ? `${marketRate.rateChangePercentage > 0 ? '+' : ''}${marketRate.rateChangePercentage.toFixed(2)}%` 
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {marketRate.notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(marketRate)}
                        className="text-primary hover:text-green-700 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(marketRate._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding/Editing Market Rates */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingMarketRate ? 'Edit Market Rate' : 'Add New Market Rate'}
                </h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="market-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="market-date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="market-ratePerTray" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rate per Tray (₹)
                    </label>
                    <input
                      type="number"
                      id="market-ratePerTray"
                      name="ratePerTray"
                      value={formData.ratePerTray}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="market-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="market-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs sm:text-sm"
                  >
                    {editingMarketRate ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}