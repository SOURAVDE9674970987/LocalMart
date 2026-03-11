import React from 'react';
import { products } from '../data';
import { ProductCard } from './ProductCard';
import { RotateCcw } from 'lucide-react';

export function BuyItAgain() {
  // Mock frequently bought items (e.g., milk, bread, paracetamol)
  const frequentlyBought = products.filter(p => ['g1', 'g2', 'p1'].includes(p.id));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 mt-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
        Buy it Again
      </h2>
      <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
        {frequentlyBought.map((product) => (
          <div key={product.id} className="min-w-[160px] sm:min-w-[200px] max-w-[200px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
