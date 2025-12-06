'use client';

import { useState, useEffect } from 'react';
import { clientAPI, saleAPI, marketRateAPI } from '../../lib/api';
import { reportAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface Client {
  _id: string;
  name: string;
  phone: string;
  ratePerTray: number;
}

interface Sale {
  _id: string;
  clientId: string;
  clientName: string;
  trays: number;
  eggs: number;
  totalAmount: number;
  date: string;
}

// Add interface for market rate
interface MarketRate {
  _id: string;
  date: string;
  ratePerTray: number;
}

export default function SalesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { selectedFarm } = useFarm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsData, salesData] = await Promise.all([
        clientAPI.getAll(selectedFarm?._id),
        saleAPI.getAll({ farmId: selectedFarm?._id })
      ]);
      setClients(clientsData);
      setSales(salesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Only fetch data when farm changes if we want automatic refresh
  // useEffect(() => {
  //   if (selectedFarm) {
  //     fetchData();
  //   }
  // }, [selectedFarm]);

  const handleAddSale = () => {
    setEditingSale(null);
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    const client = clients.find((c: Client) => c._id === sale.clientId) || null;
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleSaveSale = async (saleData: Omit<Sale, '_id' | 'clientName' | 'eggs' | 'totalAmount'> & { ratePerTray?: number }) => {
    try {
      const client = clients.find((c: Client) => c._id === saleData.clientId);
      if (!client) return;

      const eggs = saleData.trays * 30;
      // Use the provided ratePerTray or fallback to client's rate
      const ratePerTray = saleData.ratePerTray || client.ratePerTray;
      const totalAmount = saleData.trays * ratePerTray;
      
      const saleDataWithFarmId = {
        ...saleData,
        eggs,
        totalAmount,
        farmId: selectedFarm?._id
      };

      if (editingSale) {
        // Update existing sale
        const updatedSale = await saleAPI.update(editingSale._id, saleDataWithFarmId);
        setSales(sales.map((s: Sale) => 
          s._id === editingSale._id ? updatedSale : s
        ));
      } else {
        // Add new sale
        const newSale = await saleAPI.create(saleDataWithFarmId);
        setSales([...sales, newSale]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save sale:', error);
      alert('Failed to save sale. Please try again.');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await saleAPI.delete(id);
        setSales(sales.filter((s: Sale) => s._id !== id));
      } catch (error) {
        console.error('Failed to delete sale:', error);
        alert('Failed to delete sale. Please try again.');
      }
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const response = await reportAPI.generate({
        reportType: 'sales',
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
      console.error('Failed to export sales:', error);
      alert('Failed to export sales. Please try again.');
    } finally {
      setExporting(false);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Sales
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Record and review daily egg sales by client.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            onClick={handleAddSale}
            className="btn btn-primary text-xs sm:text-sm"
          >
            Add Sale
          </button>
          <button
            onClick={fetchData}
            className="btn btn-outline flex items-center gap-1 text-xs sm:text-sm"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Sales History</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Trays
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Eggs
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount (₹)
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sales.map((sale) => (
                  <tr
                    key={sale._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <span className="sm:hidden">Date: </span>
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      <span className="sm:hidden">Client: </span>
                      {sale.clientName}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <span className="sm:hidden">Trays: </span>
                      {sale.trays}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <span className="sm:hidden">Eggs: </span>
                      {sale.eggs}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <span className="sm:hidden">Amount: </span>
                      ₹{(sale.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEditSale(sale)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale._id)}
                        className="text-danger hover:text-red-700"
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
      </div>

      {showModal && (
        <SaleModal 
          sale={editingSale}
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
          onSave={handleSaveSale}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

interface SaleModalProps {
  sale: Sale | null;
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onSave: (saleData: Omit<Sale, '_id' | 'clientName' | 'eggs' | 'totalAmount'> & { ratePerTray?: number }) => void;
  onClose: () => void;
}

interface SaleFormData {
  clientId: string;
  trays: number;
  date: string;
  ratePerTray: string; // Add ratePerTray field
}

function SaleModal({ sale, clients, selectedClient, onSelectClient, onSave, onClose }: SaleModalProps) {
  const [formData, setFormData] = useState<SaleFormData>({
    clientId: sale?.clientId || '',
    trays: sale?.trays || 1,
    date: sale?.date || new Date().toISOString().split('T')[0],
    ratePerTray: ''
  });

  useEffect(() => {
    if (sale) {
      setFormData({
        clientId: sale.clientId || '',
        trays: sale.trays || 1,
        date: sale.date || new Date().toISOString().split('T')[0],
        ratePerTray: ''
      });
      
      // Update selected client when sale changes
      const client = clients.find((c: Client) => c._id === sale.clientId) || null;
      onSelectClient(client);
    } else {
      setFormData({
        clientId: '',
        trays: 1,
        date: new Date().toISOString().split('T')[0],
        ratePerTray: ''
      });
      onSelectClient(null);
    }
  }, [sale, clients]);

  // Fetch market rate when date changes
  useEffect(() => {
    const fetchMarketRate = async () => {
      if (!formData.date) return;
      
      try {
        const marketRate = await marketRateAPI.getByDate(formData.date);
        if (marketRate && marketRate.ratePerTray) {
          setFormData(prev => ({
            ...prev,
            ratePerTray: marketRate.ratePerTray.toString()
          }));
        }
      } catch (error) {
        console.log('No market rate found for this date');
      }
    };
    
    fetchMarketRate();
  }, [formData.date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // If changing client, update selected client
    if (name === 'clientId') {
      const client = clients.find((c: Client) => c._id === value) || null;
      onSelectClient(client);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      clientId: formData.clientId,
      trays: formData.trays,
      date: formData.date,
      ratePerTray: formData.ratePerTray ? parseFloat(formData.ratePerTray) : undefined
    });
  };

  // Calculate total amount based on ratePerTray or client's rate
  const calculateTotalAmount = () => {
    const rate = formData.ratePerTray ? parseFloat(formData.ratePerTray) : (selectedClient?.ratePerTray || 0);
    return (formData.trays * rate) || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {sale ? 'Edit Sale' : 'Add Sale'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="clientId">
              Client
            </label>
            <select
              id="clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="ratePerTray">
              Rate per Tray (₹)
            </label>
            <input
              type="number"
              id="ratePerTray"
              name="ratePerTray"
              min="0"
              step="0.01"
              value={formData.ratePerTray}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder={selectedClient ? `Default: ₹${selectedClient.ratePerTray}` : "Enter rate"}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="trays">
              Number of Trays
            </label>
            <input
              type="number"
              id="trays"
              name="trays"
              min="1"
              value={formData.trays}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="date">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          {selectedClient && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Sale Summary</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>Eggs: {formData.trays * 30}</p>
                <p className="font-bold">Total Amount: ₹{calculateTotalAmount().toLocaleString()}</p>
              </div>
            </div>
          )}
          
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
              disabled={!selectedClient}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}