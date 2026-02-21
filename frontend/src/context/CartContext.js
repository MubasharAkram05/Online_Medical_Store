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
  const [orderPrescription, setOrderPrescription] = useState(null);
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

    // Only set initialized to false if we don't have items to avoid flickers
    // or if the storage key actually changed (user login/logout)
    const loadCartAction = () => {
      try {
        let savedCart = window.localStorage.getItem(storageKey);
        let savedRx = window.localStorage.getItem(`${storageKey}_rx`);

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
            // Merge or set? For a fresh load (key change), we set.
            // If it's just a re-sync, we should be careful.
            setCartItems((prevItems) => {
              // If we already have items and they were added AFTER initialization started,
              // we don't want to lose them. But usually, on key change, we want the new key's data.
              return parsed;
            });
          }
        }

        if (savedRx) {
          setOrderPrescription(JSON.parse(savedRx));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadCartAction();
  }, [storageKey]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined' || !storageKey) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(cartItems));
      if (orderPrescription) {
        window.localStorage.setItem(`${storageKey}_rx`, JSON.stringify(orderPrescription));
      } else {
        window.localStorage.removeItem(`${storageKey}_rx`);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems, orderPrescription, storageKey, isInitialized]);

  const addToCart = (medicine, quantity = 1) => {
    if (!medicine || !medicine.id) {
      console.warn('CartContext: Attempted to add invalid medicine', medicine);
      return;
    }

    const numQuantity = Number(quantity) || 1;

    setCartItems((prevItems) => {
      // For items with prescriptions, we treat each distinct mapping as a separate item
      const existingItemIndex = prevItems.findIndex(
        (item) => String(item.id) === String(medicine.id)
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + numQuantity
        };
        return newItems;
      } else {
        return [...prevItems, {
          ...medicine,
          quantity: numQuantity
        }];
      }
    });
  };

  const removeFromCart = (medicineId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => {
        const idMatch = String(item.id) === String(medicineId);
        return !(idMatch);
      })
    );
  };

  const removeUnavailableItems = (medicineIds) => {
    if (!Array.isArray(medicineIds) || !medicineIds.length) {
      return;
    }

    const stringIds = medicineIds.map(id => String(id));
    setCartItems((prevItems) =>
      prevItems.filter((item) => !stringIds.includes(String(item.id)))
    );
  };

  const updateQuantity = (medicineId, quantity) => {
    const numQuantity = Number(quantity);

    if (numQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        String(item.id) === String(medicineId)
          ? { ...item, quantity: numQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setOrderPrescription(null);
    if (typeof window !== 'undefined' && storageKey) {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(`${storageKey}_rx`);
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
    orderPrescription,
    setOrderPrescription,
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
