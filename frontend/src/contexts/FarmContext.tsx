'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { farmAPI } from '../lib/api';
import { useAuth } from './AuthContext';

interface Farm {
  _id: string;
  name: string;
  location: string;
  owner: string;
  businessType?: 'sole_proprietorship' | 'partnership' | 'corporation' | 'llc';
  numberOfPartners?: number;
  partnerDetails?: Array<{
    name: string;
    percentage: number;
  }>;
  contact: {
    phone: string;
    email?: string;
  };
  size?: number;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FarmContextType {
  farms: Farm[];
  selectedFarm: Farm | null;
  setSelectedFarm: (farm: Farm | null) => void;
  loading: boolean;
  error: string | null;
  refreshFarms: () => Promise<void>;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarmState] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, token } = useAuth();

  // Wrapper function to handle localStorage persistence
  const setSelectedFarm = (farm: Farm | null) => {
    setSelectedFarmState(farm);
    if (typeof window !== 'undefined') {
      if (farm) {
        localStorage.setItem('selectedFarmId', farm._id);
      } else {
        localStorage.removeItem('selectedFarmId');
      }
    }
  };

  const refreshFarms = async () => {
    if (!isAuthenticated || !token) {
      setFarms([]);
      setSelectedFarmState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await farmAPI.getAll();
      setFarms(data);
      
      // Restore selected farm from localStorage after fetching farms
      if (typeof window !== 'undefined' && data.length > 0 && !selectedFarm) {
        const savedFarmId = localStorage.getItem('selectedFarmId');
        if (savedFarmId) {
          const farmToSelect = data.find((farm: Farm) => farm._id === savedFarmId) || null;
          if (farmToSelect) {
            setSelectedFarmState(farmToSelect);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch farms:', err);
      setError('Failed to load farms. Please try again later.');
      setFarms([]);
      setSelectedFarmState(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh farms when auth state changes
  useEffect(() => {
    refreshFarms();
  }, [isAuthenticated, token]);

  return (
    <FarmContext.Provider value={{
      farms,
      selectedFarm,
      setSelectedFarm,
      loading,
      error,
      refreshFarms
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}