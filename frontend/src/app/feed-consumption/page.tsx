'use client';

import { useState, useEffect } from 'react';
import { batchAPI, feedConsumptionAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

interface FeedConsumptionRecord {
  _id: string;
  batchId: {
    _id: string;
    name: string;
    quantity: number;
  };
  date: string;
  feedType: string;
  quantity: number;
  unit: string;
  notes: string;
  fcr: number;
  weightGain: number;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

interface FeedConsumptionStats {
  trendData: {
    date: string;
    quantity: number;
    fcr: number;
  }[];
  avgFCR: number;
  totalFeedConsumed: number;
  recordCount: number;
}

export default function FeedConsumptionPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [feedConsumptions, setFeedConsumptions] = useState<FeedConsumptionRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [stats, setStats] = useState<FeedConsumptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeedConsumption, setEditingFeedConsumption] = useState<FeedConsumptionRecord | null>(null);
  const { selectedFarm } = useFarm();
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    feedType: '',
    quantity: '',
    unit: 'kg',
    notes: '',
    weightGain: ''
  });
  const [alerts, setAlerts] = useState<FeedConsumptionRecord[]>([]);

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getAll(selectedFarm?._id);
      setBatches(data);
      if (data.length > 0 && !selectedBatch) {
        setSelectedBatch(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchFeedConsumptions = async () => {
    try {
      setLoading(true);
      const data = await feedConsumptionAPI.getAll(selectedFarm?._id);
      setFeedConsumptions(data);
    } catch (error) {
      console.error('Failed to fetch feed consumptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedBatch) return;
    
    try {
      const data = await feedConsumptionAPI.getStats(selectedBatch);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch feed consumption stats:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await feedConsumptionAPI.getAlerts(selectedFarm?._id);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch feed consumption alerts:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchBatches(),
      fetchFeedConsumptions(),
      fetchAlerts()
    ]);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedBatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const feedConsumptionData = {
        ...formData,
        batchId: formData.batchId || selectedBatch,
        quantity: parseFloat(formData.quantity),
        weightGain: formData.weightGain ? parseFloat(formData.weightGain) : undefined,
        farmId: selectedFarm?._id
      };

      if (editingFeedConsumption) {
        await feedConsumptionAPI.update(editingFeedConsumption._id, feedConsumptionData);
      } else {
        await feedConsumptionAPI.create(feedConsumptionData);
      }

      // Reset form and refresh data
      setFormData({
        batchId: selectedBatch,
        date: new Date().toISOString().split('T')[0],
        feedType: '',
        quantity: '',
        unit: 'kg',
        notes: '',
        weightGain: ''
      });
      setEditingFeedConsumption(null);
      setShowModal(false);
      
      // Refresh data
      fetchFeedConsumptions();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save feed consumption record:', error);
      alert('Failed to save feed consumption record. Please try again.');
    }
  };

  const handleEdit = (feedConsumption: FeedConsumptionRecord) => {
    setEditingFeedConsumption(feedConsumption);
    setFormData({
      batchId: feedConsumption.batchId._id,
      date: feedConsumption.date.split('T')[0],
      feedType: feedConsumption.feedType,
      quantity: feedConsumption.quantity.toString(),
      unit: feedConsumption.unit,
      notes: feedConsumption.notes,
      weightGain: feedConsumption.weightGain ? feedConsumption.weightGain.toString() : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feed consumption record?')) {
      return;
    }

    try {
      await feedConsumptionAPI.delete(id);
      fetchFeedConsumptions();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete feed consumption record:', error);
      alert('Failed to delete feed consumption record. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingFeedConsumption(null);
    setFormData({
      batchId: selectedBatch,
      date: new Date().toISOString().split('T')[0],
      feedType: '',
      quantity: '',
      unit: 'kg',
      notes: '',
      weightGain: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFeedConsumption(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Feed Consumption & FCR</h1>
        <button
          onClick={handleAddNew}
          className="btn btn-primary text-xs sm:text-sm"
        >
          Add Feed Consumption
        </button>
      </div>

      {/* Batch Selector */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Select Batch</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {batches.map(batch => (
            <div 
              key={batch._id}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedBatch === batch._id 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setSelectedBatch(batch._id)}
            >
              <h3 className="font-bold">{batch.name}</h3>
              <p className="text-sm">{batch.quantity} chicks</p>
              <p className="text-sm">Breed: {batch.breed}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">High Consumption Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert._id} className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{alert.batchId.name}</h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {alert.quantity} {alert.unit} of {alert.feedType}
                    </p>
                  </div>
                  <span className="text-yellow-700 dark:text-yellow-300">
                    {formatDate(alert.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Average FCR</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.avgFCR.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Feed Conversion Ratio</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Total Feed Consumed</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.totalFeedConsumed.toFixed(2)} kg</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Records</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.recordCount}</p>
            <p className="text-sm text-gray-500">Consumption entries</p>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {stats && stats.trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Feed Consumption Trend</h2>
          <div className="h-64 flex items-end space-x-2 overflow-x-auto">
            {stats.trendData.map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className="w-8 bg-primary rounded-t hover:bg-green-700 transition-colors"
                  style={{ height: `${Math.max(10, (point.quantity / 50) * 100)}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500">
                  {point.quantity.toFixed(1)}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FCR Trend Chart */}
      {stats && stats.trendData.some(point => point.fcr !== undefined) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">FCR Trend</h2>
          <div className="h-64 flex items-end space-x-2 overflow-x-auto">
            {stats.trendData.filter(point => point.fcr !== undefined).map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className={`w-8 rounded-t hover:bg-green-700 transition-colors ${
                    point.fcr && point.fcr > 2 ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ height: `${Math.min(100, Math.max(10, (point.fcr || 0) * 20))}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500">
                  {point.fcr?.toFixed(2) || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feed Consumption Records Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Feed Consumption Records</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
          </div>
        ) : feedConsumptions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No feed consumption records found. Add a new record to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Feed Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">FCR</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Weight Gain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {feedConsumptions.map((feedConsumption) => (
                  <tr key={feedConsumption._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {feedConsumption.batchId.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(feedConsumption.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {feedConsumption.feedType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {feedConsumption.quantity} {feedConsumption.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feedConsumption.fcr && feedConsumption.fcr > 2 
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                          : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                        {feedConsumption.fcr ? feedConsumption.fcr.toFixed(2) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {feedConsumption.weightGain ? `${feedConsumption.weightGain} kg` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(feedConsumption)}
                        className="text-primary hover:text-green-700 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(feedConsumption._id)}
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

      {/* Modal for Adding/Editing Feed Consumption Records */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingFeedConsumption ? 'Edit Feed Consumption' : 'Add New Feed Consumption'}
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
                    <label htmlFor="feed-batchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch
                    </label>
                    <select
                      id="feed-batchId"
                      name="batchId"
                      value={formData.batchId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select a batch</option>
                      {batches.map(batch => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name} ({batch.quantity} chicks)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="feed-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="feed-date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="feed-feedType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Feed Type
                    </label>
                    <input
                      type="text"
                      id="feed-feedType"
                      name="feedType"
                      value={formData.feedType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="feed-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="feed-quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="feed-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit
                      </label>
                      <select
                        id="feed-unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      >
                        <option value="kg">kg</option>
                        <option value="grams">grams</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="feed-weightGain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weight Gain (kg) - Optional
                    </label>
                    <input
                      type="number"
                      id="feed-weightGain"
                      name="weightGain"
                      value={formData.weightGain}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="feed-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="feed-notes"
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
                    {editingFeedConsumption ? 'Update' : 'Save'}
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