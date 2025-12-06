'use client';

import { useState, useEffect } from 'react';
import { farmAPI, saleAPI, paymentAPI, expenseAPI, batchAPI } from '../../lib/api';
import { useFarm } from '../../contexts/FarmContext';

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
  capacity?: number;
}

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

interface Batch {
  _id: string;
  name: string;
  quantity: number;
  hatchDate: string;
  breed: string;
  farmId: string;
}

interface PartnerShare {
  farm: Farm;
  partnerName: string;
  percentage: number;
  salesShare: number;
  paymentShare: number;
  expenseShare: number;
  profitShare: number;
  birdShare: number;
  totalBirdsInFarm: number;
}

export default function PartnershipDashboard() {
  const [partnerShares, setPartnerShares] = useState<PartnerShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { farms } = useFarm();

  const fetchPartnershipData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - took too long to fetch data')), 15000)
      );
      
      // Get all farms with timeout
      const allFarmsPromise = farmAPI.getAll();
      const allFarms = await Promise.race([allFarmsPromise, timeoutPromise]);
      
      // Debug: Log all farms to see what we're working with
      console.log('All farms:', allFarms);
      
      // If no farms, set empty shares and return
      if (!allFarms || allFarms.length === 0) {
        console.log('No farms found');
        setPartnerShares([]);
        setLoading(false);
        return;
      }
      
      setDebugInfo(allFarms);
      
      // Filter for partnership farms - more inclusive filtering
      const partnershipFarms = allFarms.filter((farm: Farm) => {
        const isPartnership = farm.businessType === 'partnership';
        const hasPartnerDetails = farm.partnerDetails && farm.partnerDetails.length > 0;
        console.log(`Farm ${farm.name}: isPartnership=${isPartnership}, hasPartnerDetails=${hasPartnerDetails}`);
        return isPartnership && hasPartnerDetails;
      });
      
      console.log('Partnership farms:', partnershipFarms);
      
      // Get all financial data and batches
      const allSales: Sale[] = [];
      const allPayments: Payment[] = [];
      const allExpenses: Expense[] = [];
      const allBatches: Batch[] = [];
      
      // Fetch data for each partnership farm
      for (const farm of partnershipFarms) {
        try {
          const [salesData, paymentsData, expensesData, batchesData] = await Promise.all([
            saleAPI.getAll({ farmId: farm._id }),
            paymentAPI.getAll(farm._id),
            expenseAPI.getAll(farm._id),
            batchAPI.getAll(farm._id)
          ]);
          
          console.log(`Farm ${farm.name} data:`, { 
            sales: salesData.length, 
            payments: paymentsData.length, 
            expenses: expensesData.length,
            batches: batchesData.length 
          });
          
          allSales.push(...salesData);
          allPayments.push(...paymentsData);
          allExpenses.push(...expensesData);
          allBatches.push(...batchesData);
        } catch (farmError) {
          console.error(`Error fetching data for farm ${farm._id}:`, farmError);
        }
      }
      
      // Calculate partner shares
      const shares: PartnerShare[] = [];
      
      for (const farm of partnershipFarms) {
        if (!farm.partnerDetails) continue;
        
        // Calculate farm totals
        const farmSales = allSales.filter(sale => sale.farmId === farm._id);
        const farmPayments = allPayments.filter(payment => payment.farmId === farm._id);
        const farmExpenses = allExpenses.filter(expense => expense.farmId === farm._id);
        const farmBatches = allBatches.filter(batch => batch.farmId === farm._id);
        
        const totalSales = farmSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalPayments = farmPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalExpenses = farmExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalProfit = totalSales - totalPayments - totalExpenses;
        const totalBirdsInFarm = farmBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        
        console.log(`Farm ${farm.name} totals:`, { 
          totalSales, 
          totalPayments, 
          totalExpenses, 
          totalProfit,
          totalBirdsInFarm
        });
        
        // Calculate each partner's share
        for (const partner of farm.partnerDetails) {
          if (partner.name && partner.name.trim() !== '') {
            const partnerShare = {
              farm,
              partnerName: partner.name,
              percentage: partner.percentage,
              salesShare: (totalSales * partner.percentage) / 100,
              paymentShare: (totalPayments * partner.percentage) / 100,
              expenseShare: (totalExpenses * partner.percentage) / 100,
              profitShare: (totalProfit * partner.percentage) / 100,
              birdShare: (totalBirdsInFarm * partner.percentage) / 100,
              totalBirdsInFarm
            };
            
            console.log(`Partner ${partner.name} share:`, partnerShare);
            shares.push(partnerShare);
          }
        }
      }
      
      console.log('Final partner shares:', shares);
      setPartnerShares(shares);
    } catch (err) {
      console.error('Failed to fetch partnership data:', err);
      setError('Failed to load partnership data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setError('Please log in to view partnership data.');
      setLoading(false);
      return;
    }
    
    fetchPartnershipData();
  }, []);

  // Calculate consolidated totals
  const consolidatedTotals = partnerShares.reduce((totals, share) => {
    return {
      totalBirds: totals.totalBirds + share.birdShare,
      totalSales: totals.totalSales + share.salesShare,
      totalPayments: totals.totalPayments + share.paymentShare,
      totalExpenses: totals.totalExpenses + share.expenseShare,
      totalProfit: totals.totalProfit + share.profitShare
    };
  }, {
    totalBirds: 0,
    totalSales: 0,
    totalPayments: 0,
    totalExpenses: 0,
    totalProfit: 0
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-800">Partnership Dashboard</h1>
        </div>
        
        {/* Debug Info */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Loading partnership data... Check browser console for detailed information.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 dark:border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Create a unique list of farms
  const uniqueFarms: Farm[] = [];
  const farmIds = new Set<string>();
  
  partnerShares.forEach(share => {
    if (!farmIds.has(share.farm._id)) {
      farmIds.add(share.farm._id);
      uniqueFarms.push(share.farm);
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partnership Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View your consolidated partnership data across all farms</p>
        </div>
      </div>
      
      {/* Consolidated Summary */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Your Consolidated Partnership Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Total Birds</h3>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-300 truncate mt-1">{Math.round(consolidatedTotals.totalBirds).toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl border border-green-100 dark:border-green-800/50">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">Sales Share</h3>
              <p className="text-lg font-bold text-green-600 dark:text-green-300 truncate mt-1">₹{consolidatedTotals.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-100 dark:border-purple-800/50">
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">Payment Share</h3>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-300 truncate mt-1">
                ₹{consolidatedTotals.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-4 rounded-xl border border-red-100 dark:border-red-800/50">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Expense Share</h3>
              <p className="text-lg font-bold text-red-600 dark:text-red-300 truncate mt-1">
                ₹{consolidatedTotals.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`p-4 rounded-xl border ${consolidatedTotals.totalProfit >= 0 ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-100 dark:border-emerald-800/50' : 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border-rose-100 dark:border-rose-800/50'}`}>
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Profit/Loss</h3>
              <p className={`text-lg font-bold ${consolidatedTotals.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'} truncate mt-1`}>
                ₹{consolidatedTotals.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-normal ml-1 whitespace-nowrap">
                  ({consolidatedTotals.totalProfit >= 0 ? 'Profit' : 'Loss'})
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Individual Partnership Shares */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Your Partnership Shares</h2>
        </div>
        <div className="card-body">
          {partnerShares.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No partnership data</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You don't have any partnership shares yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Farm Name</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">Location</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Partner</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">Ownership %</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Birds Owned</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">Total Birds in Farm</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Sales (₹)</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Payments (₹)</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">Expenses (₹)</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Profit/Loss (₹)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {partnerShares.map((share, index) => (
                    <tr key={`${share.farm._id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{share.farm.name}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">{share.farm.location}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{share.partnerName}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell">{share.percentage}%</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">{Math.round(share.birdShare).toLocaleString()}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">{Math.round(share.totalBirdsInFarm).toLocaleString()}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">₹{share.salesShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">₹{share.paymentShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">₹{share.expenseShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`px-3 sm:px-6 py-4 text-sm font-medium ${share.profitShare >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{share.profitShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-xs font-normal ml-1 whitespace-nowrap">
                          ({share.profitShare >= 0 ? 'Profit' : 'Loss'})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 sm:px-6 py-4 text-sm text-gray-900 dark:text-white">Total</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden md:table-cell"></td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">{Math.round(consolidatedTotals.totalBirds).toLocaleString()}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell"></td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">₹{consolidatedTotals.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">₹{consolidatedTotals.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-300 hidden xl:table-cell">₹{consolidatedTotals.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className={`px-3 sm:px-6 py-4 text-sm ${consolidatedTotals.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ₹{consolidatedTotals.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-xs font-normal ml-1">
                        ({consolidatedTotals.totalProfit >= 0 ? 'Profit' : 'Loss'})
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Farm Details */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Partnership Farm Details</h2>
        </div>
        <div className="card-body">
          {uniqueFarms.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No partnership farms</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a partnership farm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueFarms.map((farm) => (
                <div key={farm._id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3 line-clamp-2">{farm.name}</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{farm.location}</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="truncate">{farm.contact.phone}</span>
                    </p>
                    {farm.contact.email && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{farm.contact.email}</span>
                      </p>
                    )}
                    <p className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate">{farm.owner}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}