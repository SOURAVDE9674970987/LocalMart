import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingBag, Plus, Minus, ArrowRight, Tag, MessageSquare, Coins, Store } from 'lucide-react';
import { useCart } from '../CartContext';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { Shop } from './VendorDashboard';
import { StripeCheckout } from './CheckoutForm';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckoutSuccess?: (orderId?: string) => void;
  address: string;
}

export function Cart({ isOpen, onClose, onCheckoutSuccess, address }: CartProps) {
  const { items, updateQuantity, totalItems, totalPrice, loyaltyPoints, addLoyaltyPoints, clearCart } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [tip, setTip] = useState<number>(0);
  const [instructions, setInstructions] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectStatus = urlParams.get('redirect_status');
    const needsShops = isOpen || redirectStatus === 'succeeded';

    if (needsShops && shops.length === 0) {
      const fetchShops = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'shops'));
          const shopsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Shop[];
          setShops(shopsData);
        } catch (error) {
          console.error("Error fetching shops:", error);
        }
      };
      fetchShops();
    }
  }, [isOpen, shops.length]);



  // Group items by shop
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    items.forEach(item => {
      const shopId = item.shopId || 'localmart';
      if (!groups[shopId]) {
        groups[shopId] = [];
      }
      groups[shopId].push(item);
    });
    return groups;
  }, [items]);

  // Calculate total delivery fee (sum of delivery fees for all unique shops in cart)
  const totalDeliveryFee = useMemo(() => {
    return Object.keys(groupedItems).length * 1.5;
  }, [groupedItems]);

  const discount = isPromoApplied ? totalPrice * 0.1 : 0; // 10% discount
  const grandTotal = totalPrice - discount + totalDeliveryFee + tip;
  const pointsEarned = Math.floor(grandTotal);

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setIsPromoApplied(true);
    } else {
      alert('Invalid promo code. Try SAVE10');
    }
  };

  const handleCheckout = () => {
    localStorage.setItem('localmart_pending_checkout', JSON.stringify({
      tip,
      isPromoApplied,
      address
    }));
    setIsCheckingOut(true);
  };

  const handlePaymentSuccess = async (savedTip?: number, savedPromoApplied?: boolean, savedAddress?: string) => {
    const actualTip = savedTip !== undefined ? savedTip : tip;
    const actualPromoApplied = savedPromoApplied !== undefined ? savedPromoApplied : isPromoApplied;
    const actualAddress = savedAddress !== undefined ? savedAddress : address;

    try {
      const customerId = auth.currentUser?.uid || 'guest';
      const createdAt = new Date().toISOString();

      let firstOrderId: string | undefined;

      // Process each shop's order
      for (const [shopId, shopItems] of Object.entries(groupedItems)) {
        const itemsList = Array.isArray(shopItems) ? shopItems : [];
        if (itemsList.length === 0) continue;

        // Calculate totals for this specific shop
        const shopTotalItemsPrice = itemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Apply proportional discount if promo code used
        const shopDiscount = actualPromoApplied ? shopTotalItemsPrice * 0.1 : 0;
        const shopSubtotal = shopTotalItemsPrice - shopDiscount;
        
        // Delivery fee is fixed $1.5 per shop
        const deliveryFee = 1.5;
        
        // Calculate earnings
        const commission = shopSubtotal * 0.05; // 5% commission
        const vendorEarnings = shopSubtotal - commission;
        
        // Simulate distance for driver earnings (0.1 to 1.0 km)
        const distanceKm = parseFloat((Math.random() * 0.9 + 0.1).toFixed(2));
        const driverEarnings = distanceKm; // $1 per km
        const appEarnings = deliveryFee - driverEarnings + commission;

        const shopTotalAmount = shopSubtotal + deliveryFee + (actualTip / Object.keys(groupedItems).length); // Split tip evenly
        
        const shopDetails = shops.find(s => s.id === shopId);
        const shopName = shopDetails?.name || (shopId === 'localmart' ? 'LocalMart Express' : 'Unknown Shop');
        const shopAddress = shopDetails?.address || 'Unknown Address';

        // Create order document
        const orderRef = await addDoc(collection(db, 'orders'), {
          customerId,
          customerName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Guest',
          customerPhoto: auth.currentUser?.photoURL || null,
          shopId,
          shopName,
          shopAddress,
          items: itemsList.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          totalAmount: shopTotalAmount,
          status: 'pending',
          deliveryAddress: actualAddress,
          createdAt,
          deliveryFee,
          commission,
          vendorEarnings,
          driverEarnings,
          distanceKm,
          appEarnings
        });

        if (!firstOrderId) {
          firstOrderId = orderRef.id;
        }

        // Deduct stock for each item
        for (const item of itemsList) {
          if (item.id && item.shopId !== 'localmart') {
            try {
              const productRef = doc(db, 'products', item.id);
              await updateDoc(productRef, {
                stock: increment(-item.quantity)
              });
            } catch (err) {
              console.error(`Failed to update stock for product ${item.id}:`, err);
            }
          }
        }
      }

      addLoyaltyPoints(pointsEarned);
      clearCart();
      setIsCheckingOut(false);
      if (onCheckoutSuccess) {
        onCheckoutSuccess(firstOrderId);
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error creating orders:", error);
      alert("There was an error processing your order. Please contact support.");
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectStatus = urlParams.get('redirect_status');
    
    if (redirectStatus === 'succeeded' && items.length > 0 && shops.length > 0) {
      // Prevent double processing
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const pendingCheckoutStr = localStorage.getItem('localmart_pending_checkout');
      let savedTip = 0;
      let savedPromoApplied = false;
      let savedAddress = address;
      
      if (pendingCheckoutStr) {
        try {
          const pending = JSON.parse(pendingCheckoutStr);
          savedTip = pending.tip || 0;
          savedPromoApplied = pending.isPromoApplied || false;
          savedAddress = pending.address || address;
        } catch (e) {
          console.error("Error parsing pending checkout", e);
        }
      }
      
      handlePaymentSuccess(savedTip, savedPromoApplied, savedAddress);
    }
  }, [items.length, shops.length, address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-gray-50 dark:bg-gray-900 h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            My Cart
            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full ml-2">
              {totalItems} items
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isCheckingOut ? (
            <div className="py-4">
              <StripeCheckout 
                amount={grandTotal} 
                onSuccess={handlePaymentSuccess} 
                onCancel={() => setIsCheckingOut(false)} 
              />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Your cart is empty</p>
              <p className="text-sm text-center max-w-[200px]">Looks like you haven't added anything to your cart yet.</p>
              <button
                onClick={onClose}
                className="mt-6 bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grouped Items List */}
              {Object.entries(groupedItems).map(([shopId, shopItems]) => {
                const shop = shops.find(s => s.id === shopId);
                
                // Ensure shopItems is an array before mapping
                const itemsList = Array.isArray(shopItems) ? shopItems : [];

                return (
                  <div key={shopId} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                          {shop ? shop.name : 'LocalMart Express'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Delivery: ${shop ? shop.deliveryFee.toFixed(2) : '2.99'}
                      </span>
                    </div>
                    <div className="p-4 space-y-4">
                      {itemsList.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl bg-gray-50 dark:bg-gray-900"
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">{item.name}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.unit}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="font-bold text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</div>
                              <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg overflow-hidden border border-emerald-100 dark:border-emerald-800">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2 font-semibold text-sm min-w-[24px] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Delivery Instructions */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Delivery Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Leave at the front door, ring bell..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
              </div>

              {/* Promo Code */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter SAVE10"
                    disabled={isPromoApplied}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={isPromoApplied || !promoCode}
                    className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                  >
                    {isPromoApplied ? 'Applied' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Driver Tip */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <label className="text-sm font-medium text-gray-900 dark:text-white mb-3 block">
                  Tip your delivery partner
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 5].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTip(amount)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        tip === amount
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {amount === 0 ? 'No Tip' : `$${amount}`}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Bill Details */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Bill Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Item Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Delivery Fees ({Object.keys(groupedItems).length} shops)</span>
                    <span>${totalDeliveryFee.toFixed(2)}</span>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Driver Tip</span>
                      <span>${tip.toFixed(2)}</span>
                    </div>
                  )}
                  {isPromoApplied && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Promo Discount (10%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                    <span>Grand Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 font-medium">
                  <Coins className="w-4 h-4" />
                  You will earn {pointsEarned} loyalty points!
                </div>
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && !isCheckingOut && (
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-70"
            >
              <div className="flex flex-col items-start">
                <span className="text-xs text-emerald-100 font-medium">Total to pay</span>
                <span className="text-lg">${grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                {isCheckingOut ? 'Processing...' : 'Checkout'}
                {!isCheckingOut && <ArrowRight className="w-5 h-5" />}
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
