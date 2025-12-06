'use client';

import { useState, useEffect } from 'react';
import { batchAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

export default function ChicksPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const { selectedFarm } = useFarm();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const data = await batchAPI.getAll(selectedFarm?._id);
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleAddBatch = () => {
    setEditingBatch(null);
    setShowModal(true);
  };

  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setShowModal(true);
  };

  const handleSaveBatch = async (batchData: Omit<Batch, '_id'>) => {
    try {
      const batchDataWithFarmId = {
        ...batchData,
        farmId: selectedFarm?._id
      };
      
      if (editingBatch) {
        // Update existing batch
        const updatedBatch = await batchAPI.update(editingBatch._id, batchDataWithFarmId);
        setBatches(batches.map((b: Batch) => 
          b._id === editingBatch._id ? updatedBatch : b
        ));
      } else {
        // Add new batch
        const newBatch = await batchAPI.create(batchDataWithFarmId);
        setBatches([...batches, newBatch]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save batch:', error);
      alert('Failed to save batch. Please try again.');
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this batch? This will also delete all related vaccine records.')) {
      try {
        await batchAPI.delete(id);
        setBatches(batches.filter((b: Batch) => b._id !== id));
      } catch (error) {
        console.error('Failed to delete batch:', error);
        alert('Failed to delete batch. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Batches</h1>
        <button 
          onClick={handleAddBatch}
          className="btn btn-primary text-xs sm:text-sm"
        >
          Add Batch
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="table-responsive">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Hatch Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Breed</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {batch.name}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                    {(batch.quantity || 0).toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                    {new Date(batch.hatchDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                    {batch.breed}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm font-medium text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <button 
                        onClick={() => handleEditBatch(batch)}
                        className="text-primary hover:text-green-700 text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteBatch(batch._id)}
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
      </div>

      {showModal && (
        <BatchModal 
          batch={editingBatch}
          onSave={handleSaveBatch}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

interface BatchModalProps {
  batch: Batch | null;
  onSave: (batchData: Omit<Batch, '_id'>) => void;
  onClose: () => void;
}

interface BatchFormData {
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

function BatchModal({ batch, onSave, onClose }: BatchModalProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    name: batch?.name || '',
    quantity: batch?.quantity || 0,
    hatchDate: batch?.hatchDate || new Date().toISOString().split('T')[0],
    breed: batch?.breed || ''
  });

  useEffect(() => {
    if (batch) {
      setFormData({
        name: batch.name || '',
        quantity: batch.quantity || 0,
        hatchDate: batch.hatchDate || new Date().toISOString().split('T')[0],
        breed: batch.breed || ''
      });
    } else {
      setFormData({
        name: '',
        quantity: 0,
        hatchDate: new Date().toISOString().split('T')[0],
        breed: ''
      });
    }
  }, [batch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      quantity: parseInt(formData.quantity.toString()),
      hatchDate: formData.hatchDate,
      breed: formData.breed
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {batch ? 'Edit Batch' : 'Add Batch'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Batch Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hatchDate">
              Hatch Date
            </label>
            <input
              type="date"
              id="hatchDate"
              name="hatchDate"
              value={formData.hatchDate}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="breed">
              Breed
            </label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs sm:text-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
