# WasteZero

A full-stack volunteer-opportunity and waste-pickup management platform connecting **NGOs** and **volunteers**. NGOs post cleanup/recycling opportunities and schedule waste pickups; volunteers discover and apply to them; admins moderate the whole platform. Built as part of the Infosys Springboard 7.0 Virtual Internship.

**Stack:** Angular 22 (standalone components) · Node.js / Express 5 · MongoDB (Mongoose) · Socket.IO · JWT · End-to-end encrypted messaging

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Security](#security)
- [Real-Time Messaging & Encryption](#real-time-messaging--encryption)
- [Roles](#roles)
- [Scripts](#scripts)
- [Development Notes](#development-notes)

---

## Features

- **Authentication** — registration, email OTP verification, login, optional 2FA (email OTP), password reset, refresh-token rotation, "logout everywhere," account lockout after repeated failed logins.
- **Opportunities** — NGOs create/edit/soft-delete volunteer opportunities; volunteers browse, search, filter, and apply.
- **Applications** — application lifecycle (pending / accepted / rejected / withdrawn) tied to users and opportunities.
- **Pickups** — NGO-facing pickup scheduling and management with distance-aware sorting against a built-in dataset of ~90 Indian cities (haversine distance).
- **Messaging** — real-time, end-to-end encrypted direct messaging over Socket.IO, with conversation history, typing indicators, read receipts, and multi-device key backup/restore.
- **Notifications** — in-app notifications for application and opportunity lifecycle events.
- **Dashboard** — role-aware stats (volunteer / NGO / admin), month-over-month trends, recycling breakdown, upcoming pickups.
- **Admin Panel** — platform stats, user management (search, filter, suspend/reinstate), opportunity moderation, admin action logs, CSV report exports (users / pickups / opportunities / full).

## Tech Stack

**Backend**
- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO (real-time messaging & presence)
- JWT authentication, bcrypt password hashing
- Joi request validation
- Winston logging, Helmet, CORS, express-rate-limit
- Cloudinary (opportunity image uploads), Nodemailer (OTP emails), PDFKit (report generation)

**Frontend**
- Angular 22, standalone components, zoneless change detection
- RxJS, Socket.IO client
- Web Crypto API + `hash-wasm` (Argon2id) for client-side end-to-end encryption
- SCSS with CSS custom properties, Material Symbols icons

## Project Structure

```
WasteZero-Batch1-main/
├── Backend/
│   └── src/
│       ├── config/          # DB connection, Cloudinary, email, logger
│       ├── constants/       # Roles, status enums, message/notification types
│       ├── models/          # Mongoose schemas
│       ├── validators/      # Joi validation schemas
│       ├── middlewares/     # auth, role, ownership, rate limit, error handler
│       ├── services/        # Business logic layer
│       ├── controllers/     # Thin request handlers
│       ├── routes/          # Express routers + central registry
│       ├── sockets/         # Socket.IO auth, connection & event handling
│       ├── templates/       # Transactional email templates
│       ├── utils/           # ApiResponse, ApiError, asyncHandler, geo, PDF/CSV, tokens
│       ├── app.js           # Express app setup
│       └── server.js        # Entry point
│
└── Frontend/
    └── src/app/
        ├── core/             # Crypto service, auth interceptor, theme service
        ├── features/         # auth, dashboard, opportunities, pickups, messages,
        │                     # profile, settings, admin, help
        └── shared/           # sidebar, mobile nav, city autocomplete, notifications
```

## Getting Started

### Prerequisites
- Node.js v24+
- npm 10+
- A running MongoDB instance (local or Atlas)

### Backend

```bash
cd Backend
npm install
cp .env.example .env   # then fill in the values (see below)
npm run dev
```

The API starts at `http://localhost:3000`. Health check: `GET /health`.

### Frontend

```bash
cd Frontend
npm install
npm start               # ng serve
```

The app runs at `http://localhost:4200` and expects the backend API to be reachable (see `src/environments/environment.ts` for the configured API URL).

## Environment Variables

Backend `.env`:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (OTP delivery) — e.g. Gmail App Password or SendGrid
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=

# Cloudinary (opportunity image uploads) — https://console.cloudinary.com/
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## API Overview

All routes are mounted under `/api/v1`.

| Module | Base route | Purpose |
|---|---|---|
| Auth | `/auth` | Register, login, email OTP verification, 2FA, password reset, refresh-token rotation, session/logout management |
| Users | `/users` | Get/update own profile |
| Opportunities | `/opportunities` | CRUD + search/filter/paginate for volunteer opportunities |
| Applications | `/applications` | Apply to opportunities, manage application status |
| Messages | `/messages` | Encrypted direct messaging, conversation history |
| Pickups | `/pickups` | Schedule and manage NGO waste pickups |
| Notifications | `/notifications` | In-app notifications |
| Dashboard | `/dashboard` | Role-aware platform stats |
| Admin | `/admin` | Stats, user moderation, opportunity moderation, logs, CSV reports |

Requests are handled through a consistent pipeline:

```
Route → Auth middleware (JWT) → Role middleware → Ownership middleware
      → Joi validator → Controller (thin) → Service (business logic) → MongoDB
```

All responses follow a standard envelope: `{ success, message, data, timestamp }`.

## Security

- Passwords hashed with bcrypt; never stored or logged in plaintext
- JWT access tokens + rotating refresh tokens, with "logout everywhere" and per-token revocation
- Role-based access control (`volunteer`, `ngo`, `admin`) plus per-resource ownership checks
- Joi validation on every endpoint; server-managed fields are stripped from client input
- Helmet security headers, CORS, and a two-layer rate limiter (global + route-specific)
- Account lockout after repeated failed logins, with auto-unlock
- Optional email-based two-factor authentication
- Email OTP verification for registration and password reset, bcrypt-hashed and rate-limited
- Structured logging via Winston (no `console.log` in application code)

## Real-Time Messaging & Encryption

Direct messages are delivered over an authenticated Socket.IO connection (same JWT as the REST API) and are **end-to-end encrypted** in the browser before they ever reach the server:

- Every account has a browser-generated RSA-OAEP (2048-bit) key pair. The private key never leaves the browser in plaintext and is persisted in IndexedDB; only the public key is uploaded.
- Each message gets a fresh random AES-256-GCM key. The message body is encrypted with that key, and the key itself is wrapped separately for the sender and receiver using their public keys — the server only ever stores and relays ciphertext.
- **Multi-device key backup:** the key pair is also encrypted with a password-derived key (Argon2id → AES-256-GCM) and the resulting blob, along with the (non-secret) salt, is stored server-side. Logging in on a new device re-derives the same key from the account password and restores the original key pair, so message history stays readable across devices instead of generating a new, incompatible identity.

## Roles

| Role | Description |
|---|---|
| `volunteer` | Browses and applies to opportunities, schedules/tracks pickups, messages NGOs |
| `ngo` | Posts and manages opportunities, manages pickups, reviews applications |
| `admin` | Platform moderation: user suspension, opportunity removal, audit logs, report exports |

## Scripts

**Backend**
| Command | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with `--watch` |

**Frontend**
| Command | Description |
|---|---|
| `npm start` / `ng serve` | Start dev server at `localhost:4200` |
| `npm run build` | Production build to `dist/` |
| `npm run watch` | Development build in watch mode |
| `npm test` | Run unit tests (Vitest) |

## Development Notes

- The Dashboard's **CO2 Saved** and **Total Collected (kg)** figures are estimates derived from a constant average weight per completed pickup, since the schema doesn't yet track a measured per-pickup weight. These constants live at the top of `dashboardController.js` and can be replaced once real weight capture is added.
- See `MILESTONE4_TESTING_REPORT.md` for the most recent testing pass (admin dashboard, moderation, and reporting) and its documented follow-ups.
- Individual `Backend/README.md` and `Frontend/README.md` files contain additional service-specific detail (architecture diagram, full endpoint tables, CLI usage).
