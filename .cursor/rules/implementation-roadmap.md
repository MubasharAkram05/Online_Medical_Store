## Online Medical Store – Implementation Roadmap
## Review Summary
- `PROJECT_STRUCTURE.md` lays out a comprehensive React/Express/MySQL architecture with clear separation of frontend, backend, docs, and database assets.
- It covers most feature areas (auth, medicines, prescriptions, orders, admin) but lacks concrete implementation guidance, DB schema details, and integration flow between modules.

## Implementation Roadmap
- **Phase 1 – Foundations**
  - Confirm project scaffolding (`frontend`, `backend`, `database`) and shared configs (`.env`, `docker-compose.yml`).
  - Set up MySQL schema and seed framework to unblock feature work.
  - Configure backend Express server (`app.js`), DB connection, centralized error handling, JWT utilities.
- **Phase 2 – Core User Journey**
  - `Register` → `Login` → `Profile setup` → `Prescription upload`.
  - Build medicine catalog browsing, searching, and filtering.
  - Implement cart/order flow with prescription verification gate and payments.
- **Phase 3 – Admin & Reporting**
  - Inventory CRUD with expiry/stock tracking, supplier management, verification queue.
  - Dashboard analytics, low-stock alerts, exportable reports.

## Phase 1 Deliverables (Start Here)

- **Database Schema (MySQL)**
  ```14:34:database/schema.sql
  CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient','doctor','pharmacist','admin') DEFAULT 'patient',
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

  CREATE TABLE prescriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    status ENUM('pending','verified','rejected','expired') DEFAULT 'pending',
    notes TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  -- add medicines, categories, carts, orders, order_items, payments, interactions in follow-up script
  ```
  - Add migrations or use Sequelize/Knex for versioning.
  - Seed roles, sample medicines, interaction data as required.

- **Backend Setup (`backend/src`)**
  - `config/database.js`: MySQL pool via `mysql2/promise`.
  - `models/User.js`, `Prescription.js`, `Medicine.js`, etc.
  - `routes/auth.routes.js` (register/login/refresh/reset) → `auth.controller.js`.
  - `middleware/auth.middleware.js` for JWT verification; use bcrypt for password hashing.
  - Global error + validation middleware.

- **Frontend Setup (`frontend/src`)**
  - Create `services/api.js` (Axios base, interceptors).
  - `context/AuthContext.js`, `hooks/useAuth.js`.
  - Pages: `pages/auth/RegisterPage.js`, `LoginPage.js`, `ForgotPasswordPage.js`, `ResetPasswordPage.js`.
  - Components: `components/auth/AuthGuard.js`, `PrivateRoute.js`.
  - Global forms using `react-hook-form`, validation via shared `validators.js`.

## Step-by-Step Feature Implementation

- **Step 1: User Registration**
  - Frontend form (name, email, phone, password, confirm). Client-side validation.
  - POST `POST /api/auth/register`.
  - Backend: validate, hash (`bcrypt`), store, return JWT + refresh token.
  - DB: insert into `users`.
  - Optional: send verification email; store token table.

- **Step 2: User Login**
  - Frontend login form; persist token in `AuthContext` + `localStorage`.
  - Backend `POST /api/auth/login` verifies password, returns tokens, user profile.
  - Add refresh token rotation endpoint.

- **Step 3: Password Reset**
  - `POST /api/auth/request-reset` to send token; `POST /api/auth/reset` to update.
  - Store reset tokens hashed and expiring.

- **Step 4: Prescription Upload**
  - Frontend component with drag-and-drop; restrict to JPG/PNG/PDF; preview.
  - Backend `POST /api/prescriptions` using `multer` to `uploads/prescriptions/`; persist metadata.
  - Admin verification endpoints (`PATCH /api/prescriptions/:id/status`).

- **Step 5: Medicine Catalog**
  - Tables: `medicines`, `categories`, `medicine_images`, `medicine_interactions`.
  - Endpoints: `GET /api/medicines`, `GET /api/medicines/:id`, search query params, autocomplete route.
  - Frontend pages with filters (category, price, availability), use `react-query`.

- **Step 6: Cart & Orders**
  - Tables: `carts`, `cart_items`, `orders`, `order_items`.
  - Backend endpoints for cart CRUD, order creation. Ensure prescription requirement check.
  - Generate order IDs, store status (`placed`, `processing`, `shipped`, etc.), capture timestamps.

- **Step 7: Payments**
  - `payments` table (order_id, method, status, reference, receipt_url).
  - Integrate placeholder payment providers (mock service first, plug real gateway later).
  - Store receipts/transaction data; handle COD flow.

- **Step 8: Account & History**
  - Frontend dashboard showing profile, addresses, saved prescriptions, downloadable invoices.
  - Backend endpoints for update profile, change password, list orders (`GET /api/orders/me`), invoice generation.

- **Step 9: Dosage & Interaction Alerts**
  - Extend `medicines` with dosage, side effects, interactions. Link to external API if available.
  - On order submission, backend cross-check combinations; return warnings.
  - Frontend surfaces warnings modally; require confirmation.

- **Admin Module**
  - Role-based routes using `AdminRoute`.
  - CRUD for medicines/suppliers (`admin.routes.js`).
  - Verification queue UI, order management with prioritization flags.
  - Reporting endpoints (`GET /api/admin/reports`), low-stock notifications.

## Next Actions
- Confirm stack choices (ORM, state management, UI library).
- Decide on seed/mock data strategy for early testing.
- Once schema and auth foundation are in place, proceed with Step 1 implementation and testing before moving on.



### Phase 1 – Foundations
- Confirm project scaffolding for `frontend`, `backend`, and `database`.
- Define MySQL schema, migrations, and seed strategy (users, medicines, interactions).
- Configure Express app: `app.js`, database connection, JWT utilities, centralized error handling.
- Set up frontend base: Axios `api.js`, `AuthContext`, `useAuth`, routing skeleton.

### Phase 2 – Core User Journey
- Implement registration → login → profile management flow with JWT + refresh tokens.
- Build prescription upload (frontend component, backend upload endpoint, storage).
- Deliver medicine catalog browsing with search, filters, autocomplete.
- Complete cart and order flow, including prescription verification at checkout.
- Integrate payment options (card, transfer, wallet, COD) with receipt storage.
- Provide user dashboard: order history, invoice download, account settings.

### Phase 3 – Admin & Reporting
- Admin CRUD for medicines with expiry tracking, stock alerts, supplier management.
- Prescription verification queue with status updates and admin notes.
- Order management with priority handling; status workflows.
- Reporting endpoints and dashboards for sales, inventory, expiry alerts.
- Dosage & interaction management: data sourcing, warning generation on risky combos.

### Supporting Tasks & Tools
- Authentication: JWT access/refresh tokens, bcrypt password hashing, optional verification.
- Testing: unit/integration tests for auth, prescriptions, ordering, admin workflows.
- Deployment: `.env` management, Docker/Nginx setup, CI/CD considerations.
- Documentation: keep `PROJECT_STRUCTURE.md`, API docs, and setup guides updated.

