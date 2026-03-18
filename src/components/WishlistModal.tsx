import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../CartContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from './VendorDashboard';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && wishlist.length > 0) {
      const fetchWishlistProducts = async () => {
        setLoading(true);
        try {
          const productsData: Product[] = [];
          for (const id of wishlist) {
            const productDoc = await getDoc(doc(db, 'products', id));
            if (productDoc.exists()) {
              productsData.push({ id: productDoc.id, ...productDoc.data() } as Product);
            }
          }
          setWishlistProducts(productsData);
        } catch (error) {
          console.error("Error fetching wishlist products:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchWishlistProducts();
    } else if (isOpen && wishlist.length === 0) {
      setWishlistProducts([]);
    }
  }, [isOpen, wishlist]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            My Wishlist
            <span className="bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 text-xs px-2 py-0.5 rounded-full ml-2">
              {wishlist.length} items
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {wishlistProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 space-y-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Your wishlist is empty</p>
              <p className="text-sm text-center max-w-[250px]">Save items you buy frequently or want to buy later by clicking the heart icon on products.</p>
              <button
                onClick={onClose}
                className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-4 shadow-sm relative group">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors z-10"
                  >
                    <Heart className="w-4 h-4 fill-rose-500" />
                  </button>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-xl bg-gray-50 dark:bg-gray-900"
                  />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 pr-6">{product.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{product.unit}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="flex items-center justify-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors text-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
