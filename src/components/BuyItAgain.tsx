import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { RotateCcw } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs, limit, query, where, documentId } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Product } from './VendorDashboard';

export function BuyItAgain() {
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's past orders
        const ordersQuery = query(
          collection(db, 'orders'),
          where('customerId', '==', user.uid),
          limit(10)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const productIds = new Set<string>();
        ordersSnapshot.forEach(doc => {
          const orderData = doc.data();
          if (orderData.items) {
            orderData.items.forEach((item: any) => {
              if (item.id) {
                productIds.add(item.id);
              }
            });
          }
        });

        const uniqueProductIds = Array.from(productIds).slice(0, 10);

        if (uniqueProductIds.length > 0) {
          // Fetch the actual products
          const productsQuery = query(
            collection(db, 'products'),
            where(documentId(), 'in', uniqueProductIds)
          );
          const productsSnapshot = await getDocs(productsQuery);
          const productsData = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          
          setFrequentlyBought(productsData);
        } else {
          // Fallback to trending products if no past orders
          const fallbackQuery = query(collection(db, 'products'), limit(5));
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const fallbackData = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setFrequentlyBought(fallbackData);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading || frequentlyBought.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 mt-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <RotateCcw className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
        Buy it Again
      </h2>
      <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
        {frequentlyBought.map((product) => (
          <div key={product.id} className="min-w-[160px] sm:min-w-[200px] max-w-[200px]">
            <ProductCard product={product as any} />
          </div>
        ))}
      </div>
    </div>
  );
}
