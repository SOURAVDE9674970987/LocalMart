import React, { useState } from 'react';
import { Package, MapPin, Clock, CheckCircle, DollarSign, TrendingUp, Calendar, Map as MapIcon, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export function DeliveryDashboard() {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'earnings' | 'performance'>('deliveries');

  const deliveries = [
    {
      id: 'ORD-1029',
      customer: 'Sarah Johnson',
      address: '123 Main St, Apt 4B',
      status: 'Ready for Pickup',
      time: '10 mins ago',
      amount: '$45.00',
      distance: '2.4 km'
    },
    {
      id: 'ORD-1030',
      customer: 'Michael Chen',
      address: '456 Oak Ave',
      status: 'In Transit',
      time: 'Just now',
      amount: '$32.50',
      distance: '1.1 km'
    }
  ];

  const hoursData = [
    { name: 'Mon', hours: 6.5 },
    { name: 'Tue', hours: 8.0 },
    { name: 'Wed', hours: 7.5 },
    { name: 'Thu', hours: 5.0 },
    { name: 'Fri', hours: 9.0 },
    { name: 'Sat', hours: 10.5 },
    { name: 'Sun', hours: 4.0 },
  ];

  const monthlyData = [
    { month: 'Jan', orders: 340, earnings: 1250 },
    { month: 'Feb', orders: 410, earnings: 1680 },
    { month: 'Mar', orders: 380, earnings: 1450 },
  ];

  // Map coordinates
  const driverPos: [number, number] = [40.7128, -74.0060]; // NYC
  const destinationPos: [number, number] = [40.7200, -73.9900];
  const route: [number, number][] = [
    driverPos,
    [40.7150, -74.0000],
    [40.7180, -73.9950],
    destinationPos
  ];

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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">14</p>
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">4.5h</p>
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
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  Navigating
                </span>
              </div>
              <div className="flex-1 min-h-[400px] relative bg-gray-100 dark:bg-gray-900 z-0">
                <MapContainer center={driverPos} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={driverPos} icon={driverIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                  <Marker position={destinationPos}>
                    <Popup>Delivery Destination</Popup>
                  </Marker>
                  <Polyline positions={route} color="#10b981" weight={4} dashArray="8, 8" />
                </MapContainer>

                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between z-[1000]">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Next Stop</p>
                    <p className="text-gray-900 dark:text-white font-bold">456 Oak Ave</p>
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
                {deliveries.map((delivery) => (
                  <div key={delivery.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">{delivery.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          delivery.status === 'In Transit' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {delivery.status}
                        </span>
                      </div>
                      
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium mb-1">{delivery.customer}</p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 gap-1">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{delivery.address}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Distance</span>
                          <span className="font-medium text-gray-900 dark:text-white">{delivery.distance}</span>
                        </div>
                        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors">
                          {delivery.status === 'In Transit' ? 'Mark Delivered' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$85.50</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> +12% from yesterday
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$420.00</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                45 deliveries completed
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">$1,450.00</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                380 deliveries completed
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
