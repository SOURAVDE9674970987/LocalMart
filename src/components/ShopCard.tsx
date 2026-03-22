import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Shop } from '../data';

interface ShopCardProps {
  shop: Shop;
  onClick: () => void;
  key?: React.Key;
}

export function ShopCard({ shop, onClick }: ShopCardProps) {
  const getNormalizedCategories = () => {
    let shopCategories = shop.categories;
    let normalizedCategories: string[] = [];
    
    const processCategory = (cat: any) => {
      if (Array.isArray(cat)) {
        cat.forEach(processCategory);
      } else if (typeof cat === 'string') {
        try {
          const parsed = JSON.parse(cat);
          if (Array.isArray(parsed)) {
            parsed.forEach(processCategory);
          } else if (typeof parsed === 'string') {
            normalizedCategories.push(parsed);
          } else {
            normalizedCategories.push(cat);
          }
        } catch (e) {
          const cleaned = cat.replace(/^\[|\]$/g, '').replace(/['"]/g, '');
          if (cleaned.includes(',')) {
            cleaned.split(',').forEach(c => normalizedCategories.push(c.trim()));
          } else {
            normalizedCategories.push(cat.trim());
          }
        }
      }
    };

    if (typeof shopCategories === 'string') {
      processCategory(shopCategories);
    } else if (Array.isArray(shopCategories)) {
      shopCategories.forEach(processCategory);
    }
    
    return normalizedCategories;
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden border border-gray-100/50 dark:border-gray-700/50 group transform hover:-translate-y-1"
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={shop.image} 
          alt={shop.name} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
        
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-white/20 dark:border-gray-700/50 transform group-hover:scale-105 transition-transform duration-300">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 drop-shadow-sm" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{shop.rating}</span>
        </div>

        <div className="absolute bottom-5 left-5 right-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="text-white font-black text-2xl sm:text-3xl leading-tight mb-2 drop-shadow-lg">{shop.name}</h3>
          <div className="flex flex-wrap items-center gap-2 text-white/90 text-sm font-medium">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-white/10">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span className="text-white">{shop.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-white/10">
              <span className="text-white">${shop.deliveryFee.toFixed(2)} delivery</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 bg-white dark:bg-gray-800 relative z-10">
        <div className="flex flex-wrap gap-2">
          {getNormalizedCategories().map((category: string) => (
            <span key={category} className="text-xs font-bold tracking-wide px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
              {category}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
