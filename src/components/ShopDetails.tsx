import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Star, Clock, Info, Search } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { Shop, Product } from './VendorDashboard';

interface ShopDetailsProps {
  shopId: string;
  onBack: () => void;
}

export function ShopDetails({ shopId, onBack }: ShopDetailsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const shopDoc = await getDoc(doc(db, 'shops', shopId));
        if (shopDoc.exists()) {
          setShop({ id: shopDoc.id, ...shopDoc.data() } as Shop);
        }
      } catch (error) {
        console.error("Error fetching shop details:", error);
      }
    };

    fetchShopDetails();

    const productsQuery = query(collection(db, 'products'), where('shopId', '==', shopId));
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shopId]);
  
  const shopProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  }, [products, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-500">Loading shop details...</p>
      </div>
    );
  }

  if (!shop) return (
    <div className="text-center py-20">
      <p className="text-gray-500 text-lg mb-4">Shop not found.</p>
      <button onClick={onBack} className="text-emerald-600 font-medium">Go Back</button>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Shop Header */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-b-[2.5rem] sm:rounded-[2.5rem] sm:mt-6 shadow-xl">
        <img 
          src={shop.image} 
          alt={shop.name} 
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-2xl text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg">{shop.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm sm:text-base font-medium">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-white/10">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow" />
              <span className="font-bold text-white">{shop.rating}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-white/10">
              <Clock className="w-5 h-5 text-emerald-300" />
              <span className="text-white">{shop.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-white/10">
              <Info className="w-5 h-5 text-blue-300" />
              <span className="text-white">Delivery: ${shop.deliveryFee.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">All Products</h2>
          <div className="relative w-full sm:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all shadow-sm hover:shadow-md"
              placeholder={`Search in ${shop.name}...`}
            />
          </div>
        </div>

        {shopProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {shopProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] border border-gray-100 dark:border-gray-700/50">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
