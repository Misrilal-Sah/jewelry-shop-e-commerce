import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../config/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Coupon state (shared between Cart and Checkout)
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  // Sidebar functions
  const openCartSidebar = () => setSidebarOpen(true);
  const closeCartSidebar = () => setSidebarOpen(false);

  // Local storage key for guest cart
  const GUEST_CART_KEY = 'jewelry-guest-cart';
  const COUPON_STORAGE_KEY = 'jewelry-applied-coupon';

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      // Load guest cart from localStorage
      const savedCart = localStorage.getItem(GUEST_CART_KEY);
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    }
    // Load saved coupon
    const savedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
    if (savedCoupon) {
      const { coupon, discountAmount } = JSON.parse(savedCoupon);
      setAppliedCoupon(coupon);
      setDiscount(discountAmount);
    }
  }, [isAuthenticated]);

  // Save guest cart to localStorage
  useEffect(() => {
    if (!isAuthenticated && items.length > 0) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const fetchCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Fetch cart error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply coupon - shared function
  const applyCoupon = (coupon, discountAmount) => {
    setAppliedCoupon(coupon);
    setDiscount(discountAmount);
    // Save to localStorage for persistence
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify({ 
      coupon, 
      discountAmount 
    }));
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return items.some(item => item.product_id === productId || item.id === productId);
  };

  // Get cart item by product ID
  const getCartItem = (productId) => {
    return items.find(item => item.product_id === productId || item.id === productId);
  };

  const addToCart = async (product, quantity = 1, size = null, skipOpenCart = false) => {
    if (isAuthenticated) {
      try {
        const res = await apiFetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.id, quantity, size })
        });
        if (res.ok) {
          await fetchCart();
          if (!skipOpenCart) openCartSidebar();
          return { success: true };
        }
        const data = await res.json();
        return { success: false, message: data.message };
      } catch (error) {
        return { success: false, message: 'Failed to add to cart' };
      }
    } else {
      // Guest cart
      const existingIndex = items.findIndex(
        item => item.product_id === product.id && item.size === size
      );
      if (existingIndex > -1) {
        const updated = [...items];
        updated[existingIndex].quantity += quantity;
        setItems(updated);
      } else {
        setItems([...items, {
          id: Date.now(),
          product_id: product.id,
          name: product.name,
          images: product.images,
          metal_price: product.metal_price,
          making_charges: product.making_charges,
          gst_percent: product.gst_percent || 3,
          quantity,
          size
        }]);
      }
      if (!skipOpenCart) openCartSidebar();
      return { success: true };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (isAuthenticated) {
      try {
        await apiFetch(`/api/cart/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ quantity })
        });
        await fetchCart();
      } catch (error) {
        console.error('Update cart error:', error);
      }
    } else {
      setItems(items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = async (itemId) => {
    if (isAuthenticated) {
      try {
        await apiFetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchCart();
      } catch (error) {
        console.error('Remove from cart error:', error);
      }
    } else {
      const newItems = items.filter(item => item.id !== itemId && item.product_id !== itemId);
      setItems(newItems);
      if (newItems.length === 0) {
        localStorage.removeItem(GUEST_CART_KEY);
      }
    }
  };

  // Remove by product ID (for toggle functionality)
  const removeByProductId = async (productId) => {
    const item = getCartItem(productId);
    if (item) {
      await removeFromCart(item.id || item.product_id);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await apiFetch('/api/cart', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems([]);
      } catch (error) {
        console.error('Clear cart error:', error);
      }
    } else {
      setItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
    }
    // Also clear coupon when cart is cleared
    removeCoupon();
  };

  // Calculate totals
  const getCartTotals = () => {
    let subtotal = 0;
    let gstTotal = 0;

    items.forEach(item => {
      // Use item_price if available (from backend, includes flash sale discount)
      // Otherwise fall back to metal_price + making_charges for guest cart
      const itemPrice = item.item_price 
        ? parseFloat(item.item_price) 
        : (parseFloat(item.metal_price || 0) + parseFloat(item.making_charges || 0));
      const itemTotal = itemPrice * item.quantity;
      const itemGst = itemTotal * (parseFloat(item.gst_percent || 3) / 100);
      subtotal += itemTotal;
      gstTotal += itemGst;
    });

    const total = subtotal + gstTotal;
    const finalTotal = Math.max(0, total - discount);

    return {
      subtotal,
      gst: gstTotal,
      total,
      finalTotal,
      itemCount: items.reduce((acc, item) => acc + item.quantity, 0)
    };
  };

  return (
    <CartContext.Provider value={{
      items,
      loading,
      sidebarOpen,
      openCartSidebar,
      closeCartSidebar,
      addToCart,
      updateQuantity,
      removeFromCart,
      removeByProductId,
      clearCart,
      isInCart,
      getCartItem,
      // Coupon state and functions
      appliedCoupon,
      discount,
      applyCoupon,
      removeCoupon,
      ...getCartTotals()
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
