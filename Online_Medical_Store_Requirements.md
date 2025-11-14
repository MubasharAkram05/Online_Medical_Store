
# Online Medical Store Management System — Project Requirements (for Cursor AI)

## 1. High-level summary
- **Project:** Online Medical Store Management System (OMSMS)
- **Purpose:** Allow users to register, upload prescriptions, browse medicines, place orders, and admins to manage inventory, prescriptions, and generate reports.
- **Tech Stack:** 
  - Frontend: React.js
  - Backend: Node.js + Express.js
  - Database: MySQL
  - Authentication: JWT
  - Web Server: Nginx
  - File Storage: Local / Cloud (S3-compatible)

---

## 2. Goals & success criteria
- Users can register/login/logout securely with JWT.
- Users can upload prescriptions and link them to orders; admin can verify.
- Users can browse/search/filter medicines, add to cart, checkout, and make payments.
- Admin can manage medicines, orders, users, and reports.
- Prescription-only medicines require verified prescriptions.
- API and UI flows must pass basic test scenarios.

---

## 3. User roles & permissions
- **Guest:** Browse medicines, view details.
- **User (Patient):** Register/login, upload prescriptions, buy medicines, view orders.
- **Pharmacist/Doctor:** Verify prescriptions.
- **Admin:** Full control over medicines, orders, users, and reports.

---

## 4. Functional Requirements

### 4.1 Authentication & User Profile
- Register with name, email, phone, password.
- Login using email/password, receive JWT token.
- Password reset via secure token/email.
- Store user data securely with hashed passwords (bcrypt).

### 4.2 Prescription Upload & Verification
- Upload JPG/PNG/PDF files securely.
- Admin verifies and changes status (Pending → Verified/Rejected).
- Linked to user profile and orders.

### 4.3 Browse, Search, Filter Medicines
- Search by name, brand, or category.
- Filter by price, expiry, or popularity.
- Sort results and support pagination.

### 4.4 Cart & Checkout
- Add/update/remove medicines in cart.
- Validate prescription for restricted medicines.
- Generate order ID, reduce stock, and create order record.

### 4.5 Payment Integration
- Support multiple payment methods (Card, Bank, Wallet, COD).
- Simulated gateway for MVP.
- Store payment receipts and transaction data.

### 4.6 Admin Dashboard & Reports
- CRUD for medicines and suppliers.
- View and verify prescriptions.
- Generate sales, low-stock, and expiry reports.

---

## 5. Non-Functional Requirements
- **Security:** HTTPS, JWT, password hashing, file validation.
- **Performance:** <2s response time, DB indexes.
- **Scalability:** Stateless APIs, S3-compatible storage.
- **Reliability:** Backups, error recovery.
- **Maintainability:** Modular structure, code comments.
- **Accessibility:** Simple responsive UI, WCAG compliant.

---

## 6. Data Model (MySQL)

| Table | Columns |
|-------|----------|
| users | id, name, email, phone, password_hash, role, is_verified, created_at, updated_at |
| medicines | id, name, brand, category, description, price, quantity, requires_prescription, expiry_date, supplier_id |
| prescriptions | id, user_id, filename, path, status, uploaded_at |
| orders | id, user_id, total_amount, payment_method, payment_status, order_status, created_at |
| order_items | id, order_id, medicine_id, quantity, price |
| payments | id, order_id, method, transaction_id, status |
| suppliers | id, name, contact_info, address |

---

## 7. REST API Endpoints (Essential)

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

### Prescriptions
- `POST /api/prescriptions`
- `PUT /api/prescriptions/:id/verify` (Admin)
- `GET /api/prescriptions/:id`

### Medicines
- `GET /api/medicines`
- `GET /api/medicines/:id`
- `POST /api/medicines` (Admin)
- `PUT /api/medicines/:id` (Admin)
- `DELETE /api/medicines/:id` (Admin)

### Cart & Orders
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/:itemId`
- `DELETE /api/cart/:itemId`
- `POST /api/orders/checkout`
- `GET /api/orders/:id`

### Reports (Admin)
- `GET /api/reports/sales`
- `GET /api/reports/low-stock`
- `GET /api/reports/expiring-soon`

---

## 8. Error Handling & Validation
- Use HTTP codes: 200, 201, 400, 401, 403, 404, 500.
- JSON error structure: `{ error: { code, message } }`.
- Validate all file types and input data.

---

## 9. Environment Setup

```
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=omsms_db
JWT_SECRET=supersecretkey
UPLOAD_DIR=./uploads
```

### Steps
```
git clone <repo>
cd omsms
npm install
npm run migrate
npm run dev
```

---

## 10. Testing
- Unit tests: authentication, prescriptions, orders.
- Integration tests: end-to-end flow.
- Security tests: SQL injection, invalid JWT, large uploads.

---

## 11. CI/CD & Deployment
- CI: run tests, lint, build.
- CD: Docker deployment with Nginx reverse proxy.
- DB backups: daily cron job.
- Monitoring: logs + health endpoint.

---

## 12. MVP Deliverables
- Auth system
- Medicine listing
- Cart + Checkout
- Prescription upload
- Admin CRUD + reports

---

## 13. Supervisor
- **Name:** Mukaram Shah
- **Email:** Mukaram.shah@vu.edu.pk
- **MS Teams:** to_mshah@outlook.com

---

## 14. React Project Directory Structure

### Complete Project Structure

```
omsms/
├── frontend/                          # React.js Frontend Application
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── images/                   # Static images
│   │
│   ├── src/
│   │   ├── index.js                  # Entry point
│   │   ├── App.js                    # Main App component with routing
│   │   ├── index.css                 # Global styles
│   │   │
│   │   ├── components/               # Reusable Components
│   │   │   ├── common/               # Common UI components
│   │   │   │   ├── Button.js
│   │   │   │   ├── Input.js
│   │   │   │   ├── Card.js
│   │   │   │   ├── Modal.js
│   │   │   │   ├── Loading.js
│   │   │   │   ├── Alert.js
│   │   │   │   ├── Pagination.js
│   │   │   │   └── SearchBar.js
│   │   │   │
│   │   │   ├── layout/               # Layout Components
│   │   │   │   ├── Layout.js         # Main layout wrapper
│   │   │   │   ├── Header.js        # Navigation header with cart
│   │   │   │   ├── Footer.js        # Footer
│   │   │   │   ├── Sidebar.js       # Sidebar (for admin)
│   │   │   │   └── AdminLayout.js   # Admin layout wrapper
│   │   │   │
│   │   │   ├── auth/                 # Authentication Components
│   │   │   │   ├── PrivateRoute.js  # Protected route wrapper
│   │   │   │   ├── AdminRoute.js    # Admin route wrapper
│   │   │   │   └── AuthGuard.js     # Auth guard component
│   │   │   │
│   │   │   ├── medicine/             # Medicine-related Components
│   │   │   │   ├── MedicineCard.js
│   │   │   │   ├── MedicineList.js
│   │   │   │   ├── MedicineDetail.js
│   │   │   │   ├── MedicineFilter.js
│   │   │   │   └── MedicineSearch.js
│   │   │   │
│   │   │   ├── cart/                 # Shopping Cart Components
│   │   │   │   ├── CartItem.js
│   │   │   │   ├── CartSummary.js
│   │   │   │   └── CartIcon.js
│   │   │   │
│   │   │   ├── prescription/         # Prescription Components
│   │   │   │   ├── PrescriptionUpload.js
│   │   │   │   ├── PrescriptionList.js
│   │   │   │   └── PrescriptionStatus.js
│   │   │   │
│   │   │   ├── order/                # Order Components
│   │   │   │   ├── OrderCard.js
│   │   │   │   ├── OrderDetail.js
│   │   │   │   ├── OrderStatus.js
│   │   │   │   └── OrderTracking.js
│   │   │   │
│   │   │   └── admin/                # Admin Components
│   │   │       ├── AdminDashboard.js
│   │   │       ├── MedicineManagement.js
│   │   │       ├── OrderManagement.js
│   │   │       ├── PrescriptionVerification.js
│   │   │       ├── UserManagement.js
│   │   │       ├── ReportGenerator.js
│   │   │       └── SupplierManagement.js
│   │   │
│   │   ├── pages/                    # Page Components
│   │   │   ├── HomePage.js
│   │   │   │
│   │   │   ├── auth/                 # Authentication Pages
│   │   │   │   ├── LoginPage.js
│   │   │   │   ├── RegisterPage.js
│   │   │   │   ├── ForgotPasswordPage.js
│   │   │   │   └── ResetPasswordPage.js
│   │   │   │
│   │   │   ├── medicines/            # Medicine Pages
│   │   │   │   ├── MedicinesPage.js
│   │   │   │   └── MedicineDetailPage.js
│   │   │   │
│   │   │   ├── cart/                 # Cart & Checkout Pages
│   │   │   │   ├── CartPage.js
│   │   │   │   └── CheckoutPage.js
│   │   │   │
│   │   │   ├── orders/               # Order Pages
│   │   │   │   ├── OrdersPage.js
│   │   │   │   └── OrderDetailPage.js
│   │   │   │
│   │   │   ├── prescriptions/        # Prescription Pages
│   │   │   │   ├── PrescriptionUploadPage.js
│   │   │   │   └── PrescriptionsPage.js
│   │   │   │
│   │   │   ├── profile/              # Profile Pages
│   │   │   │   ├── ProfilePage.js
│   │   │   │   └── EditProfilePage.js
│   │   │   │
│   │   │   └── admin/                # Admin Pages
│   │   │       ├── AdminDashboard.js
│   │   │       ├── AdminMedicines.js
│   │   │       ├── AdminOrders.js
│   │   │       ├── AdminPrescriptions.js
│   │   │       ├── AdminUsers.js
│   │   │       ├── AdminReports.js
│   │   │       └── AdminSuppliers.js
│   │   │
│   │   ├── services/                 # API Services
│   │   │   ├── api.js                # Axios instance & interceptors
│   │   │   ├── authService.js        # Authentication API calls
│   │   │   ├── medicineService.js    # Medicine API calls
│   │   │   ├── cartService.js        # Cart API calls
│   │   │   ├── orderService.js       # Order API calls
│   │   │   ├── prescriptionService.js # Prescription API calls
│   │   │   ├── paymentService.js     # Payment API calls
│   │   │   └── adminService.js       # Admin API calls
│   │   │
│   │   ├── context/                  # React Context API
│   │   │   ├── AuthContext.js        # Authentication context
│   │   │   ├── CartContext.js        # Shopping cart context
│   │   │   └── ThemeContext.js       # Theme context (optional)
│   │   │
│   │   ├── hooks/                     # Custom React Hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   ├── useLocalStorage.js
│   │   │   └── useDebounce.js
│   │   │
│   │   ├── utils/                     # Utility Functions
│   │   │   ├── constants.js          # App constants (USER_ROLES, ORDER_STATUS, etc.)
│   │   │   ├── helpers.js            # Helper functions
│   │   │   ├── validators.js         # Form validation
│   │   │   ├── formatters.js         # Data formatters (currency, date)
│   │   │   └── storage.js            # LocalStorage helpers
│   │   │
│   │   ├── styles/                    # CSS/SCSS Files
│   │   │   ├── components/           # Component-specific styles
│   │   │   ├── pages/                # Page-specific styles
│   │   │   └── variables.css         # CSS variables
│   │   │
│   │   └── assets/                    # Static Assets
│   │       ├── images/
│   │       ├── icons/
│   │       └── fonts/
│   │
│   ├── package.json
│   ├── .env                          # Environment variables
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   └── jsconfig.json                 # or tsconfig.json for TypeScript
│
├── backend/                           # Node.js + Express.js Backend
│   ├── src/
│   │   ├── index.js                   # Entry point
│   │   ├── app.js                     # Express app setup
│   │   │
│   │   ├── routes/                    # API Routes
│   │   │   ├── auth.routes.js
│   │   │   ├── medicine.routes.js
│   │   │   ├── cart.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── prescription.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── controllers/               # Route Controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── medicine.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── prescription.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── models/                    # Database Models
│   │   │   ├── User.js
│   │   │   ├── Medicine.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── Prescription.js
│   │   │   ├── Payment.js
│   │   │   └── Supplier.js
│   │   │
│   │   ├── middleware/                # Express Middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   ├── upload.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── rateLimiter.middleware.js
│   │   │
│   │   ├── services/                  # Business Logic
│   │   │   ├── auth.service.js
│   │   │   ├── medicine.service.js
│   │   │   ├── order.service.js
│   │   │   ├── prescription.service.js
│   │   │   ├── payment.service.js
│   │   │   └── email.service.js
│   │   │
│   │   ├── utils/                     # Utility Functions
│   │   │   ├── db.js                  # Database connection
│   │   │   ├── jwt.js                 # JWT helpers
│   │   │   ├── bcrypt.js              # Password hashing
│   │   │   ├── validators.js          # Input validators
│   │   │   └── logger.js              # Logging utility
│   │   │
│   │   └── config/                    # Configuration
│   │       ├── database.js
│   │       ├── jwt.js
│   │       └── upload.js
│   │
│   ├── uploads/                       # Uploaded files (prescriptions)
│   │   └── prescriptions/
│   │
│   ├── database/
│   │   ├── migrations/                # Database migrations
│   │   └── seeds/                     # Seed data
│   │
│   ├── tests/                         # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── README.md
│
├── database/                           # Database Scripts
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
├── docs/                               # Documentation
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
├── .gitignore
├── README.md
└── docker-compose.yml                  # Docker setup (optional)
```

### Key Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "react-query": "^3.39.0",
    "react-hook-form": "^7.43.0",
    "react-toastify": "^9.1.0",
    "jwt-decode": "^3.1.2"
  }
}
```

### Component Organization Principles

1. **Components Folder**: Reusable UI components organized by feature
2. **Pages Folder**: Full page components for routes
3. **Services Folder**: API calls organized by feature
4. **Context Folder**: Global state management
5. **Hooks Folder**: Custom React hooks for reusability
6. **Utils Folder**: Helper functions and constants

### Routing Structure

```
/                           → HomePage
/login                      → LoginPage
/register                   → RegisterPage
/medicines                  → MedicinesPage (Public)
/medicines/:id              → MedicineDetailPage (Public)
/cart                       → CartPage (Protected)
/checkout                   → CheckoutPage (Protected)
/orders                     → OrdersPage (Protected)
/orders/:id                 → OrderDetailPage (Protected)
/prescriptions/upload       → PrescriptionUploadPage (Protected)
/profile                    → ProfilePage (Protected)
/admin                      → AdminDashboard (Admin Only)
/admin/medicines            → AdminMedicines (Admin Only)
/admin/orders               → AdminOrders (Admin Only)
/admin/prescriptions        → AdminPrescriptions (Admin Only)
/admin/users                → AdminUsers (Admin Only)
/admin/reports              → AdminReports (Admin Only)
```

---
