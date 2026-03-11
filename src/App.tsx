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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [address, setAddress] = useState('Home - 10001');
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const handleCheckoutSuccess = () => {
    setIsCartOpen(false);
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
        />
        
        <main className="max-w-7xl mx-auto">
          {userRole === 'vendor' ? (
            <VendorDashboard />
          ) : userRole === 'delivery' ? (
            <DeliveryDashboard />
          ) : selectedShopId ? (
            <ShopDetails 
              shopId={selectedShopId} 
              onBack={() => setSelectedShopId(null)} 
            />
          ) : (
            <>
              <section className="bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-8 sm:px-6 lg:px-8 mx-4 sm:mx-6 lg:mx-8 mt-6 rounded-3xl overflow-hidden relative shadow-lg transition-colors">
                <div className="relative z-10 max-w-lg">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                    Groceries delivered in <span className="text-yellow-300">10 minutes</span>
                  </h1>
                  <p className="text-emerald-100 text-lg mb-6">
                    Fresh vegetables, pharmacy, and daily essentials at your doorstep.
                  </p>
                  <button 
                    onClick={() => {
                      const shopListElement = document.getElementById('shop-list');
                      if (shopListElement) {
                        shopListElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="bg-white text-emerald-600 dark:text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                  >
                    Order Now
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
        />
        <WishlistModal 
          isOpen={isWishlistModalOpen} 
          onClose={() => setIsWishlistModalOpen(false)} 
        />
        <OrderHistoryModal 
          isOpen={isOrderHistoryModalOpen} 
          onClose={() => setIsOrderHistoryModalOpen(false)} 
        />
      </div>
    </CartProvider>
  );
}
