# Online Medical Store Management System - React Project Structure

## 📁 Complete Directory Structure

```
omsms/
├── frontend/                          # React.js Frontend Application
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── images/                   # Static images
│   │
│   ├── src/
│   │   ├── index.js                 # Entry point
│   │   ├── App.js                   # Main App component
│   │   ├── index.css                # Global styles
│   │   │
│   │   ├── components/              # Reusable Components
│   │   │   ├── common/              # Common UI components
│   │   │   │   ├── Button.js
│   │   │   │   ├── Input.js
│   │   │   │   ├── Card.js
│   │   │   │   ├── Modal.js
│   │   │   │   ├── Loading.js
│   │   │   │   ├── Alert.js
│   │   │   │   ├── Pagination.js
│   │   │   │   └── SearchBar.js
│   │   │   │
│   │   │   ├── layout/              # Layout Components
│   │   │   │   ├── Layout.js       # Main layout wrapper
│   │   │   │   ├── Header.js       # Navigation header
│   │   │   │   ├── Footer.js       # Footer
│   │   │   │   ├── Sidebar.js      # Sidebar (for admin)
│   │   │   │   └── AdminLayout.js  # Admin layout wrapper
│   │   │   │
│   │   │   ├── auth/               # Authentication Components
│   │   │   │   ├── PrivateRoute.js # Protected route wrapper
│   │   │   │   ├── AdminRoute.js   # Admin route wrapper
│   │   │   │   └── AuthGuard.js    # Auth guard component
│   │   │   │
│   │   │   ├── medicine/          # Medicine-related Components
│   │   │   │   ├── MedicineCard.js
│   │   │   │   ├── MedicineList.js
│   │   │   │   ├── MedicineDetail.js
│   │   │   │   ├── MedicineFilter.js
│   │   │   │   └── MedicineSearch.js
│   │   │   │
│   │   │   ├── cart/              # Shopping Cart Components
│   │   │   │   ├── CartItem.js
│   │   │   │   ├── CartSummary.js
│   │   │   │   └── CartIcon.js
│   │   │   │
│   │   │   ├── prescription/     # Prescription Components
│   │   │   │   ├── PrescriptionUpload.js
│   │   │   │   ├── PrescriptionList.js
│   │   │   │   └── PrescriptionStatus.js
│   │   │   │
│   │   │   ├── order/            # Order Components
│   │   │   │   ├── OrderCard.js
│   │   │   │   ├── OrderDetail.js
│   │   │   │   ├── OrderStatus.js
│   │   │   │   └── OrderTracking.js
│   │   │   │
│   │   │   └── admin/            # Admin Components
│   │   │       ├── AdminDashboard.js
│   │   │       ├── MedicineManagement.js
│   │   │       ├── OrderManagement.js
│   │   │       ├── PrescriptionVerification.js
│   │   │       ├── UserManagement.js
│   │   │       ├── ReportGenerator.js
│   │   │       └── SupplierManagement.js
│   │   │
│   │   ├── pages/                # Page Components
│   │   │   ├── HomePage.js
│   │   │   │
│   │   │   ├── auth/              # Authentication Pages
│   │   │   │   ├── LoginPage.js
│   │   │   │   ├── RegisterPage.js
│   │   │   │   ├── ForgotPasswordPage.js
│   │   │   │   └── ResetPasswordPage.js
│   │   │   │
│   │   │   ├── medicines/        # Medicine Pages
│   │   │   │   ├── MedicinesPage.js
│   │   │   │   └── MedicineDetailPage.js
│   │   │   │
│   │   │   ├── cart/             # Cart & Checkout Pages
│   │   │   │   ├── CartPage.js
│   │   │   │   └── CheckoutPage.js
│   │   │   │
│   │   │   ├── orders/           # Order Pages
│   │   │   │   ├── OrdersPage.js
│   │   │   │   └── OrderDetailPage.js
│   │   │   │
│   │   │   ├── prescriptions/    # Prescription Pages
│   │   │   │   ├── PrescriptionUploadPage.js
│   │   │   │   └── PrescriptionsPage.js
│   │   │   │
│   │   │   ├── profile/          # Profile Pages
│   │   │   │   ├── ProfilePage.js
│   │   │   │   └── EditProfilePage.js
│   │   │   │
│   │   │   └── admin/            # Admin Pages
│   │   │       ├── AdminDashboard.js
│   │   │       ├── AdminMedicines.js
│   │   │       ├── AdminOrders.js
│   │   │       ├── AdminPrescriptions.js
│   │   │       ├── AdminUsers.js
│   │   │       ├── AdminReports.js
│   │   │       └── AdminSuppliers.js
│   │   │
│   │   ├── services/             # API Services
│   │   │   ├── api.js            # Axios instance & interceptors
│   │   │   ├── authService.js    # Authentication API calls
│   │   │   ├── medicineService.js # Medicine API calls
│   │   │   ├── cartService.js    # Cart API calls
│   │   │   ├── orderService.js   # Order API calls
│   │   │   ├── prescriptionService.js # Prescription API calls
│   │   │   ├── paymentService.js # Payment API calls
│   │   │   └── adminService.js   # Admin API calls
│   │   │
│   │   ├── context/              # React Context API
│   │   │   ├── AuthContext.js    # Authentication context
│   │   │   ├── CartContext.js    # Shopping cart context
│   │   │   └── ThemeContext.js   # Theme context (optional)
│   │   │
│   │   ├── hooks/                # Custom React Hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   ├── useLocalStorage.js
│   │   │   └── useDebounce.js
│   │   │
│   │   ├── utils/                # Utility Functions
│   │   │   ├── constants.js     # App constants
│   │   │   ├── helpers.js       # Helper functions
│   │   │   ├── validators.js    # Form validation
│   │   │   ├── formatters.js    # Data formatters
│   │   │   └── storage.js       # LocalStorage helpers
│   │   │
│   │   ├── styles/              # CSS/SCSS Files
│   │   │   ├── components/     # Component-specific styles
│   │   │   ├── pages/          # Page-specific styles
│   │   │   └── variables.css   # CSS variables
│   │   │
│   │   └── assets/             # Static Assets
│   │       ├── images/
│   │       ├── icons/
│   │       └── fonts/
│   │
│   ├── package.json
│   ├── .env                      # Environment variables
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   └── jsconfig.json            # or tsconfig.json for TypeScript
│
├── backend/                       # Node.js + Express.js Backend
│   ├── src/
│   │   ├── index.js              # Entry point
│   │   ├── app.js                # Express app setup
│   │   │
│   │   ├── routes/               # API Routes
│   │   │   ├── auth.routes.js
│   │   │   ├── medicine.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── prescription.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── controllers/          # Route Controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── medicine.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── prescription.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── models/               # Database Models
│   │   │   ├── User.js
│   │   │   ├── Medicine.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── Prescription.js
│   │   │   ├── Payment.js
│   │   │   └── Supplier.js
│   │   │
│   │   ├── middleware/           # Express Middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── rateLimiter.middleware.js
│   │   │
│   │   ├── services/            # Business Logic
│   │   │   ├── auth.service.js
│   │   │   ├── medicine.service.js
│   │   │   ├── order.service.js
│   │   │   ├── prescription.service.js
│   │   │   ├── payment.service.js
│   │   │   └── email.service.js
│   │   │
│   │   ├── utils/               # Utility Functions
│   │   │   ├── db.js            # Database connection
│   │   │   ├── jwt.js           # JWT helpers
│   │   │   ├── bcrypt.js        # Password hashing
│   │   │   ├── validators.js    # Input validators
│   │   │   └── logger.js        # Logging utility
│   │   │
│   │   └── config/              # Configuration
│   │       ├── database.js
│   │       ├── jwt.js
│   │       └── upload.js
│   │
│   ├── uploads/                  # Uploaded files (prescriptions)
│   │   └── prescriptions/
│   │
│   ├── database/
│   │   ├── migrations/          # Database migrations
│   │   └── seeds/              # Seed data
│   │
│   ├── tests/                   # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── README.md
│
├── database/                     # Database Scripts
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_medicines.sql
│   │   ├── 003_create_orders.sql
│   │   ├── 004_create_prescriptions.sql
│   │   └── 005_create_suppliers.sql
│   │
│   └── seeds/
│       └── initial_data.sql
│
├── docs/                         # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── docker-compose.yml           # Docker setup (optional)
```

---

## 📝 Detailed Component Breakdown

### **Frontend Structure Details**

#### **1. Components/Common**
- Reusable UI components used across the application
- Button, Input, Card, Modal, Loading spinner, Alert messages
- Pagination and SearchBar for list views

#### **2. Components/Layout**
- **Layout.js**: Main layout wrapper with header and footer
- **Header.js**: Navigation bar with cart icon, user menu, login/logout
- **Footer.js**: Footer with links and contact info
- **AdminLayout.js**: Admin-specific layout with sidebar navigation

#### **3. Components/Auth**
- **PrivateRoute.js**: Route protection for authenticated users
- **AdminRoute.js**: Route protection for admin users only
- **AuthGuard.js**: Component-level auth checking

#### **4. Components/Medicine**
- **MedicineCard.js**: Display single medicine card
- **MedicineList.js**: Grid/list view of medicines
- **MedicineDetail.js**: Detailed medicine information
- **MedicineFilter.js**: Filter by category, price, expiry
- **MedicineSearch.js**: Search functionality

#### **5. Components/Cart**
- **CartItem.js**: Individual cart item with quantity controls
- **CartSummary.js**: Cart total, checkout button
- **CartIcon.js**: Cart icon in header with item count

#### **6. Components/Prescription**
- **PrescriptionUpload.js**: File upload component
- **PrescriptionList.js**: List of user's prescriptions
- **PrescriptionStatus.js**: Status badge (Pending/Verified/Rejected)

#### **7. Components/Order**
- **OrderCard.js**: Order summary card
- **OrderDetail.js**: Complete order details
- **OrderStatus.js**: Order status indicator
- **OrderTracking.js**: Order tracking timeline

#### **8. Components/Admin**
- All admin-specific components for managing the system

---

### **Pages Structure**

#### **Public Pages**
- **HomePage**: Landing page with featured medicines
- **MedicinesPage**: Browse all medicines with filters
- **MedicineDetailPage**: Individual medicine details

#### **Authentication Pages**
- **LoginPage**: User login
- **RegisterPage**: User registration
- **ForgotPasswordPage**: Password reset request
- **ResetPasswordPage**: Password reset form

#### **User Pages**
- **CartPage**: Shopping cart view
- **CheckoutPage**: Order checkout with payment
- **OrdersPage**: User's order history
- **OrderDetailPage**: Individual order details
- **PrescriptionUploadPage**: Upload prescription
- **PrescriptionsPage**: User's prescription list
- **ProfilePage**: User profile and settings

#### **Admin Pages**
- **AdminDashboard**: Overview statistics
- **AdminMedicines**: CRUD operations for medicines
- **AdminOrders**: Manage all orders
- **AdminPrescriptions**: Verify prescriptions
- **AdminUsers**: User management
- **AdminReports**: Generate reports
- **AdminSuppliers**: Supplier management

---

### **Services Structure**

All API calls organized by feature:
- **authService**: Login, register, password reset
- **medicineService**: Get medicines, search, filter
- **cartService**: Add/remove/update cart items
- **orderService**: Create order, get order history
- **prescriptionService**: Upload, get prescriptions
- **paymentService**: Process payments
- **adminService**: Admin operations

---

### **Context & Hooks**

- **AuthContext**: Global authentication state
- **CartContext**: Global shopping cart state
- **useAuth**: Custom hook for auth operations
- **useCart**: Custom hook for cart operations

---

## 🚀 Setup Instructions

### **1. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

### **2. Backend Setup**
```bash
cd backend
npm install
npm run dev
```

### **3. Database Setup**
```bash
mysql -u root -p < database/migrations/001_create_users.sql
# ... run all migrations
```

---

## 📦 Key Dependencies

### **Frontend**
- react
- react-router-dom
- axios
- react-query
- react-hook-form
- @mui/material (or custom UI library)
- react-toastify

### **Backend**
- express
- mysql2
- jsonwebtoken
- bcryptjs
- multer (file uploads)
- dotenv
- cors
- express-validator

---

## ✅ Implementation Checklist

- [ ] Setup project structure
- [ ] Create all component files (empty shells)
- [ ] Setup routing
- [ ] Implement authentication
- [ ] Implement medicine listing
- [ ] Implement cart functionality
- [ ] Implement checkout
- [ ] Implement prescription upload
- [ ] Implement admin dashboard
- [ ] Add tests
- [ ] Deploy

---

*This structure follows React best practices and is scalable for future enhancements.*

