'use client'

import { CustomLineChart } from './CustomLineChart'

// Sample data - you would replace this with actual data from your API
const sampleData = [
  { date: "2024-04-01", value: 186 },
  { date: "2024-04-02", value: 305 },
  { date: "2024-04-03", value: 237 },
  { date: "2024-04-04", value: 73 },
  { date: "2024-04-05", value: 209 },
  { date: "2024-04-06", value: 214 },
  { date: "2024-04-07", value: 409 },
  { date: "2024-04-08", value: 59 },
  { date: "2024-04-09", value: 261 },
  { date: "2024-04-10", value: 327 },
  { date: "2024-04-11", value: 292 },
  { date: "2024-04-12", value: 342 },
  { date: "2024-04-13", value: 137 },
  { date: "2024-04-14", value: 120 },
  { date: "2024-04-15", value: 138 },
  { date: "2024-04-16", value: 446 },
  { date: "2024-04-17", value: 364 },
  { date: "2024-04-18", value: 243 },
  { date: "2024-04-19", value: 89 },
  { date: "2024-04-20", value: 137 },
  { date: "2024-04-21", value: 224 },
  { date: "2024-04-22", value: 138 },
  { date: "2024-04-23", value: 387 },
  { date: "2024-04-24", value: 215 },
  { date: "2024-04-25", value: 75 },
  { date: "2024-04-26", value: 383 },
  { date: "2024-04-27", value: 122 },
  { date: "2024-04-28", value: 315 },
  { date: "2024-04-29", value: 454 },
  { date: "2024-04-30", value: 165 },
]

export function CustomLineChartExample() {
  return (
    <div className="space-y-6">
      <CustomLineChart 
        data={sampleData}
        title="Sales Performance"
        description="Daily sales trends (last 30 days)"
      />
    </div>
  )
}