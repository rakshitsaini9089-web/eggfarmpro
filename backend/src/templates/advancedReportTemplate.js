// Advanced Enterprise Dashboard Report Template for Eggmind AI
const generateAdvancedReportHTML = (reportData) => {
  const {
    farmName,
    date,
    reportId,
    eggsCollected,
    mortality,
    efficiencyScore,
    todaysRevenue,
    weeklyRevenue,
    monthlySales,
    lastMonthSales,
    productivityIndex,
    fcr,
    healthStabilityScore,
    salesPerformanceRating,
    dailySalesData,
    feedConsumptionData,
    aiInsights,
    farmId
  } = reportData;

  // Determine trend indicator
  const monthlyTrend = monthlySales > lastMonthSales ? '▲' : '▼';
  const trendColor = monthlySales > lastMonthSales ? '#4ade80' : '#f87171';

  // Calculate averages for KPIs
  const avgProductivity = productivityIndex || 0;
  const avgFCR = fcr || 0;
  const avgHealth = healthStabilityScore || 0;
  const avgSales = salesPerformanceRating || 0;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eggmind AI Smart Performance Report</title>
    <style>
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: #2B2B2B;
            line-height: 1.5;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
        }
        
        /* Full A4 background with diagonal gradient and vignette */
        .page-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            background: linear-gradient(135deg, #F7F4EF 0%, #E6DDD1 100%);
            z-index: -2;
        }
        
        /* Vignette effect */
        .vignette {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            box-shadow: inset 0 0 100px 50px rgba(0, 0, 0, 0.1);
            z-index: -1;
            pointer-events: none;
        }
        
        /* Main Content */
        .report-container {
            width: 100%;
            min-height: 297mm;
            padding: 0;
            margin: 0;
        }
        
        /* Modern Header Section */
        .header-section {
            width: 100%;
            padding: 30px 40px;
            background: #ffffffaa;
            backdrop-filter: blur(10px);
            border-radius: 18px;
            margin: 40px 30px 30px 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-text {
            flex: 1;
            text-align: center;
        }
        
        .header-title {
            font-size: 34px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2B2B2B;
        }
        
        .header-subtitle {
            font-size: 18px;
            font-weight: 500;
            color: #6B645B;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
        }
        
        /* Section Layout (Cards) */
        .section {
            margin: 30px;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2B2B2B;
        }
        
        /* Cards Grid */
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .card {
            background: #ffffffdd;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(5px);
        }
        
        .card-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2B2B2B;
        }
        
        .card-list {
            list-style: none;
        }
        
        .card-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #E8DFD5;
        }
        
        .card-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        
        .item-label {
            font-size: 15px;
            color: #6B645B;
        }
        
        .item-value {
            font-size: 16px;
            font-weight: 500;
            color: #2B2B2B;
        }
        
        .trend-indicator {
            font-weight: 600;
            color: ${trendColor};
        }
        
        /* Graph Placeholders */
        .graph-placeholder {
            background: linear-gradient(135deg, #ffffffaa, #f8f6f2);
            border-radius: 20px;
            height: 140px;
            margin: 20px 30px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.7);
            position: relative;
            overflow: hidden;
        }
        
        .graph-title {
            font-size: 20px;
            font-weight: 600;
            margin: 30px 30px 15px 30px;
            color: #2B2B2B;
        }
        
        /* Footer */
        .report-footer {
            text-align: center;
            padding: 30px;
            color: #8B8479;
            font-size: 14px;
            margin-top: 30px;
        }
        
        /* Responsive adjustments for print */
        @media print {
            body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
            }
            
            .page-background, .vignette {
                position: fixed;
            }
            
            .card, .graph-placeholder {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <!-- Full A4 background with diagonal gradient -->
    <div class="page-background"></div>
    <div class="vignette"></div>
    
    <!-- Main Report Content -->
    <div class="report-container">
        <!-- Modern Header Section -->
        <div class="header-section">
            <div class="header-content">
                <div class="header-text">
                    <h1 class="header-title">Eggmind AI Smart Performance Report</h1>
                    <p class="header-subtitle">Intelligent Insights Generated by Eggmind AI System</p>
                </div>
                <img src="/logo/MindAilogo.png" alt="Eggmind AI Logo" class="logo">
            </div>
        </div>
        
        <!-- Section Layout (Cards) -->
        <div class="section">
            <div class="cards-grid">
                <!-- Today's Summary Card -->
                <div class="card">
                    <h2 class="card-title">Today's Summary</h2>
                    <ul class="card-list">
                        <li class="card-item">
                            <span class="item-label">Eggs Collected</span>
                            <span class="item-value">${eggsCollected || 0}</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Mortality</span>
                            <span class="item-value">${mortality || 0}</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Efficiency Score</span>
                            <span class="item-value">${efficiencyScore || 0}%</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Today's Revenue</span>
                            <span class="item-value">₹${todaysRevenue || 0}</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Production Insights Card -->
                <div class="card">
                    <h2 class="card-title">Production Insights</h2>
                    <ul class="card-list">
                        <li class="card-item">
                            <span class="item-label">Productivity Index</span>
                            <span class="item-value">${avgProductivity}/100</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Feed Conversion Ratio</span>
                            <span class="item-value">${avgFCR.toFixed(2)}</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Health Stability</span>
                            <span class="item-value">${avgHealth}/100</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Weekly Production</span>
                            <span class="item-value">${weeklyRevenue || 0} units</span>
                        </li>
                    </ul>
                </div>
                
                <!-- Financial Overview Card -->
                <div class="card">
                    <h2 class="card-title">Financial Overview</h2>
                    <ul class="card-list">
                        <li class="card-item">
                            <span class="item-label">Sales Performance</span>
                            <span class="item-value">${avgSales}/100</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Monthly Sales</span>
                            <span class="item-value">₹${monthlySales || 0}</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Previous Month</span>
                            <span class="item-value">₹${lastMonthSales || 0}</span>
                        </li>
                        <li class="card-item">
                            <span class="item-label">Trend Indicator</span>
                            <span class="trend-indicator">${monthlyTrend} ${Math.abs(((monthlySales || 0) - (lastMonthSales || 0)) / (lastMonthSales || 1) * 100).toFixed(1)}%</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        
        <!-- Graph Placeholders -->
        <h2 class="graph-title">Production Trend</h2>
        <div class="graph-placeholder"></div>
        
        <h2 class="graph-title">Expense Trend</h2>
        <div class="graph-placeholder"></div>
        
        <!-- Footer -->
        <div class="report-footer">
            Report generated automatically by Eggmind AI
        </div>
    </div>
</body>
</html>
`;
};

module.exports = { generateAdvancedReportHTML };