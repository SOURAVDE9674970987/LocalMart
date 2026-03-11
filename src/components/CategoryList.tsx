import React from 'react';
import { categories } from '../data';
import * as Icons from 'lucide-react';

interface CategoryListProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryList({ selectedCategory, onSelectCategory }: CategoryListProps) {
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
          const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ElementType;
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
