import React, { useState, useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { products } from '../data';
import { SlidersHorizontal } from 'lucide-react';

interface ProductListProps {
  selectedCategory: string | null;
}

type SortOption = 'popular' | 'price_asc' | 'price_desc';
type DietaryFilter = 'All' | 'Vegan' | 'Gluten-Free' | 'Organic';

export function ProductList({ selectedCategory }: ProductListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Category Filter
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Dietary Filter
    if (dietaryFilter !== 'All') {
      result = result.filter((p) => p.dietary?.includes(dietaryFilter));
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
      return 0;
    });

    return result;
  }, [selectedCategory, dietaryFilter, sortBy]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {selectedCategory ? `${selectedCategory} Items` : 'Trending Near You'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            {selectedCategory ? `Explore our best ${selectedCategory.toLowerCase()} products` : 'Discover what others are buying right now'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
              showFilters 
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <option value="popular">Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[1.5rem] flex flex-wrap gap-3 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 mr-2 self-center uppercase tracking-wider">Dietary:</span>
          {(['All', 'Vegan', 'Gluten-Free', 'Organic'] as DietaryFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setDietaryFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                dietaryFilter === filter 
                  ? 'bg-emerald-600 text-white shadow-[0_4px_12px_-4px_rgba(5,150,105,0.4)] scale-105' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700/50 mt-8">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <SlidersHorizontal className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Try adjusting your filters or search criteria.</p>
          <button 
            onClick={() => { setDietaryFilter('All'); setSortBy('popular'); }}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
