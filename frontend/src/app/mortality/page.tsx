'use client';

import { useState, useEffect } from 'react';
import { batchAPI, mortalityAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

interface MortalityRecord {
  _id: string;
  batchId: {
    _id: string;
    name: string;
    quantity: number;
  };
  count: number;
  reason: string;
  age: number;
  notes: string;
  mortalityPercentage: number;
  date: string;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

interface MortalityStats {
  trendData: {
    date: string;
    count: number;
    percentage: number;
  }[];
  avgMortality: number;
  totalDeaths: number;
}

export default function MortalityTrackingPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [mortalities, setMortalities] = useState<MortalityRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [stats, setStats] = useState<MortalityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMortality, setEditingMortality] = useState<MortalityRecord | null>(null);
  const { selectedFarm } = useFarm();
  const [formData, setFormData] = useState({
    batchId: '',
    count: '',
    reason: '',
    age: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [alerts, setAlerts] = useState<MortalityRecord[]>([]);

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

  const fetchMortalities = async () => {
    try {
      setLoading(true);
      const data = await mortalityAPI.getAll(selectedFarm?._id);
      setMortalities(data);
    } catch (error) {
      console.error('Failed to fetch mortalities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedBatch) return;
    
    try {
      const data = await mortalityAPI.getStats(selectedBatch);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch mortality stats:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await mortalityAPI.getAlerts(5.0, selectedFarm?._id); // 5% threshold
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch mortality alerts:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchBatches(),
      fetchMortalities(),
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
      const mortalityData = {
        ...formData,
        batchId: formData.batchId || selectedBatch,
        count: parseInt(formData.count),
        age: parseInt(formData.age),
        farmId: selectedFarm?._id
      };

      if (editingMortality) {
        await mortalityAPI.update(editingMortality._id, mortalityData);
      } else {
        await mortalityAPI.create(mortalityData);
      }

      // Reset form and refresh data
      setFormData({
        batchId: selectedBatch,
        count: '',
        reason: '',
        age: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingMortality(null);
      setShowModal(false);
      
      // Refresh data
      fetchMortalities();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save mortality record:', error);
      alert('Failed to save mortality record. Please try again.');
    }
  };

  const handleEdit = (mortality: MortalityRecord) => {
    setEditingMortality(mortality);
    setFormData({
      batchId: mortality.batchId._id,
      count: mortality.count.toString(),
      reason: mortality.reason,
      age: mortality.age.toString(),
      notes: mortality.notes,
      date: mortality.date.split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mortality record?')) {
      return;
    }

    try {
      await mortalityAPI.delete(id);
      fetchMortalities();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete mortality record:', error);
      alert('Failed to delete mortality record. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingMortality(null);
    setFormData({
      batchId: selectedBatch,
      count: '',
      reason: '',
      age: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMortality(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mortality Tracking</h1>
        <button
          onClick={handleAddNew}
          className="btn btn-primary text-xs sm:text-sm"
        >
          Add Mortality Record
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
                  ? 'bg-primary text-white dark:text-white' 
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
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-200">High Mortality Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert._id} className="bg-red-100 dark:bg-red-800 p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-200">{alert.batchId.name}</h3>
                    <p className="text-red-700 dark:text-red-300">
                      {alert.count} deaths ({alert.mortalityPercentage.toFixed(2)}%) - {alert.reason}
                    </p>
                  </div>
                  <span className="text-red-700 dark:text-red-300">
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
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Average Mortality</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.avgMortality.toFixed(2)}%</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Total Deaths</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.totalDeaths}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Current Batch</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">
              {batches.find(b => b._id === selectedBatch)?.name || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {stats && stats.trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Mortality Trend</h2>
          <div className="h-64 flex items-end space-x-2 overflow-x-auto">
            {stats.trendData.map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className="w-8 bg-primary rounded-t hover:bg-green-700 transition-colors"
                  style={{ height: `${Math.max(10, (point.percentage / 10) * 100)}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500">
                  {point.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mortality Records Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Mortality Records</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
          </div>
        ) : mortalities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No mortality records found. Add a new record to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Count</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Percentage</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reason</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Age</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {mortalities.map((mortality) => (
                  <tr key={mortality._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <span className="sm:hidden">Batch: </span>
                      {mortality.batchId.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <span className="sm:hidden">Count: </span>
                      {mortality.count}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        mortality.mortalityPercentage > 5 
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                          : mortality.mortalityPercentage > 2 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' 
                            : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                        {mortality.mortalityPercentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <span className="sm:hidden">Reason: </span>
                      {mortality.reason}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                      <span className="md:hidden">Age: </span>
                      {mortality.age} days
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <span className="sm:hidden">Date: </span>
                      {formatDate(mortality.date)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleEdit(mortality)}
                          className="text-primary hover:text-green-700 text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(mortality._id)}
                          className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Adding/Editing Mortality Records */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingMortality ? 'Edit Mortality Record' : 'Add New Mortality Record'}
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
                    <label htmlFor="mortality-batchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch
                    </label>
                    <select
                      id="mortality-batchId"
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
                    <label htmlFor="mortality-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Count
                    </label>
                    <input
                      type="number"
                      id="mortality-count"
                      name="count"
                      value={formData.count}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="mortality-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason
                    </label>
                    <input
                      type="text"
                      id="mortality-reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="mortality-age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Age (days)
                    </label>
                    <input
                      type="number"
                      id="mortality-age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="mortality-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="mortality-date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="mortality-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="mortality-notes"
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
                    {editingMortality ? 'Update' : 'Save'}
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