'use client';

import { useState, useEffect } from 'react';
import { batchAPI, wasteFertilizerAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

interface WasteFertilizerRecord {
  _id: string;
  type: 'waste' | 'fertilizer';
  batchId?: {
    _id: string;
    name: string;
    quantity: number;
  };
  quantity: number;
  unit: string;
  date: string;
  productionDate?: string;
  saleDate?: string;
  saleAmount?: number;
  buyer?: string;
  notes: string;
  addToProfit: boolean;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

interface WasteFertilizerStats {
  waste: {
    totalWaste: number;
    recordCount: number;
  };
  fertilizer: {
    totalProduced: number;
    totalRevenue: number;
    recordCount: number;
  };
  trendData: {
    _id: {
      date: string;
      type: string;
    };
    quantity: number;
    revenue: number;
  }[];
}

export default function WasteFertilizerPage() {
  const { selectedFarm } = useFarm();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [records, setRecords] = useState<WasteFertilizerRecord[]>([]);
  const [stats, setStats] = useState<WasteFertilizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteFertilizerRecord | null>(null);
  const [recordType, setRecordType] = useState<'waste' | 'fertilizer'>('waste');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getAll(selectedFarm?._id);
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await wasteFertilizerAPI.getAll(selectedFarm?._id);
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await wasteFertilizerAPI.getStats(selectedFarm?._id);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchBatches(), fetchRecords(), fetchStats()]);
  }, []);

  const handleAddRecord = () => {
    setEditingRecord(null);
    setRecordType('waste');
    setShowModal(true);
  };

  const handleEditRecord = (record: WasteFertilizerRecord) => {
    setEditingRecord(record);
    setRecordType(record.type);
    setShowModal(true);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await wasteFertilizerAPI.delete(id);
        fetchRecords();
        fetchStats();
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formEntries = Object.fromEntries(formData.entries());
    
    // Create a new object for API submission
    const data: Record<string, any> = {};
    
    // Copy all form entries to the data object
    Object.keys(formEntries).forEach(key => {
      data[key] = formEntries[key];
    });

    // Convert relevant fields to numbers
    const numericFields = ['quantity', 'saleAmount'];
    numericFields.forEach(field => {
      if (data[field]) {
        const value = parseFloat(data[field] as string);
        if (!isNaN(value)) {
          data[field] = value;
        } else {
          // Remove invalid numeric fields from data
          delete data[field];
        }
      }
    });

    // Add type and farmId to data
    data.type = recordType;
    data.farmId = selectedFarm?._id;

    try {
      if (editingRecord) {
        await wasteFertilizerAPI.update(editingRecord._id, data);
      } else {
        await wasteFertilizerAPI.create(data);
      }
      setShowModal(false);
      fetchRecords();
      fetchStats();
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record. Please check form data and try again.');
    }
  };

  const filteredRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    return recordDate >= startDate && recordDate <= endDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-800">Waste & Fertilizer Management</h1>
        <button
          onClick={handleAddRecord}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          Add Record
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Waste</h3>
            <p className="text-3xl font-bold text-red-600">{stats.waste.totalWaste} kg</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stats.waste.recordCount} records</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Fertilizer Produced</h3>
            <p className="text-3xl font-bold text-green-600">{stats.fertilizer.totalProduced} kg</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stats.fertilizer.recordCount} records</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Fertilizer Revenue</h3>
            <p className="text-3xl font-bold text-blue-600">₹{stats.fertilizer.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">from sales</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchRecords}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Batch
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.type === 'waste' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                    {record.batchId ? record.batchId.name : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {record.saleAmount ? `Sold for ₹${record.saleAmount}` : record.notes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditRecord(record)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(record._id)}
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
        
        {filteredRecords.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No records found.</p>
          </div>
        )}
      </div>

      {/* Modal for adding/editing records */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingRecord ? 'Edit Record' : 'Add New Record'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Record Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="waste"
                      checked={recordType === 'waste'}
                      onChange={() => setRecordType('waste')}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2">Waste</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="fertilizer"
                      checked={recordType === 'fertilizer'}
                      onChange={() => setRecordType('fertilizer')}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2">Fertilizer</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="waste-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="waste-date"
                  name="date"
                  defaultValue={editingRecord?.date.split('T')[0] || new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="waste-batchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Batch (Optional)
                </label>
                <select
                  id="waste-batchId"
                  name="batchId"
                  defaultValue={editingRecord?.batchId?._id || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="waste-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="waste-quantity"
                  name="quantity"
                  defaultValue={editingRecord?.quantity || ''}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="waste-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  id="waste-unit"
                  name="unit"
                  defaultValue={editingRecord?.unit || 'kg'}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {recordType === 'fertilizer' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="waste-productionDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Production Date
                    </label>
                    <input
                      type="date"
                      id="waste-productionDate"
                      name="productionDate"
                      defaultValue={editingRecord?.productionDate?.split('T')[0] || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="waste-saleAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sale Amount (₹)
                    </label>
                    <input
                      type="number"
                      id="waste-saleAmount"
                      name="saleAmount"
                      defaultValue={editingRecord?.saleAmount || ''}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="waste-buyer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Buyer
                    </label>
                    <input
                      type="text"
                      id="waste-buyer"
                      name="buyer"
                      defaultValue={editingRecord?.buyer || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="waste-saleDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sale Date
                    </label>
                    <input
                      type="date"
                      id="waste-saleDate"
                      name="saleDate"
                      defaultValue={editingRecord?.saleDate?.split('T')[0] || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}
              
              <div className="mb-4">
                <label htmlFor="waste-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="waste-notes"
                  name="notes"
                  defaultValue={editingRecord?.notes || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label htmlFor="waste-addToProfit" className="inline-flex items-center">
                  <input
                    type="checkbox"
                    id="waste-addToProfit"
                    name="addToProfit"
                    defaultChecked={editingRecord?.addToProfit !== undefined ? editingRecord.addToProfit : true}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Add to farm profit
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {editingRecord ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}