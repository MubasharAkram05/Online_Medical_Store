# Online Medical Store Management System (OMSMS)

A full-stack web application for managing an online medical store with customer ordering, prescription handling, payments, and admin operations.

## Features

- User authentication (register/login)
- Medicine listing, search, and details
- Cart and checkout flow
- Prescription upload and verification workflow
- Multi-method payment flow
- Admin dashboard for medicines, orders, users, and prescriptions

## Tech Stack

- Frontend: React 18, React Router, Axios, React Hook Form
- Backend: Node.js, Express.js, PostgreSQL (e.g. [Neon](https://neon.tech) serverless Postgres)
- Security: JWT, bcrypt, helmet, CORS, rate limiting

## Project Structure

```text
omsms/
|-- frontend/
|-- backend/
|-- database/
|-- docs/
|-- README.md
`-- PROJECT_STRUCTURE.md
```

## Prerequisites

- Node.js >= 18
- npm
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project, or local Postgres)

## Installation

### 1. Clone and move into project

```bash
git clone <your-repo-url>
cd "Online Medical store Managment system"
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` and configure values:

```env
PORT=4000
APP_NAME=Online Medical Store API

DATABASE_URL=postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/online_medical_store?sslmode=require

JWT_ACCESS_SECRET=change_me_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

## Run the project

### Start backend

```bash
cd backend
npm run dev
```

### Start frontend

```bash
cd frontend
npm start
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Useful Scripts

### Backend (`backend/package.json`)
- `npm install` - install dependencies
- `npm run dev` - start backend in development mode
- `npm start` - start backend in production mode
- `npm run seed-medicines` - seed medicines
- `npm run setup-db` - setup database

### Frontend (`frontend/package.json`)

- `npm start` - run frontend in development mode
- `npm run build` - build production bundle
- `npm test` - run tests

## API Modules

- `auth`
- `medicine`
- `order`
- `prescription`
- `admin`

## Deploying to Vercel

This is a monorepo containing two independently deployable apps, so create
**two separate Vercel projects** pointing at this same repository:

### 1. Backend project (root directory: `backend`)

- Import the repo in Vercel and set **Root Directory** to `backend`.
- Vercel picks up `backend/vercel.json`, which routes all requests to the
  serverless function at `backend/api/index.js` (the same Express app used
  locally, called directly with Vercel's `(req, res)`).
- Add all variables from `backend/.env.example` as Environment Variables in
  the Vercel project settings. In particular:
  - `DATABASE_URL` must point at a **hosted** Postgres instance — e.g. a
    [Neon](https://neon.tech) serverless Postgres database, which pairs
    naturally with Vercel's serverless functions. Vercel functions cannot
    reach a Postgres server on your local machine.
  - `CORS_ORIGIN` should be your frontend's Vercel URL (e.g.
    `https://your-frontend.vercel.app`).
  - `FRONTEND_URL` should also be the frontend's deployed URL.
- **File uploads**: Vercel functions run on a read-only filesystem except
  for `/tmp`, and `/tmp` is not persisted between invocations. Prescription,
  payment-proof, and medicine-image uploads will work per-request but will
  **not** be durably stored. For a real deployment, swap the disk storage in
  `backend/src/middleware/upload.middleware.js` for an object storage
  provider (S3, Cloudinary, Vercel Blob, etc.) before relying on uploads in
  production.
- After deploying, note the backend's URL (e.g.
  `https://your-backend.vercel.app`) — the API is served at
  `https://your-backend.vercel.app/api/...`.

### 2. Frontend project (root directory: `frontend`)

- Import the repo again as a second Vercel project and set **Root
  Directory** to `frontend`. Vercel auto-detects the Create React App build
  (`npm run build`, output `build/`).
- `frontend/vercel.json` adds a rewrite so client-side routes (React Router)
  resolve correctly on refresh/deep-link.
- Add environment variable `REACT_APP_API_URL` set to
  `https://your-backend.vercel.app/api`.

## Submission Notes

Before sharing/submitting ZIP:

- Remove `frontend/node_modules/`
- Remove `backend/node_modules/`
- Remove `frontend/build/`
- Remove `backend/uploads/`
- Do not include real `.env` files

## License

This project is built for academic/final-year project submission.
# Deploy
Deployed successfully on Vercel.
