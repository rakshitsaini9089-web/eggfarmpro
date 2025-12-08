
'use client';

import { useState, useEffect } from 'react';
import { dashboardAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AiInsight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export function AiInsightsCard() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchAiInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch insights from the dashboard stats endpoint which now includes AI insights
      const data = await dashboardAPI.getStats();
      
      // Use the AI insights from the dashboard stats
      const aiInsights = data.aiInsights || {};
      
      // Transform the data to match our insights format
      const transformedInsights: AiInsight[] = [
        {
          id: '1',
          title: 'Health Alert',
          description: aiInsights.healthAlert || 'No health alerts at this time',
          priority: 'high',
          action: 'Check Health Records'
        },
        {
          id: '2',
          title: 'Financial Insight',
          description: aiInsights.financialInsight || 'Your financials are stable',
          priority: 'medium'
        },
        {
          id: '3',
          title: 'Production Tip',
          description: aiInsights.productionTip || 'Continue with current practices',
          priority: 'medium'
        },
        {
          id: '4',
          title: 'Market Opportunity',
          description: aiInsights.marketOpportunity || 'Monitor local market prices',
          priority: 'low'
        }
      ];
      
      setInsights(transformedInsights);
    } catch (err) {
      setError('Failed to load AI insights. Please try again.');
      console.error('Insights fetch error:', err);
      // Fallback to mock data if API fails
      setInsights([
        {
          id: '1',
          title: 'High Mortality Alert',
          description: 'Mortality rate increased by 15% compared to last week. Check for disease outbreak.',
          priority: 'high',
          action: 'View Mortality Records'
        },
        {
          id: '2',
          title: 'Feed Optimization',
          description: 'Based on current consumption patterns, switching to Feed Type B could reduce costs by 8%.',
          priority: 'medium',
          action: 'Explore Feed Options'
        },
        {
          id: '3',
          title: 'Market Opportunity',
          description: 'Local market rates are 12% higher than your current pricing. Consider adjusting rates.',
          priority: 'medium'
        },
        {
          id: '4',
          title: 'Vaccination Reminder',
          description: 'Batch #E2024-001 is due for Newcastle vaccine in 3 days.',
          priority: 'high',
          action: 'Schedule Vaccination'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiInsights();
  }, []);

  const handleRefreshInsights = async () => {
    await fetchAiInsights();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center">
          <h2 className="card-title">AI Insights & Recommendations</h2>
          {/* Refresh button removed as per user request */}
        </div>
      </div>
      <div className="card-body">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow dark:bg-gray-700/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{insight.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(insight.priority)}`}>
                      {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {insight.description}
                  </p>
                </div>
              </div>
              {insight.action && (
                <div className="mt-3">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      // Navigate to appropriate page based on action
                      if (insight.action === 'Check Health Records') {
                        router.push('/vaccination');
                      } else if (insight.action === 'View Mortality Records') {
                        router.push('/mortality');
                      } else if (insight.action === 'Explore Feed Options') {
                        router.push('/feed-consumption');
                      } else if (insight.action === 'Schedule Vaccination') {
                        router.push('/vaccination');
                      } else {
                        // Default action - could be customized further
                        console.log('Action clicked:', insight.action);
                      }
                    }}
                  >
                    {insight.action}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
