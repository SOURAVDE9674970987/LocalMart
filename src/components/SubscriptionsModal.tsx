import React from 'react';
import { X, Calendar, Play, Pause, Trash2 } from 'lucide-react';
import { useCart } from '../CartContext';
import { products } from '../data';

interface SubscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionsModal({ isOpen, onClose }: SubscriptionsModalProps) {
  const { subscriptions, toggleSubscriptionStatus, removeSubscription } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            My Subscriptions
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {subscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 space-y-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">No active subscriptions</p>
              <p className="text-sm text-center max-w-[250px]">Subscribe to your daily essentials to get them delivered automatically.</p>
              <button
                onClick={onClose}
                className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const product = products.find(p => p.id === sub.productId);
                if (!product) return null;

                return (
                  <div key={sub.productId} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border ${sub.status === 'active' ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-700'} flex flex-col sm:flex-row gap-4 shadow-sm transition-colors`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-20 h-20 object-cover rounded-xl bg-gray-50 dark:bg-gray-900 ${sub.status === 'paused' ? 'opacity-50 grayscale' : ''}`}
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className={`font-semibold text-sm line-clamp-2 ${sub.status === 'active' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {product.name}
                          </h3>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${sub.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">Delivered {sub.frequency}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className={`font-bold ${sub.status === 'active' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          ${product.price.toFixed(2)} <span className="text-xs font-normal text-gray-500">/ delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSubscriptionStatus(sub.productId)}
                            className={`p-2 rounded-lg transition-colors ${sub.status === 'active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'}`}
                            title={sub.status === 'active' ? 'Pause Subscription' : 'Resume Subscription'}
                          >
                            {sub.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => removeSubscription(sub.productId)}
                            className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
                            title="Cancel Subscription"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
