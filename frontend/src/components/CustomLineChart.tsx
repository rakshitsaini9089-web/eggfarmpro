'use client'

import React from 'react'

interface DataPoint {
  date: string
  value: number
}

interface CustomLineChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

export function CustomLineChart({ 
  data, 
  title = "Line Chart", 
  description = "Showing trends over time" 
}: CustomLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
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

  // For line chart, we'll show a subset of data points to avoid overcrowding
  const displayedData = data.slice(-30) // Show last 30 days

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="h-64 sm:h-72 relative">
          <svg className="w-full h-full" viewBox="0 0 420 220">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgb(var(--gray-200))" strokeWidth="0.5" opacity="0.7" />
              </pattern>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feFlood floodColor="rgba(var(--gray-900), 0.3)"/>
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* X and Y axis */}
            <line x1="50" y1="20" x2="50" y2="190" stroke="rgb(var(--gray-400))" strokeWidth="2" />
            <line x1="50" y1="190" x2="400" y2="190" stroke="rgb(var(--gray-400))" strokeWidth="2" />
            
            {/* Y-axis labels */}
            <text x="45" y="195" textAnchor="end" className="text-xs fill-gray-500 dark:fill-gray-400 font-medium">0</text>
            
            {/* Line chart */}
            {displayedData.length > 0 && (
              <>
                {(() => {
                  const maxProfit = Math.max(...displayedData.map(d => d.value), 1)
                  const minProfit = Math.min(...displayedData.map(d => d.value), 0)
                  const profitRange = maxProfit - minProfit || 1
                  
                  // Create area path for gradient fill
                  let areaPath = ''
                  let linePath = ''
                  
                  displayedData.forEach((point, index) => {
                    const x = 50 + (index * (350 / (displayedData.length - 1)))
                    const y = 190 - ((point.value - minProfit) / profitRange) * 170
                    
                    if (index === 0) {
                      areaPath = `M ${x} 190 L ${x} ${y}`
                      linePath = `M ${x} ${y}`
                    } else {
                      const prevX = 50 + ((index - 1) * (350 / (displayedData.length - 1)))
                      const prevY = 190 - ((displayedData[index - 1].value - minProfit) / profitRange) * 170
                      
                      // Smooth curve using quadratic bezier
                      const cx = (prevX + x) / 2
                      areaPath += ` Q ${cx} ${prevY} ${x} ${y}`
                      linePath += ` Q ${cx} ${prevY} ${x} ${y}`
                    }
                    
                    if (index === displayedData.length - 1) {
                      areaPath += ` L ${x} 190 Z`
                    }
                  })
                  
                  return (
                    <>
                      {/* Area fill with gradient */}
                      <defs>
                        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#areaGradient)" />
                      
                      {/* Line with shadow */}
                      <path 
                        d={linePath} 
                        stroke="rgb(var(--primary))"
                        strokeWidth="4" 
                        fill="none" 
                        filter="url(#shadow)"
                        className="drop-shadow-lg"
                      />
                      
                      {/* Data points */}
                      {displayedData.map((point, index) => {
                        const x = 50 + (index * (350 / (displayedData.length - 1)))
                        const y = 190 - ((point.value - minProfit) / profitRange) * 170
                        
                        // Adjust tooltip position to stay within SVG bounds
                        const tooltipX = x
                        const tooltipY = y - 30
                        
                        return (
                          <g key={index} className="cursor-pointer">
                            {/* Hover area for tooltip */}
                            <circle cx={x} cy={y} r="15" fill="transparent" />
                            
                            {/* Data point circle */}
                            <circle 
                              cx={x} 
                              cy={y} 
                              r="6" 
                              fill="rgb(var(--primary))"
                              stroke="white" 
                              strokeWidth="3"
                              className="transition-all duration-300 hover:r-8"
                            />
                            
                            {/* Tooltip */}
                            <g className="opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              {/* Tooltip background */}
                              <rect 
                                x={tooltipX - 40} 
                                y={tooltipY - 35} 
                                width="80" 
                                height="36" 
                                rx="6" 
                                fill="rgb(var(--gray-800))"
                                stroke="rgb(var(--gray-300))"
                                strokeWidth="0.5"
                              />
                              
                              {/* Tooltip content */}
                              <text 
                                x={tooltipX} 
                                y={tooltipY - 18} 
                                textAnchor="middle" 
                                className="text-xs fill-white font-bold"
                              >
                                {point.value.toLocaleString()}
                              </text>
                              <text 
                                x={tooltipX} 
                                y={tooltipY - 6} 
                                textAnchor="middle" 
                                className="text-xs fill-gray-300"
                              >
                                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </text>
                            </g>
                          </g>
                        )
                      })}
                    </>
                  )
                })()}
                
                {/* X-axis labels */}
                {displayedData.map((point, index) => {
                  const x = 50 + (index * (350 / (displayedData.length - 1)))
                  return (
                    <g key={index}>
                      <line x1={x} y1="190" x2={x} y2="195" stroke="rgb(var(--gray-400))" strokeWidth="1" />
                      <text 
                        x={x} 
                        y="210" 
                        textAnchor="middle" 
                        className="text-xs fill-gray-500 dark:fill-gray-400 font-medium"
                      >
                        {new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </text>
                      <text 
                        x={x} 
                        y="225" 
                        textAnchor="middle" 
                        className="text-xs fill-gray-400 dark:fill-gray-500"
                      >
                        {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </text>
                    </g>
                  )
                })}
              </>
            )}
            
            {/* No data message */}
            {displayedData.length === 0 && (
              <text 
                x="200" 
                y="100" 
                textAnchor="middle" 
                className="text-sm fill-gray-500 dark:fill-gray-400"
              >
                No data available
              </text>
            )}
          </svg>
        </div>
      </div>
    </div>
  )
}