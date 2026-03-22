import React, { useState } from 'react';
import { Product } from '../data';
import { useCart } from '../CartContext';
import { Plus, Minus, Heart, ShoppingCart } from 'lucide-react';
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
      <div className="bg-white dark:bg-gray-800 rounded-[1.5rem] border border-gray-100/50 dark:border-gray-700/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative group">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-10 p-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-700"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </button>

        <div 
          className="relative aspect-square overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 cursor-pointer p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="object-contain w-full h-full transform group-hover:scale-110 transition-transform duration-500 drop-shadow-md"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-bold text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700">
            {product.deliveryTime}
          </div>
          {product.originalPrice && (
            <div className="absolute top-3 right-3 bg-rose-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-sm">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-grow bg-white dark:bg-gray-800">
          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1.5">{product.unit}</div>
          <h3 
            className="font-bold text-gray-900 dark:text-white leading-snug mb-3 line-clamp-2 flex-grow cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
              <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">${product.price.toFixed(2)}</div>
              {product.originalPrice && (
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 line-through mt-0.5">${product.originalPrice.toFixed(2)}</div>
              )}
            </div>
            
            {product.stock !== undefined && product.stock <= 0 ? (
              <div className="text-rose-500 font-bold text-sm bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-800/50">
                Out of Stock
              </div>
            ) : quantity === 0 ? (
              <div className="relative group/btn">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white font-bold py-2 px-4 rounded-xl transition-all duration-300 border border-emerald-200/50 dark:border-emerald-800/50 relative z-20 flex items-center gap-1.5 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-gray-700">
                  <span className="font-semibold">{product.name}</span> • ${product.price.toFixed(2)}
                  <div className="absolute top-full right-6 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center bg-emerald-600 text-white rounded-xl overflow-hidden shadow-md relative z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product.id, -1);
                  }}
                  className="p-2 hover:bg-emerald-700 transition-colors active:bg-emerald-800"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-sm min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.stock !== undefined && quantity >= product.stock) {
                      alert(`Only ${product.stock} items available in stock.`);
                      return;
                    }
                    updateQuantity(product.id, 1);
                  }}
                  className="p-2 hover:bg-emerald-700 transition-colors active:bg-emerald-800"
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
