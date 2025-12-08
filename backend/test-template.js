const { generateAdvancedReportHTML } = require('./src/templates/advancedReportTemplate');

const sampleData = {
  farmName: 'Test Farm',
  date: '2025-12-08',
  reportId: 'TEST-001',
  eggsCollected: 1200,
  mortality: 5,
  efficiencyScore: 95.5,
  todaysRevenue: 6500,
  weeklyRevenue: 45000,
  monthlySales: 200000,
  lastMonthSales: 180000,
  productivityIndex: 85,
  fcr: 1.8,
  healthStabilityScore: 92,
  salesPerformanceRating: 88,
  dailySalesData: [
    { date: '2025-12-08', customer: 'Local Market', quantity: 1200, unitPrice: 5.5, total: 6600 }
  ],
  feedConsumptionData: [
    { date: '2025-12-08', batch: 'Batch A', feedType: 'Layer Mash', quantity: 150, cost: 4500 }
  ],
  aiInsights: 'Your farm is performing well above average. Egg production is consistent and mortality rates are low.',
  farmId: 'FS-2025-001'
};

const html = generateAdvancedReportHTML(sampleData);

// Save to a file for inspection
const fs = require('fs');
fs.writeFileSync('test-report.html', html);
console.log('Test report generated successfully!');