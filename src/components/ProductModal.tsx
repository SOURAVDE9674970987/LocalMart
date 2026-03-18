import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Plus, Minus, Info, ShieldCheck, Leaf } from 'lucide-react';
import { Product } from '../data';
import { useCart } from '../CartContext';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const { items, addToCart, updateQuantity, wishlist, toggleWishlist } = useCart();
  const [activeImage, setActiveImage] = useState(0);

  if (!isOpen) return null;

  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = wishlist.includes(product.id);
  
  const images = product.images || [product.image];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl transform transition-all flex flex-col md:flex-row max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Gallery */}
        <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800 p-6 flex flex-col">
          <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-white dark:bg-gray-900 flex items-center justify-center">
            <img 
              src={images[activeImage]} 
              alt={product.name} 
              className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal"
            />
            {product.originalPrice && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-sm">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-white dark:bg-gray-900 ${activeImage === idx ? 'border-emerald-500' : 'border-transparent'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">{product.category}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.name}
              </h2>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
            </button>
          </div>

          <p className="text-gray-500 dark:text-gray-400 mb-6">{product.unit}</p>

          <div className="flex items-end gap-3 mb-8">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-lg text-gray-400 dark:text-gray-500 line-through mb-1">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>

          <div className="space-y-6 flex-1">
            {product.dietary && product.dietary.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.dietary.map(diet => (
                  <span key={diet} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                    <Leaf className="w-3 h-3" />
                    {diet}
                  </span>
                ))}
              </div>
            )}

            {product.isPrescriptionRequired && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">Prescription Required</h4>
                  <p className="text-blue-700 dark:text-blue-400 text-xs mt-1">You will need to upload a valid prescription during checkout for this item.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {product.expiryDate && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shelf Life</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{product.expiryDate}</p>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Delivery Time</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{product.deliveryTime}</p>
              </div>
            </div>

            {product.ingredients && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  Ingredients
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.ingredients}
                </p>
              </div>
            )}

            {product.nutrition && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-400" />
                  Nutritional Info
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.nutrition}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            {product.stock !== undefined && product.stock <= 0 ? (
              <div className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-2xl font-bold flex items-center justify-center border border-red-200 dark:border-red-800/50">
                Currently Out of Stock
              </div>
            ) : quantity === 0 ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Cart
              </button>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(product.id, -1);
                  }}
                  className="p-3 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-xl text-emerald-800 dark:text-emerald-400 w-12 text-center">
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
                  className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
