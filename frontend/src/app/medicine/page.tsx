'use client';

import { useState, useEffect } from 'react';
import { batchAPI, medicineAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

interface MedicineRecord {
  _id: string;
  name: string;
  batchId: {
    _id: string;
    name: string;
    quantity: number;
  };
  dose: string;
  purpose: string;
  withdrawalPeriod: number;
  withdrawalPeriodUnit: string;
  administeredDate: string;
  expiryDate: string;
  notes: string;
  cost: number;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

export default function MedicinePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [medicines, setMedicines] = useState<MedicineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineRecord | null>(null);
  const [expiryAlerts, setExpiryAlerts] = useState<MedicineRecord[]>([]);
  const [withdrawalReminders, setWithdrawalReminders] = useState<MedicineRecord[]>([]);
  const { selectedFarm } = useFarm();
  
  const [formData, setFormData] = useState({
    name: '',
    batchId: '',
    dose: '',
    purpose: '',
    withdrawalPeriod: '',
    withdrawalPeriodUnit: 'days',
    administeredDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
    cost: ''
  });

  const fetchBatches = async () => {
    try {
      const data = await batchAPI.getAll(selectedFarm?._id);
      setBatches(data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await medicineAPI.getAll(selectedFarm?._id);
      setMedicines(data);
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      // Fetch expiry alerts
      const expiryData = await medicineAPI.getExpiryAlerts(selectedFarm?._id);
      setExpiryAlerts(expiryData);
      
      // Fetch withdrawal reminders
      const withdrawalData = await medicineAPI.getWithdrawalReminders(selectedFarm?._id);
      setWithdrawalReminders(withdrawalData);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchBatches(),
      fetchMedicines(),
      fetchAlerts()
    ]);
  }, []);

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
      const medicineData = {
        ...formData,
        withdrawalPeriod: parseInt(formData.withdrawalPeriod),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        farmId: selectedFarm?._id
      };

      if (editingMedicine) {
        await medicineAPI.update(editingMedicine._id, medicineData);
      } else {
        await medicineAPI.create(medicineData);
      }

      // Reset form and refresh data
      setFormData({
        name: '',
        batchId: '',
        dose: '',
        purpose: '',
        withdrawalPeriod: '',
        withdrawalPeriodUnit: 'days',
        administeredDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        notes: '',
        cost: ''
      });
      setEditingMedicine(null);
      setShowModal(false);
      
      // Refresh data
      fetchMedicines();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save medicine record:', error);
      alert('Failed to save medicine record. Please try again.');
    }
  };

  const handleEdit = (medicine: MedicineRecord) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      batchId: medicine.batchId._id,
      dose: medicine.dose,
      purpose: medicine.purpose,
      withdrawalPeriod: medicine.withdrawalPeriod.toString(),
      withdrawalPeriodUnit: medicine.withdrawalPeriodUnit,
      administeredDate: medicine.administeredDate.split('T')[0],
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
      notes: medicine.notes,
      cost: medicine.cost ? medicine.cost.toString() : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this medicine record?')) {
      return;
    }

    try {
      await medicineAPI.delete(id);
      fetchMedicines();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete medicine record:', error);
      alert('Failed to delete medicine record. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingMedicine(null);
    setFormData({
      name: '',
      batchId: '',
      dose: '',
      purpose: '',
      withdrawalPeriod: '',
      withdrawalPeriodUnit: 'days',
      administeredDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      notes: '',
      cost: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMedicine(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate withdrawal end date
  const calculateWithdrawalEndDate = (administeredDate: string, period: number, unit: string) => {
    const date = new Date(administeredDate);
    
    if (unit === 'hours') {
      date.setHours(date.getHours() + period);
    } else if (unit === 'days') {
      date.setDate(date.getDate() + period);
    } else if (unit === 'weeks') {
      date.setDate(date.getDate() + (period * 7));
    }
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Medicine / Antibiotic Log</h1>
        <button
          onClick={handleAddNew}
          className="btn btn-primary text-xs sm:text-sm"
        >
          Add Medicine Record
        </button>
      </div>

      {/* Alerts Section */}
      {(expiryAlerts.length > 0 || withdrawalReminders.length > 0) && (
        <div className="space-y-4">
          {expiryAlerts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-200">Medicine Expiry Alerts</h2>
              <div className="space-y-3">
                {expiryAlerts.map(alert => (
                  <div key={alert._id} className="bg-red-100 dark:bg-red-800 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-red-800 dark:text-red-200">{alert.name}</h3>
                        <p className="text-red-700 dark:text-red-300">
                          Batch: {alert.batchId.name} | Expiry: {formatDate(alert.expiryDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {withdrawalReminders.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Withdrawal Period Reminders</h2>
              <div className="space-y-3">
                {withdrawalReminders.map(reminder => (
                  <div key={reminder._id} className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{reminder.name}</h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Batch: {reminder.batchId.name} | 
                          Withdrawal ends: {calculateWithdrawalEndDate(
                            reminder.administeredDate, 
                            reminder.withdrawalPeriod, 
                            reminder.withdrawalPeriodUnit
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medicine Records Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Medicine Records</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No medicine records found. Add a new record to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Administered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Withdrawal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {medicines.map((medicine) => (
                  <tr key={medicine._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {medicine.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {medicine.batchId.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {medicine.dose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {medicine.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(medicine.administeredDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {medicine.withdrawalPeriod} {medicine.withdrawalPeriodUnit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {medicine.cost ? `₹${medicine.cost.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(medicine)}
                        className="text-primary hover:text-green-700 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(medicine._id)}
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

      {/* Modal for Adding/Editing Medicine Records */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingMedicine ? 'Edit Medicine Record' : 'Add New Medicine Record'}
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
                    <label htmlFor="medicine-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      id="medicine-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="medicine-batchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch
                    </label>
                    <select
                      id="medicine-batchId"
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
                    <label htmlFor="medicine-dose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dose
                    </label>
                    <input
                      type="text"
                      id="medicine-dose"
                      name="dose"
                      value={formData.dose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="medicine-purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      id="medicine-purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="medicine-withdrawalPeriod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Withdrawal Period
                      </label>
                      <input
                        type="number"
                        id="medicine-withdrawalPeriod"
                        name="withdrawalPeriod"
                        value={formData.withdrawalPeriod}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="medicine-withdrawalPeriodUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit
                      </label>
                      <select
                        id="medicine-withdrawalPeriodUnit"
                        name="withdrawalPeriodUnit"
                        value={formData.withdrawalPeriodUnit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      >
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                        <option value="weeks">weeks</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="medicine-administeredDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Administered Date
                      </label>
                      <input
                        type="date"
                        id="medicine-administeredDate"
                        name="administeredDate"
                        value={formData.administeredDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="medicine-expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="medicine-expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="medicine-cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cost (Optional)
                    </label>
                    <input
                      type="number"
                      id="medicine-cost"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="medicine-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      id="medicine-notes"
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
                    {editingMedicine ? 'Update' : 'Save'}
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