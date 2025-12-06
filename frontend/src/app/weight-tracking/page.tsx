'use client';

import { useState, useEffect } from 'react';
import { batchAPI, weightTrackingAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

interface WeightTrackingRecord {
  _id: string;
  batchId: {
    _id: string;
    name: string;
    quantity: number;
    breed: string;
    hatchDate: string;
  };
  date: string;
  averageWeight: number;
  unit: string;
  sampleSize: number;
  notes: string;
  growthRate: number;
  deviation: number;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

interface WeightTrackingStats {
  growthCurveData: {
    date: string;
    averageWeight: number;
    sampleSize: number;
    growthRate: number;
    deviation: number;
  }[];
  avgWeight: number;
  avgGrowthRate: number;
  recordCount: number;
}

export default function WeightTrackingPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [weightTrackings, setWeightTrackings] = useState<WeightTrackingRecord[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [stats, setStats] = useState<WeightTrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWeightTracking, setEditingWeightTracking] = useState<WeightTrackingRecord | null>(null);
  const { selectedFarm } = useFarm();
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    averageWeight: '',
    unit: 'grams',
    sampleSize: '',
    notes: ''
  });
  const [alerts, setAlerts] = useState<WeightTrackingRecord[]>([]);

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

  const fetchWeightTrackings = async () => {
    try {
      setLoading(true);
      const data = await weightTrackingAPI.getAll(selectedFarm?._id);
      setWeightTrackings(data);
    } catch (error) {
      console.error('Failed to fetch weight trackings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!selectedBatch) return;
    
    try {
      const data = await weightTrackingAPI.getStats(selectedBatch);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch weight tracking stats:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await weightTrackingAPI.getAlerts(10.0, selectedFarm?._id); // 10 grams threshold
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch weight tracking alerts:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchBatches(),
      fetchWeightTrackings(),
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
      const weightTrackingData = {
        ...formData,
        batchId: formData.batchId || selectedBatch,
        averageWeight: parseFloat(formData.averageWeight),
        sampleSize: parseInt(formData.sampleSize),
        farmId: selectedFarm?._id
      };

      if (editingWeightTracking) {
        await weightTrackingAPI.update(editingWeightTracking._id, weightTrackingData);
      } else {
        await weightTrackingAPI.create(weightTrackingData);
      }

      // Reset form and refresh data
      setFormData({
        batchId: selectedBatch,
        date: new Date().toISOString().split('T')[0],
        averageWeight: '',
        unit: 'grams',
        sampleSize: '',
        notes: ''
      });
      setEditingWeightTracking(null);
      setShowModal(false);
      
      // Refresh data
      fetchWeightTrackings();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save weight tracking record:', error);
      alert('Failed to save weight tracking record. Please try again.');
    }
  };

  const handleEdit = (weightTracking: WeightTrackingRecord) => {
    setEditingWeightTracking(weightTracking);
    setFormData({
      batchId: weightTracking.batchId._id,
      date: weightTracking.date.split('T')[0],
      averageWeight: weightTracking.averageWeight.toString(),
      unit: weightTracking.unit,
      sampleSize: weightTracking.sampleSize.toString(),
      notes: weightTracking.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this weight tracking record?')) {
      return;
    }

    try {
      await weightTrackingAPI.delete(id);
      fetchWeightTrackings();
      fetchStats();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete weight tracking record:', error);
      alert('Failed to delete weight tracking record. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingWeightTracking(null);
    setFormData({
      batchId: selectedBatch,
      date: new Date().toISOString().split('T')[0],
      averageWeight: '',
      unit: 'grams',
      sampleSize: '',
      notes: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingWeightTracking(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Weight Tracking & Growth Curve</h1>
        <button
          onClick={handleAddNew}
          className="btn btn-primary text-xs sm:text-sm"
        >
          Add Weight Record
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
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-200">Growth Deviation Alerts</h2>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert._id} className="bg-red-100 dark:bg-red-800 p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-red-800 dark:text-red-200">{alert.batchId.name}</h3>
                    <p className="text-red-700 dark:text-red-300">
                      Current: {alert.averageWeight} {alert.unit} | 
                      Deviation: {alert.deviation.toFixed(2)} {alert.unit} below expected
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
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Average Weight</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.avgWeight.toFixed(2)} grams</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Avg Growth Rate</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.avgGrowthRate.toFixed(2)} g/day</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">Records</h3>
            <p className="text-3xl font-bold text-primary dark:text-primary">{stats.recordCount}</p>
            <p className="text-sm text-gray-500">Weight entries</p>
          </div>
        </div>
      )}

      {/* Growth Curve Chart */}
      {stats && stats.growthCurveData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Growth Curve</h2>
          <div className="h-64 flex items-end space-x-2 overflow-x-auto">
            {stats.growthCurveData.map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className="w-8 bg-primary rounded-t hover:bg-green-700 transition-colors"
                  style={{ height: `${Math.max(10, (point.averageWeight / 2000) * 100)}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500">
                  {point.averageWeight.toFixed(0)}g
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deviation Chart */}
      {stats && stats.growthCurveData.some(point => point.deviation !== undefined) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Deviation from Expected Curve</h2>
          <div className="h-64 flex items-end space-x-2 overflow-x-auto">
            {stats.growthCurveData.filter(point => point.deviation !== undefined).map((point, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className={`w-8 rounded-t hover:bg-green-700 transition-colors ${
                    point.deviation && point.deviation < -10 ? 'bg-red-500' : 
                    point.deviation && point.deviation < 0 ? 'bg-yellow-500' : 'bg-primary'
                  }`}
                  style={{ height: `${Math.min(100, Math.max(10, Math.abs(point.deviation || 0) * 2))}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-xs text-gray-500">
                  {point.deviation?.toFixed(0) || '0'}g
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight Tracking Records Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Weight Tracking Records</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
          </div>
        ) : weightTrackings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No weight tracking records found. Add a new record to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Average Weight</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Sample Size</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Deviation</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {weightTrackings.map((weightTracking) => (
                  <tr key={weightTracking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {weightTracking.batchId.name}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(weightTracking.date)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      {weightTracking.averageWeight} {weightTracking.unit}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                      {weightTracking.sampleSize} chicks
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        weightTracking.deviation && weightTracking.deviation < -10 
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                          : weightTracking.deviation && weightTracking.deviation < 0 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' 
                            : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                        {weightTracking.deviation ? `${weightTracking.deviation.toFixed(2)}g` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleEdit(weightTracking)}
                          className="text-primary hover:text-green-700 text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(weightTracking._id)}
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

      {/* Modal for Adding/Editing Weight Tracking Records */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingWeightTracking ? 'Edit Weight Record' : 'Add New Weight Record'}
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
                    <label htmlFor="weight-batchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch
                    </label>
                    <select
                      id="weight-batchId"
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
                    <label htmlFor="weight-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="weight-date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="weight-averageWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Average Weight
                      </label>
                      <input
                        type="number"
                        id="weight-averageWeight"
                        name="averageWeight"
                        value={formData.averageWeight}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                        min="0"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="weight-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit
                      </label>
                      <select
                        id="weight-unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      >
                        <option value="grams">grams</option>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="weight-sampleSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sample Size
                    </label>
                    <input
                      type="number"
                      id="weight-sampleSize"
                      name="sampleSize"
                      value={formData.sampleSize}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="weight-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="weight-notes"
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
                    {editingWeightTracking ? 'Update' : 'Save'}
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