'use client';

import { useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { useTheme } from '../contexts/ThemeContext';
import { AiChatWidget } from './AiChatWidget';
import { 
  XMarkIcon, 
  MoonIcon, 
  SunIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
  BuildingLibraryIcon,
  HomeIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  DocumentTextIcon,
  ScaleIcon,
  CalculatorIcon,
  PhoneIcon,
  MicrophoneIcon,
  EyeIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Partnership Dashboard', href: '/partnership-dashboard', icon: UserGroupIcon },
  { name: 'Farms', href: '/farms', icon: BuildingLibraryIcon },
  { name: 'Chicks', href: '/chicks', icon: UserGroupIcon },
  { name: 'Clients', href: '/clients', icon: UserIcon },
  { name: 'Sales', href: '/sales', icon: CreditCardIcon },
  { name: 'Payments', href: '/payments', icon: CurrencyDollarIcon },
  { name: 'Expenses', href: '/expenses', icon: CalculatorIcon },
  { name: 'Vaccination', href: '/vaccination', icon: BeakerIcon },
  { name: 'Mortality', href: '/mortality', icon: ArchiveBoxIcon },
  { name: 'Feed Consumption', href: '/feed-consumption', icon: ArchiveBoxIcon },
  { name: 'Weight Tracking', href: '/weight-tracking', icon: ScaleIcon },
  { name: 'Medicine', href: '/medicine', icon: BeakerIcon },
  { name: 'Market Rate', href: '/market-rate', icon: ChartBarIcon },
  { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon },
  { name: 'Waste/Fertilizer', href: '/waste-fertilizer', icon: TrashIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'WhatsApp', href: '/whatsapp', icon: ChatBubbleLeftRightIcon },
];

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isHydrated, token, logout } = useAuth();
  const { farms, selectedFarm, setSelectedFarm, loading: farmsLoading } = useFarm();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [farmMenuOpen, setFarmMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userMenuCloseTimer, setUserMenuCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [farmMenuCloseTimer, setFarmMenuCloseTimer] = useState<NodeJS.Timeout | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const farmMenuRef = useRef<HTMLDivElement>(null);

  const darkMode = theme === 'dark';

  // Memoize desktop navigation items
  const desktopNavItems = useMemo(() => NAV_ITEMS.map((item) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.name}>
        <Link 
          href={item.href}
          prefetch={true}
          className={`flex items-center p-3 rounded-lg transition-colors duration-100 sidebar-menu-item ${isActive 
              ? 'bg-gradient-primary text-white shadow-md' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          onClick={(e) => {
            // Ensure navigation works properly
            e.stopPropagation();
          }}
        >
          <item.icon className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
          {!sidebarCollapsed && (
            <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{item.name}</span>
          )}
        </Link>
      </li>
    );
  }), [pathname, sidebarCollapsed]);

  // Memoize mobile navigation items
  const mobileNavItems = useMemo(() => NAV_ITEMS.map((item) => {
    const isActive = pathname === item.href;
    return (
      <li key={item.name}>
        <Link
          href={item.href}
          prefetch={true}
          onClick={(e) => {
            setSidebarOpen(false);
            // Ensure navigation works properly
            e.stopPropagation();
          }}
          className={`flex items-center p-3 rounded-lg transition-colors duration-100 sidebar-menu-item ${isActive
              ? 'bg-gradient-primary text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <item.icon
            className={`h-5 w-5 mr-3 ${
              isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'
            }`}
          />
          <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
            {item.name}
          </span>
        </Link>
      </li>
    );
  }), [pathname]);

  // Only run auth check on client side
  useEffect(() => {
    setMounted(true);
    
    // Load sidebar collapsed preference
    const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarCollapsed === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  // Save sidebar collapsed preference
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (farmMenuRef.current && !farmMenuRef.current.contains(event.target as Node)) {
        setFarmMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (userMenuCloseTimer) {
        clearTimeout(userMenuCloseTimer);
      }
      if (farmMenuCloseTimer) {
        clearTimeout(farmMenuCloseTimer);
      }
    };
  }, [userMenuCloseTimer, farmMenuCloseTimer]);

  // Redirect to login if not authenticated and hydration is complete
  useEffect(() => {
    if (!mounted || !isHydrated) return;
    
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isHydrated, pathname, mounted, router]);

  // If on login page, show only children with full-viewport background
  if (pathname === '/login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {children}
      </div>
    );
  }

  // If not mounted, not hydrated, or not authenticated (and not on login page), show loading
  if (!mounted || !isHydrated || (!isAuthenticated && pathname !== '/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary dark:border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    // Handle special cases for pages not in NAV_ITEMS
    if (pathname === '/settings') {
      return 'Settings';
    }
    if (pathname === '/profile') {
      return 'Profile';
    }
    
    const item = NAV_ITEMS.find(i => i.href === pathname);
    return item ? item.name : 'Dashboard';
  };

  const toggleDarkMode = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen transition-colors duration-300 ease-in-out">
      <style jsx>{`
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 768px) {
          .sidebar-desktop {
            display: none !important;
          }
        }
      `}</style>
      
      {/* Sidebar */}
      <div className={`sidebar-desktop hidden md:flex md:flex-col md:relative z-30 ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800/70 shadow-xl h-full transition-all duration-150 ease-in-out border-r border-gray-200 dark:border-gray-700 before:absolute before:inset-0 before:bg-black/0 dark:before:bg-black/10 before:rounded-xl before:z-[-1]`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-secondary dark:bg-gray-800">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3 max-w-full">
              <img src="/logo.png" alt="EggFarm Pro Logo" className="w-8 h-8 object-contain rounded-none border-0" />
              <div className="max-w-[calc(100%-2.25rem)]">
                <h1 className="text-base font-semibold text-gray-800 dark:text-white truncate">Egg Farm Pro</h1>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 break-words whitespace-normal overflow-hidden truncate">AI Powered Farm Management</p>
              </div>
            </div>
          )}
          
          {sidebarCollapsed ? (
            <div className="flex items-center justify-center w-full">
              <button 
                onClick={toggleSidebar}
                className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 nav-button"
                aria-label="Expand sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 nav-button"
              aria-label="Collapse sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-hidden">
          <ul className="space-y-1">
            {desktopNavItems}
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="mt-auto py-2 px-4 border-t border-gray-200 dark:border-gray-700">
          {sidebarCollapsed ? (
            <div className="text-left text-[10px] text-gray-500 dark:text-gray-400" title="© {new Date().getFullYear()} EggFarm Pro. All rights reserved.">
              © {new Date().getFullYear()}
            </div>
          ) : (
            <div className="text-left text-[10px] text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} EggFarm Pro • All rights reserved
            </div>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm z-10 flex-shrink-0 px-2 py-2 sm:px-3 sm:py-3 md:px-6 md:py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-1 sm:gap-2 md:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden inline-flex items-center justify-center text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 nav-button"
                aria-label="Open sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {getPageTitle()}
                </h1>
                {selectedFarm && (
                  <p className="text-[9px] sm:text-xs md:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedFarm.name} • {selectedFarm.location}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 md:gap-3 flex-shrink-0">
              {/* User Menu */}
              <div 
                className="relative" 
                ref={userMenuRef}
                onMouseEnter={() => {
                  // Close farm menu when opening user menu to prevent overlap
                  if (farmMenuOpen) {
                    setFarmMenuOpen(false);
                  }
                  if (userMenuCloseTimer) {
                    clearTimeout(userMenuCloseTimer);
                    setUserMenuCloseTimer(null);
                  }
                  setUserMenuOpen(true);
                }}
                onMouseLeave={() => {
                  const timer = setTimeout(() => {
                    setUserMenuOpen(false);
                    setUserMenuCloseTimer(null);
                  }, 300); // 300ms delay before closing
                  setUserMenuCloseTimer(timer);
                }}
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close farm menu when opening user menu to prevent overlap
                    if (farmMenuOpen) {
                      setFarmMenuOpen(false);
                    }
                    setUserMenuOpen(!userMenuOpen);
                  }}
                  className="flex items-center justify-center p-1 sm:p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-primary-foreground dark:hover:text-white dark:hover:bg-primary transition-colors duration-300"
                  aria-label="Account menu"
                >
                  <UserCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>                
                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-xl shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-600"
                    onMouseEnter={() => {
                      if (userMenuCloseTimer) {
                        clearTimeout(userMenuCloseTimer);
                        setUserMenuCloseTimer(null);
                      }
                    }}
                    onMouseLeave={() => {
                      const timer = setTimeout(() => {
                        setUserMenuOpen(false);
                        setUserMenuCloseTimer(null);
                      }, 300); // 300ms delay before closing
                      setUserMenuCloseTimer(timer);
                    }}
                  >
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center space-x-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push('/settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center space-x-2"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium flex items-center space-x-2"
                    >
                      <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Farm Switch Button - moved to be after user menu to prevent overlap */}
              {!farmsLoading && farms.length > 0 && (
                <div 
                  className="relative" 
                  ref={farmMenuRef}
                  onMouseEnter={() => {
                    // Close user menu when opening farm menu to prevent overlap
                    if (userMenuOpen) {
                      setUserMenuOpen(false);
                    }
                    if (farmMenuCloseTimer) {
                      clearTimeout(farmMenuCloseTimer);
                      setFarmMenuCloseTimer(null);
                    }
                    setFarmMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    const timer = setTimeout(() => {
                      setFarmMenuOpen(false);
                      setFarmMenuCloseTimer(null);
                    }, 300); // 300ms delay before closing
                    setFarmMenuCloseTimer(timer);
                  }}
                >
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Close user menu when opening farm menu to prevent overlap
                      if (userMenuOpen) {
                        setUserMenuOpen(false);
                      }
                      setFarmMenuOpen(!farmMenuOpen);
                    }}
                    className="flex items-center justify-center p-1 sm:p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-primary-foreground dark:hover:text-white dark:hover:bg-primary transition-colors duration-300"
                    aria-label={farms.length > 1 ? "Switch Farm" : "View Farm"}
                  >
                    <BuildingLibraryIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </button>                  
                  {/* Farm dropdown menu */}
                  {farmMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-xl shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-600"
                      onMouseEnter={() => {
                        if (farmMenuCloseTimer) {
                          clearTimeout(farmMenuCloseTimer);
                          setFarmMenuCloseTimer(null);
                        }
                      }}
                      onMouseLeave={() => {
                        const timer = setTimeout(() => {
                          setFarmMenuOpen(false);
                          setFarmMenuCloseTimer(null);
                        }, 300); // 300ms delay before closing
                        setFarmMenuCloseTimer(timer);
                      }}
                    >
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {farms.length > 1 ? 'Select Farm' : 'Your Farm'}
                      </div>
                      {farms.map((farm) => (
                        <button
                          key={farm._id}
                          onClick={() => {
                            setSelectedFarm(farm);
                            setFarmMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition flex items-center space-x-2 ${
                            selectedFarm?._id === farm._id
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <BuildingLibraryIcon className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{farm.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{farm.location}</div>
                          </div>
                        </button>
                      ))}
                      {farms.length > 1 && (
                        <>
                          <hr className="my-2 border-gray-200 dark:border-gray-600" />
                          <button
                            onClick={() => {
                              // This will deselect the current farm to show all farms
                              setSelectedFarm(null);
                              setFarmMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition flex items-center space-x-2 ${
                              selectedFarm === null
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span className="font-medium">View All Farms</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-center p-1 sm:p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-primary-foreground dark:hover:text-white dark:hover:bg-primary transition-colors duration-300"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
            {children}
          </div>
        </main>
        
      </div>

      {/* Mobile sidebar + overlay */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800/70 shadow-xl md:hidden flex flex-col border-r border-gray-200 dark:border-gray-700 before:absolute before:inset-0 before:bg-black/0 dark:before:bg-black/10 before:rounded-xl before:z-[-1]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-secondary dark:bg-gray-800">
              <div className="flex items-center space-x-3 max-w-full">
                <img src="/logo.png" alt="EggFarm Pro Logo" className="w-9 h-9 object-contain rounded-none border-0" />
                <div className="max-w-[calc(100%-2.5rem)]">
                  <h1 className="text-base font-semibold text-gray-800 dark:text-white">Egg Farm Pro</h1>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 break-words whitespace-normal overflow-hidden">AI Powered Farm Management</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-100 nav-button"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-hidden">
              <ul className="space-y-1">
                {mobileNavItems}
              </ul>
            </nav>
            
            {/* Mobile Sidebar Footer */}
            <div className="mt-auto py-2 px-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-left text-[10px] text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} EggFarm Pro • All rights reserved
              </div>
            </div>
          </div>
        </>
      )}
      {/* AI Chat Widget */}
      <AiChatWidget />
    </div>
  );
}