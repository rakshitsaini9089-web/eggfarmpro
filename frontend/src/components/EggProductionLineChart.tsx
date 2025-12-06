'use client'

import { useState } from "react"

interface DataPoint {
  date: string
  value: number
}

interface EggProductionLineChartProps {
  data: DataPoint[]
  title?: string
  description?: string
}

export function EggProductionLineChart({ 
  data, 
  title = "Egg Production Trends", 
  description = "Monthly egg production overview" 
}: EggProductionLineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{index: number, x: number, y: number} | null>(null)

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
  const width = 400
  const height = 250
  const padding = 40
  
  // Find min and max values for scaling
  const values = data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1 // Avoid division by zero
  
  // Calculate points for the line
  const points = data.map((point, index) => {
    const x = padding + (index * (width - 2 * padding) / (data.length - 1))
    const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding)
    return { x, y, ...point }
  })

  // Create path for the line
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      
      <div className="relative">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1={padding}
              y1={padding + i * (height - 2 * padding) / 4}
              x2={width - padding}
              y2={padding + i * (height - 2 * padding) / 4}
              stroke="rgb(209 213 219)"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              className="dark:stroke-gray-600"
            />
          ))}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = maxValue - i * (valueRange / 4)
            return (
              <text
                key={i}
                x={padding - 10}
                y={padding + i * (height - 2 * padding) / 4 + 4}
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                {Math.round(value)}
              </text>
            )
          })}
          
          {/* X-axis labels */}
          {points.map((point, index) => {
            // Show only some labels to avoid crowding
            if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
              return (
                <text
                  key={index}
                  x={point.x}
                  y={height - padding + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short' })}
                </text>
              )
            }
            return null
          })}
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#4CAF50"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#4CAF50"
                stroke="white"
                strokeWidth="2"
                onMouseEnter={(e) => setHoveredPoint({index, x: point.x, y: point.y})}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              />
              {hoveredPoint?.index === index && (
                <g>
                  {/* Tooltip */}
                  <rect
                    x={point.x - 30}
                    y={point.y - 40}
                    width="60"
                    height="30"
                    rx="4"
                    fill="white"
                    stroke="#4CAF50"
                    strokeWidth="1"
                    className="dark:fill-gray-800"
                  />
                  <text
                    x={point.x}
                    y={point.y - 25}
                    textAnchor="middle"
                    className="text-xs fill-gray-800 dark:fill-white font-medium"
                  >
                    {point.value}
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-500 dark:fill-gray-400"
                  >
                    {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              )}
            </g>
          ))}
          
          {/* Axes */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="rgb(156 163 175)"
            strokeWidth="1"
            className="dark:stroke-gray-500"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgb(156 163 175)"
            strokeWidth="1"
            className="dark:stroke-gray-500"
          />
        </svg>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Hover over points to see exact values
      </div>
    </div>
  )
}