import React from 'react';
import { ShoppingCart, Search, Menu, MapPin, Sun, Moon, Mic, ScanLine, Heart, Clock, Store, LogOut, Truck } from 'lucide-react';
import { useCart } from '../CartContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserRole } from './Auth';

interface HeaderProps {
  onCartClick: () => void;
  address: string;
  onAddressClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  onWishlistClick: () => void;
  onOrderHistoryClick: () => void;
  userRole: UserRole;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  isMobileSearchOpen?: boolean;
  setIsMobileSearchOpen?: (isOpen: boolean) => void;
}

export function Header({ 
  onCartClick, 
  address, 
  onAddressClick, 
  isDarkMode, 
  toggleDarkMode, 
  onWishlistClick, 
  onOrderHistoryClick,
  userRole,
  searchQuery = '',
  setSearchQuery,
  isMobileSearchOpen = false,
  setIsMobileSearchOpen
}: HeaderProps) {
  const { totalItems, wishlist } = useCart();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center gap-4">
            {userRole !== 'customer' && (
              <button className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full lg:hidden transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-500 tracking-tighter drop-shadow-sm">LocalMart</span>
              {(userRole === 'customer' || userRole === 'vendor') && address && (
                <button 
                  onClick={userRole === 'customer' ? onAddressClick : undefined}
                  className={`flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 transition-colors text-left group ${userRole === 'customer' ? 'hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer' : 'cursor-default'}`}
                >
                  <MapPin className={`w-3.5 h-3.5 mr-1 shrink-0 ${userRole === 'customer' ? 'group-hover:text-emerald-500' : 'text-emerald-500'}`} />
                  <span className="truncate max-w-[150px] sm:max-w-[250px] font-medium">
                    {userRole === 'customer' ? 'Delivery to ' : 'Shop Location: '}
                    <strong className="dark:text-gray-200">{address}</strong>
                  </span>
                </button>
              )}
            </div>
          </div>

          {userRole === 'customer' && (
            <div className="flex-1 max-w-2xl px-6 hidden md:block">
              <div className="relative flex items-center group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  className="block w-full pl-11 pr-20 py-2.5 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm hover:shadow-md"
                  placeholder="Search for vegetables, groceries, pharmacy..."
                />
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                  <button className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700" title="Voice Search">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700" title="Scan Barcode">
                    <ScanLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {userRole === 'vendor' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                <Store className="w-4 h-4" />
                Vendor Dashboard
              </div>
            )}
            
            {userRole === 'delivery' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                <Truck className="w-4 h-4" />
                Driver Dashboard
              </div>
            )}

            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            
            {userRole === 'customer' && (
              <>
                <button 
                  onClick={() => setIsMobileSearchOpen?.(!isMobileSearchOpen)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full md:hidden"
                >
                  <Search className="w-6 h-6" />
                </button>
                <button
                  onClick={onOrderHistoryClick}
                  className="hidden md:flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Order History"
                >
                  <Clock className="w-6 h-6" />
                </button>
                <button
                  onClick={onWishlistClick}
                  className="relative flex items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Wishlist"
                >
                  <Heart className="w-6 h-6" />
                  {wishlist.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-rose-500 rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={onCartClick}
                  className="hidden md:flex relative items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Cart"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-emerald-600 rounded-full">
                      {totalItems}
                    </span>
                  )}
                </button>
              </>
            )}
            
            <div className={`${userRole === 'customer' ? 'hidden md:block' : 'block'} w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1`}></div>
            
            <button
              onClick={handleLogout}
              className={`${userRole === 'customer' ? 'hidden md:flex' : 'flex'} p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-colors`}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        {userRole === 'customer' && isMobileSearchOpen && (
          <div className="md:hidden pb-4 pt-2 animate-in slide-in-from-top-2 duration-200">
            <div className="relative flex items-center group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                autoFocus
                className="block w-full pl-11 pr-20 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm hover:shadow-md"
                placeholder="Search for products..."
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <button className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700" title="Voice Search">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
