import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryList } from './components/CategoryList';
import { ProductList } from './components/ProductList';
import { Cart } from './components/Cart';
import { CartProvider } from './CartContext';
import { AddressModal } from './components/AddressModal';
import { BuyItAgain } from './components/BuyItAgain';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { WishlistModal } from './components/WishlistModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { ShopList } from './components/ShopList';
import { ShopDetails } from './components/ShopDetails';
import { VendorDashboard } from './components/VendorDashboard';
import { DeliveryDashboard } from './components/DeliveryDashboard';
import { GlobalSearchResults } from './components/GlobalSearchResults';
import { MobileNavigation } from './components/MobileNavigation';
import { ProfileModal } from './components/ProfileModal';
import { Auth, UserRole } from './components/Auth';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [address, setAddress] = useState('Home - 10001');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role) {
              setUserRole(data.role as UserRole);
              localStorage.setItem('localmart_role', data.role);
            }
          } else {
            // Fallback to local storage if document doesn't exist yet (e.g. during signup)
            const storedRole = localStorage.getItem('localmart_role') as UserRole;
            if (storedRole) {
              setUserRole(storedRole);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          const storedRole = localStorage.getItem('localmart_role') as UserRole;
          if (storedRole) {
            setUserRole(storedRole);
          }
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const handleCheckoutSuccess = (orderId?: string) => {
    setIsCartOpen(false);
    if (orderId) {
      setTrackingOrderId(orderId);
    }
    setIsTrackingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 selection:bg-emerald-100 selection:text-emerald-900 transition-colors">
        <Header 
          onCartClick={() => setIsCartOpen(true)} 
          address={address}
          onAddressClick={() => setIsAddressModalOpen(true)}
          isDarkMode={isDarkMode}
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onWishlistClick={() => setIsWishlistModalOpen(true)}
          onOrderHistoryClick={() => setIsOrderHistoryModalOpen(true)}
          userRole={userRole}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isMobileSearchOpen={isMobileSearchOpen}
          setIsMobileSearchOpen={setIsMobileSearchOpen}
        />
        
        <main className="max-w-7xl mx-auto pb-20 md:pb-0">
          {userRole === 'vendor' ? (
            <VendorDashboard onAddressChange={setAddress} />
          ) : userRole === 'delivery' ? (
            <DeliveryDashboard />
          ) : searchQuery ? (
            <GlobalSearchResults searchQuery={searchQuery} />
          ) : selectedShopId ? (
            <ShopDetails 
              shopId={selectedShopId} 
              onBack={() => setSelectedShopId(null)} 
            />
          ) : (
            <>
              <section className="bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-10 sm:px-10 lg:px-12 mx-4 sm:mx-6 lg:mx-8 mt-6 rounded-[2rem] overflow-hidden relative shadow-[0_20px_40px_-15px_rgba(5,150,105,0.4)] transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 opacity-90" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
                
                <div className="relative z-10 max-w-lg">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
                    Groceries delivered in <span className="text-yellow-300">10 minutes</span>
                  </h1>
                  <p className="text-emerald-50 text-lg mb-8 font-medium opacity-90">
                    Fresh vegetables, pharmacy, and daily essentials at your doorstep.
                  </p>
                  <button 
                    onClick={() => {
                      const shopListElement = document.getElementById('shop-list');
                      if (shopListElement) {
                        shopListElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold py-3.5 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    Order Now
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden md:block opacity-20 pointer-events-none">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform translate-x-1/4 translate-y-1/4">
                    <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,96.1,-2.9C95.4,12.2,88,26.9,78.2,39.3C68.4,51.7,56.2,61.8,42.5,69.5C28.8,77.2,14.4,82.5,0.1,82.3C-14.2,82.1,-28.4,76.4,-41.7,68.4C-55,60.4,-67.4,50.1,-76.2,37.1C-85,24.1,-90.2,8.4,-89.5,-6.9C-88.8,-22.2,-82.2,-37.1,-72.2,-48.9C-62.2,-60.7,-48.8,-69.4,-34.9,-76.3C-21,-83.2,-6.6,-88.3,4.3,-95.7C15.2,-103.1,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
                  </svg>
                </div>
              </section>

              <BuyItAgain />

              <CategoryList
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              
              <div id="shop-list">
                <ShopList 
                  selectedCategory={selectedCategory} 
                  onSelectShop={setSelectedShopId} 
                />
              </div>
            </>
          )}
        </main>

        <Cart 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          onCheckoutSuccess={handleCheckoutSuccess}
          address={address}
        />
        <AddressModal 
          isOpen={isAddressModalOpen} 
          onClose={() => setIsAddressModalOpen(false)} 
          currentAddress={address}
          onSave={setAddress}
        />
        <OrderTrackingModal 
          isOpen={isTrackingModalOpen} 
          onClose={() => setIsTrackingModalOpen(false)} 
          address={address}
          orderId={trackingOrderId}
        />
        <WishlistModal 
          isOpen={isWishlistModalOpen} 
          onClose={() => setIsWishlistModalOpen(false)} 
        />
        <OrderHistoryModal 
          isOpen={isOrderHistoryModalOpen} 
          onClose={() => setIsOrderHistoryModalOpen(false)} 
          onTrackOrder={(orderId) => {
            setTrackingOrderId(orderId);
            setIsTrackingModalOpen(true);
          }}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />

        {userRole === 'customer' && (
          <MobileNavigation 
            activeTab={isCartOpen ? 'cart' : isOrderHistoryModalOpen ? 'orders' : isProfileModalOpen ? 'profile' : (searchQuery || isMobileSearchOpen) ? 'search' : 'home'}
            onHomeClick={() => {
              setSearchQuery('');
              setSelectedShopId(null);
              setSelectedCategory(null);
              setIsCartOpen(false);
              setIsOrderHistoryModalOpen(false);
              setIsProfileModalOpen(false);
              setIsMobileSearchOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSearchClick={() => {
              setIsCartOpen(false);
              setIsOrderHistoryModalOpen(false);
              setIsProfileModalOpen(false);
              setIsMobileSearchOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                if (searchInput) searchInput.focus();
              }, 100);
            }}
            onOrdersClick={() => {
              setIsCartOpen(false);
              setIsProfileModalOpen(false);
              setIsMobileSearchOpen(false);
              setIsOrderHistoryModalOpen(true);
            }}
            onCartClick={() => {
              setIsOrderHistoryModalOpen(false);
              setIsProfileModalOpen(false);
              setIsMobileSearchOpen(false);
              setIsCartOpen(true);
            }}
            onProfileClick={() => {
              setIsCartOpen(false);
              setIsOrderHistoryModalOpen(false);
              setIsMobileSearchOpen(false);
              setIsProfileModalOpen(true);
            }}
          />
        )}
      </div>
    </CartProvider>
  );
}
