'use client'

import { useState, useMemo } from "react"

interface DataPoint {
  date: string
  desktop: number
  mobile: number
}

interface ChartConfig {
  views: {
    label: string
  }
  desktop: {
    label: string
    color: string
  }
  mobile: {
    label: string
    color: string
  }
}

interface InteractiveBarChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

export function InteractiveBarChart({ 
  data, 
  title = "Bar Chart - Interactive", 
  description = "Showing total visitors for the last 3 months" 
}: InteractiveBarChartProps) {
  const [activeChart, setActiveChart] = useState<'desktop' | 'mobile'>('desktop')

  const chartConfig: ChartConfig = {
    views: {
      label: "Page Views",
    },
    desktop: {
      label: "Desktop",
      color: "#4CAF50", // Green color to match your theme
    },
    mobile: {
      label: "Mobile",
      color: "#2196F3", // Blue color
    },
  }

  const total = useMemo(() => ({
    desktop: data.reduce((acc, curr) => acc + curr.desktop, 0),
    mobile: data.reduce((acc, curr) => acc + curr.mobile, 0),
  }), [data])

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    )
  }

  // Calculate chart dimensions and scales
  const width = 600
  const height = 250
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }
  
  // For bar chart, we'll show a subset of data points to avoid overcrowding
  const displayedData = data.slice(-30) // Show last 30 days
  
  // Find max value for scaling
  const maxValue = Math.max(
    ...displayedData.map(d => Math.max(d.desktop, d.mobile))
  )
  
  // Calculate bar dimensions
  const barWidth = Math.max(2, (width - padding.left - padding.right) / displayedData.length - 2)
  const chartHeight = height - padding.top - padding.bottom

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header with title and interactive buttons */}
      <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex border-t border-gray-200 dark:border-gray-700 sm:border-t-0">
          {(['desktop', 'mobile'] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="data-[active=true]:bg-gray-100 dark:data-[active=true]:bg-gray-700 relative z-30 flex flex-1 flex-col justify-center gap-1 border-l border-gray-200 dark:border-gray-700 px-6 py-4 text-left sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
              style={{ borderLeftWidth: key === 'desktop' ? '0' : '1px' }}
            >
              <span className="text-muted-foreground text-xs text-gray-500 dark:text-gray-400">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl text-gray-900 dark:text-white">
                {total[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart area */}
      <div className="p-2 sm:p-6">
        <div className="overflow-x-auto">
          <svg 
            width="100%" 
            height={height} 
            viewBox={`0 0 ${width} ${height}`}
            className="min-w-[500px]"
          >
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => {
              const y = padding.top + i * (chartHeight / 4)
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="rgb(209 213 219)"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                    className="dark:stroke-gray-600"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500 dark:fill-gray-400"
                  >
                    {Math.round(maxValue - i * (maxValue / 4))}
                  </text>
                </g>
              )
            })}
            
            {/* Bars */}
            {displayedData.map((point, index) => {
              const x = padding.left + index * (barWidth + 2) + 1
              const value = point[activeChart]
              const barHeight = chartHeight * (value / maxValue)
              const y = height - padding.bottom - barHeight
              
              // Format date for x-axis
              const date = new Date(point.date)
              const isLabelVisible = index % Math.ceil(displayedData.length / 8) === 0 || index === displayedData.length - 1
              
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={chartConfig[activeChart].color}
                    className="hover:opacity-80 transition-opacity"
                  />
                  {isLabelVisible && (
                    <text
                      x={x + barWidth / 2}
                      y={height - padding.bottom + 15}
                      textAnchor="middle"
                      className="text-xs fill-gray-500 dark:fill-gray-400"
                    >
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </text>
                  )}
                </g>
              )
            })}
            
            {/* Axes */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="rgb(156 163 175)"
              strokeWidth="1"
              className="dark:stroke-gray-500"
            />
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="rgb(156 163 175)"
              strokeWidth="1"
              className="dark:stroke-gray-500"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}