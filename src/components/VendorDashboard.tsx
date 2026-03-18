import React, { useState, useEffect, useRef } from 'react';
import { Package, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Plus, Minus, Trash2, Store, X, MapPin } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

function LocationMarker({ position, setPosition, onLocationSelect }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void, onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  unit: string;
  category: string;
  stock?: number;
}

export interface Shop {
  id: string;
  vendorId: string;
  name: string;
  address?: string;
  location?: { lat: number; lng: number } | null;
  image: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  categories: string[];
}

export function VendorDashboard({ onAddressChange }: { onAddressChange?: (address: string) => void }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'earnings'>('orders');
  const [shop, setShop] = useState<Shop | null>(null);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, ordersToday: 0, weekly: 0 });
  const [loading, setLoading] = useState(true);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [shopLocation, setShopLocation] = useState<[number, number] | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '',
    unit: '',
    category: '',
    stock: '10'
  });
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const skipGeocodeRef = useRef(false);

  const performReverseGeocoding = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        skipGeocodeRef.current = true;
        setNewShopAddress(data.display_name);
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  useEffect(() => {
    if (!newShopAddress.trim() || isFetchingLocation) return;
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newShopAddress)}`);
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setShopLocation([parseFloat(lat), parseFloat(lon)]);
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
      } finally {
        setIsGeocoding(false);
      }
    }, 1000); // Wait 1 second after user stops typing to fetch

    return () => clearTimeout(delayDebounceFn);
  }, [newShopAddress, isFetchingLocation]);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!auth.currentUser) return;
      
      try {
        // Fetch shop
        const shopQuery = query(collection(db, 'shops'), where('vendorId', '==', auth.currentUser.uid));
        const shopSnapshot = await getDocs(shopQuery);
        
        if (!shopSnapshot.empty) {
          const shopData = { id: shopSnapshot.docs[0].id, ...shopSnapshot.docs[0].data() } as Shop;
          setShop(shopData);
          if (onAddressChange && shopData.address) {
            onAddressChange(shopData.address);
          }
          
          // Real-time listener for products
          const productsQuery = query(collection(db, 'products'), where('shopId', '==', shopData.id));
          const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            setInventory(productsData);
          });

          // Real-time listener for orders
          const ordersQuery = query(collection(db, 'orders'), where('shopId', '==', shopData.id));
          const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => {
              const data = doc.data() as any;
              return {
                id: doc.id,
                ...data,
                itemsCount: data.items ? data.items.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0,
                total: data.vendorEarnings || data.totalAmount || 0,
                time: new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
            });
            
            // Sort orders by createdAt descending
            ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(ordersData);
            
            // Calculate earnings
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let todayEarnings = 0;
            let todayOrdersCount = 0;
            let weeklyEarnings = 0;
            
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            
            ordersData.forEach(order => {
              const orderDate = new Date(order.createdAt);
              if (order.status === 'completed' || order.status === 'delivering' || order.status === 'ready' || order.status === 'preparing' || order.status === 'accepted' || order.status === 'pending') {
                // Only count earnings for orders that are not rejected
                if (orderDate >= today) {
                  todayEarnings += (order.vendorEarnings || 0);
                  todayOrdersCount++;
                }
                if (orderDate >= weekAgo) {
                  weeklyEarnings += (order.vendorEarnings || 0);
                }
              }
            });
            
            setEarnings({ 
              today: todayEarnings, 
              ordersToday: todayOrdersCount, 
              weekly: weeklyEarnings 
            });
          });

          setLoading(false);
          
          return () => {
            unsubscribeProducts();
            unsubscribeOrders();
          };
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
        setLoading(false);
      }
    };

    const cleanup = fetchVendorData();
    return () => {
      cleanup.then(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  const handleGetLocation = () => {
    setIsFetchingLocation(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsFetchingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setShopLocation([lat, lng]);
        performReverseGeocoding(lat, lng);
        setIsFetchingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setError("Could not get your location. Please select it on the map.");
        setIsFetchingLocation(false);
        if (!shopLocation) setShopLocation([40.7128, -74.0060]); // Default to NYC
      }
    );
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newShopName.trim() || !newShopAddress.trim()) return;
    
    setError(null);
    try {
      const newShop = {
        vendorId: auth.currentUser.uid,
        name: newShopName,
        address: newShopAddress,
        location: shopLocation ? { lat: shopLocation[0], lng: shopLocation[1] } : null,
        image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=800',
        rating: 5.0,
        deliveryTime: '15-30 mins',
        deliveryFee: 2.99,
        categories: ['Groceries']
      };
      
      const docRef = await addDoc(collection(db, 'shops'), newShop);
      setShop({ id: docRef.id, ...newShop });
      setIsCreatingShop(false);
    } catch (error) {
      console.error("Error creating shop:", error);
      setError("Failed to create shop. Please try again.");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setError(null);
    setIsSubmitting(true);
    try {
      const productData = {
        shopId: shop.id,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        unit: newProduct.unit,
        category: newProduct.category,
        stock: parseInt(newProduct.stock, 10)
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      setInventory(prev => [...prev, { id: docRef.id, ...productData }]);
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: '', image: '', unit: '', category: '', stock: '10' });
    } catch (error) {
      console.error("Error adding product:", error);
      setError("Failed to add product. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStock = async (productId: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, (currentStock || 0) + change);
    
    // Optimistic update
    setInventory(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    
    try {
      await updateDoc(doc(db, 'products', productId), { stock: newStock });
    } catch (error) {
      console.error("Error updating stock:", error);
      // Revert on error
      setInventory(prev => prev.map(p => p.id === productId ? { ...p, stock: currentStock } : p));
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, 'products', productId));
      setInventory(prev => prev.filter(p => p.id !== productId));
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product. Please try again.");
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    setError(null);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'preparing' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'preparing' } : o));
    } catch (error) {
      console.error("Error accepting order:", error);
      setError("Failed to accept order. Please try again.");
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setError(null);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'rejected' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
    } catch (error) {
      console.error("Error rejecting order:", error);
      setError("Failed to reject order. Please try again.");
    }
  };

  const handleReadyOrder = async (orderId: string) => {
    setError(null);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'ready' });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'ready' } : o));
    } catch (error) {
      console.error("Error marking order as ready:", error);
      setError("Failed to mark order as ready. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <Store className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome, Vendor!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">You need to set up your shop before you can start selling.</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between text-red-600 dark:text-red-400 text-left">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isCreatingShop ? (
          <form onSubmit={handleCreateShop} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop Name</label>
              <input
                type="text"
                required
                value={newShopName}
                onChange={(e) => setNewShopName(e.target.value)}
                placeholder="Enter your shop name"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop Address</label>
              <input
                type="text"
                required
                value={newShopAddress}
                onChange={(e) => setNewShopAddress(e.target.value)}
                placeholder="Enter shop address / location"
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pin Location on Map</label>
                <div className="flex items-center gap-2">
                  {isGeocoding && <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">Finding address...</span>}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isFetchingLocation || isGeocoding}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {isFetchingLocation ? 'Locating...' : 'Get Current Location'}
                  </button>
                </div>
              </div>
              <div className="h-[200px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
                <MapContainer center={shopLocation || [40.7128, -74.0060]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {shopLocation && <MapUpdater center={shopLocation} />}
                  <LocationMarker position={shopLocation} setPosition={setShopLocation} onLocationSelect={performReverseGeocoding} />
                </MapContainer>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Click on the map to set your exact store location.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setIsCreatingShop(false)} className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">Create Shop</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsCreatingShop(true)}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Set Up My Shop
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{shop.name}</p>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors text-left group">
            <MapPin className="w-3 h-3 mr-1 shrink-0 text-emerald-500" />
            <span className="truncate max-w-[250px] sm:max-w-[300px]">Shop Location: <strong className="dark:text-gray-200">{shop.address || 'Address not set'}</strong></span>
          </div>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['orders', 'inventory', 'earnings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Orders</h2>
          <div className="grid gap-4">
            {orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No active orders</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">When customers place orders, they will appear here.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">{order.id}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.status === 'pending' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Customer: {order.customerName || order.customerId}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.itemsCount} items • ${order.total.toFixed(2)} • {order.time}
                    </p>
                  </div>
                  {order.status === 'pending' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRejectOrder(order.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                  {order.status === 'preparing' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleReadyOrder(order.id)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Mark Ready
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Inventory</h2>
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Product</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Stock</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-900" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-900 dark:text-white">${product.price.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleUpdateStock(product.id, product.stock || 0, -1)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {product.stock || 0}
                        </span>
                        <button 
                          onClick={() => handleUpdateStock(product.id, product.stock || 0, 1)}
                          className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setProductToDelete(product.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors inline-flex"
                        title="Remove Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No products in inventory. Add some products to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Earnings</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.today.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-500">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Orders Today</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{earnings.ordersToday}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Revenue</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.weekly.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Product</h3>
              <button 
                onClick={() => setIsAddingProduct(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Organic Bananas"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="2.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    required
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Meat">Meat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 1 kg, 1 bunch"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="https://..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddingProduct(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Product</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRemoveProduct(productToDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
