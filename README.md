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
- Backend: Node.js, Express.js, MySQL
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
- MySQL Server

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

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=online_medical_store

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

## Submission Notes

Before sharing/submitting ZIP:

- Remove `frontend/node_modules/`
- Remove `backend/node_modules/`
- Remove `frontend/build/`
- Remove `backend/uploads/`
- Do not include real `.env` files

## License

This project is built for academic/final-year project submission.
