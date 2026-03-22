import React, { createContext, useContext, useEffect, useState } from 'react';

// create cart context — stores all cart data and functions
// available to any component wrapped in CartProvider
const CartContext = createContext();

// storage key for guest users — not logged in
const DEFAULT_CART_KEY = 'cart_guest';

// old storage key — for backward compatibility with older cart data
const LEGACY_CART_KEY = 'cart';

/**
 * getActiveUserId — gets current logged in user's ID from localStorage
 * Returns null if user is not logged in or data is corrupt
 *
 * @returns {string|null} - user ID or null
 */
const getActiveUserId = () => {
  // window check — for server side rendering safety
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('user');
    // no user in localStorage — not logged in
    if (!rawUser) {
      return null;
    }
    const parsed = JSON.parse(rawUser);
    // return user id if exists, otherwise null
    return parsed?.id || null;
  } catch (error) {
    // JSON.parse failed — corrupt data
    return null;
  }
};

/**
 * resolveCartStorageKey — determines which localStorage key to use for cart
 * Logged in user → 'cart_user_123' (unique per user)
 * Guest user     → 'cart_guest'
 *
 * This ensures each user has their own separate cart
 */
const resolveCartStorageKey = () => {
  const userId = getActiveUserId();
  // logged in → user specific key, guest → default key
  return userId ? `cart_user_${userId}` : DEFAULT_CART_KEY;
};

/**
 * useCart — custom hook to access cart context
 * Must be used inside CartProvider — throws error if used outside
 *
 * Usage: const { cartItems, addToCart } = useCart();
 */
export const useCart = () => {
  const context = useContext(CartContext);
  // safety check — prevent using cart outside CartProvider
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

/**
 * CartProvider — wraps entire app to provide cart functionality
 * Manages: cart items, prescriptions, localStorage sync
 * Handles: guest cart, user cart, legacy cart migration
 *
 * @param {ReactNode} children - All child components
 */
export const CartProvider = ({ children }) => {

  // storageKey state — which localStorage key is currently active
  // changes when user logs in or out
  const [storageKey, setStorageKey] = useState(() => {
    // server side rendering check
    if (typeof window === 'undefined') {
      return DEFAULT_CART_KEY;
    }
    // get correct key based on login status
    return resolveCartStorageKey();
  });

  // cartItems state — array of all items currently in cart
  const [cartItems, setCartItems] = useState([]);

  // orderPrescription state — prescription file attached to order
  // null if no prescription uploaded
  const [orderPrescription, setOrderPrescription] = useState(null);

  // isInitialized state — true after cart is loaded from localStorage
  // prevents saving empty cart before loading is complete
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * useEffect 1 — monitors login/logout changes
   * Updates storage key when user logs in or out
   * Listens to window focus and storage events
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateStorageKey = () => {
      const nextKey = resolveCartStorageKey();
      // only update if key actually changed — prevents unnecessary re-renders
      setStorageKey((prevKey) => (prevKey === nextKey ? prevKey : nextKey));
    };

    updateStorageKey();

    // update key when user switches tab back — login may have changed
    const handleFocus = () => updateStorageKey();

    // update key when localStorage 'user' key changes
    // happens when user logs in or out in another tab
    const handleStorage = (event) => {
      if (event.key === 'user') {
        updateStorageKey();
      }
    };

    // add event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    // cleanup — remove listeners when component unmounts
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  /**
   * useEffect 2 — loads cart from localStorage when storage key changes
   * Runs on initial load and when user logs in/out
   * Also handles legacy cart migration from old 'cart' key
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) {
      return;
    }

    const loadCartAction = () => {
      try {
        // load cart items from localStorage
        let savedCart = window.localStorage.getItem(storageKey);
        // load prescription from localStorage
        let savedRx = window.localStorage.getItem(`${storageKey}_rx`);

        // legacy cart migration — if no cart found with new key
        // check old 'cart' key and migrate data to new key
        if (!savedCart && storageKey !== LEGACY_CART_KEY) {
          const legacyCart = window.localStorage.getItem(LEGACY_CART_KEY);
          if (legacyCart) {
            savedCart = legacyCart;
            // save under new key
            window.localStorage.setItem(storageKey, legacyCart);
            // remove old key
            window.localStorage.removeItem(LEGACY_CART_KEY);
          }
        }

        // parse and set cart items if found
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }

        // parse and set prescription if found
        if (savedRx) {
          setOrderPrescription(JSON.parse(savedRx));
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      } finally {
        // mark cart as initialized — even if loading failed
        setIsInitialized(true);
      }
    };

    loadCartAction();
  }, [storageKey]); // runs whenever storage key changes

  /**
   * useEffect 3 — saves cart to localStorage whenever it changes
   * Only runs after cart is initialized — prevents saving empty cart on load
   * Saves both cart items and prescription
   */
  useEffect(() => {
    // do not save before initialization — would overwrite existing data
    if (!isInitialized || typeof window === 'undefined' || !storageKey) {
      return;
    }

    try {
      // save cart items to localStorage
      window.localStorage.setItem(storageKey, JSON.stringify(cartItems));

      // save or remove prescription based on whether it exists
      if (orderPrescription) {
        window.localStorage.setItem(`${storageKey}_rx`, JSON.stringify(orderPrescription));
      } else {
        window.localStorage.removeItem(`${storageKey}_rx`);
      }
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartItems, orderPrescription, storageKey, isInitialized]);

  /**
   * addToCart — adds medicine to cart or increases quantity if already exists
   *
   * @param {object} medicine - Medicine object to add
   * @param {number} quantity - Quantity to add — default 1
   */
  const addToCart = (medicine, quantity = 1) => {
    // validate medicine object before adding
    if (!medicine || !medicine.id) {
      console.warn('CartContext: Attempted to add invalid medicine', medicine);
      return;
    }

    // ensure quantity is a valid number — fallback to 1
    const numQuantity = Number(quantity) || 1;

    setCartItems((prevItems) => {
      // check if medicine already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => String(item.id) === String(medicine.id)
      );

      if (existingItemIndex > -1) {
        // medicine exists — increase quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + numQuantity
        };
        return newItems;
      } else {
        // medicine not in cart — add as new item
        return [...prevItems, {
          ...medicine,
          quantity: numQuantity
        }];
      }
    });
  };

  /**
   * removeFromCart — removes a medicine from cart by ID
   *
   * @param {string|number} medicineId - ID of medicine to remove
   */
  const removeFromCart = (medicineId) => {
    // filter out item with matching ID
    // String() conversion ensures type-safe comparison
    setCartItems((prevItems) =>
      prevItems.filter((item) => {
        const idMatch = String(item.id) === String(medicineId);
        return !(idMatch);
      })
    );
  };

  /**
   * removeUnavailableItems — removes multiple out of stock items at once
   * Called when backend confirms some items are no longer available
   *
   * @param {array} medicineIds - Array of medicine IDs to remove
   */
  const removeUnavailableItems = (medicineIds) => {
    // validate input — must be non-empty array
    if (!Array.isArray(medicineIds) || !medicineIds.length) {
      return;
    }

    // convert all IDs to strings for safe comparison
    const stringIds = medicineIds.map(id => String(id));

    // keep only items whose ID is not in the removal list
    setCartItems((prevItems) =>
      prevItems.filter((item) => !stringIds.includes(String(item.id)))
    );
  };

  /**
   * updateQuantity — updates quantity of a specific cart item
   * If quantity is 0 or less — removes item from cart
   *
   * @param {string|number} medicineId - ID of medicine to update
   * @param {number} quantity - New quantity value
   */
  const updateQuantity = (medicineId, quantity) => {
    const numQuantity = Number(quantity);

    // quantity 0 or less — remove item from cart
    if (numQuantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    // update quantity of matching item
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        String(item.id) === String(medicineId)
          ? { ...item, quantity: numQuantity }  // update matching item
          : item                                 // keep others same
      )
    );
  };

  /**
   * clearCart — removes all items from cart and clears localStorage
   * Called after successful order placement
   */
  const clearCart = () => {
    // clear cart items and prescription from state
    setCartItems([]);
    setOrderPrescription(null);

    // also clear from localStorage
    if (typeof window !== 'undefined' && storageKey) {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(`${storageKey}_rx`);
    }
  };

  /**
   * getCartTotal — calculates total price of all items in cart
   * price × quantity for each item — then sum all
   *
   * @returns {number} - Total price of all cart items
   */
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    );
  };

  /**
   * getCartItemsCount — calculates total number of items in cart
   * Counts quantity of each item — not just number of distinct items
   * example: 2 Panadol + 3 Disprin = 5 total
   *
   * @returns {number} - Total quantity of all items
   */
  const getCartItemsCount = () => {
    return cartItems.reduce(
      (count, item) => count + item.quantity, 0
    );
  };

  // all values and functions exposed to child components via context
  const value = {
    cartItems,               // array of cart items
    orderPrescription,       // prescription file
    setOrderPrescription,    // update prescription
    addToCart,               // add item to cart
    removeFromCart,          // remove single item
    removeUnavailableItems,  // remove multiple items
    updateQuantity,          // update item quantity
    clearCart,               // empty entire cart
    getCartTotal,            // get total price
    getCartItemsCount        // get total item count
  };

  // provide cart context to all child components
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};