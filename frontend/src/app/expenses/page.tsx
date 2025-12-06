'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { expenseAPI } from '../../lib/api';
import { reportAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';

interface Expense {
  _id: string;
  type: 'feed' | 'labor' | 'electricity' | 'medicine' | 'transport' | 'vaccine' | 'other' | 'feed_expense' | 'construction_material' | 'construction_labor';
  amount: number;
  description: string;
  date: string;
  category?: string;
  items?: ExpenseItem[];
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { selectedFarm } = useFarm();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseAPI.getAll(selectedFarm?._id);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, '_id'>) => {
    try {
      const expenseDataWithFarmId = {
        ...expenseData,
        farmId: selectedFarm?._id
      };
      
      if (editingExpense) {
        // Update existing expense
        const updatedExpense = await expenseAPI.update(editingExpense._id, expenseDataWithFarmId);
        setExpenses(expenses.map((e: Expense) => 
          e._id === editingExpense._id ? updatedExpense : e
        ));
      } else {
        // Add new expense
        const newExpense = await expenseAPI.create(expenseDataWithFarmId);
        setExpenses([...expenses, newExpense]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseAPI.delete(id);
        setExpenses(expenses.filter((e: Expense) => e._id !== id));
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const response = await reportAPI.generate({
        reportType: 'expenses',
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
      console.error('Failed to export expenses:', error);
      alert('Failed to export expenses. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      feed: 'Feed',
      labor: 'Labor',
      electricity: 'Electricity',
      medicine: 'Medicine',
      transport: 'Transport',
      vaccine: 'Vaccine',
      feed_expense: 'Feed Expense',
      construction_material: 'Construction Material',
      construction_labor: 'Construction Labour',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
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
            Expenses
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Track daily and monthly spending across your farm.
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
            onClick={handleAddExpense}
            className="btn btn-primary text-xs sm:text-sm"
          >
            Add Expense
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="card-title">Expense List</h2>
          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">
            Total:{' '}
            <span className="text-primary-dark">
              ₹{(getTotalExpenses() || 0).toLocaleString()}
            </span>
          </p>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                    Description
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount (₹)
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr
                    key={expense._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getTypeLabel(expense.type)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                      {expense.description}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                      ₹{(expense.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-sm font-medium text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-primary hover:text-primary-dark text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
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
        <ExpenseModal
          expense={editingExpense}
          onSave={handleSaveExpense}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

interface ExpenseModalProps {
  expense: Expense | null;
  onSave: (expenseData: Omit<Expense, '_id'>) => void;
  onClose: () => void;
}

interface ExpenseItem {
  name: string;
  quantity: number;
  rate: number;
  total: number;
}

interface ExpenseFormData {
  type: 'feed' | 'labor' | 'electricity' | 'medicine' | 'transport' | 'vaccine' | 'other' | 'feed_expense' | 'construction_material' | 'construction_labor';
  amount: number;
  description: string;
  date: string;
  category?: string;
  items?: ExpenseItem[];
}

function ExpenseModal({ expense, onSave, onClose }: ExpenseModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    type: expense?.type || 'feed',
    amount: expense?.amount || 0,
    description: expense?.description || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    category: expense?.category || '',
    items: expense?.items || []
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

  useEffect(() => {
    if (expense) {
      setFormData({
        type: expense.type || 'feed',
        amount: expense.amount || 0,
        description: expense.description || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        category: expense.category || '',
        items: expense.items || []
      });
    } else {
      setFormData({
        type: 'feed',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        items: []
      });
    }
  }, [expense]);

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
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          {expense ? 'Edit Expense' : 'Add Expense'}
        </h2>
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
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={3}
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
