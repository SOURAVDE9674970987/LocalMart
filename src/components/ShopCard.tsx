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
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100 dark:border-gray-700 group"
    >
      <div className="relative h-40 overflow-hidden">
        <img 
          src={shop.image} 
          alt={shop.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <h3 className="text-white font-bold text-lg leading-tight">{shop.name}</h3>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">{shop.rating}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="font-medium">{shop.deliveryTime}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span>Delivery: ${shop.deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {getNormalizedCategories().map((category: string) => (
            <span key={category} className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
              {category}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
