'use client'

import { EggProductionLineChart } from './EggProductionLineChart'

// Sample data - you would replace this with actual data from your API
const sampleData = [
  { date: '2024-01-01', value: 18600 },
  { date: '2024-02-01', value: 30500 },
  { date: '2024-03-01', value: 23700 },
  { date: '2024-04-01', value: 7300 },
  { date: '2024-05-01', value: 20900 },
  { date: '2024-06-01', value: 21400 },
]

export function EggProductionLineChartExample() {
  return (
    <div className="space-y-6">
      <EggProductionLineChart 
        data={sampleData}
        title="Monthly Egg Production"
        description="Eggs produced per month (last 6 months)"
      />
      
      {/* You can also use it with different data and titles */}
      <EggProductionLineChart 
        data={[
          { date: '2024-01-01', value: 1200 },
          { date: '2024-02-01', value: 1500 },
          { date: '2024-03-01', value: 1800 },
          { date: '2024-04-01', value: 1600 },
          { date: '2024-05-01', value: 2100 },
          { date: '2024-06-01', value: 2300 },
        ]}
        title="Average Daily Production"
        description="Daily average eggs produced per hen"
      />
    </div>
  )
}