'use client';

import { useState, useEffect } from 'react';
import { batchAPI, vaccineAPI } from '../../lib/api';
import { reportAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
}

interface Vaccine {
  _id: string;
  batchId: string;
  batchName: string;
  name: string;
  scheduledDate: string;
  administeredDate: string | null;
  status: 'pending' | 'done' | 'missed';
  notes: string;
}

export default function VaccinationPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  const { selectedFarm } = useFarm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesData, vaccinesData] = await Promise.all([
        batchAPI.getAll(selectedFarm?._id),
        vaccineAPI.getAll(selectedFarm?._id)
      ]);
      setBatches(batchesData);
      setVaccines(vaccinesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFarm]);

  const handleAddVaccine = () => {
    setEditingVaccine(null);
    setShowModal(true);
  };

  const handleEditVaccine = (vaccine: Vaccine) => {
    setEditingVaccine(vaccine);
    setShowModal(true);
  };

  const handleSaveVaccine = async (vaccineData: Omit<Vaccine, '_id' | 'batchName'>) => {
    try {
      // Check if farm is selected first
      if (!selectedFarm?._id) {
        alert('Please select a farm first before adding a vaccine.');
        return;
      }
      
      // Validate required fields
      if (!vaccineData.batchId) {
        alert('Please select a batch.');
        return;
      }
      
      if (!vaccineData.name.trim()) {
        alert('Please enter a vaccine name.');
        return;
      }
      
      const batch = batches.find((b: Batch) => b._id === vaccineData.batchId);
      if (!batch) {
        alert('Batch not found. Please select a valid batch.');
        return;
      }

      const vaccineWithBatchName = {
        ...vaccineData,
        batchName: batch.name,
        farmId: selectedFarm._id
      };

      if (editingVaccine) {
        // Update existing vaccine
        const updatedVaccine = await vaccineAPI.update(editingVaccine._id, vaccineWithBatchName);
        setVaccines(vaccines.map((v: Vaccine) => 
          v._id === editingVaccine._id ? updatedVaccine : v
        ));
      } else {
        // Add new vaccine
        const newVaccine = await vaccineAPI.create(vaccineWithBatchName);
        setVaccines([...vaccines, newVaccine]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save vaccine:', error);
      alert('Failed to save vaccine. Please try again.');
    }
  };

  const handleDeleteVaccine = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vaccine record?')) {
      try {
        await vaccineAPI.delete(id);
        setVaccines(vaccines.filter((v: Vaccine) => v._id !== id));
      } catch (error) {
        console.error('Failed to delete vaccine:', error);
        alert('Failed to delete vaccine. Please try again.');
      }
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const response = await reportAPI.generate({
        reportType: 'vaccinations',
        format,
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = `/api${response.report.downloadUrl}`;
      link.download = response.report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export vaccinations:', error);
      alert('Failed to export vaccinations. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'missed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      done: 'Done',
      missed: 'Missed'
    };
    return labels[status] || status;
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
        <h1 className="text-2xl font-bold text-gray-800">Vaccination Schedule</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="btn btn-outline text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="btn btn-outline text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={handleAddVaccine}
            className="btn btn-primary text-xs sm:text-sm"
          >
            Add Vaccine
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vaccine</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Scheduled Date</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Administered Date</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vaccines.map((vaccine) => (
                <tr key={vaccine._id}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {vaccine.batchName}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {vaccine.name}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {new Date(vaccine.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {vaccine.administeredDate 
                      ? new Date(vaccine.administeredDate).toLocaleDateString('en-US') 
                      : '-'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vaccine.status)}}`}>
                      {getStatusLabel(vaccine.status)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditVaccine(vaccine)}
                      className="text-primary hover:text-green-700 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteVaccine(vaccine._id)}
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
      </div>

      {showModal && (
        <VaccineModal 
          vaccine={editingVaccine}
          batches={batches}
          onSave={handleSaveVaccine}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

interface VaccineModalProps {
  vaccine: Vaccine | null;
  batches: Batch[];
  onSave: (vaccineData: Omit<Vaccine, '_id' | 'batchName'>) => void;
  onClose: () => void;
}

interface VaccineFormData {
  batchId: string;
  name: string;
  scheduledDate: string;
  administeredDate: string | null;
  status: 'pending' | 'done' | 'missed';
  notes: string;
}

function VaccineModal({ vaccine, batches, onSave, onClose }: VaccineModalProps) {
  const [formData, setFormData] = useState<VaccineFormData>({
    batchId: vaccine?.batchId || '',
    name: vaccine?.name || '',
    scheduledDate: vaccine?.scheduledDate || new Date().toISOString().split('T')[0],
    administeredDate: vaccine?.administeredDate || null,
    status: vaccine?.status || 'pending',
    notes: vaccine?.notes || ''
  });

  useEffect(() => {
    if (vaccine) {
      setFormData({
        batchId: vaccine.batchId || '',
        name: vaccine.name || '',
        scheduledDate: vaccine.scheduledDate || new Date().toISOString().split('T')[0],
        administeredDate: vaccine.administeredDate || null,
        status: vaccine.status || 'pending',
        notes: vaccine.notes || ''
      });
    } else {
      setFormData({
        batchId: '',
        name: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        administeredDate: null,
        status: 'pending',
        notes: ''
      });
    }
  }, [vaccine]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields before submission
    if (!formData.batchId) {
      alert('Please select a batch.');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('Please enter a vaccine name.');
      return;
    }
    
    onSave({
      batchId: formData.batchId,
      name: formData.name,
      scheduledDate: formData.scheduledDate,
      administeredDate: formData.administeredDate,
      status: formData.status,
      notes: formData.notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {vaccine ? 'Edit Vaccine' : 'Add Vaccine'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="batchId">
              Batch
            </label>
            <select
              id="batchId"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a batch</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batch.breed})
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Vaccine Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDate">
              Scheduled Date
            </label>
            <input
              type="date"
              id="scheduledDate"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="administeredDate">
              Administered Date
            </label>
            <input
              type="date"
              id="administeredDate"
              name="administeredDate"
              value={formData.administeredDate || ''}
              onChange={handleDateChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="pending">Pending</option>
              <option value="done">Done</option>
              <option value="missed">Missed</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={3}
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
