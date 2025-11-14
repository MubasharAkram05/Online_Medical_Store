# Troubleshooting Guide - Empty Pages Issue

## Problem
Pages (Home, Products, Cart, Login, Register) showing empty/blank

## Solution Steps

### 1. Check if Layout Component is Fixed
The Layout component should use `<Outlet />` instead of `{children}` for React Router v6.

**File: `frontend/src/components/layout/Layout.js`**
```jsx
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        <Outlet />  {/* This is correct for React Router v6 */}
      </main>
      <Footer />
    </div>
  );
};
```

### 2. Verify Dependencies
Make sure all dependencies are installed:
```bash
cd frontend
npm install
```

Required packages:
- react
- react-dom
- react-router-dom
- react-hook-form
- react-toastify
- axios

### 3. Check Browser Console
Open browser DevTools (F12) and check:
- Any JavaScript errors in Console tab?
- Any network errors in Network tab?
- Are CSS files loading?

### 4. Verify Routes
Check `frontend/src/App.js` - routes should be:
```jsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="medicines" element={<MedicinesPage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route path="cart" element={<CartPage />} />
  </Route>
</Routes>
```

### 5. Clear Cache and Restart
```bash
# Stop the server (Ctrl+C)
# Clear cache
rm -rf node_modules/.cache

# Restart
npm start
```

### 6. Check if Pages Have Content
All pages should have proper JSX content. Verify:
- HomePage.js - has hero section, categories, products
- MedicinesPage.js - has search bar, product grid
- CartPage.js - has cart items display
- LoginPage.js - has form with email/password fields
- RegisterPage.js - has registration form

### 7. CSS Loading
Make sure CSS files are imported:
- Each page imports its CSS (e.g., `import './HomePage.css'`)
- Components import their CSS
- `index.css` is imported in `index.js`

### 8. Common Issues

**Issue: Blank white page**
- Check browser console for errors
- Verify React app is mounting (check if Header/Footer show)

**Issue: Pages show but no content**
- Check CSS files are loading
- Verify container classes exist
- Check if data is loading (for API calls)

**Issue: Routing not working**
- Verify BrowserRouter is in index.js
- Check Routes are properly nested
- Ensure Layout uses Outlet

### 9. Test Individual Pages
Try accessing directly:
- http://localhost:3000/
- http://localhost:3000/medicines
- http://localhost:3000/login
- http://localhost:3000/register
- http://localhost:3000/cart

### 10. Verify Context Providers
CartProvider should wrap the entire app:
```jsx
// In App.js
<CartProvider>
  <Routes>...</Routes>
</CartProvider>
```

## Quick Fix Checklist

- [ ] Layout.js uses `<Outlet />` not `{children}`
- [ ] All dependencies installed (`npm install`)
- [ ] No console errors
- [ ] CSS files imported correctly
- [ ] Routes properly configured
- [ ] CartProvider wraps app
- [ ] Browser cache cleared
- [ ] Server restarted

## Still Not Working?

1. Check browser console for specific errors
2. Verify all files exist in correct locations
3. Make sure React dev server is running (`npm start`)
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

