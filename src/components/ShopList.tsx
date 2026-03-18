import React, { useState, useEffect, useMemo } from 'react';
import { ShopCard } from './ShopCard';
import { Category } from '../data';
import { db } from '../firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { Shop } from './VendorDashboard';

interface ShopListProps {
  selectedCategory: string | null;
  onSelectShop: (shopId: string) => void;
}

export function ShopList({ selectedCategory, onSelectShop }: ShopListProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopIds, setActiveShopIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products to determine which shops have inventory
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const shopIdsWithProducts = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.shopId) {
          shopIdsWithProducts.add(data.shopId);
        }
      });
      setActiveShopIds(shopIdsWithProducts);
    }, (error) => {
      console.error("Error fetching products for shop filtering:", error);
    });

    const unsubscribeShops = onSnapshot(collection(db, 'shops'), (snapshot) => {
      const shopsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shop[];
      setShops(shopsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching shops:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeShops();
    };
  }, []);

  const filteredShops = useMemo(() => {
    // First, filter out shops that have no products
    const activeShops = shops.filter(shop => activeShopIds.has(shop.id));

    if (!selectedCategory || selectedCategory === 'All') return activeShops;
    
    return activeShops.filter(shop => {
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
      
      return normalizedCategories.includes(selectedCategory as Category);
    });
  }, [selectedCategory, shops, activeShopIds]);

  if (loading) {
    return (
      <section className="py-8 px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading shops...</p>
      </section>
    );
  }

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
          <ShopCard key={shop.id} shop={shop as any} onClick={() => onSelectShop(shop.id)} />
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
