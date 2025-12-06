const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Vaccine = require('../models/Vaccine');

/**
 * Get dashboard statistics
 */
async function getDashboardStats(req, res) {
  try {
    // Get farmId from query parameters or request body
    const farmId = req.query.farmId || req.body.farmId;
    
    // Build query filters
    const farmFilter = farmId ? { farmId } : {};
    
    // Create date range for today in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Convert to UTC to match database storage
    const todayUTC = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setDate(tomorrowUTC.getDate() + 1);
    
    console.log('Date range for today (UTC):', todayUTC, 'to', tomorrowUTC);
    console.log('Farm filter:', farmFilter);
    
    // Get today's sales with farm filter
    const todaysSalesQuery = {
      date: { $gte: todayUTC, $lt: tomorrowUTC },
      ...farmFilter
    };
    
    const todaysSales = await Sale.find(todaysSalesQuery).populate('clientId', 'name ratePerTray');
    console.log('Today\'s sales count:', todaysSales.length);
    
    // Calculate today's total sales amount
    const todaysSalesTotal = todaysSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Get today's payments with farm filter
    const todaysPaymentsQuery = {
      date: { $gte: todayUTC, $lt: tomorrowUTC },
      ...farmFilter
    };
    
    const todaysPayments = await Payment.find(todaysPaymentsQuery).populate('clientId', 'name');
    console.log('Today\'s payments count:', todaysPayments.length);
    
    // Calculate cash vs UPI payments
    const cashPayments = todaysPayments.filter(p => p.paymentMethod === 'cash');
    const upiPayments = todaysPayments.filter(p => p.paymentMethod === 'upi');
    
    const cashTotal = cashPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const upiTotal = upiPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate total due (unpaid sales) with farm filter
    const allSales = await Sale.find(farmFilter);
    console.log('All sales for farm:', allSales.length);
    
    // Get all payments for this farm
    const allPayments = await Payment.find(farmFilter);
    console.log('All payments for farm:', allPayments.length);
    
    let totalDue = 0;
    
    allSales.forEach(sale => {
      // Find payments for this sale
      const salePayments = allPayments.filter(payment => payment.saleId && payment.saleId.toString() === sale._id.toString());
      const paidAmount = salePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const dueAmount = sale.totalAmount - paidAmount;
      console.log(`Sale ${sale._id}: Total=${sale.totalAmount}, Paid=${paidAmount}, Due=${dueAmount}`);
      if (dueAmount > 0) {
        totalDue += dueAmount;
      }
    });
    
    console.log('Total due calculated:', totalDue);
    
    // Calculate today's profit (sales - expenses) with farm filter
    const todaysExpensesQuery = {
      date: { $gte: todayUTC, $lt: tomorrowUTC },
      ...farmFilter
    };
    
    const todaysExpenses = await Expense.find(todaysExpensesQuery);
    console.log('Today\'s expenses count:', todaysExpenses.length);
    
    const todaysExpenseTotal = todaysExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const todaysProfit = todaysSalesTotal - todaysExpenseTotal;
    
    // Get 30-day profit trend with farm filter
    const dailyProfits = [];
    
    for (let i = 29; i >= 0; i--) { // Go from 29 days ago to today
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Convert to UTC
      const dateUTC = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const nextDateUTC = new Date(dateUTC);
      nextDateUTC.setDate(nextDateUTC.getDate() + 1);
      
      // Get sales for the day with farm filter
      const dailySalesQuery = {
        date: { $gte: dateUTC, $lt: nextDateUTC },
        ...farmFilter
      };
      
      const dailySales = await Sale.find(dailySalesQuery);
      
      const dailySalesTotal = dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      // Get expenses for the day with farm filter
      const dailyExpensesQuery = {
        date: { $gte: dateUTC, $lt: nextDateUTC },
        ...farmFilter
      };
      
      const dailyExpenses = await Expense.find(dailyExpensesQuery);
      
      const dailyExpenseTotal = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate profit
      const dailyProfit = dailySalesTotal - dailyExpenseTotal;
      
      dailyProfits.push({
        date: date.toISOString().split('T')[0],
        profit: dailyProfit
      });
    }
    
    // Get 7-day profit trend with farm filter
    const weeklyProfits = [];
    
    for (let i = 6; i >= 0; i--) { // Go from 6 days ago to today
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Convert to UTC
      const dateUTC = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const nextDateUTC = new Date(dateUTC);
      nextDateUTC.setDate(nextDateUTC.getDate() + 1);
      
      // Get sales for the day with farm filter
      const dailySalesQuery = {
        date: { $gte: dateUTC, $lt: nextDateUTC },
        ...farmFilter
      };
      
      const dailySales = await Sale.find(dailySalesQuery);
      
      const dailySalesTotal = dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      // Get expenses for the day with farm filter
      const dailyExpensesQuery = {
        date: { $gte: dateUTC, $lt: nextDateUTC },
        ...farmFilter
      };
      
      const dailyExpenses = await Expense.find(dailyExpensesQuery);
      
      const dailyExpenseTotal = dailyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate profit
      const dailyProfit = dailySalesTotal - dailyExpenseTotal;
      
      weeklyProfits.push({
        date: date.toISOString().split('T')[0],
        profit: dailyProfit
      });
    }
    
    // Calculate monthly data
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Convert to UTC
    const firstDayOfMonthUTC = new Date(firstDayOfMonth.getTime() - (firstDayOfMonth.getTimezoneOffset() * 60000));
    const firstDayOfNextMonthUTC = new Date(firstDayOfNextMonth.getTime() - (firstDayOfNextMonth.getTimezoneOffset() * 60000));
    
    console.log('Monthly date range (UTC):', firstDayOfMonthUTC, 'to', firstDayOfNextMonthUTC);
    
    // Monthly sales
    const monthlySalesQuery = {
      date: { $gte: firstDayOfMonthUTC, $lt: firstDayOfNextMonthUTC },
      ...farmFilter
    };
    
    const monthlySales = await Sale.find(monthlySalesQuery);
    console.log('Monthly sales count:', monthlySales.length);
    const monthlySalesTotal = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Monthly expenses
    const monthlyExpensesQuery = {
      date: { $gte: firstDayOfMonthUTC, $lt: firstDayOfNextMonthUTC },
      ...farmFilter
    };
    
    const monthlyExpenses = await Expense.find(monthlyExpensesQuery);
    console.log('Monthly expenses count:', monthlyExpenses.length);
    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Monthly profit
    const monthlyProfit = monthlySalesTotal - monthlyExpenseTotal;
    
    // Get upcoming vaccines with farm filter
    const upcomingVaccinesQuery = {
      scheduledDate: { $gte: new Date() },
      status: 'pending',
      ...farmFilter
    };
    
    const upcomingVaccines = await Vaccine.find(upcomingVaccinesQuery)
      .populate('batchId', 'name')
      .sort({ scheduledDate: 1 })
      .limit(5);
    
    // Prepare response
    const stats = {
      todaysSales: {
        count: todaysSales.length,
        total: todaysSalesTotal
      },
      todaysPayments: {
        cash: {
          count: cashPayments.length,
          total: cashTotal
        },
        upi: {
          count: upiPayments.length,
          total: upiTotal
        }
      },
      totalDue: totalDue,
      todaysProfit: todaysProfit,
      todaysExpenses: todaysExpenseTotal, // Add today's expenses to the response
      profitTrend: dailyProfits, // Already in correct order
      weeklyProfitTrend: weeklyProfits, // Add weekly profit trend
      upcomingVaccines: upcomingVaccines,
      monthlyData: {
        sales: monthlySalesTotal,
        expenses: monthlyExpenseTotal,
        profit: monthlyProfit
      }
    };
    
    console.log('Dashboard stats response:', stats);
    
    res.json(stats);
  } catch (err) {
    console.error('Error in getDashboardStats:', err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getDashboardStats
};