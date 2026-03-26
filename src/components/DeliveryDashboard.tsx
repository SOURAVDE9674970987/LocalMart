import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, DollarSign, TrendingUp, Calendar, Map as MapIcon, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'earnings' | 'performance'>('deliveries');
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [earnings, setEarnings] = useState({ today: 0, weekly: 0, monthly: 0, totalDeliveries: 0 });
  const [monthlyData, setMonthlyData] = useState<{ month: string, orders: number, earnings: number }[]>([]);
  const [hoursOnline, setHoursOnline] = useState<number>(0);
  const [activeDeliveryRoute, setActiveDeliveryRoute] = useState<{
    shopCoords: [number, number] | null,
    customerCoords: [number, number] | null,
    shopAddress: string,
    customerAddress: string,
    shopName: string,
    customerName: string
  } | null>(null);

  const activeDelivery = deliveries.find(d => d.driverId === auth.currentUser?.uid && d.status === 'delivering');
  const activeDeliveryId = activeDelivery?.id;

  useEffect(() => {
    if (activeDelivery) {
      const fetchCoords = async () => {
        try {
          let shopCoords: [number, number] | null = null;
          let customerCoords: [number, number] | null = null;

          if (activeDelivery.shopAddress) {
            const shopRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeDelivery.shopAddress)}`);
            const shopData = await shopRes.json();
            if (shopData && shopData.length > 0) {
              shopCoords = [parseFloat(shopData[0].lat), parseFloat(shopData[0].lon)];
            }
          }

          if (activeDelivery.deliveryAddress) {
            const custRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(activeDelivery.deliveryAddress)}`);
            const custData = await custRes.json();
            if (custData && custData.length > 0) {
              customerCoords = [parseFloat(custData[0].lat), parseFloat(custData[0].lon)];
            }
          }

          setActiveDeliveryRoute({
            shopCoords,
            customerCoords,
            shopAddress: activeDelivery.shopAddress,
            customerAddress: activeDelivery.deliveryAddress,
            shopName: activeDelivery.shopName || 'Shop',
            customerName: activeDelivery.customerName || 'Customer'
          });
        } catch (error) {
          console.error("Error geocoding addresses:", error);
        }
      };

      fetchCoords();
    } else {
      setActiveDeliveryRoute(null);
    }
  }, [activeDeliveryId]);

  useEffect(() => {
    const driverId = auth.currentUser?.uid;
    if (!driverId) return;

    // Start a timer for hours online
    const storageKey = `driverSessionStart_${driverId}`;
    const storedStartTime = localStorage.getItem(storageKey);
    const startTime = storedStartTime ? parseInt(storedStartTime, 10) : Date.now();
    if (!storedStartTime) {
      localStorage.setItem(storageKey, startTime.toString());
    }

    const updateHours = () => {
      const elapsed = Date.now() - startTime;
      setHoursOnline(elapsed / (1000 * 60 * 60)); // Convert ms to hours
    };
    
    updateHours();
    const timer = setInterval(updateHours, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    // Get driver location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to a default location (e.g., city center)
          setDriverLocation([40.7128, -74.0060]);
        }
      );
    } else {
      setDriverLocation([40.7128, -74.0060]);
    }

    // Listen for orders
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      const driverId = auth.currentUser?.uid;
      
      // Filter orders:
      // 1. Unassigned orders that are ready
      // 2. Orders assigned to this driver
      const relevantOrders = allOrders.filter(order => {
        if (order.driverId === driverId) {
          if (order.status === 'completed') {
            if (order.completedAt) {
              const completedTime = new Date(order.completedAt).getTime();
              return Date.now() - completedTime < 5 * 60 * 1000; // Keep for 5 minutes
            }
            return false;
          }
          return true;
        }
        if (!order.driverId && order.status === 'ready') {
          // In a real app, we would calculate actual distance using coordinates.
          // Since we don't have coordinates for the delivery address, we'll use the simulated distanceKm
          // and only show orders within 1km.
          return (order.distanceKm || 0) <= 1.0;
        }
        return false;
      });
      
      setDeliveries(relevantOrders);
      
      // Calculate earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let todayEarnings = 0;
      let weeklyEarnings = 0;
      let monthlyEarnings = 0;
      let totalDeliveries = 0;
      
      const monthlyStats: Record<string, { orders: number, earnings: number }> = {};
      
      allOrders.forEach(order => {
        if (order.driverId === driverId && order.status === 'completed') {
          const orderDate = new Date(order.createdAt);
          const month = orderDate.toLocaleString('default', { month: 'short' });
          
          if (!monthlyStats[month]) {
            monthlyStats[month] = { orders: 0, earnings: 0 };
          }
          
          monthlyStats[month].orders += 1;
          monthlyStats[month].earnings += (order.driverEarnings || 0);
          
          totalDeliveries++;
          
          if (orderDate >= today) {
            todayEarnings += (order.driverEarnings || 0);
          }
          if (orderDate >= weekAgo) {
            weeklyEarnings += (order.driverEarnings || 0);
          }
          if (orderDate >= startOfMonth) {
            monthlyEarnings += (order.driverEarnings || 0);
          }
        }
      });
      
      setEarnings({ 
        today: todayEarnings, 
        weekly: weeklyEarnings, 
        monthly: monthlyEarnings,
        totalDeliveries 
      });
      
      const formattedMonthlyData = Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        orders: data.orders,
        earnings: data.earnings
      }));
      
      setMonthlyData(formattedMonthlyData);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const driverId = auth.currentUser?.uid;
      if (!driverId) return;
      
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        driverId,
        status: 'delivering'
      });
    } catch (error) {
      console.error("Error accepting order:", error);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error completing order:", error);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location. Please ensure location services are enabled.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const hoursData = [
    { name: 'Mon', hours: 6.5 },
    { name: 'Tue', hours: 8.0 },
    { name: 'Wed', hours: 7.5 },
    { name: 'Thu', hours: 5.0 },
    { name: 'Fri', hours: 9.0 },
    { name: 'Sat', hours: 10.5 },
    { name: 'Sun', hours: 4.0 },
  ];

  // Map coordinates
  const driverPos: [number, number] = driverLocation || [40.7128, -74.0060]; // NYC
  
  let route: [number, number][] = [];
  let mapCenter = driverPos;

  if (activeDeliveryRoute) {
    route.push(driverPos);
    if (activeDeliveryRoute.shopCoords) {
      route.push(activeDeliveryRoute.shopCoords);
    }
    if (activeDeliveryRoute.customerCoords) {
      route.push(activeDeliveryRoute.customerCoords);
    }
    
    // Center map on the first destination (shop or customer)
    if (activeDeliveryRoute.shopCoords) {
      mapCenter = [
        (driverPos[0] + activeDeliveryRoute.shopCoords[0]) / 2,
        (driverPos[1] + activeDeliveryRoute.shopCoords[1]) / 2
      ];
    }
  } else {
    const destinationPos: [number, number] = [driverPos[0] + 0.0080, driverPos[1] + 0.0150];
    route = [
      driverPos,
      [driverPos[0] + 0.0022, driverPos[1] + 0.0060],
      [driverPos[0] + 0.0052, driverPos[1] + 0.0110],
      destinationPos
    ];
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage deliveries and track earnings</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          {(['deliveries', 'earnings', 'performance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap flex-1 sm:flex-none ${
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

      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{deliveries.filter(d => d.status === 'delivering').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{earnings.today > 0 ? Math.round(earnings.today) : 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hours Online</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{hoursOnline.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Live Map
                </h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleGetLocation}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <MapPin className="w-4 h-4" />
                    Get My Location
                  </button>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Navigation className="w-4 h-4" />
                    Navigating
                  </span>
                </div>
              </div>
              <div className="flex-1 min-h-[400px] relative bg-gray-100 dark:bg-gray-900 z-0">
                <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <MapUpdater center={mapCenter} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={driverPos} icon={driverIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                  
                  {activeDeliveryRoute ? (
                    <>
                      {activeDeliveryRoute.shopCoords && (
                        <Marker position={activeDeliveryRoute.shopCoords}>
                          <Popup>
                            <strong>Shop: {activeDeliveryRoute.shopName}</strong><br/>
                            {activeDeliveryRoute.shopAddress}
                          </Popup>
                        </Marker>
                      )}
                      {activeDeliveryRoute.customerCoords && (
                        <Marker position={activeDeliveryRoute.customerCoords}>
                          <Popup>
                            <strong>Customer: {activeDeliveryRoute.customerName}</strong><br/>
                            {activeDeliveryRoute.customerAddress}
                          </Popup>
                        </Marker>
                      )}
                    </>
                  ) : (
                    <Marker position={route[route.length - 1]}>
                      <Popup>Delivery Destination</Popup>
                    </Marker>
                  )}
                  
                  <Polyline positions={route} color="#10b981" weight={4} dashArray="8, 8" />
                </MapContainer>

                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between z-[1000]">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Next Stop</p>
                    <p className="text-gray-900 dark:text-white font-bold">
                      {activeDeliveryRoute ? activeDeliveryRoute.shopName : '456 Oak Ave'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">ETA</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">4 mins</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Deliveries</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700 flex-1 overflow-y-auto">
                {deliveries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No active deliveries available.</div>
                ) : (
                  deliveries.map((delivery) => (
                    <div key={delivery.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 dark:text-white">{delivery.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            delivery.status === 'delivering' 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium text-sm mb-0.5">Shop: {delivery.shopName || 'Unknown Shop'}</p>
                            <div className="flex items-start text-xs text-gray-500 dark:text-gray-400 gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{delivery.shopAddress || 'Address not available'}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-900 dark:text-white font-medium text-sm mb-0.5">Customer: {delivery.customerName || delivery.customerId}</p>
                            <div className="flex items-start text-xs text-gray-500 dark:text-gray-400 gap-1">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{delivery.deliveryAddress}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Distance</span>
                            <span className="font-medium text-gray-900 dark:text-white">{delivery.distanceKm} km</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Earnings</span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">${(delivery.driverEarnings || 0).toFixed(2)}</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (delivery.status === 'delivering') handleCompleteOrder(delivery.id);
                              else if (delivery.status !== 'completed') handleAcceptOrder(delivery.id);
                            }}
                            disabled={delivery.status === 'completed'}
                            className={`px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors ${
                              delivery.status === 'completed' 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}>
                            {delivery.status === 'completed' ? 'Delivered' : delivery.status === 'delivering' ? 'Mark Delivered' : 'Accept'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Earnings</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.today.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.weekly.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.monthly.toFixed(2)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {earnings.totalDeliveries} deliveries completed
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Monthly Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Month</th>
                    <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Deliveries</th>
                    <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Earnings</th>
                    <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Avg/Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((data) => (
                    <tr key={data.month} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{data.month}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{data.orders}</td>
                      <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">${data.earnings}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">${(data.earnings / data.orders).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hours Worked (This Week)</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Track your daily active hours on the platform</p>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hoursData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: '#10B981', opacity: 0.1 }}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#10B981' }}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill="#10B981" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
