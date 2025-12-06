'use client';

import React, { useState, useEffect } from 'react';
import { saleAPI, paymentAPI, reportAPI, expenseAPI, farmAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';
import { AIReportCard } from '@/components/AIReportCard';

interface Sale {
  _id: string;
  clientId: string;
  clientName: string;
  trays: number;
  totalAmount: number;
  date: string;
  farmId: string;
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
  farmId: string;
}

interface Expense {
  _id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  farmId: string;
}

interface Farm {
  _id: string;
  name: string;
  owner: string;
  businessType?: 'sole_proprietorship' | 'partnership' | 'corporation' | 'llc';
  partnerDetails?: Array<{
    name: string;
    percentage: number;
  }>;
  contact: {
    phone: string;
    email?: string;
  };
  location: string;
}

function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allFarms, setAllFarms] = useState<Farm[]>([]); // Add state for all farms
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { selectedFarm } = useFarm();

  const fetchData = async () => {
    try {
      setLoading(true);
      if (selectedFarm?._id) {
        const [salesData, paymentsData, expensesData] = await Promise.all([
          saleAPI.getAll({ farmId: selectedFarm._id }),
          paymentAPI.getAll(selectedFarm._id),
          expenseAPI.getAll(selectedFarm._id)
        ]);
        setSales(salesData);
        setPayments(paymentsData);
        setExpenses(expensesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all farms data
  const fetchAllFarmsData = async () => {
    try {
      setLoading(true);
      // Fetch all farms
      const farmsData = await farmAPI.getAll();
      setAllFarms(farmsData);
      
      // Fetch data for all farms
      const allSales: Sale[] = [];
      const allPayments: Payment[] = [];
      const allExpenses: Expense[] = [];
      
      for (const farm of farmsData) {
        const [salesData, paymentsData, expensesData] = await Promise.all([
          saleAPI.getAll({ farmId: farm._id }),
          paymentAPI.getAll(farm._id),
          expenseAPI.getAll(farm._id)
        ]);
        
        allSales.push(...salesData);
        allPayments.push(...paymentsData);
        allExpenses.push(...expensesData);
      }
      
      setSales(allSales);
      setPayments(allPayments);
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Failed to fetch all farms data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no farm is selected, show data for all farms
    if (!selectedFarm) {
      fetchAllFarmsData();
    } else {
      fetchData();
    }
  }, [selectedFarm]);

  // Calculate partner-wise financials for partnership farms
  const calculatePartnerWiseFinancials = () => {
    if (!selectedFarm || selectedFarm.businessType !== 'partnership' || !selectedFarm.partnerDetails) {
      return null;
    }

    // Calculate total sales and payments
    const totalSales = sales
      .filter(sale => sale.farmId === selectedFarm._id)
      .reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0);

    const totalPayments = payments
      .filter(payment => payment.farmId === selectedFarm._id)
      .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);

    // Calculate total expenses
    const totalExpenses = expenses
      .filter(expense => expense.farmId === selectedFarm._id)
      .reduce((sum: number, expense: Expense) => sum + expense.amount, 0);

    // Calculate profit/loss
    const totalProfit = totalSales - totalPayments - totalExpenses;

    // Calculate partner shares
    const partnerShares = selectedFarm.partnerDetails.map(partner => ({
      name: partner.name,
      percentage: partner.percentage,
      salesShare: (totalSales * partner.percentage) / 100,
      paymentShare: (totalPayments * partner.percentage) / 100,
      expenseShare: (totalExpenses * partner.percentage) / 100,
      profitShare: (totalProfit * partner.percentage) / 100 // Profit/Loss share
    }));

    return {
      totalSales,
      totalPayments,
      totalExpenses,
      totalProfit,
      partnerShares
    };
  };

  // Calculate farm-wise financials (for all farm types)
  const calculateFarmWiseFinancials = () => {
    // If no farm is selected, calculate totals for all farms
    if (!selectedFarm) {
      const totalSales = sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0);
      const totalPayments = payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
      const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
      const totalProfit = totalSales - totalPayments - totalExpenses;
      
      return {
        totalSales,
        totalPayments,
        totalExpenses,
        totalProfit,
        pendingPayments: totalSales - totalPayments
      };
    } else {
      // Calculate total sales and payments for the selected farm
      const farmSales = sales.filter(sale => sale.farmId === selectedFarm._id);
      const farmPayments = payments.filter(payment => payment.farmId === selectedFarm._id);
      const farmExpenses = expenses.filter(expense => expense.farmId === selectedFarm._id);

      const totalSales = farmSales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0);
      const totalPayments = farmPayments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
      const totalExpenses = farmExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
      const totalProfit = totalSales - totalPayments - totalExpenses;

      return {
        totalSales,
        totalPayments,
        totalExpenses,
        totalProfit,
        pendingPayments: totalSales - totalPayments
      };
    }
  };

  // Calculate owner-wise financials (for sole proprietorships)
  const calculateOwnerWiseFinancials = () => {
    if (!selectedFarm || selectedFarm.businessType !== 'sole_proprietorship') {
      return null;
    }

    // For sole proprietorship, the owner gets 100% of everything
    const farmSales = sales.filter(sale => sale.farmId === selectedFarm._id);
    const farmPayments = payments.filter(payment => payment.farmId === selectedFarm._id);
    const farmExpenses = expenses.filter(expense => expense.farmId === selectedFarm._id);

    const totalSales = farmSales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0);
    const totalPayments = farmPayments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
    const totalExpenses = farmExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
    const totalProfit = totalSales - totalPayments - totalExpenses;

    return {
      ownerName: selectedFarm.owner,
      totalSales,
      totalPayments,
      totalExpenses,
      totalProfit,
      salesShare: totalSales,
      paymentShare: totalPayments,
      expenseShare: totalExpenses,
      profitShare: totalProfit
    };
  };

  // Calculate financials for all farms
  const calculateAllFarmsFinancials = () => {
    // If a farm is selected, don't show all farms financials
    if (selectedFarm) return null;
    
    // Group data by farm
    const farmMap = new Map();
    
    // Initialize all farms in the map
    allFarms.forEach(farm => {
      farmMap.set(farm._id, {
        farm,
        sales: [],
        payments: [],
        expenses: []
      });
    });
    
    // Group sales, payments, and expenses by farm
    sales.forEach(sale => {
      if (farmMap.has(sale.farmId)) {
        farmMap.get(sale.farmId).sales.push(sale);
      }
    });
    
    payments.forEach(payment => {
      if (farmMap.has(payment.farmId)) {
        farmMap.get(payment.farmId).payments.push(payment);
      }
    });
    
    expenses.forEach(expense => {
      if (farmMap.has(expense.farmId)) {
        farmMap.get(expense.farmId).expenses.push(expense);
      }
    });
    
    // Calculate financials for each farm
    const farmFinancials = Array.from(farmMap.values()).map(({ farm, sales, payments, expenses }) => {
      const totalSales = sales.reduce((sum: number, sale: Sale) => sum + sale.totalAmount, 0);
      const totalPayments = payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
      const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
      const totalProfit = totalSales - totalPayments - totalExpenses;
      
      return {
        farm,
        totalSales,
        totalPayments,
        totalExpenses,
        totalProfit,
        pendingPayments: totalSales - totalPayments
      };
    });
    
    return farmFinancials;
  };

  const handleExport = async (reportType: string, format: 'csv' | 'pdf') => {
    try {
      setExporting(true);
      const response = await reportAPI.generate({
        reportType,
        format,
        farmId: selectedFarm?._id
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = `/api${response.report.downloadUrl}`;
      link.download = response.report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const partnerFinancials = calculatePartnerWiseFinancials();
  const farmFinancials = calculateFarmWiseFinancials();
  const ownerFinancials = calculateOwnerWiseFinancials();
  const allFarmsFinancials = calculateAllFarmsFinancials();

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
            Financial Reports
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            High-level overview of sales, payments, and expenses by farm.
          </p>
        </div>
      </div>
      
      {/* AI-Powered Reports Section */}
      <AIReportCard />
      
      <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport('sales', 'csv')}
            disabled={exporting}
            className="btn btn-outline text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export Sales CSV'}
          </button>
          <button
            onClick={() => handleExport('payments', 'csv')}
            disabled={exporting}
            className="btn btn-outline text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? 'Exporting…' : 'Export Payments CSV'}
          </button>
        </div>      
      {!selectedFarm ? (
        <React.Fragment>
          {/* All Farms Financial Summary */}
          {allFarmsFinancials && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">All Farms Financial Summary</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Total Sales</h3>
                  <p className="text-2xl font-bold text-green-600">₹{allFarmsFinancials.reduce((sum, farm) => sum + farm.totalSales, 0).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Total Payments</h3>
                  <p className="text-2xl font-bold text-blue-600">₹{allFarmsFinancials.reduce((sum, farm) => sum + farm.totalPayments, 0).toLocaleString()}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Total Expenses</h3>
                  <p className="text-2xl font-bold text-red-600">₹{allFarmsFinancials.reduce((sum, farm) => sum + farm.totalExpenses, 0).toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-lg ${allFarmsFinancials.reduce((sum, farm) => sum + farm.pendingPayments, 0) < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                  <h3 className={`text-lg font-semibold ${allFarmsFinancials.reduce((sum, farm) => sum + farm.pendingPayments, 0) < 0 ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'}`}>Pending Payments</h3>
                  <p className={`text-2xl font-bold ${allFarmsFinancials.reduce((sum, farm) => sum + farm.pendingPayments, 0) < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                    ₹{allFarmsFinancials.reduce((sum, farm) => sum + farm.pendingPayments, 0).toLocaleString()}
                  </p>
                </div>
                {/* Add Profit/Loss card */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg md:col-span-4">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Overall Profit/Loss</h3>
                  <p className={`text-2xl font-bold ${(allFarmsFinancials.reduce((sum, farm) => sum + farm.totalProfit, 0) >= 0) ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{allFarmsFinancials.reduce((sum, farm) => sum + farm.totalProfit, 0).toLocaleString()}
                    <span className="text-base font-normal ml-2">
                      ({(allFarmsFinancials.reduce((sum, farm) => sum + farm.totalProfit, 0) >= 0) ? 'Profit' : 'Loss'})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Farm Financial Summaries */}
          {allFarmsFinancials && allFarmsFinancials.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Individual Farm Financials</h2>
              </div>
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss (₹)</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {allFarmsFinancials.map((farmFin, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{farmFin.farm.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{farmFin.farm.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{farmFin.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{farmFin.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{farmFin.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${farmFin.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{farmFin.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-xs font-normal ml-1">
                            ({farmFin.totalProfit >= 0 ? 'Profit' : 'Loss'})
                          </span>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {/* Farm Information */}
          {selectedFarm && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Farm Information</h2>
              </div>
              <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Farm Name</h3>
                  <p className="text-gray-900">{selectedFarm.name}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">
                    {selectedFarm.businessType === 'partnership' ? 'Organization Name' : 'Owner Name'}
                  </h3>
                  <p className="text-gray-900">{selectedFarm.owner}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Business Type</h3>
                  <p className="text-gray-900">
                    {selectedFarm.businessType === 'sole_proprietorship' && 'Sole Proprietorship'}
                    {selectedFarm.businessType === 'partnership' && 'Partnership'}
                    {selectedFarm.businessType === 'corporation' && 'Corporation'}
                    {selectedFarm.businessType === 'llc' && 'LLC'}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Contact</h3>
                  <p className="text-gray-900">Phone: {selectedFarm.contact?.phone}</p>
                  {selectedFarm.contact?.email && <p className="text-gray-900">Email: {selectedFarm.contact.email}</p>}
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Farm Financial Summary */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Farm Financial Summary</h2>
            </div>
            <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Total Sales</h3>
                <p className="text-2xl font-bold text-green-600">₹{(farmFinancials?.totalSales || 0).toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Total Payments</h3>
                <p className="text-2xl font-bold text-blue-600">₹{(farmFinancials?.totalPayments || 0).toLocaleString()}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-600">₹{(farmFinancials?.totalExpenses || 0).toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-lg ${farmFinancials && farmFinancials.pendingPayments < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                <h3 className={`text-lg font-semibold ${farmFinancials && farmFinancials.pendingPayments < 0 ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'}`}>Pending Payments</h3>
                <p className={`text-2xl font-bold ${farmFinancials && farmFinancials.pendingPayments < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  ₹{(farmFinancials?.pendingPayments || 0).toLocaleString()}
                </p>
              </div>
              {/* Add Profit/Loss card */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg md:col-span-4">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Farm Profit/Loss</h3>
                <p className={`text-2xl font-bold ${farmFinancials && (farmFinancials.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(farmFinancials?.totalProfit || 0).toLocaleString()}
                  <span className="text-base font-normal ml-2">
                    ({(farmFinancials && (farmFinancials.totalProfit || 0) >= 0) ? 'Profit' : 'Loss'})
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Owner-wise Financials (only for sole proprietorships) */}
          {selectedFarm && selectedFarm.businessType === 'sole_proprietorship' && ownerFinancials && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h2 className="card-title">Owner Financials</h2>
                <button
                  onClick={() => handleExport('owner-financials', 'csv')}
                  disabled={exporting}
                  className="btn btn-outline btn-sm text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exporting…' : 'Export CSV'}
                </button>
              </div>
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss (₹)</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ownerFinancials.ownerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{ownerFinancials.salesShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{ownerFinancials.paymentShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{ownerFinancials.expenseShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${ownerFinancials.profitShare >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{ownerFinancials.profitShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-normal ml-1">
                          ({ownerFinancials.profitShare >= 0 ? 'Profit' : 'Loss'})
                        </span>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Partner-wise Financials (only for partnerships) */}
          {selectedFarm && selectedFarm.businessType === 'partnership' && partnerFinancials && (
            <div className="card">
              <div className="card-header flex justify-between items-center">
                <h2 className="card-title">Partner-wise Financials</h2>
                <button
                  onClick={() => handleExport('partner-financials', 'csv')}
                  disabled={exporting}
                  className="btn btn-outline btn-sm text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {exporting ? 'Exporting…' : 'Export CSV'}
                </button>
              </div>
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Share (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Share (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Share (₹)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss Share (₹)</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {partnerFinancials.partnerShares.map((partner, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.percentage}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{partner.salesShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{partner.paymentShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{partner.expenseShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${partner.profitShare >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{partner.profitShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-xs font-normal ml-1">
                            ({partner.profitShare >= 0 ? 'Profit' : 'Loss'})
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{partnerFinancials.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{partnerFinancials.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{partnerFinancials.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${partnerFinancials.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{partnerFinancials.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-normal ml-1">
                          ({partnerFinancials.totalProfit >= 0 ? 'Profit' : 'Loss'})
                        </span>
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sales */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Sales</h2>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trays</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sales
                    .filter(sale => !selectedFarm || sale.farmId === selectedFarm._id)
                    .slice(0, 5)
                    .map((sale) => (
                      <tr key={sale._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sale.trays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{(sale.totalAmount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Payments</h2>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payments
                    .filter(payment => !selectedFarm || payment.farmId === selectedFarm._id)
                    .slice(0, 5)
                    .map((payment) => (
                      <tr key={payment._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{(payment.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paymentMethod === 'cash' ? 'Cash' : 'UPI'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

export default ReportsPage;
