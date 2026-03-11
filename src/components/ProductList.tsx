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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {selectedCategory ? `${selectedCategory} Items` : 'Trending Near You'}
        </h2>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="popular">Popularity</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2 self-center">Dietary:</span>
          {(['All', 'Vegan', 'Gluten-Free', 'Organic'] as DietaryFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setDietaryFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                dietaryFilter === filter 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found matching your criteria.</p>
          <button 
            onClick={() => { setDietaryFilter('All'); setSortBy('popular'); }}
            className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
