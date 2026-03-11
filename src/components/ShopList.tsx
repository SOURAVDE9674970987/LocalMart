import React, { useState, useMemo } from 'react';
import { ShopCard } from './ShopCard';
import { shops, Category } from '../data';

interface ShopListProps {
  selectedCategory: string | null;
  onSelectShop: (shopId: string) => void;
}

export function ShopList({ selectedCategory, onSelectShop }: ShopListProps) {
  const filteredShops = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') return shops;
    return shops.filter(shop => shop.categories.includes(selectedCategory as Category));
  }, [selectedCategory]);

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shops Near You</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Discover local stores delivering to your area</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredShops.map(shop => (
          <ShopCard key={shop.id} shop={shop} onClick={() => onSelectShop(shop.id)} />
        ))}
      </div>
      
      {filteredShops.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No shops found for this category.</p>
        </div>
      )}
    </section>
  );
}
