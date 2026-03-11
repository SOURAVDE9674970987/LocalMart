import React, { useState, useMemo } from 'react';
import { ArrowLeft, Star, Clock, Info, Search } from 'lucide-react';
import { shops, products } from '../data';
import { ProductCard } from './ProductCard';

interface ShopDetailsProps {
  shopId: string;
  onBack: () => void;
}

export function ShopDetails({ shopId, onBack }: ShopDetailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const shop = shops.find(s => s.id === shopId);
  
  const shopProducts = useMemo(() => {
    let filtered = products.filter(p => p.shopId === shopId);
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [shopId, searchQuery]);

  if (!shop) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Shop Header */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-b-3xl sm:rounded-3xl sm:mt-6 shadow-sm">
        <img 
          src={shop.image} 
          alt={shop.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{shop.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-bold">{shop.rating}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>{shop.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <Info className="w-4 h-4" />
              <span>Delivery: ${shop.deliveryFee.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Products</h2>
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              placeholder={`Search in ${shop.name}...`}
            />
          </div>
        </div>

        {shopProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {shopProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
