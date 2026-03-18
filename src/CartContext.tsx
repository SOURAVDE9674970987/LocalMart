import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from './data';

export interface CartItem extends Product {
  quantity: number;
}

export interface Subscription {
  productId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  status: 'active' | 'paused';
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  loyaltyPoints: number;
  addLoyaltyPoints: (points: number) => void;
  subscriptions: Subscription[];
  addSubscription: (productId: string, frequency: 'weekly' | 'biweekly' | 'monthly') => void;
  removeSubscription: (productId: string) => void;
  toggleSubscriptionStatus: (productId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('localmart_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('localmart_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    const saved = localStorage.getItem('localmart_loyalty');
    return saved ? parseInt(saved, 10) : 150;
  });
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('localmart_subscriptions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('localmart_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('localmart_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('localmart_loyalty', loyaltyPoints.toString());
  }, [loyaltyPoints]);

  useEffect(() => {
    localStorage.setItem('localmart_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addLoyaltyPoints = (points: number) => {
    setLoyaltyPoints(prev => prev + points);
  };

  const addSubscription = (productId: string, frequency: 'weekly' | 'biweekly' | 'monthly') => {
    setSubscriptions(prev => {
      const existing = prev.find(s => s.productId === productId);
      if (existing) {
        return prev.map(s => s.productId === productId ? { ...s, frequency } : s);
      }
      return [...prev, { productId, frequency, status: 'active' }];
    });
  };

  const removeSubscription = (productId: string) => {
    setSubscriptions(prev => prev.filter(s => s.productId !== productId));
  };

  const toggleSubscriptionStatus = (productId: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.productId === productId) {
        return { ...s, status: s.status === 'active' ? 'paused' : 'active' };
      }
      return s;
    }));
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        wishlist,
        toggleWishlist,
        loyaltyPoints,
        addLoyaltyPoints,
        subscriptions,
        addSubscription,
        removeSubscription,
        toggleSubscriptionStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
