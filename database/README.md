# Database Setup

This project uses PostgreSQL (e.g. [Neon](https://neon.tech) serverless Postgres).

## Create Database
Create the database via your Postgres provider's dashboard/CLI (e.g. the Neon console), then load the schema:

```bash
psql "$DATABASE_URL" -f schema.sql
```

## Seed Default Catalogue
After the schema exists, load the starter products that power the `/medicines` page:

```bash
psql "$DATABASE_URL" -f database/seeds/medicines_seed.sql
```

> Re-running the seed on a database that already contains rows will attempt to insert duplicates. Clean the table (or remove specific rows) first if necessary.

## Users Table Columns
- `role` supports: `patient`, `doctor`, `pharmacist`, `admin`
- Passwords stored as bcrypt hashes

## Prescriptions
- Store uploaded files in `backend/uploads/prescriptions/`
- `status` values: `pending`, `verified`, `rejected`, `expired`
- Track original filename, mime type, and size for each upload
- `verified_by` references `users.id` for staff accounts

## Medicines
- Each product tracks price, stock, category, and whether it requires a prescription
- `requires_prescription = true` forces verification during checkout
- Additional clinical data:
  - `dosage_instructions` for recommended usage
  - `side_effects` for common adverse reactions
  - `interactions` JSON for general interaction notes
- `expiry_date` and `supplier_id` support stock expiry tracking and supplier reporting
- `medicine_interactions` table stores pairwise interaction records with severity and description

## Orders
- `orders` table stores shipping/contact details, totals, payment method, and prescription verification flag
- `order_items` stores per-medicine quantity and pricing
- Order numbers are generated automatically (unique per order)
- `orders.status` supports: `pending`, `pending_prescription`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`
- From November 2025 onward, `orders.priority` tracks urgency (`normal`, `high`, `urgent`). If your database predates this column, run:
  ```sql
  ALTER TABLE orders
    ADD COLUMN priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent'));
  ```
- If your database predates prescription-gated order status support, run:
  ```sql
  ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
  ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'pending_prescription', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
  ```

## Payments
- Each order links to a `payments` record capturing method, status, transaction/reference details
- Cash on delivery starts as `pending`; electronic methods can be marked `completed` immediately
- `receipt_url` can store links to uploaded receipts or provider confirmations

## Suppliers
- `suppliers` table stores vendor information (contact details, notes)
- `medicines.supplier_id` references suppliers for procurement tracking

## Password Reset Tokens
- Store hashed reset tokens with expiry for secure password reset flow
