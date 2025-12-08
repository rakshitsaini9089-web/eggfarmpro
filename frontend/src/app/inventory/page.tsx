'use client';

import { useState, useEffect } from 'react';
import { inventoryAPI } from '../../lib/api';
import { reportAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface InventoryItem {
  _id: string;
  itemName: string;
  itemType: 'feed' | 'medicine' | 'vaccine' | 'tray' | 'packaging' | 'other';
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalPrice: number;
  supplier: string;
  purchaseDate: string;
  expiryDate: string;
  batchNumber: string;
  location: string;
  notes: string;
  lowStockThreshold: number;
  usedQuantity: number;
  availableQuantity: number;
  createdAt: string;
  createdBy: {
    username: string;
  };
}

interface InventorySummary {
  _id: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  lowStockItems: number;
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<string>('all');
  const { selectedFarm } = useFarm();
  
  const [formData, setFormData] = useState({
    itemName: '',
    itemType: 'feed',
    quantity: '',
    unit: '',
    costPerUnit: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    batchNumber: '',
    location: '',
    notes: '',
    lowStockThreshold: ''
  });

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      // Only fetch items if we have a valid farm ID
      console.log('Fetching inventory items, selectedFarm:', selectedFarm);
      if (selectedFarm?._id) {
        console.log('Farm ID being passed to items:', selectedFarm._id);
        // Validate that the farm ID is a proper ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(selectedFarm._id)) {
          const data = await inventoryAPI.getAll(selectedItemType === 'all' ? undefined : selectedItemType, selectedFarm._id);
          setInventoryItems(data);
        } else {
          console.warn('Invalid farm ID format for items, not fetching:', selectedFarm._id);
          setInventoryItems([]);
        }
      } else {
        console.log('No valid farm ID for items, setting empty items');
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
      setInventoryItems([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchInventorySummary = async () => {
    try {
      // Only fetch summary if we have a valid farm ID
      console.log('Fetching inventory summary, selectedFarm:', selectedFarm);
      if (selectedFarm?._id) {
        console.log('Farm ID being passed:', selectedFarm._id);
        // Validate that the farm ID is a proper ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(selectedFarm._id)) {
          const data = await inventoryAPI.getSummary(selectedFarm._id);
          setInventorySummary(data);
        } else {
          console.warn('Invalid farm ID format, not fetching summary:', selectedFarm._id);
          setInventorySummary([]);
        }
      } else {
        console.log('No valid farm ID, setting empty summary');
        setInventorySummary([]);
      }
    } catch (error) {
      console.error('Failed to fetch inventory summary:', error);
      setInventorySummary([]); // Set to empty array on error
    }
  };

  const fetchAlerts = async () => {
    try {
      console.log('Fetching alerts, selectedFarm:', selectedFarm);
      // Only fetch alerts if we have a valid farm ID
      if (selectedFarm?._id) {
        console.log('Farm ID being passed to alerts:', selectedFarm._id);
        // Validate that the farm ID is a proper ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(selectedFarm._id)) {
          // Fetch low stock alerts
          const lowStockData = await inventoryAPI.getLowStockAlerts(selectedFarm._id);
          setLowStockAlerts(lowStockData);
          
          // Fetch expiry alerts
          const expiryData = await inventoryAPI.getExpiryAlerts(selectedFarm._id);
          setExpiryAlerts(expiryData);
        } else {
          console.warn('Invalid farm ID format for alerts, not fetching:', selectedFarm._id);
          setLowStockAlerts([]);
          setExpiryAlerts([]);
        }
      } else {
        console.log('No valid farm ID for alerts, setting empty alerts');
        setLowStockAlerts([]);
        setExpiryAlerts([]);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setLowStockAlerts([]);
      setExpiryAlerts([]);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchInventoryItems(),
      fetchInventorySummary(),
      fetchAlerts()
    ]);
  }, [selectedItemType, selectedFarm]);

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
      const quantity = parseFloat(formData.quantity);
      const costPerUnit = parseFloat(formData.costPerUnit);
      const totalPrice = quantity * costPerUnit;
      
      const inventoryData = {
        ...formData,
        quantity,
        costPerUnit,
        totalPrice,
        lowStockThreshold: formData.lowStockThreshold ? parseFloat(formData.lowStockThreshold) : undefined,
        farmId: selectedFarm?._id
      };

      if (editingInventoryItem) {
        await inventoryAPI.update(editingInventoryItem._id, inventoryData);
      } else {
        await inventoryAPI.create(inventoryData);
      }

      // Reset form and refresh data
      setFormData({
        itemName: '',
        itemType: 'feed',
        quantity: '',
        unit: '',
        costPerUnit: '',
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        batchNumber: '',
        location: '',
        notes: '',
        lowStockThreshold: ''
      });
      setEditingInventoryItem(null);
      setShowModal(false);
      
      // Refresh data
      fetchInventoryItems();
      fetchInventorySummary();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to save inventory item:', error);
      alert('Failed to save inventory item. Please try again.');
    }
  };

  const handleEdit = (inventoryItem: InventoryItem) => {
    setEditingInventoryItem(inventoryItem);
    setFormData({
      itemName: inventoryItem.itemName,
      itemType: inventoryItem.itemType,
      quantity: inventoryItem.quantity.toString(),
      unit: inventoryItem.unit,
      costPerUnit: inventoryItem.costPerUnit.toString(),
      supplier: inventoryItem.supplier,
      purchaseDate: inventoryItem.purchaseDate.split('T')[0],
      expiryDate: inventoryItem.expiryDate ? inventoryItem.expiryDate.split('T')[0] : '',
      batchNumber: inventoryItem.batchNumber,
      location: inventoryItem.location,
      notes: inventoryItem.notes,
      lowStockThreshold: inventoryItem.lowStockThreshold ? inventoryItem.lowStockThreshold.toString() : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      await inventoryAPI.delete(id);
      fetchInventoryItems();
      fetchInventorySummary();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete inventory item:', error);
      alert('Failed to delete inventory item. Please try again.');
    }
  };

  const handleUseItem = async (id: string, itemName: string) => {
    const quantityStr = prompt(`Enter quantity to use for ${itemName}:`);
    if (!quantityStr) return;
    
    const quantity = parseFloat(quantityStr);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    try {
      await inventoryAPI.useItem(id, { quantity });
      fetchInventoryItems();
      fetchInventorySummary();
      fetchAlerts();
    } catch (error) {
      console.error('Failed to use inventory item:', error);
      alert('Failed to use inventory item. Please try again.');
    }
  };

  const handleAddNew = () => {
    setEditingInventoryItem(null);
    setFormData({
      itemName: '',
      itemType: 'feed',
      quantity: '',
      unit: '',
      costPerUnit: '',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      batchNumber: '',
      location: '',
      notes: '',
      lowStockThreshold: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInventoryItem(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Get item type label
  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      feed: 'Feed',
      medicine: 'Medicine',
      vaccine: 'Vaccine',
      tray: 'Tray',
      packaging: 'Packaging',
      other: 'Other'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleAddNew}
            className="btn btn-primary text-xs sm:text-sm"
          >
            Add Inventory Item
          </button>
        </div>
      </div>

      {/* Filter by Item Type */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Filter Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedItemType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedItemType === 'all'
                ? 'bg-[rgb(34,197,94)] text-white hover:bg-[rgb(22,163,74)]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setSelectedItemType('feed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedItemType === 'feed'
                ? 'bg-[rgb(34,197,94)] text-white hover:bg-[rgb(22,163,74)]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setSelectedItemType('medicine')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedItemType === 'medicine'
                ? 'bg-[rgb(34,197,94)] text-white hover:bg-[rgb(22,163,74)]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Medicine
          </button>
          <button
            onClick={() => setSelectedItemType('vaccine')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedItemType === 'vaccine'
                ? 'bg-[rgb(34,197,94)] text-white hover:bg-[rgb(22,163,74)]'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Vaccine
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {inventorySummary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {inventorySummary.map((summary) => (
            <div key={summary._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {getItemTypeLabel(summary._id)}
              </h3>
              <p className="text-3xl font-bold text-primary dark:text-primary">{summary.totalItems}</p>
              <p className="text-sm text-gray-500">
                {summary.totalQuantity} units | {formatCurrency(summary.totalValue)}
              </p>
              {summary.lowStockItems > 0 && (
                <p className="text-sm text-red-500 mt-1">
                  {summary.lowStockItems} low stock items
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alerts Section */}
      {(lowStockAlerts.length > 0 || expiryAlerts.length > 0) && (
        <div className="space-y-4">
          {lowStockAlerts.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-red-800 dark:text-red-200">Low Stock Alerts</h2>
              <div className="space-y-3">
                {lowStockAlerts.map(alert => (
                  <div key={alert._id} className="bg-red-100 dark:bg-red-800 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-red-800 dark:text-red-200">{alert.itemName}</h3>
                        <p className="text-red-700 dark:text-red-300">
                          Available: {alert.availableQuantity} {alert.unit} | 
                          Threshold: {alert.lowStockThreshold} {alert.unit}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiryAlerts.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Expiry Alerts</h2>
              <div className="space-y-3">
                {expiryAlerts.map(alert => (
                  <div key={alert._id} className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">{alert.itemName}</h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                          Expiry: {formatDate(alert.expiryDate)} | 
                          Batch: {alert.batchNumber || 'N/A'}
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

      {/* Inventory Items Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Inventory Items</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No inventory items found. Add a new item to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Item</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Available</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Unit Price</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Total Value</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Purchase Date</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {inventoryItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.itemName}
                      {item.batchNumber && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Batch: {item.batchNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                      {getItemTypeLabel(item.itemType)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.availableQuantity <= item.lowStockThreshold 
                          ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' 
                          : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                        {item.availableQuantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">
                      {formatCurrency(item.costPerUnit)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">
                      {item.supplier || 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">
                      {formatDate(item.purchaseDate)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <button
                          onClick={() => handleUseItem(item._id, item.itemName)}
                          className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-primary hover:text-green-700 text-xs sm:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
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

      {/* Modal for Adding/Editing Inventory Items */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingInventoryItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
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
                    <label htmlFor="inventory-itemName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      id="inventory-itemName"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="inventory-itemType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Item Type
                    </label>
                    <select
                      id="inventory-itemType"
                      name="itemType"
                      value={formData.itemType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="feed">Feed</option>
                      <option value="medicine">Medicine</option>
                      <option value="vaccine">Vaccine</option>
                      <option value="tray">Tray</option>
                      <option value="packaging">Packaging</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inventory-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="inventory-quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="inventory-unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        id="inventory-unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inventory-costPerUnit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cost per Unit (₹)
                      </label>
                      <input
                        type="number"
                        id="inventory-costPerUnit"
                        name="costPerUnit"
                        value={formData.costPerUnit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="inventory-lowStockThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Low Stock Threshold
                      </label>
                      <input
                        type="number"
                        id="inventory-lowStockThreshold"
                        name="lowStockThreshold"
                        value={formData.lowStockThreshold}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="inventory-supplier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Supplier (Optional)
                    </label>
                    <input
                      type="text"
                      id="inventory-supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inventory-purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        id="inventory-purchaseDate"
                        name="purchaseDate"
                        value={formData.purchaseDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="inventory-expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="inventory-expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="inventory-batchNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Batch Number (Optional)
                      </label>
                      <input
                        type="text"
                        id="inventory-batchNumber"
                        name="batchNumber"
                        value={formData.batchNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="inventory-location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location (Optional)
                      </label>
                      <input
                        type="text"
                        id="inventory-location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="inventory-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="inventory-notes"
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
                    {editingInventoryItem ? 'Update' : 'Save'}
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