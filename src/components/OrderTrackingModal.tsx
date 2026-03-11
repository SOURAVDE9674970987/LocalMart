import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, CheckCircle2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

export function OrderTrackingModal({ isOpen, onClose, address }: OrderTrackingModalProps) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(10);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setEta(10);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
        
        setEta(prev => {
          if (prev <= 0) return 0;
          return prev - 0.5;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const position: [number, number] = [40.7128, -74.0060]; // Mock driver location

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl transform transition-all flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            Order Tracking
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="h-64 bg-gray-100 dark:bg-gray-800 relative z-0">
          <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>Driver is here</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 z-10 relative shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Delivery</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.ceil(eta)} <span className="text-lg font-medium text-gray-500 dark:text-gray-400">mins</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivering to</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[150px] truncate">{address}</p>
            </div>
          </div>

          <div className="relative pt-1 mb-8">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <div 
                style={{ width: `${progress}%` }} 
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="text-emerald-600 dark:text-emerald-400">Order Placed</span>
              <span className={progress >= 50 ? 'text-emerald-600 dark:text-emerald-400' : ''}>On the way</span>
              <span className={progress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : ''}>Delivered</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center shrink-0">
              <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">John Doe</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your delivery partner</p>
            </div>
            <button className="ml-auto px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
