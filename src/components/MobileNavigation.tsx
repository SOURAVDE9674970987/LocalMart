import React from 'react';
import { Home, Search, ShoppingCart, Clock, User } from 'lucide-react';
import { useCart } from '../CartContext';

interface MobileNavigationProps {
  onHomeClick: () => void;
  onSearchClick: () => void;
  onOrdersClick: () => void;
  onCartClick: () => void;
  onProfileClick: () => void;
  activeTab: 'home' | 'search' | 'orders' | 'cart' | 'profile';
}

export function MobileNavigation({
  onHomeClick,
  onSearchClick,
  onOrdersClick,
  onCartClick,
  onProfileClick,
  activeTab
}: MobileNavigationProps) {
  const { totalItems } = useCart();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border-t border-gray-200/50 dark:border-gray-800/50 z-40 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-colors">
      <div className="flex justify-around items-center h-16 sm:h-20 px-2 max-w-md mx-auto relative">
        <button 
          onClick={onHomeClick}
          className="relative flex flex-col items-center justify-center w-full h-full group"
        >
          <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,0.5)]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
            <Home className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'home' ? 'scale-110' : ''}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold mt-1 transition-colors duration-300 ${activeTab === 'home' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>Home</span>
        </button>
        
        <button 
          onClick={onSearchClick}
          className="relative flex flex-col items-center justify-center w-full h-full group"
        >
          <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${activeTab === 'search' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,0.5)]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
            <Search className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'search' ? 'scale-110' : ''}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold mt-1 transition-colors duration-300 ${activeTab === 'search' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>Search</span>
        </button>

        <button 
          onClick={onOrdersClick}
          className="relative flex flex-col items-center justify-center w-full h-full group"
        >
          <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${activeTab === 'orders' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,0.5)]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
            <Clock className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'orders' ? 'scale-110' : ''}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold mt-1 transition-colors duration-300 ${activeTab === 'orders' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>Orders</span>
        </button>

        <button 
          onClick={onCartClick}
          className="relative flex flex-col items-center justify-center w-full h-full group"
        >
          <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${activeTab === 'cart' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,0.5)]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
            <ShoppingCart className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'cart' ? 'scale-110' : ''}`} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none text-emerald-600 bg-white border-2 border-emerald-500 rounded-full shadow-sm">
                {totalItems}
              </span>
            )}
          </div>
          <span className={`text-[10px] sm:text-xs font-bold mt-1 transition-colors duration-300 ${activeTab === 'cart' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>Cart</span>
        </button>

        <button 
          onClick={onProfileClick}
          className="relative flex flex-col items-center justify-center w-full h-full group"
        >
          <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${activeTab === 'profile' ? 'bg-emerald-500 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,0.5)]' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}`}>
            <User className={`w-5 h-5 transition-transform duration-300 ${activeTab === 'profile' ? 'scale-110' : ''}`} />
          </div>
          <span className={`text-[10px] sm:text-xs font-bold mt-1 transition-colors duration-300 ${activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>Profile</span>
        </button>
      </div>
    </div>
  );
}
