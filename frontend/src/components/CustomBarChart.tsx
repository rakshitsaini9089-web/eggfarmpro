'use client'

import React, { useState, useMemo } from 'react'

interface DataPoint {
  date: string
  desktop: number
  mobile: number
}

interface CustomBarChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

export function CustomBarChart({ 
  data, 
  title = "Bar Chart - Interactive", 
  description = "Showing total visitors for the last 3 months" 
}: CustomBarChartProps) {
  const [activeChart, setActiveChart] = useState<'desktop' | 'mobile'>('desktop')

  const total = useMemo(() => ({
    desktop: data.reduce((acc, curr) => acc + curr.desktop, 0),
    mobile: data.reduce((acc, curr) => acc + curr.mobile, 0),
  }), [data])

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No data available
          </div>
        </div>
      </div>
    )
  }

  // For bar chart, we'll show a subset of data points to avoid overcrowding
  const displayedData = data.slice(-30) // Show last 30 days

  return (
    <div className="card py-0">
      <div className="card-header">
        <div className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
          <div className="flex">
            {(['desktop', 'mobile'] as const).map((key) => {
              return (
                <button
                  key={key}
                  data-active={activeChart === key}
                  className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                  onClick={() => setActiveChart(key)}
                >
                  <span className="text-muted-foreground text-xs text-gray-500 dark:text-gray-400">
                    {key === 'desktop' ? 'Desktop' : 'Mobile'}
                  </span>
                  <span className="text-lg leading-none font-bold sm:text-3xl text-gray-900 dark:text-white">
                    {total[key].toLocaleString()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="card-body px-2 sm:p-6">
        <div className="h-64 sm:h-72 flex items-end space-x-1 overflow-x-auto pb-4 px-2">
          {displayedData.map((point, index) => {
            // Calculate max value for scaling
            const maxValue = Math.max(...displayedData.map(d => Math.max(d.desktop, d.mobile)), 1)
            // Ensure minimum height of 5% for visibility, and scale appropriately
            const value = point[activeChart]
            const barHeight = maxValue > 0 ? Math.max(5, (value / maxValue) * 85) : 5
            
            return (
              <div key={index} className="flex flex-col items-center flex-shrink-0 group" style={{ width: '20px' }}>
                <div className="relative w-full flex justify-center mb-1 sm:mb-2">
                  <div className="absolute bottom-full mb-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-800 text-white text-[10px] sm:text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                    {value.toLocaleString()}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                  </div>
                </div>
                <div 
                  className="w-full bg-gradient-to-t from-primary to-green-500 rounded-t-lg hover:from-green-700 hover:to-green-600 transition-all duration-500 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105"
                  style={{ height: `${barHeight}%` }}
                >
                  {/* Show value inside bar for high values */}
                  {barHeight > 20 && value > 0 && (
                    <div className="flex justify-center items-center h-full">
                      <span className="text-[8px] sm:text-xs text-white font-bold transform -rotate-90 origin-center whitespace-nowrap">
                        {value.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[8px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 transform -rotate-45 origin-center whitespace-nowrap font-medium">
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          Hover over bars to see exact values
        </div>
      </div>
    </div>
  )
}