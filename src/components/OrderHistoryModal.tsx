import React from 'react';
import { X, Clock, Package, ChevronRight } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderHistoryModal({ isOpen, onClose }: OrderHistoryModalProps) {
  if (!isOpen) return null;

  // Mock order history
  const orders = [
    {
      id: 'ORD-1092',
      date: 'Oct 24, 2023',
      total: 34.50,
      status: 'Delivered',
      items: ['Organic Bananas', 'Whole Milk', 'Farm Fresh Eggs']
    },
    {
      id: 'ORD-0981',
      date: 'Oct 15, 2023',
      total: 12.99,
      status: 'Delivered',
      items: ['Paracetamol 500mg', 'Band-Aids']
    },
    {
      id: 'ORD-0844',
      date: 'Oct 02, 2023',
      total: 45.20,
      status: 'Delivered',
      items: ['Chicken Breast', 'Broccoli', 'Brown Rice', 'Olive Oil']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            Order History
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{order.id}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">${order.total.toFixed(2)}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 mt-1">
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3 flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate pr-4">
                  {order.items.join(', ')}
                </p>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
