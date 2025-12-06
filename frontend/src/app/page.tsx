'use client';
// Modified by Egg Mind AI - Enhanced Payment Form with UPI Screenshot Reader
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '../lib/dateUtils';
import { dashboardAPI, saleAPI, paymentAPI, expenseAPI, clientAPI, marketRateAPI } from '../lib/api';
import { useFarm } from '../contexts/FarmContext';
import { AiInsightsCard } from '@/components/AiInsightsCard';
import { VoiceInputButton } from '@/components/VoiceInputButton';
import { UploadReader } from '@/components/UploadReader';
import {
  CurrencyDollarIcon as CurrencyDollarIconImport,
  CalculatorIcon as CalculatorIconImport,
  CreditCardIcon as CreditCardIconImport,
  ArrowPathIcon as ArrowPathIconImport,
  ChartBarIcon as ChartBarIconImport,
  DocumentTextIcon as DocumentTextIconImport,
  BuildingLibraryIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ProfitTrendItem {
  date: string;
  profit: number;
}

interface Vaccine {
  _id: string;
  name: string;
  batchId: {
    name: string;
  };
  scheduledDate: string;
}

interface Client {
  _id: string;
  name: string;
  ratePerTray: number;
}

interface Sale {
  _id: string;
  clientId: string;
  totalAmount: number;
  date: string;
}

interface Payment {
  _id: string;
  clientId: string;
  amount: number;
  date: string;
}

interface SaleFormData {
  clientId: string;
  trays: number;
  date: string;
  description?: string; // Optional description
  ratePerTray?: number; // Optional rate per tray
}

interface PaymentFormData {
  clientId: string;
  saleId: string;
  amount: number;
  paymentMethod: 'cash' | 'upi';
  utr?: string;
  date: string;
  description?: string; // Optional description
}

interface ExpenseFormData {
  type: 'feed' | 'labor' | 'electricity' | 'medicine' | 'transport' | 'vaccine' | 'other' | 'feed_expense' | 'construction_material' | 'construction_labor';
  amount: number;
  description: string;
  date: string;
  category?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    rate?: number;
    total?: number;
  }>;
}

interface Stats {
  todaysSales: { count: number; total: number };
  todaysPayments: {
    cash: { count: number; total: number };
    upi: { count: number; total: number };
  };
  totalDue: number;
  todaysProfit: number;
  todaysExpenses: number; // Add today's expenses property
  profitTrend: ProfitTrendItem[];
  weeklyProfitTrend: ProfitTrendItem[];
  upcomingVaccines: Vaccine[];
  monthlyData: {
    sales: number;
    expenses: number;
    profit: number;
  };
}

const DashboardPage = () => {
  const [stats, setStats] = useState<Stats>({
    todaysSales: { count: 0, total: 0 },
    todaysPayments: {
      cash: { count: 0, total: 0 },
      upi: { count: 0, total: 0 }
    },
    totalDue: 0,
    todaysProfit: 0,
    todaysExpenses: 0, // Initialize today's expenses
    profitTrend: [],
    weeklyProfitTrend: [],
    upcomingVaccines: [],
    monthlyData: {
      sales: 0,
      expenses: 0,
      profit: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPendingAmounts, setClientPendingAmounts] = useState<Record<string, number>>({});
  const [showPendingTooltip, setShowPendingTooltip] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  
  const router = useRouter();
  const { selectedFarm } = useFarm();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getStats(selectedFarm?._id);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Show user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      // Fetch all required data
      const [clientsData, salesData, paymentsData] = await Promise.all([
        clientAPI.getAll(selectedFarm?._id),
        saleAPI.getAll({ farmId: selectedFarm?._id }),
        paymentAPI.getAll(selectedFarm?._id)
      ]);
      
      console.log('Detailed data inspection:');
      console.log('Clients:', clientsData);
      console.log('Sales details:', salesData.map((s: any) => ({ 
        id: s._id, 
        clientId: s.clientId, 
        clientIdType: typeof s.clientId,
        totalAmount: s.totalAmount,
        clientIdString: typeof s.clientId === 'string' ? s.clientId : String(s.clientId)
      })));
      console.log('Payments details:', paymentsData.map((p: any) => ({ 
        id: p._id, 
        clientId: p.clientId, 
        clientIdType: typeof p.clientId,
        amount: p.amount,
        clientIdString: typeof p.clientId === 'string' ? p.clientId : String(p.clientId)
      })));
      
      // Calculate pending amounts for each client
      const pendingAmounts: Record<string, number> = {};
      let totalPending = 0;
      
      clientsData.forEach((client: Client) => {
        console.log(`Processing client: ${client.name} (${client._id}) - Type: ${typeof client._id}`);
        
        // Calculate total sales amount for this client
        const clientSales = salesData.filter((sale: Sale) => {
          // Handle both string and object IDs
          const saleClientId = typeof sale.clientId === 'string' ? sale.clientId : String(sale.clientId);
          const isMatch = saleClientId === client._id;
          if (isMatch) {
            console.log(`  Matched sale:`, sale);
          } else {
            console.log(`  Sale ${sale._id} clientId "${saleClientId}" does not match client._id "${client._id}"`);
          }
          return isMatch;
        });
        const totalOwed = clientSales.reduce((sum: number, sale: Sale) => sum + (sale.totalAmount || 0), 0);
        
        // Calculate total payments amount for this client
        const clientPayments = paymentsData.filter((payment: Payment) => {
          // Handle both string and object IDs
          const paymentClientId = typeof payment.clientId === 'string' ? payment.clientId : String(payment.clientId);
          const isMatch = paymentClientId === client._id;
          if (isMatch) {
            console.log(`  Matched payment:`, payment);
          } else {
            console.log(`  Payment ${payment._id} clientId "${paymentClientId}" does not match client._id "${client._id}"`);
          }
          return isMatch;
        });
        const totalPaid = clientPayments.reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0);
        
        // Calculate pending amount
        const pendingAmount = totalOwed - totalPaid;
        console.log(`  Client ${client.name}: Owed=${totalOwed}, Paid=${totalPaid}, Pending=${pendingAmount}`);
        pendingAmounts[client._id] = pendingAmount;
        if (pendingAmount > 0) {
          totalPending += pendingAmount;
        }
      });
      
      console.log('Final calculated pending amounts:', pendingAmounts);
      console.log('Total pending:', totalPending);
      
      setClients(clientsData);
      setClientPendingAmounts(pendingAmounts);
      
      // Don't update stats here - let the dashboard API provide the correct totalDue value
      // The fetchDashboardStats function will update the stats with the correct backend-calculated totalDue
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      // Show user-friendly error message
    }
  };

  useEffect(() => {
    // Initial data fetch
    Promise.all([
      fetchDashboardStats(),
      fetchClients()
    ]);

    // Set up auto-refresh every 30 seconds, but only if no modals are open
    const interval = setInterval(() => {
      // Only refresh if no modals are open to prevent data loss during user input
      if (!showSaleModal && !showPaymentModal && !showExpenseModal && !showScreenshotModal) {
        Promise.all([
          fetchDashboardStats(),
          fetchClients()
        ]);
      }
    }, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [selectedFarm, showSaleModal, showPaymentModal, showExpenseModal, showScreenshotModal]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPendingTooltip) {
        setShowPendingTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPendingTooltip]);

  const handleAddSale = () => {
    setShowSaleModal(true);
  };

  const handleAddPayment = () => {
    setShowPaymentModal(true);
  };

  const handleUploadScreenshot = () => {
    // We'll integrate this into the Add Payment modal instead
    setShowPaymentModal(true);
  };
  const handleAddExpense = () => {
    setShowExpenseModal(true);
  };

  const handleSaveSale = async (saleData: SaleFormData) => {
    try {
      // Get client to calculate total amount
      const client = clients.find(c => c._id === saleData.clientId);
      if (!client) {
        alert('Client not found');
        return;
      }
      
      // Calculate eggs and total amount
      const eggs = saleData.trays * 30;
      const ratePerTray = saleData.ratePerTray || client.ratePerTray;
      const totalAmount = saleData.trays * ratePerTray;
      
      await saleAPI.create({
        ...saleData,
        eggs,
        totalAmount,
        farmId: selectedFarm?._id
      });
      await fetchDashboardStats(); // Refresh dashboard stats
      setShowSaleModal(false);
    } catch (error) {
      console.error('Failed to save sale:', error);
      alert('Failed to save sale. Please try again.');
    }
  };

  const handleSavePayment = async (paymentData: PaymentFormData) => {
    try {
      await paymentAPI.create({
        ...paymentData,
        farmId: selectedFarm?._id
      });
      await fetchDashboardStats(); // Refresh dashboard stats
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Failed to save payment:', error);
      alert('Failed to save payment. Please try again.');
    }
  };

  const handleSaveExpense = async (expenseData: ExpenseFormData) => {
    try {
      await expenseAPI.create({
        ...expenseData,
        farmId: selectedFarm?._id
      });
      await fetchDashboardStats(); // Refresh dashboard stats
      setShowExpenseModal(false);
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  // Inline Sale Modal Component
  const SaleModal = ({ clients, onSave, onClose }: { clients: Client[], onSave: (data: SaleFormData) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<SaleFormData>({
      clientId: '',
      trays: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientRate, setClientRate] = useState<number | null>(null);
    
    // AI Suggestion for amount
    const handleAISuggestAmount = async () => {
      try {
        // Get client history for AI suggestion
        const client = clients.find(c => c._id === formData.clientId);
        if (!client) return;

        // In a real implementation, this would call the backend AI API
        // For now, we'll simulate a reasonable suggestion
        const suggestedRate = client.ratePerTray || 0;
        const suggestedAmount = formData.trays * suggestedRate;
        
        // Set the suggested amount
        setFormData(prev => ({
          ...prev,
          ratePerTray: suggestedRate
        }));
        
        // Show notification
        alert(`AI suggests rate of ₹${suggestedRate.toFixed(2)} per tray based on client history`);
      } catch (error) {
        console.error('AI suggestion error:', error);
        alert('Failed to get AI suggestion. Please try again.');
      }
    };

    // Update client rate when client changes
    useEffect(() => {
      if (formData.clientId) {
        const client = clients.find(c => c._id === formData.clientId);
        setClientRate(client ? client.ratePerTray : null);
      } else {
        setClientRate(null);
      }
    }, [formData.clientId, clients]);
    // Fetch market rate when date changes
    useEffect(() => {
      const fetchMarketRate = async () => {
        if (!formData.date) return;
        
        try {
          const marketRate = await marketRateAPI.getByDate(formData.date);
          if (marketRate && marketRate.ratePerTray) {
            setFormData(prev => ({
              ...prev,
              ratePerTray: marketRate.ratePerTray
            }));
          }
        } catch (error) {
          console.log('No market rate found for this date');
        }
      };
      
      fetchMarketRate();
    }, [formData.date]);
    
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);      try {
        await onSave(formData);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Calculate total amount
    const calculateTotalAmount = () => {
      const rate = formData.ratePerTray || clientRate || 0;
      return (formData.trays * rate) || 0;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New Sale</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-client">
                Client
              </label>
              <select
                id="sale-client"
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-rate">
                Rate per Tray (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  id="sale-rate"
                  value={formData.ratePerTray || ''}
                  onChange={(e) => setFormData({...formData, ratePerTray: parseFloat(e.target.value) || undefined})}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={clientRate ? `Default: ₹${clientRate}` : "Enter rate"}
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  onClick={handleAISuggestAmount}
                  disabled={!formData.clientId || !formData.trays}
                  className="btn btn-primary px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  AI Suggest
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-trays">
                Trays
              </label>
              <input
                type="number"
                id="sale-trays"
                value={formData.trays || ''}
                onChange={(e) => setFormData({...formData, trays: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="0"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="sale-date">
                Date
              </label>
              <input
                type="date"
                id="sale-date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="sale-description">
                Description (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="sale-description"
                  name="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                  rows={2}
                  placeholder="Add any notes about this sale..."
                />
                <div className="absolute right-2 bottom-2">
                  <VoiceInputButton 
                    onTranscript={(text) => setFormData({...formData, description: (formData.description || '') + (formData.description ? ' ' : '') + text})}
                    className="p-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-gray-800 dark:text-white mb-2">Sale Summary</h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <p>Eggs: {formData.trays * 30}</p>
                <p className="font-bold">Total Amount: ₹{calculateTotalAmount().toLocaleString()}</p>
              </div>
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
                {isSubmitting ? 'Saving…' : 'Save Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Inline Payment Modal Component
  const PaymentModal = ({ clients, onSave, onClose }: { clients: Client[], onSave: (data: PaymentFormData) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<PaymentFormData>({
      clientId: '',
      saleId: '',
      amount: 0,
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSales, setClientSales] = useState<any[]>([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const { selectedFarm } = useFarm();

    // Fetch sales when client is selected
    useEffect(() => {
      const fetchClientSales = async () => {
        // Only fetch sales if we have both clientId and selectedFarm
        if (formData.clientId && selectedFarm?._id) {
          setLoadingSales(true);
          try {
            // Fetch sales filtered by clientId and farmId from backend
            const sales = await saleAPI.getAll({ 
              clientId: formData.clientId,
              farmId: selectedFarm._id
            });
            // No need to filter again on frontend since backend already filters by clientId and farmId
            setClientSales(sales);
            
            // If there's only one sale, auto-select it
            if (sales.length === 1) {
              setFormData(prev => ({...prev, saleId: sales[0]._id}));
            } else if (sales.length === 0) {
              // Reset saleId if no sales for this client
              setFormData(prev => ({...prev, saleId: ''}));
            }
          } catch (error) {
            console.error('Failed to fetch client sales:', error);
            setClientSales([]);
          } finally {
            setLoadingSales(false);
          }
        } else {
          // If we don't have both clientId and selectedFarm, clear the sales
          setClientSales([]);
          if (!formData.clientId) {
            setFormData(prev => ({...prev, saleId: ''}));
          }
        }
      };

      fetchClientSales();
    }, [formData.clientId, selectedFarm]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate that a sale is selected
      if (!formData.saleId) {
        alert('Please select a sale');
        return;
      }
      
      setIsSubmitting(true);
      try {
        await onSave(formData);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Add New Payment</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-client">
                Client
              </label>
              <select
                id="payment-client"
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            {formData.clientId && (
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-sale">
                  Sale
                </label>
                {loadingSales ? (
                  <div className="text-gray-500 dark:text-gray-400">Loading sales...</div>
                ) : clientSales.length > 0 ? (
                  <select
                    id="payment-sale"
                    value={formData.saleId}
                    onChange={(e) => setFormData({...formData, saleId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Sale</option>
                    {clientSales.map(sale => (
                      <option key={sale._id} value={sale._id}>
                        {formatDate(sale.date)} - {sale.trays} trays - ₹{sale.totalAmount}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-red-500 dark:text-red-400">No sales found for this client</div>
                )}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-amount">
                Amount
              </label>
              <input
                type="number"
                id="payment-amount"
                value={formData.amount || ''}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-method">
                Payment Method
              </label>
              <select
                id="payment-method"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as 'cash' | 'upi'})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="payment-description">
                Description (Optional)
              </label>
              <div className="relative">
                <textarea
                  id="payment-description"
                  name="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-10"
                  rows={2}
                  placeholder="Add any notes about this payment..."
                />
                <div className="absolute right-2 bottom-2">
                  <VoiceInputButton 
                    onTranscript={(text) => setFormData({...formData, description: (formData.description || '') + (formData.description ? ' ' : '') + text})}
                    className="p-1"
                  />
                </div>
              </div>
            </div>
            
            {formData.paymentMethod === 'upi' && (
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-utr">
                  UTR Number
                </label>
                <input
                  type="text"
                  id="payment-utr"
                  value={formData.utr || ''}
                  onChange={(e) => setFormData({...formData, utr: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Upload Screenshot (Optional)</label>
              <UploadReader 
                onUpload={(data: any) => {
                  if (data.amount) {
                    setFormData({...formData, amount: data.amount, description: (formData.description || '') + (formData.description ? ' ' : '') + `[Screenshot: ${data.senderUpiId || 'uploaded'}]`});
                  }
                }}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="payment-date">
                Date
              </label>
              <input
                type="date"
                id="payment-date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
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
  };

  // Inline Expense Modal Component
  const ExpenseModal = ({ onSave, onClose }: { onSave: (data: ExpenseFormData) => void, onClose: () => void }) => {
    const [formData, setFormData] = useState<ExpenseFormData>({
      type: 'feed',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      items: []
    });
    
    // Feed Expense options
    const feedExpenseOptions = [
      'Feed Bag',
      'LC',
      'Maki',
      'Bajara',
      'Stone',
      'Stone Dust',
      'Dorb',
      'DOC',
      'Protein (Soya)',
      'Medicine'
    ];
    
    // Construction Material options
    const constructionMaterialOptions = [
      'Cement',
      'Bricks',
      'Sand',
      'Stone',
      'Iron',
      'Tiles',
      'Paint'
    ];
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    // Handle dropdown selection with subcategories
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as 'feed' | 'labor' | 'electricity' | 'medicine' | 'transport' | 'vaccine' | 'other' | 'feed_expense' | 'construction_material' | 'construction_labor';
      
      // Set category based on type
      let category = '';
      if (value === 'feed') {
        category = 'Feed';
      } else if (value === 'construction_material') {
        category = 'Construction Material';
      } else if (value === 'construction_labor') {
        category = 'Construction Labour';
      }
      
      setFormData(prev => ({ ...prev, type: value, category }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        type: formData.type,
        amount: parseFloat(formData.amount.toString()),
        description: formData.description,
        date: formData.date,
        category: formData.category,
        items: formData.items
      });
    };
    
    // Render subcategory options based on selected type
    const renderSubcategoryOptions = () => {
      if (formData.type === 'feed') {
        return (
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Feed Items
            </label>
            <div className="grid grid-cols-2 gap-2">
              {feedExpenseOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`feed-${option}`}
                    name="feedItems"
                    value={option}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor={`feed-${option}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      } else if (formData.type === 'construction_material') {
        return (
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Construction Materials
            </label>
            <div className="grid grid-cols-2 gap-2">
              {constructionMaterialOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`material-${option}`}
                    name="materialItems"
                    value={option}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor={`material-${option}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      } else if (formData.type === 'construction_labor') {
        return (
          <div className="mb-4 space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="labor-type">
                Labour Type
              </label>
              <input
                type="text"
                id="labor-type"
                name="laborType"
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter labour type"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="number-of-labor">
                  Number of Labour
                </label>
                <input
                  type="number"
                  id="number-of-labor"
                  name="numberOfLabor"
                  min="0"
                  className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="rate-per-labor">
                  Rate per Labour (₹)
                </label>
                <input
                  type="number"
                  id="rate-per-labor"
                  name="ratePerLabor"
                  min="0"
                  step="0.01"
                  className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            </div>
          </div>
        );
      }
      return null;
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Add Expense
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="type">
                Expense Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="feed">Feed</option>
                <option value="labor">Labor</option>
                <option value="electricity">Electricity</option>
                <option value="medicine">Medicine</option>
                <option value="transport">Transport</option>
                <option value="vaccine">Vaccine</option>
                <option value="feed_expense">Feed Expense</option>
                <option value="construction_material">Construction Material</option>
                <option value="construction_labor">Construction Labour</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Subcategory options */}
            {renderSubcategoryOptions()}
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="amount">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="description">
                Description
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-10"
                  rows={3}
                  required
                />
                <div className="absolute right-2 bottom-2">
                  <VoiceInputButton 
                    onTranscript={(text) => setFormData({...formData, description: formData.description + (formData.description ? ' ' : '') + text})}
                    className="p-1"
                  />
                </div>
              </div>
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
                Save Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Today's Sales</h3>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CurrencyDollarIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{(stats.todaysSales.total || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{(stats.todaysSales.count || 0)} sales</p>
            </div>
          </div>
          
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-red-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Today's Expenses</h3>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <CalculatorIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{(stats.todaysExpenses || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Today's total</p>
            </div>
          </div>
          
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-blue-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Cash Payments</h3>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CreditCardIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{(stats.todaysPayments.cash.total || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{(stats.todaysPayments.cash.count || 0)} payments</p>
            </div>
          </div>
          
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-purple-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">UPI Payments</h3>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <ArrowPathIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{(stats.todaysPayments.upi.total || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{(stats.todaysPayments.upi.count || 0)} payments</p>
            </div>
          </div>
          
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-yellow-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Today's Profit</h3>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <ChartBarIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{(stats.todaysProfit || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Today's Sales - Today's Expense</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-green-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Monthly Sales</h3>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CurrencyDollarIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{((stats.monthlyData?.sales) || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
            </div>
          </div>
          
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-red-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Monthly Expenses</h3>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <CalculatorIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{((stats.monthlyData?.expenses) || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
            </div>
          </div>
          
          <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-l-yellow-500">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300">Monthly Profit</h3>
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <ChartBarIconImport className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">₹{((stats.monthlyData?.profit) || 0).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <button 
              onClick={handleAddSale}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-primary via-green-600 to-primary-dark text-gray-900 dark:text-white shadow-lg hover:shadow-xl border-2 border-gray-200 dark:border-white/20"
            >
              <CreditCardIconImport className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-gray-800 dark:text-white" />
              <span className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">Add Sale</span>
            </button>
            <button 
              onClick={handleAddPayment}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-primary via-green-600 to-primary-dark text-gray-900 dark:text-white shadow-lg hover:shadow-xl border-2 border-gray-200 dark:border-white/20"
            >
              <CurrencyDollarIconImport className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-gray-800 dark:text-white" />
              <span className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">Add Payment</span>
            </button>
            <button 
              onClick={handleAddExpense}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-primary via-green-600 to-primary-dark text-gray-900 dark:text-white shadow-lg hover:shadow-xl border-2 border-gray-200 dark:border-white/20"
            >
              <CalculatorIconImport className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-gray-800 dark:text-white" />
              <span className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">Add Expenses</span>
            </button>
            <button 
              onClick={() => router.push('/farms')}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-primary via-green-600 to-primary-dark text-gray-900 dark:text-white shadow-lg hover:shadow-xl border-2 border-gray-200 dark:border-white/20"
            >
              <BuildingLibraryIcon className="h-6 w-6 sm:h-8 sm:w-8 mb-1 sm:mb-2 text-gray-800 dark:text-white" />
              <span className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">Add Farm</span>
            </button>
          </div>        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="card relative">
        <div className="card-header">
          <h2 className="card-title">Payment Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Received */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200">Total Received</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ₹{(stats.todaysPayments.cash.total + stats.todaysPayments.upi.total || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full">
                  <CreditCardIconImport className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
              </div>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                Cash: ₹{stats.todaysPayments.cash.total.toLocaleString()} | UPI: ₹{stats.todaysPayments.upi.total.toLocaleString()}
              </div>
            </div>
            
            {/* Total Pending */}
            <div 
              className={`bg-red-50 dark:bg-red-900/20 p-4 rounded-lg cursor-pointer relative transition-colors duration-200 ${
                showPendingTooltip 
                  ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-300 dark:ring-red-700' 
                  : 'hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
              onMouseEnter={() => setShowPendingTooltip(true)}
              onMouseLeave={() => setShowPendingTooltip(false)}
              onClick={() => setShowPendingTooltip(!showPendingTooltip)}
              title="Click or hover to see details"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Total Pending</h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    ₹{(stats.totalDue || 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-800 rounded-full">
                  <DocumentTextIconImport className="h-6 w-6 text-red-600 dark:text-red-300" />
                </div>
              </div>
              
              {/* Hover Tooltip with Client Details */}
              {showPendingTooltip && (
                <div className="absolute left-0 top-full mt-2 w-full z-50" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Clients with Pending Payments</h4>
                    {Object.keys(clientPendingAmounts).filter(clientId => clientPendingAmounts[clientId] > 0).length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(clientPendingAmounts)
                          .filter(([clientId, amount]) => amount > 0)
                          .map(([clientId, amount]) => {
                            // Find client by ID, handling both string and object IDs
                            const client = clients.find(c => {
                              const clientIdStr = typeof c._id === 'string' ? c._id : String(c._id);
                              return clientIdStr === clientId;
                            });
                            return client ? (
                              <div key={clientId} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 dark:text-gray-300">{client.name}</span>
                                <span className="font-medium text-red-600 dark:text-red-400">₹{amount.toLocaleString()}</span>
                              </div>
                            ) : null;
                          })}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
                        No pending payments found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Insights */}
      <AiInsightsCard />
      
      {/* Profit Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 30-Day Profit Trend - Bar Chart */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="card-title">30-Day Profit Trend</h2>
              {/* Refresh button removed as per user request */}
            </div>
          </div>
          <div className="card-body">
            <div className="h-64 sm:h-72 flex items-end space-x-1 overflow-x-auto pb-4 px-2">
              {stats.profitTrend.map((day, index) => {
                // Calculate max profit for scaling
                const maxProfit = Math.max(...stats.profitTrend.map(d => d.profit), 1);
                // Ensure minimum height of 5% for visibility, and scale appropriately
                const barHeight = maxProfit > 0 ? Math.max(5, (day.profit / maxProfit) * 85) : 5;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-shrink-0 group" style={{ width: '20px' }}>
                    <div className="relative w-full flex justify-center mb-1 sm:mb-2">
                      <div className="absolute bottom-full mb-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-800 text-white text-[10px] sm:text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                        ₹{day.profit.toLocaleString()}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    <div 
                      className="w-full bg-gradient-to-t from-primary to-green-500 rounded-t-lg hover:from-green-700 hover:to-green-600 transition-all duration-500 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105"
                      style={{ height: `${barHeight}%` }}
                    >
                      {/* Show value inside bar for high values */}
                      {barHeight > 20 && day.profit > 0 && (
                        <div className="flex justify-center items-center h-full">
                          <span className="text-[8px] sm:text-xs text-white font-bold transform -rotate-90 origin-center whitespace-nowrap">
                            ₹{day.profit.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 transform -rotate-45 origin-center whitespace-nowrap font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Hover over bars to see exact values
            </div>
          </div>
        </div>
        
        {/* 7-Day Profit Trend - Line Chart */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="card-title">7-Day Profit Trend</h2>
              {/* Refresh button removed as per user request */}
            </div>
          </div>
          <div className="card-body">
            <div className="h-64 sm:h-72 relative">
              <svg className="w-full h-full" viewBox="0 0 420 220">
                {/* Background grid */}
                <defs>
                  <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(var(--gray-200))" strokeWidth="0.5" opacity="0.7" />
                  </pattern>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="2" dy="2" result="offsetblur"/>
                    <feFlood floodColor="rgba(var(--gray-900), 0.3)"/>
                    <feComposite in2="offsetblur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid2)" />
                
                {/* X and Y axis */}
                <line x1="50" y1="20" x2="50" y2="190" stroke="rgb(var(--gray-400))" strokeWidth="2" />
                <line x1="50" y1="190" x2="400" y2="190" stroke="rgb(var(--gray-400))" strokeWidth="2" />
                
                {/* Y-axis labels */}
                <text x="45" y="195" textAnchor="end" className="text-xs fill-gray-500 dark:fill-gray-400 font-medium">0</text>
                
                {/* Line chart */}
                {stats.weeklyProfitTrend.length > 0 && (
                  <>
                    {/* Calculate max profit for scaling */}
                    {(() => {
                      const maxProfit = Math.max(...stats.weeklyProfitTrend.map(d => d.profit), 1);
                      const minProfit = Math.min(...stats.weeklyProfitTrend.map(d => d.profit), 0);
                      const profitRange = maxProfit - minProfit || 1;
                      
                      // Create area path for gradient fill
                      let areaPath = '';
                      let linePath = '';
                      
                      stats.weeklyProfitTrend.forEach((day, index) => {
                        const x = 50 + (index * (350 / (stats.weeklyProfitTrend.length - 1)));
                        const y = 190 - ((day.profit - minProfit) / profitRange) * 170;
                        
                        if (index === 0) {
                          areaPath = `M ${x} 190 L ${x} ${y}`;
                          linePath = `M ${x} ${y}`;
                        } else {
                          const prevX = 50 + ((index - 1) * (350 / (stats.weeklyProfitTrend.length - 1)));
                          const prevY = 190 - ((stats.weeklyProfitTrend[index - 1].profit - minProfit) / profitRange) * 170;
                          
                          // Smooth curve using quadratic bezier
                          const cx = (prevX + x) / 2;
                          areaPath += ` Q ${cx} ${prevY} ${x} ${y}`;
                          linePath += ` Q ${cx} ${prevY} ${x} ${y}`;
                        }
                        
                        if (index === stats.weeklyProfitTrend.length - 1) {
                          areaPath += ` L ${x} 190 Z`;
                        }
                      });
                      
                      return (
                        <>
                          {/* Area fill with gradient */}
                          <defs>
                            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                          <path d={areaPath} fill="url(#areaGradient)" />
                          
                          {/* Line with shadow */}
                          <path 
                            d={linePath} 
                            stroke="rgb(var(--primary))"
                            strokeWidth="4" 
                            fill="none" 
                            filter="url(#shadow)"
                            className="drop-shadow-lg"
                          />
                          
                          {/* Data points */}
                          {stats.weeklyProfitTrend.map((day, index) => {
                            const x = 50 + (index * (350 / (stats.weeklyProfitTrend.length - 1)));
                            const y = 190 - ((day.profit - minProfit) / profitRange) * 170;
                            
                            // Adjust tooltip position to stay within SVG bounds
                            const tooltipX = x;
                            const tooltipY = y - 30;
                            
                            return (
                              <g key={index} className="cursor-pointer">
                                {/* Hover area for tooltip */}
                                <circle cx={x} cy={y} r="15" fill="transparent" />
                                
                                {/* Data point circle */}
                                <circle 
                                  cx={x} 
                                  cy={y} 
                                  r="6" 
                                  fill="rgb(var(--primary))"
                                  stroke="white" 
                                  strokeWidth="3"
                                  className="transition-all duration-300 hover:r-8"
                                />
                                
                                {/* Tooltip */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                  {/* Tooltip background */}
                                  <rect 
                                    x={tooltipX - 40} 
                                    y={tooltipY - 35} 
                                    width="80" 
                                    height="36" 
                                    rx="6" 
                                    fill="rgb(var(--gray-800))"
                                    stroke="rgb(var(--gray-300))"
                                    strokeWidth="0.5"
                                  />
                                  
                                  {/* Tooltip content */}
                                  <text 
                                    x={tooltipX} 
                                    y={tooltipY - 18} 
                                    textAnchor="middle" 
                                    className="text-xs fill-white font-bold"
                                  >
                                    ₹{day.profit.toLocaleString()}
                                  </text>
                                  <text 
                                    x={tooltipX} 
                                    y={tooltipY - 6} 
                                    textAnchor="middle" 
                                    className="text-xs fill-gray-300"
                                  >
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                  </text>
                                </g>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                    
                    {/* X-axis labels */}
                    {stats.weeklyProfitTrend.map((day, index) => {
                      const x = 50 + (index * (350 / (stats.weeklyProfitTrend.length - 1)));
                      return (
                        <g key={index}>
                          <line x1={x} y1="190" x2={x} y2="195" stroke="rgb(var(--gray-400))" strokeWidth="1" />
                          <text 
                            x={x} 
                            y="210" 
                            textAnchor="middle" 
                            className="text-xs fill-gray-500 dark:fill-gray-400 font-medium"
                          >
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </text>
                          <text 
                            x={x} 
                            y="225" 
                            textAnchor="middle" 
                            className="text-xs fill-gray-400 dark:fill-gray-500"
                          >
                            {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
                
                {/* No data message */}
                {stats.weeklyProfitTrend.length === 0 && (
                  <text 
                    x="225" 
                    y="110" 
                    textAnchor="middle" 
                    className="text-lg fill-gray-500 dark:fill-gray-400 font-medium"
                  >
                    No data available
                  </text>
                )}
              </svg>
            </div>
            <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Hover over points to see exact values
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Vaccines */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Upcoming Vaccinations</h2>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vaccine</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stats.upcomingVaccines.map((vaccine) => (
                  <tr key={vaccine._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                      <span className="sm:hidden">Vaccine: </span>
                      {vaccine.name}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      <span className="sm:hidden">Batch: </span>
                      {vaccine.batchId?.name || 'N/A'}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                      <span className="sm:hidden">Date: </span>
                      {formatDate(vaccine.scheduledDate)}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                      <span className="sm:hidden">Status: </span>
                      <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showSaleModal && (
        <SaleModal
          clients={clients}
          onSave={handleSaveSale}
          onClose={() => setShowSaleModal(false)}
        />
      )}
      
      {showPaymentModal && (
        <PaymentModal
          clients={clients}
          onSave={handleSavePayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
      
      {showExpenseModal && (
        <ExpenseModal
          onSave={handleSaveExpense}
          onClose={() => setShowExpenseModal(false)}
        />
      )}
      
    </div>
  );
}

export default DashboardPage;
