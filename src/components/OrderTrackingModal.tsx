import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, CheckCircle2, Navigation, ClipboardList, PackageOpen, Truck } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  orderId?: string | null;
}

export function OrderTrackingModal({ isOpen, onClose, address, orderId }: OrderTrackingModalProps) {
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(10);
  const [orderStatus, setOrderStatus] = useState<string>('pending');
  const [orderAddress, setOrderAddress] = useState<string>(address);

  useEffect(() => {
    if (isOpen && orderId) {
      setOrderAddress(address); // Reset to default address initially
      const orderRef = doc(db, 'orders', orderId);
      const unsubscribe = onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrderStatus(data.status);
          if (data.deliveryAddress) {
            setOrderAddress(data.deliveryAddress);
          }
          
          // Update progress and ETA based on status
          switch (data.status) {
            case 'pending':
              setProgress(0);
              setEta(15);
              break;
            case 'accepted':
            case 'preparing':
              setProgress(33);
              setEta(12);
              break;
            case 'ready':
              setProgress(50);
              setEta(10);
              break;
            case 'delivering':
              setProgress(66);
              setEta(5);
              break;
            case 'completed':
              setProgress(100);
              setEta(0);
              break;
            case 'rejected':
              setProgress(0);
              setEta(0);
              break;
            default:
              setProgress(0);
              setEta(15);
          }
        }
      });

      return () => unsubscribe();
    } else if (isOpen) {
      // Fallback if no orderId
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
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const getStatusText = () => {
    switch (orderStatus) {
      case 'pending': return 'Order Placed';
      case 'accepted': return 'Order Accepted';
      case 'preparing': return 'Packing Items';
      case 'ready': return 'Waiting for Driver';
      case 'delivering': return 'On the Way';
      case 'completed': return 'Delivered';
      case 'rejected': return 'Order Cancelled';
      default: return 'Processing';
    }
  };

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

        <div className="p-6 bg-white dark:bg-gray-900 z-10 relative shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Delivery</p>
              {orderStatus === 'completed' ? (
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  Delivered
                </p>
              ) : orderStatus === 'rejected' ? (
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                  Cancelled
                </p>
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.ceil(eta)} <span className="text-lg font-medium text-gray-500 dark:text-gray-400">mins</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Delivering to</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white max-w-[150px] truncate">{orderAddress}</p>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute top-5 left-[12.5%] w-[75%] h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${orderStatus === 'rejected' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${orderStatus === 'rejected' ? 100 : progress}%` }}
              ></div>
            </div>
            
            <div className="relative flex justify-between">
              {/* Step 1: Placed */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${orderStatus === 'rejected' ? 'bg-rose-500 text-white' : progress >= 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  {orderStatus === 'rejected' ? <X className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium mt-2 text-center ${orderStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : progress >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {orderStatus === 'rejected' ? 'Cancelled' : 'Order Placed'}
                </span>
              </div>

              {/* Step 2: Preparing */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${orderStatus === 'rejected' ? 'bg-rose-500 text-white' : progress >= 33 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  {orderStatus === 'rejected' ? <X className="w-5 h-5" /> : <PackageOpen className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium mt-2 text-center ${orderStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : progress >= 33 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {orderStatus === 'rejected' ? 'Cancelled' : 'Preparing'}
                </span>
              </div>

              {/* Step 3: Out for Delivery */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${orderStatus === 'rejected' ? 'bg-rose-500 text-white' : progress >= 66 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  {orderStatus === 'rejected' ? <X className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium mt-2 text-center ${orderStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : progress >= 66 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {orderStatus === 'rejected' ? 'Cancelled' : 'Out for Delivery'}
                </span>
              </div>

              {/* Step 4: Delivered */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-500 ${orderStatus === 'rejected' ? 'bg-rose-500 text-white' : progress >= 100 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                  {orderStatus === 'rejected' ? <X className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium mt-2 text-center ${orderStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : progress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {orderStatus === 'rejected' ? 'Cancelled' : 'Delivered'}
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-4 flex items-center gap-4 ${orderStatus === 'rejected' ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${orderStatus === 'rejected' ? 'bg-rose-100 dark:bg-rose-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
              {orderStatus === 'rejected' ? (
                <X className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              ) : (
                <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <p className={`font-semibold ${orderStatus === 'rejected' ? 'text-rose-900 dark:text-rose-100' : 'text-gray-900 dark:text-white'}`}>{getStatusText()}</p>
              <p className={`text-sm ${orderStatus === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {orderStatus === 'delivering' ? 'Your delivery partner is on the way' : orderStatus === 'rejected' ? 'This order was cancelled by the shop' : 'Waiting for updates...'}
              </p>
            </div>
            {orderStatus === 'delivering' && (
              <button className="ml-auto px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Call
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
