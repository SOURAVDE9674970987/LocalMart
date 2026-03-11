import React, { useState } from 'react';
import { Product } from '../data';
import { useCart } from '../CartContext';
import { Plus, Minus, Heart } from 'lucide-react';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity, wishlist, toggleWishlist } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = wishlist.includes(product.id);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full relative group">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-700"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </button>

        <div 
          className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-200 shadow-sm">
            {product.deliveryTime}
          </div>
          {product.originalPrice && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.unit}</div>
          <h3 
            className="font-semibold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2 flex-grow cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
          >
            {product.name}
          </h3>
          
          <div className="flex items-end justify-between mt-auto pt-2">
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</div>
              {product.originalPrice && (
                <div className="text-xs text-gray-400 dark:text-gray-500 line-through">${product.originalPrice.toFixed(2)}</div>
              )}
            </div>
            
            {quantity === 0 ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-semibold py-1.5 px-4 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800 relative z-20"
              >
                ADD
              </button>
            ) : (
              <div className="flex items-center bg-emerald-600 text-white rounded-xl overflow-hidden shadow-sm relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product.id, -1);
                  }}
                  className="p-1.5 hover:bg-emerald-700 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-2 font-semibold text-sm min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product.id, 1);
                  }}
                  className="p-1.5 hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductModal 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
