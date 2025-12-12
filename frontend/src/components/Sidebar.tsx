
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  UserIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  ScaleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

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
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'UPI Reader', href: '/ocr', icon: PhotoIcon },
  { name: 'WhatsApp', href: '/whatsapp', icon: ChatBubbleLeftRightIcon },
];

export default function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}) {
  const pathname = usePathname();

  // Load sidebar collapsed preference
  useEffect(() => {
    const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarCollapsed === 'true') {
      setSidebarCollapsed(true);
    }
  }, [setSidebarCollapsed]);

  // Save sidebar collapsed preference
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        id="nav-bar"
        className={`hidden md:flex md:flex-col absolute left-1vw top-1vw h-[calc(100%-2vw)] rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{
          background: 'linear-gradient(to right, #84cc16, #4ade80, #10b981)',
          color: 'var(--navbar-light-primary)',
          fontFamily: 'Verdana, Geneva, Tahoma, sans-serif',
          transformOrigin: 'left center'
        }}
      >
        <style>
          {`
          :root {
            --navbar-width: 256px;
            --navbar-width-min: 80px;
            --navbar-dark-primary: #84cc16;
            --navbar-dark-secondary: #2c3e50;
            --navbar-light-primary: #f5f6fa;
            --navbar-light-secondary: #8392a5;
          }
          
          #nav-toggle:checked ~ #nav-header {
            width: calc(var(--navbar-width-min) - 16px);
          }
          
          #nav-toggle:checked ~ #nav-content,
          #nav-toggle:checked ~ #nav-footer {
            width: var(--navbar-width-min);
          }
          
          #nav-content-highlight {
            position: absolute;
            left: 16px;
            top: -70px;
            width: calc(100% - 16px);
            height: 54px;
            background: linear-gradient(135deg, #9c88ff, #4b6cb7);
            background-attachment: fixed;
            border-radius: 16px 0 0 16px;
            transition: top 0.2s;
          }
          
          #nav-content-highlight:before,
          #nav-content-highlight:after {
            content: '';
            position: absolute;
            right: 0;
            bottom: 100%;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            box-shadow: 16px 16px linear-gradient(135deg, #9c88ff, #4b6cb7);
          }
          
          #nav-content-highlight:after {
            top: 100%;
            box-shadow: 16px -16px linear-gradient(135deg, #9c88ff, #4b6cb7);
          }
          
          .nav-button:nth-of-type(1):hover ~ #nav-content-highlight { top: 16px; }
          .nav-button:nth-of-type(2):hover ~ #nav-content-highlight { top: 70px; }
          .nav-button:nth-of-type(3):hover ~ #nav-content-highlight { top: 124px; }
          .nav-button:nth-of-type(4):hover ~ #nav-content-highlight { top: 178px; }
          .nav-button:nth-of-type(5):hover ~ #nav-content-highlight { top: 232px; }
          .nav-button:nth-of-type(6):hover ~ #nav-content-highlight { top: 286px; }
          .nav-button:nth-of-type(7):hover ~ #nav-content-highlight { top: 340px; }
          .nav-button:nth-of-type(8):hover ~ #nav-content-highlight { top: 394px; }
          .nav-button:nth-of-type(9):hover ~ #nav-content-highlight { top: 448px; }
          .nav-button:nth-of-type(10):hover ~ #nav-content-highlight { top: 502px; }
          .nav-button:nth-of-type(11):hover ~ #nav-content-highlight { top: 556px; }
          .nav-button:nth-of-type(12):hover ~ #nav-content-highlight { top: 610px; }
          .nav-button:nth-of-type(13):hover ~ #nav-content-highlight { top: 664px; }
          .nav-button:nth-of-type(14):hover ~ #nav-content-highlight { top: 718px; }
          .nav-button:nth-of-type(15):hover ~ #nav-content-highlight { top: 772px; }
          .nav-button:nth-of-type(16):hover ~ #nav-content-highlight { top: 826px; }
          .nav-button:nth-of-type(17):hover ~ #nav-content-highlight { top: 880px; }
          `}
        </style>
        
        {/* Nav Header */}
        <div 
          id="nav-header"
          className="relative min-h-20 rounded-xl z-20 flex items-center transition-all duration-200 pl-4"
          style={{ background: 'linear-gradient(to right, #84cc16, #4ade80, #10b981)', width: sidebarCollapsed ? 'calc(80px - 16px)' : 'calc(256px - 16px)' }}
        >
          {!sidebarCollapsed && (
            <Link 
              id="nav-title" 
              href="/" 
              className="text-xl font-bold no-underline"
              style={{ color: 'inherit' }}
            >
              EggFarm Pro
            </Link>
          )}
          
          <label 
            htmlFor="nav-toggle" 
            className="absolute right-0 w-12 h-full flex items-center justify-center cursor-pointer"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span 
              id="nav-toggle-burger"
              className="relative w-4 h-0.5 rounded-full transition-all duration-200"
              style={{ 
                background: sidebarCollapsed ? 'var(--navbar-light-primary)' : 'var(--navbar-dark-primary)',
              }}
            >
              {!sidebarCollapsed && (
                <>
                  <span 
                    className="absolute top-[-6px] w-2.5 h-0.5 rounded-full transition-all duration-200"
                    style={{ 
                      background: 'var(--navbar-light-primary)',
                      transform: 'translate(2px, 8px) rotate(30deg)'
                    }}
                  />
                  <span 
                    className="absolute top-[6px] w-2.5 h-0.5 rounded-full transition-all duration-200"
                    style={{ 
                      background: 'var(--navbar-light-primary)',
                      transform: 'translate(2px, -8px) rotate(-30deg)'
                    }}
                  />
                </>
              )}
            </span>
          </label>
          
          <hr className="absolute bottom-0 left-4 w-[calc(100%-32px)] border-t border-solid" style={{ borderColor: 'var(--navbar-dark-secondary)' }} />
        </div>
        
        {/* Nav Content */}
        <div 
          id="nav-content"
          className="relative flex-1 overflow-x-hidden overflow-y-auto transition-all duration-200 pt-4 pb-4"
          style={{ 
            width: sidebarCollapsed ? '80px' : '256px',
            background: 'linear-gradient(to right, #84cc16, #4ade80, #10b981)',
            boxShadow: '0 0 0 16px #84cc16',
            direction: 'rtl'
          }}
        >
          <div id="nav-content-highlight"></div>
          
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div 
                key={item.name}
                className={`nav-button relative ml-4 h-12 flex items-center cursor-pointer z-10 transition-all duration-300 ease-in-out ${
                  isActive ? 'text-white' : ''
                }`}
                style={{ 
                  color: isActive ? 'var(--navbar-light-primary)' : 'var(--navbar-light-secondary)',
                  direction: 'ltr',
                  transformOrigin: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
              >
                <item.icon 
                  className={`${sidebarCollapsed ? 'min-w-[calc(100%-16px)] text-center mx-auto' : 'min-w-12 text-center mr-3'}`}
                />
                {!sidebarCollapsed && (
                  <span 
                    className="transition-opacity duration-1000"
                    style={{ opacity: sidebarCollapsed ? 0 : 1 }}
                  >
                    {item.name}
                  </span>
                )}
              </div>
            );
          })}
          
          <hr className="my-0 mx-4 border-t border-solid" style={{ borderColor: 'var(--navbar-dark-secondary)', width: 'calc(100% - 32px)' }} />
        </div>
        
        {/* Nav Footer */}
        <div 
          id="nav-footer"
          className="relative h-12 rounded-xl flex flex-col z-20 transition-all duration-200"
          style={{ 
            width: sidebarCollapsed ? '80px' : '256px',
            background: 'var(--navbar-dark-secondary)'
          }}
        >
          <div className="relative w-full h-12 flex items-center">
            <div 
              id="nav-footer-avatar"
              className="relative ml-4 w-8 h-8 rounded-full overflow-hidden transition-all duration-200"
              style={{ 
                transform: sidebarCollapsed ? 'translateX(-50%)' : 'translateX(0)',
                marginLeft: sidebarCollapsed ? '0' : '16px',
                left: sidebarCollapsed ? '50%' : '0'
              }}
            >
              <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-700" />
              </div>
            </div>
            
            {!sidebarCollapsed && (
              <div 
                id="nav-footer-titlebox"
                className="relative ml-4 flex flex-col transition-opacity duration-1000"
                style={{ opacity: sidebarCollapsed ? 0 : 1 }}
              >
                <span id="nav-footer-title" className="text-sm font-medium">User</span>
                <span 
                  id="nav-footer-subtitle" 
                  className="text-xs"
                  style={{ color: 'var(--navbar-light-secondary)' }}
                >
                  Administrator
                </span>
              </div>
            )}
            
            <label 
              htmlFor="nav-footer-toggle" 
              className="absolute right-0 w-12 h-full flex items-center cursor-pointer transition-transform duration-200"
              style={{ 
                transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                opacity: sidebarCollapsed ? 0 : 1,
                pointerEvents: sidebarCollapsed ? 'none' : 'auto'
              }}
            >
              <svg 
                className="w-4 h-4" 
                style={{ color: 'var(--navbar-light-secondary)' }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </label>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar + Overlay */}
      {sidebarOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div 
            id="nav-bar"
            className="fixed left-1vw top-1vw h-[calc(100%-2vw)] rounded-xl overflow-hidden z-50 md:hidden flex flex-col transition-all duration-500 ease-out scale-105 shadow-2xl"
            style={{
              width: '256px',
              background: 'linear-gradient(to right, #84cc16, #4ade80, #10b981)',
              color: 'var(--navbar-light-primary)',
              fontFamily: 'Verdana, Geneva, Tahoma, sans-serif',
              transformOrigin: 'left center'
            }}
          >
            <style>
              {`
              :root {
                --navbar-dark-primary: #84cc16;
                --navbar-dark-secondary: #2c3e50;
                --navbar-light-primary: #f5f6fa;
                --navbar-light-secondary: #8392a5;
              }
              
              #nav-content-highlight {
                position: absolute;
                left: 16px;
                top: -70px;
                width: calc(100% - 16px);
                height: 54px;
                background: linear-gradient(135deg, #9c88ff, #4b6cb7);
                background-attachment: fixed;
                border-radius: 16px 0 0 16px;
                transition: top 0.2s;
              }
              `}
            </style>
            
            {/* Nav Header */}
            <div 
              id="nav-header"
              className="relative min-h-20 rounded-xl z-20 flex items-center pl-4"
              style={{ background: 'linear-gradient(to right, #84cc16, #4ade80, #10b981)' }}
            >
              <Link 
                id="nav-title" 
                href="/" 
                className="text-xl font-bold no-underline"
                style={{ color: 'inherit' }}
                onClick={() => setSidebarOpen(false)}
              >
                EggFarm Pro
              </Link>
              
              <button
                className="absolute right-0 w-12 h-full flex items-center justify-center cursor-pointer"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-6 h-6" style={{ color: 'var(--navbar-light-primary)' }} />
              </button>
              
              <hr className="absolute bottom-0 left-4 w-[calc(100%-32px)] border-t border-solid" style={{ borderColor: 'var(--navbar-dark-secondary)' }} />
            </div>
            
            {/* Nav Content */}
            <div 
              id="nav-content"
              className="relative flex-1 overflow-x-hidden overflow-y-auto pt-4 pb-4"
              style={{ 
                background: 'linear-gradient(to right, #84cc16, #4ade80, #10b981)',
                boxShadow: '0 0 0 16px #84cc16',
                direction: 'rtl'
              }}
            >
              <div id="nav-content-highlight"></div>
              
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-button relative ml-4 h-12 flex items-center no-underline cursor-pointer z-10 transition-all duration-300 ease-in-out ${
                      isActive ? 'text-white' : ''
                    }`}
                    style={{ 
                      color: isActive ? 'var(--navbar-light-primary)' : 'var(--navbar-light-secondary)',
                      direction: 'ltr',
                      transformOrigin: 'center'
                    }}
                    onClick={() => setSidebarOpen(false)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                  >
                    <item.icon className="min-w-12 text-center mr-3" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <hr className="my-0 mx-4 border-t border-solid" style={{ borderColor: 'var(--navbar-dark-secondary)', width: 'calc(100% - 32px)' }} />
            </div>
            
            {/* Nav Footer */}
            <div 
              id="nav-footer"
              className="relative h-12 rounded-xl flex flex-col z-20"
              style={{ background: 'var(--navbar-dark-secondary)' }}
            >
              <div className="relative w-full h-12 flex items-center">
                <div 
                  id="nav-footer-avatar"
                  className="relative ml-4 w-8 h-8 rounded-full overflow-hidden"
                >
                  <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-700" />
                  </div>
                </div>
                
                <div id="nav-footer-titlebox" className="relative ml-4 flex flex-col">
                  <span id="nav-footer-title" className="text-sm font-medium">User</span>
                  <span 
                    id="nav-footer-subtitle" 
                    className="text-xs"
                    style={{ color: 'var(--navbar-light-secondary)' }}
                  >
                    Administrator
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
