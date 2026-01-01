import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'recentlyViewedProducts';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  // Add product to recently viewed
  const addToRecentlyViewed = useCallback((product) => {
    if (!product?.id) return;

    // Calculate total price (metal_price + making_charges + GST)
    const metalPrice = parseFloat(product.metal_price) || 0;
    const makingCharges = parseFloat(product.making_charges) || 0;
    const subtotal = metalPrice + makingCharges;
    const gst = subtotal * ((product.gst_percent || 3) / 100);
    const totalPrice = product.price || (subtotal + gst);

    // Get image properly
    let productImage = '/placeholder.jpg';
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          const parsed = JSON.parse(product.images);
          productImage = parsed[0] || '/placeholder.jpg';
        } catch {
          productImage = product.images;
        }
      } else if (Array.isArray(product.images)) {
        productImage = product.images[0] || '/placeholder.jpg';
      }
    }

    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.id !== product.id);
      
      // Add to beginning
      const updated = [
        {
          id: product.id,
          name: product.name,
          price: totalPrice,
          image: productImage,
          category: product.category,
          viewedAt: new Date().toISOString()
        },
        ...filtered
      ].slice(0, MAX_ITEMS);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recently viewed:', error);
      }

      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Remove single item
  const removeFromRecentlyViewed = useCallback((productId) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(p => p.id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    removeFromRecentlyViewed
  };
};

export default useRecentlyViewed;
