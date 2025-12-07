'use client';

import { useState, useEffect } from 'react';
import { clientAPI, saleAPI, paymentAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { UploadReader } from '@/components/UploadReader';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Client {
  _id: string;
  name: string;
  phone: string;
  pendingAmount?: number;
}

interface Sale {
  _id: string;
  clientId: string | { _id: string; name: string; phone: string };
  clientName: string;
  trays: number;
  totalAmount: number;
  date: string;
}

interface Payment {
  _id: string;
  saleId: string;
  clientId: string;
  clientName: string;
  saleDate: string;
  amount: number;
  paymentMethod: 'cash' | 'upi';
  utr: string;
  date: string;
}

export default function PaymentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const { selectedFarm } = useFarm();

  // Set the document title when the component mounts
  useEffect(() => {
    document.title = 'Payments - Egg Farm Pro';
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Egg Farm Pro';
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsData, salesData, paymentsData] = await Promise.all([
        clientAPI.getAll(selectedFarm?._id),
        saleAPI.getAll({ farmId: selectedFarm?._id }),
        paymentAPI.getAll(selectedFarm?._id)
      ]);
      console.log('Fetched clients:', clientsData);
      console.log('Fetched sales:', salesData);
      console.log('Fetched payments:', paymentsData);
      setClients(clientsData);
      setSales(salesData);
      setPayments(paymentsData);
      
      // Calculate pending amounts for each client
      const clientsWithPending = clientsData.map((client: Client) => {
        // Calculate total sales amount for this client
        const clientSales = salesData.filter((sale: Sale) => 
          (typeof sale.clientId === 'string' ? sale.clientId : (sale.clientId as {_id: string})._id) === client._id
        );
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
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Selected farm changed:', selectedFarm);
    fetchData();
  }, [selectedFarm]);

  const handleAddPayment = () => {
    setEditingPayment(null);
    setShowModal(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowModal(true);
  };

  const handleSavePayment = async (paymentData: Omit<Payment, '_id' | 'clientName' | 'saleDate'>) => {
    try {
      // Check if farm is selected first
      if (!selectedFarm?._id) {
        alert('Please select a farm first before adding a payment.');
        return;
      }
      
      // Validate required fields
      if (!paymentData.clientId) {
        alert('Please select a client.');
        return;
      }
      
      if (!paymentData.saleId) {
        alert('Please select a sale.');
        return;
      }
      
      // Find related client and sale
      const client = clients.find((c: Client) => c._id === paymentData.clientId);
      const sale = sales.find((s: Sale) => s._id === paymentData.saleId);
      
      console.log('Client found:', client);
      console.log('Sale found:', sale);
      console.log('Selected farm:', selectedFarm);
      
      if (!client || !sale) {
        console.error('Client or sale not found:', { client, sale });
        alert('Client or sale not found. Please select valid client and sale.');
        return;
      }

      const paymentWithNames = {
        ...paymentData,
        clientName: client.name,
        saleDate: sale.date,
        farmId: selectedFarm._id
      };
      
      console.log('Sending payment data:', paymentWithNames);

      if (editingPayment) {
        // Update existing payment
        console.log('Updating payment with ID:', editingPayment._id);
        const updatedPayment = await paymentAPI.update(editingPayment._id, paymentWithNames);
        setPayments(payments.map((p: Payment) => 
          p._id === editingPayment._id ? updatedPayment : p
        ));
      } else {
        // Add new payment
        console.log('Creating new payment with data:', paymentWithNames);
        const newPayment = await paymentAPI.create(paymentWithNames);
        setPayments([...payments, newPayment]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save payment:', error);
      alert('Failed to save payment. Please try again. Error: ' + (error as Error).message);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentAPI.delete(id);
        setPayments(payments.filter((p: Payment) => p._id !== id));
      } catch (error) {
        console.error('Failed to delete payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === 'cash' ? 'Cash' : 'UPI';
  };

  const getTotalPayments = () => {
    return payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              Payments
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Track incoming payments and methods against your sales.
            </p>
          </div>
          <button
            onClick={handleAddPayment}
            className="btn btn-primary text-xs sm:text-sm"
          >
            Add Payment
          </button>
        </div>
        
        <div className="space-y-6">

          <div className="card">
            <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="card-title">Payment History</h2>
              <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
                Total:{' '}
                <span className="text-primary-dark">
                  ₹{(getTotalPayments() || 0).toLocaleString()}
                </span>
              </p>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                        Sale Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount (₹)
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                        Method
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                        UTR
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                        Payment Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {payments.map((payment) => (
                      <tr
                        key={payment._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <span className="sm:hidden">Client: </span>
                          {payment.clientName}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                          <span className="sm:hidden">Sale Date: </span>
                          {new Date(payment.saleDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <span className="sm:hidden">Amount: </span>
                          ₹{(payment.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                          <span className="sm:hidden">Method: </span>
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                          <span className="sm:hidden">UTR: </span>
                          {payment.utr || '-'}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                          <span className="sm:hidden">Payment Date: </span>
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          <button
                            onClick={() => handleEditPayment(payment)}
                            className="text-primary hover:text-primary-dark"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment._id)}
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
            <PaymentModal 
              payment={editingPayment}
              clients={clients}
              sales={sales}
              onSave={handleSavePayment}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface PaymentModalProps {
  payment: Payment | null;
  clients: Client[];
  sales: Sale[];
  onSave: (paymentData: Omit<Payment, '_id' | 'clientName' | 'saleDate'>) => void;
  onClose: () => void;
}

interface PaymentFormData {
  saleId: string;
  clientId: string;
  amount: number;
  paymentMethod: 'cash' | 'upi';
  utr: string;
  upi_id?: string;
  date: string;
  description?: string;
}

function PaymentModal({ payment, clients, sales, onSave, onClose }: PaymentModalProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    saleId: payment?.saleId || '',
    clientId: payment?.clientId || '',
    amount: payment?.amount || 0,
    paymentMethod: payment?.paymentMethod || 'cash',
    utr: payment?.utr || '',
    date: payment?.date || new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      setFormData({
        saleId: payment.saleId || '',
        clientId: payment.clientId || '',
        amount: payment.amount || 0,
        paymentMethod: payment.paymentMethod || 'cash',
        utr: payment.utr || '',
        date: payment.date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        saleId: '',
        clientId: '',
        amount: 0,
        paymentMethod: 'cash',
        utr: '',
        date: new Date().toISOString().split('T')[0]
      });
    }
  }, [payment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('Form field changed:', name, '=', value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle UPI data from UploadReader
  const handleUpiUpload = (upiData: any) => {
    // Auto-fill form fields with extracted UPI data
    setFormData(prev => ({
      ...prev,
      paymentMethod: 'upi',
      amount: upiData.amount ? parseFloat(upiData.amount) : prev.amount,
      utr: upiData.txnid || prev.utr
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields before submission
    if (!formData.clientId) {
      alert('Please select a client.');
      return;
    }
    
    if (!formData.saleId) {
      alert('Please select a sale.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      onSave({
        saleId: formData.saleId,
        clientId: formData.clientId,
        amount: parseFloat(formData.amount.toString()),
        paymentMethod: formData.paymentMethod as 'cash' | 'upi',
        utr: formData.utr,
        date: formData.date
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter sales by selected client
  const filteredSales = sales.filter(sale => {
    console.log('Comparing sale client:', sale.clientId, 'with selected client:', formData.clientId);
    if (!formData.clientId) return true;
    
    // Handle both string and object formats for clientId
    const saleClientId = typeof sale.clientId === 'string' 
      ? sale.clientId 
      : (sale.clientId as { _id: string })._id;
      
    return saleClientId === formData.clientId;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-md my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-y-auto modal-responsive">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">
            {payment ? 'Edit Payment' : 'Add Payment'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0 ml-2"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-clientId">
              Client
            </label>
            <select
              id="payment-clientId"
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-saleId">
              Sale
            </label>
            <select
              id="payment-saleId"
              name="saleId"
              value={formData.saleId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
              disabled={!formData.clientId}
            >
              <option value="">Select a sale</option>
              {filteredSales.map((sale: Sale) => (
                <option key={sale._id} value={sale._id}>
                  {new Date(sale.date).toLocaleDateString()} - ₹{(sale.totalAmount || 0).toLocaleString()} ({sale.trays} trays)
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-amount">
              Amount (₹)
            </label>
            <input
              type="number"
              id="payment-amount"
              name="amount"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-method">
              Payment Method
            </label>
            <select
              id="payment-method"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="payment-description">
              Description (Optional)
            </label>
            <div className="relative">
              <textarea
                id="payment-description"
                name="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                rows={2}
                placeholder="Add any notes about this payment..."
              />
              <div className="absolute right-2 bottom-2">
                <VoiceInputButton 
                  onTranscript={(text) => setFormData(prev => ({...prev, description: (prev.description || '') + (prev.description ? ' ' : '') + text}))}
                  className="p-1"
                />
              </div>
            </div>
          </div>
          
          {formData.paymentMethod === 'upi' && (
            <>
              <div className="mb-3 sm:mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-utr">
                  UTR Number
                </label>
                <input
                  type="text"
                  id="payment-utr"
                  name="utr"
                  value={formData.utr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="mb-3 sm:mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-upi-id">
                  UPI ID
                </label>
                <input
                  type="text"
                  id="payment-upi-id"
                  name="upi_id"
                  value={formData.upi_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
          
          {formData.paymentMethod === 'upi' && (
            <div className="mb-3 sm:mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Upload UPI Screenshot</label>
              <UploadReader onUpload={handleUpiUpload} />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-date">
              Payment Date
            </label>
            <input
              type="date"
              id="payment-date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs sm:text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs sm:text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
