'use client';

import { useState, useEffect } from 'react';
import { clientAPI, saleAPI, paymentAPI, reportAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { StyledForm, StyledInput } from '../../components';

interface Client {
  _id: string;
  name: string;
  phone: string;
  ratePerTray: number;
}

interface Sale {
  _id: string;
  clientId: string;
  totalAmount: number;
}

interface Payment {
  _id: string;
  clientId: string;
  amount: number;
}

// Extended client interface with pending amount
interface ClientWithPending extends Client {
  pendingAmount: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { selectedFarm } = useFarm();

  const fetchClients = async () => {
    try {
      setLoading(true);
      // Fetch all required data
      const [clientsData, salesData, paymentsData] = await Promise.all([
        clientAPI.getAll(selectedFarm?._id),
        saleAPI.getAll({ farmId: selectedFarm?._id }),
        paymentAPI.getAll(selectedFarm?._id)
      ]);
      
      // Calculate pending amounts for each client
      const clientsWithPending = clientsData.map((client: Client) => {
        // Calculate total sales amount for this client
        const clientSales = salesData.filter((sale: Sale) => sale.clientId === client._id);
        const totalOwed = clientSales.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
        
        // Calculate total payments amount for this client
        const clientPayments = paymentsData.filter((payment: Payment) => payment.clientId === client._id);
        const totalPaid = clientPayments.reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0);
        
        // Calculate pending amount
        const pendingAmount = totalOwed - totalPaid;
        
        return {
          ...client,
          pendingAmount
        };
      });
      
      setClients(clientsWithPending);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFarm?._id) {
      fetchClients();
    }
  }, [selectedFarm]);

  const handleAddClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleSaveClient = async (clientData: Omit<Client, '_id'>) => {
    try {
      const clientDataWithFarmId = {
        ...clientData,
        farmId: selectedFarm?._id
      };
      
      if (editingClient) {
        // Update existing client
        const updatedClient = await clientAPI.update(editingClient._id, clientDataWithFarmId);
        setClients(clients.map(c => c._id === editingClient._id ? updatedClient : c));
      } else {
        // Add new client
        const newClient = await clientAPI.create(clientDataWithFarmId);
        setClients([...clients, newClient]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client. Please try again.');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await clientAPI.delete(id);
        setClients(clients.filter(c => c._id !== id));
      } catch (error) {
        console.error('Failed to delete client:', error);
        alert('Failed to delete client. Please try again.');
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Manage your buyers, rates, and pending balances.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleAddClient}
            className="btn btn-primary text-xs sm:text-sm"
          >
            Add Client
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Clients Overview</h2>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                    Phone
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rate / Tray
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {clients.map((client) => (
                  <tr
                    key={client._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {client.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                      {client.phone}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      ₹{client.ratePerTray}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      ₹{client.pendingAmount}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm font-medium text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-primary hover:text-primary-dark text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClient(client._id)}
                          className="text-danger hover:text-red-700 text-xs sm:text-sm"
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
      </div>

      {showModal && (
        <ClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

interface ClientModalProps {
  client: Client | null;
  onSave: (clientData: Omit<Client, '_id'>) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  phone: string;
  ratePerTray: string;
}

function ClientModal({ client, onSave, onClose }: ClientModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: client?.name || '',
    phone: client?.phone || '',
    ratePerTray: client?.ratePerTray?.toString() || ''
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        phone: client.phone || '',
        ratePerTray: client.ratePerTray?.toString() || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        ratePerTray: ''
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      phone: formData.phone,
      ratePerTray: parseFloat(formData.ratePerTray)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StyledForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          title={client ? 'Edit Client' : 'Add Client'}
          submitButtonText="Save Client"
          isSubmitting={false}
        >
          <StyledInput
            label="Name"
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <StyledInput
            label="Phone"
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          
          <StyledInput
            label="Rate per Tray (₹)"
            type="number"
            id="ratePerTray"
            name="ratePerTray"
            value={formData.ratePerTray}
            onChange={handleChange}
            required
          />
        </StyledForm>
      </div>
    </div>
  );
}
