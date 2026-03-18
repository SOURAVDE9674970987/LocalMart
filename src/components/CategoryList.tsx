import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface CategoryListProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

interface CategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const defaultCategories: Record<string, { icon: string, color: string }> = {
  'Grocery': { icon: 'ShoppingBag', color: 'bg-orange-100 text-orange-600' },
  'Vegetables': { icon: 'Carrot', color: 'bg-green-100 text-green-600' },
  'Pharmacy': { icon: 'Pill', color: 'bg-blue-100 text-blue-600' },
  'Snacks': { icon: 'Cookie', color: 'bg-yellow-100 text-yellow-600' },
};

const getRandomColor = (index: number) => {
  const colors = [
    'bg-red-100 text-red-600',
    'bg-blue-100 text-blue-600',
    'bg-green-100 text-green-600',
    'bg-yellow-100 text-yellow-600',
    'bg-purple-100 text-purple-600',
    'bg-pink-100 text-pink-600',
    'bg-indigo-100 text-indigo-600',
    'bg-teal-100 text-teal-600',
  ];
  return colors[index % colors.length];
};

export function CategoryList({ selectedCategory, onSelectCategory }: CategoryListProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    // First listen to products to know which shops are active
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (productsSnapshot) => {
      const activeShopIds = new Set<string>();
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.shopId) {
          activeShopIds.add(data.shopId);
        }
      });

      // Then listen to shops and only extract categories from active shops
      const unsubscribeShops = onSnapshot(collection(db, 'shops'), (shopsSnapshot) => {
        const uniqueCategories = new Set<string>();
        shopsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Only process categories if the shop has products
          if (!activeShopIds.has(doc.id)) return;
          
          let shopCategories = data.categories;
          
          const processCategory = (cat: any) => {
            if (Array.isArray(cat)) {
              cat.forEach(processCategory);
            } else if (typeof cat === 'string') {
              try {
                const parsed = JSON.parse(cat);
                if (Array.isArray(parsed)) {
                  parsed.forEach(processCategory);
                } else if (typeof parsed === 'string') {
                  uniqueCategories.add(parsed);
                } else {
                  uniqueCategories.add(cat);
                }
              } catch (e) {
                // If it's a string like "['Groceries', 'Organic']" that fails JSON.parse
                // Try to clean it up manually
                const cleaned = cat.replace(/^\[|\]$/g, '').replace(/['"]/g, '');
                if (cleaned.includes(',')) {
                  cleaned.split(',').forEach(c => uniqueCategories.add(c.trim()));
                } else {
                  uniqueCategories.add(cat.trim());
                }
              }
            }
          };

          if (typeof shopCategories === 'string') {
            processCategory(shopCategories);
          } else if (Array.isArray(shopCategories)) {
            shopCategories.forEach(processCategory);
          }
        });

        const categoriesList = Array.from(uniqueCategories).map((name, index) => {
          const defaultStyle = defaultCategories[name];
          return {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            icon: defaultStyle ? defaultStyle.icon : 'Tag',
            color: defaultStyle ? defaultStyle.color : getRandomColor(index)
          };
        });

        setCategories(categoriesList);
      });

      return () => unsubscribeShops();
    });

    return () => unsubscribeProducts();
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="py-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-4 sm:px-6 lg:px-8">Shop by Category</h2>
      <div className="flex overflow-x-auto hide-scrollbar px-4 sm:px-6 lg:px-8 gap-4 pb-4">
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex flex-col items-center justify-center min-w-[80px] h-[100px] rounded-2xl transition-all ${
            selectedCategory === null
              ? 'bg-emerald-600 text-white shadow-md scale-105'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <div className={`p-3 rounded-full mb-2 ${selectedCategory === null ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <Icons.LayoutGrid className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">All</span>
        </button>
        
        {categories.map((category) => {
          const IconComponent = (Icons[category.icon as keyof typeof Icons] || Icons.Tag) as React.ElementType;
          const isSelected = selectedCategory === category.name;
          
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.name)}
              className={`flex flex-col items-center justify-center min-w-[80px] h-[100px] rounded-2xl transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`p-3 rounded-full mb-2 ${isSelected ? 'bg-white/20' : category.color}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
