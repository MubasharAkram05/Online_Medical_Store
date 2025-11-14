import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext();

const DEFAULT_CART_KEY = 'cart_guest';
const LEGACY_CART_KEY = 'cart';

const getActiveUserId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    const parsed = JSON.parse(rawUser);
    return parsed?.id || null;
  } catch (error) {
    return null;
  }
};

const resolveCartStorageKey = () => {
  const userId = getActiveUserId();
  return userId ? `cart_user_${userId}` : DEFAULT_CART_KEY;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [storageKey, setStorageKey] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_CART_KEY;
    }
    return resolveCartStorageKey();
  });
  const [cartItems, setCartItems] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateStorageKey = () => {
      const nextKey = resolveCartStorageKey();
      setStorageKey((prevKey) => (prevKey === nextKey ? prevKey : nextKey));
    };

    updateStorageKey();

    const handleFocus = () => updateStorageKey();
    const handleStorage = (event) => {
      if (event.key === 'user') {
        updateStorageKey();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) {
      return;
    }

    setIsInitialized(false);

    try {
      let savedCart = window.localStorage.getItem(storageKey);

      if (!savedCart && storageKey !== LEGACY_CART_KEY) {
        const legacyCart = window.localStorage.getItem(LEGACY_CART_KEY);
        if (legacyCart) {
          savedCart = legacyCart;
          window.localStorage.setItem(storageKey, legacyCart);
          window.localStorage.removeItem(LEGACY_CART_KEY);
        }
      }

      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        } else {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      setCartItems([]);
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined' || !storageKey) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems, storageKey, isInitialized]);

  const addToCart = (medicine, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.id === medicine.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...medicine, quantity }];
      }
    });
  };

  const removeFromCart = (medicineId) => {
    setCartItems((prevItems) => prevItems.filter(item => item.id !== medicineId));
  };

  const removeUnavailableItems = (medicineIds) => {
    if (!Array.isArray(medicineIds) || !medicineIds.length) {
      return;
    }

    setCartItems((prevItems) =>
      prevItems.filter((item) => !medicineIds.includes(item.id))
    );
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map(item =>
        item.id === medicineId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    if (typeof window !== 'undefined' && storageKey) {
      window.localStorage.removeItem(storageKey);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    removeUnavailableItems,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
