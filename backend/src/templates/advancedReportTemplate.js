// Premium PDF Report Template for Eggmind AI
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
  const trendColor = monthlySales > lastMonthSales ? '#18A558' : '#0B5C2C';

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
    <title>Eggmind AI Report - ${farmName || 'Farm'} Report</title>
    <style>
        /* Base styles for A4 size formatting */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Roboto', system-ui, sans-serif;
            color: #000000;
            line-height: 1.6;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
        }
        
        /* Main Content Container */
        .report-container {
            width: 100%;
            min-height: 297mm;
            padding: 0;
            margin: 0;
            position: relative;
        }
        
        /* Premium Header Section with Professional Styling */
        .header-section {
            text-align: center;
            padding: 30px 20px;
            margin-bottom: 20px;
            background-color: #FFFFFF;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin: 0 auto 20px;
        }
        
        .header-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #0B5C2C;
        }
        
        .header-subtitle {
            font-size: 16px;
            color: #666666;
            margin-bottom: 15px;
        }
        
        .report-meta {
            font-size: 14px;
            color: #333333;
            margin-bottom: 20px;
        }
        
        .divider {
            height: 2px;
            background-color: #18A558;
            width: 100px;
            margin: 0 auto 30px;
        }
        
        /* Section Layout with Proper Spacing */
        .section {
            padding: 25px 30px;
            margin-bottom: 30px;
            background-color: #FFFFFF;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            page-break-inside: avoid;
        }
        
        .section:first-child {
            margin-top: 0;
        }
        
        .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #0B5C2C;
            border-bottom: 2px solid #18A558;
            padding-bottom: 10px;
        }
        
        .section-divider {
            height: 1px;
            background-color: #E0E0E0;
            margin: 15px 0 20px 0;
        }
        
        .section-content {
            font-size: 14px;
            line-height: 1.6;
        }
        
        /* Data Sections with Professional Spacing */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background-color: #F8F8F8;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #0B5C2C;
            margin: 10px 0;
        }
        
        .metric-label {
            font-size: 14px;
            color: #666666;
        }
        
        /* Table Styles with Enhanced Design */
        .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 15px 0 25px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .data-table th {
            background-color: #0B5C2C;
            color: #FFFFFF;
            text-align: left;
            padding: 14px 16px;
            font-weight: 600;
        }
        
        .data-table td {
            padding: 14px 16px;
            border-bottom: 1px solid #EEEEEE;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #F8F8F8;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .data-table tr:hover {
            background-color: #F0F0F0;
        }
        
        /* Card Blocks for AI Insights with Premium Styling */
        .insight-card {
            background-color: #F3FFF6;
            border-left: 4px solid #18A558;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            page-break-inside: avoid;
        }
        
        .insight-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #0B5C2C;
        }
        
        .insight-content {
            font-size: 14px;
            line-height: 1.7;
            color: #333333;
        }
        
        /* Footer with Timestamp */
        .report-footer {
            text-align: right;
            padding: 25px 30px;
            color: #666666;
            font-size: 12px;
            border-top: 1px solid #E0E0E0;
            margin-top: 30px;
            position: absolute;
            bottom: 0;
            width: 100%;
        }
        
        .footer-divider {
            height: 1px;
            background-color: #E0E0E0;
            margin-bottom: 15px;
        }
        
        /* Lists with Enhanced Styling */
        .section-content ul, 
        .section-content ol {
            margin: 15px 0;
            padding-left: 25px;
        }
        
        .section-content li {
            margin: 10px 0;
            padding-left: 10px;
        }
        
        .section-content ul li {
            list-style-type: disc;
        }
        
        .section-content ol li {
            list-style-type: decimal;
        }
        
        /* Trend Indicators */
        .trend-positive {
            color: #18A558;
            font-weight: bold;
        }
        
        .trend-negative {
            color: #0B5C2C;
            font-weight: bold;
        }
        
        /* Responsive adjustments for print */
        @media print {
            body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
            }
            
            .section {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .data-table {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .data-table tr {
                break-inside: avoid;
                page-break-inside: avoid;
            }
            
            .data-table thead {
                display: table-header-group;
            }
            
            .data-table tfoot {
                display: table-footer-group;
            }
            
            .insight-card {
                break-inside: avoid;
                page-break-inside: avoid;
            }
        }
        
        /* Page Breaks for Better Organization */
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <!-- Main Report Content -->
    <div class="report-container">
        <!-- Premium Header Section -->
        <div class="header-section">
            <h1 class="header-title">Eggmind AI Report</h1>
            <div class="header-subtitle">${farmName || 'Farm Management Report'}</div>
            <div class="report-meta">
                Generated on: ${new Date().toLocaleString()} | 
                Report ID: ${reportId || 'N/A'} | 
                Farm ID: ${farmId || 'N/A'}
            </div>
            <div class="divider"></div>
        </div>
        
        <!-- Executive Summary Section -->
        <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="section-divider"></div>
            <div class="section-content">
                <p>This comprehensive report provides key performance metrics, financial data, and AI-generated insights for optimal farm management decisions.</p>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Eggs Collected</div>
                        <div class="metric-value">${eggsCollected || 0}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Today's Revenue</div>
                        <div class="metric-value">₹${todaysRevenue || 0}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Efficiency Score</div>
                        <div class="metric-value">${efficiencyScore || 0}%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Mortality Rate</div>
                        <div class="metric-value">${mortality || 0}</div>
                    </div>
                </div>
                
                <div class="insight-card">
                    <div class="insight-title">Key Insight</div>
                    <div class="insight-content">
                        <p>${aiInsights || 'Current operational metrics indicate stable performance. Continue monitoring key indicators for optimal results.'}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Performance Metrics Section -->
        <div class="section">
            <h2 class="section-title">Performance Metrics</h2>
            <div class="section-divider"></div>
            <div class="section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Current Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Productivity Index</td>
                            <td>${avgProductivity}/100</td>
                            <td>${avgProductivity >= 80 ? 'Excellent' : avgProductivity >= 60 ? 'Good' : 'Needs Attention'}</td>
                        </tr>
                        <tr>
                            <td>Feed Conversion Ratio</td>
                            <td>${avgFCR.toFixed(2)}</td>
                            <td>${avgFCR <= 2.0 ? 'Optimal' : avgFCR <= 2.5 ? 'Acceptable' : 'Requires Optimization'}</td>
                        </tr>
                        <tr>
                            <td>Health Stability</td>
                            <td>${avgHealth}/100</td>
                            <td>${avgHealth >= 90 ? 'Excellent' : avgHealth >= 75 ? 'Good' : 'Monitor Closely'}</td>
                        </tr>
                        <tr>
                            <td>Sales Performance</td>
                            <td>${avgSales}/100</td>
                            <td>${avgSales >= 85 ? 'Strong' : avgSales >= 70 ? 'Steady' : 'Opportunity for Growth'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Financial Overview Section -->
        <div class="section">
            <h2 class="section-title">Financial Overview</h2>
            <div class="section-divider"></div>
            <div class="section-content">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Weekly Revenue</div>
                        <div class="metric-value">₹${weeklyRevenue || 0}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Monthly Sales</div>
                        <div class="metric-value">₹${monthlySales || 0}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Previous Month</div>
                        <div class="metric-value">₹${lastMonthSales || 0}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Trend</div>
                        <div class="metric-value">
                            <span class="${monthlyTrend === '▲' ? 'trend-positive' : 'trend-negative'}">
                                ${monthlyTrend} ${Math.abs(((monthlySales || 0) - (lastMonthSales || 0)) / (lastMonthSales || 1) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
                
                <h3>Detailed Sales Data</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(dailySalesData || []).map(sale => `
                        <tr>
                            <td>${sale.date || ''}</td>
                            <td>${sale.customer || ''}</td>
                            <td>${sale.quantity || 0}</td>
                            <td>₹${sale.unitPrice || 0}</td>
                            <td>₹${sale.total || 0}</td>
                        </tr>
                        `).join('')}
                        ${(dailySalesData || []).length === 0 ? `
                        <tr>
                            <td colspan="5" style="text-align: center; color: #666666;">No sales data available</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Operational Data Section -->
        <div class="section">
            <h2 class="section-title">Operational Data</h2>
            <div class="section-divider"></div>
            <div class="section-content">
                <h3>Feed Consumption</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Batch</th>
                            <th>Feed Type</th>
                            <th>Quantity</th>
                            <th>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(feedConsumptionData || []).map(feed => `
                        <tr>
                            <td>${feed.date || ''}</td>
                            <td>${feed.batch || ''}</td>
                            <td>${feed.feedType || ''}</td>
                            <td>${feed.quantity || 0}</td>
                            <td>₹${feed.cost || 0}</td>
                        </tr>
                        `).join('')}
                        ${(feedConsumptionData || []).length === 0 ? `
                        <tr>
                            <td colspan="5" style="text-align: center; color: #666666;">No feed consumption data available</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- AI Recommendations Section -->
        <div class="section">
            <h2 class="section-title">AI Recommendations</h2>
            <div class="section-divider"></div>
            <div class="section-content">
                <div class="insight-card">
                    <div class="insight-title">Actionable Insights</div>
                    <div class="insight-content">
                        <p>${aiInsights || 'Based on current data patterns, maintain current operational procedures while monitoring key performance indicators for optimization opportunities.'}</p>
                    </div>
                </div>
                
                <h3>Optimization Strategies</h3>
                <ol>
                    <li><strong>Production Efficiency:</strong> Maintain consistent feeding schedules to optimize egg production rates</li>
                    <li><strong>Health Monitoring:</strong> Implement regular health checks to prevent disease outbreaks and maintain flock stability</li>
                    <li><strong>Financial Performance:</strong> Analyze sales trends to adjust pricing strategies and maximize revenue</li>
                    <li><strong>Cost Management:</strong> Review expense patterns to identify cost-saving opportunities without compromising quality</li>
                    <li><strong>Data-Driven Decisions:</strong> Leverage AI insights for predictive analytics and proactive farm management</li>
                </ol>
                
                <div class="insight-card">
                    <div class="insight-title">Next Steps</div>
                    <div class="insight-content">
                        <ul>
                            <li>Review this report weekly to track performance trends</li>
                            <li>Implement recommended optimization strategies</li>
                            <li>Monitor key metrics for continuous improvement</li>
                            <li>Consult with agricultural specialists for complex issues</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="report-footer">
            <div class="footer-divider"></div>
            <p>Generated by Eggmind AI on: ${new Date().toLocaleString()}</p>
            <p>Confidential - For Internal Use Only</p>
        </div>
    </div>
</body>
</html>
`;
};

module.exports = { generateAdvancedReportHTML };