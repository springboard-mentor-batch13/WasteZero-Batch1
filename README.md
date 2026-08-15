# WasteZero - Smart Waste Pickup & Recycling Platform

Backend API for the Infosys Springboard 7.0 Virtual Internship.

## Project Overview

A production-ready REST API backend for a volunteer-opportunity matching platform where NGOs can post cleanup/recycling opportunities and volunteers can apply. Built with Node.js, Express.js, MongoDB, JWT authentication, and role-based access control.

## Tech Stack

- **Runtime:** Node.js v24
- **Framework:** Express.js 5
- **Database:** MongoDB + Mongoose ODM
- **Authentication:** JWT + bcrypt
- **Validation:** Joi
- **Logging:** Winston
- **Security:** Helmet, CORS
- **Architecture:** MVC + Service Layer

## Architecture

```
Client Request
     │
     ▼
Route ──► Auth Middleware ──► Role Middleware ──► Ownership Middleware
     │                                                   │
     ▼                                                   ▼
Validator (Joi) ──► Controller ──► Service ──► MongoDB
                           │
                           ▼
                    ApiResponse (JSON)
```

- **Thin controllers** — only read request, call service, return response
- **Service layer** — all business logic, DB queries, validation
- **Middlewares** — auth (JWT), role (volunteer/ngo/admin), ownership
- **Standard response** — `{ success, message, data, timestamp }`

## Folder Structure

```
WasteZero/
│
├── src/
│   ├── config/          Database connection, Winston logger
│   ├── constants/       Roles, status enums, message types, actions
│   ├── models/          Mongoose schemas (User, Opportunity, etc.)
│   ├── validators/      Joi validation schemas
│   ├── middlewares/     Auth, role, ownership, error handler
│   ├── services/        Business logic layer
│   ├── controllers/     Request handlers (thin)
│   ├── routes/          Express routes + central registry
│   ├── utils/           ApiResponse, ApiError, asyncHandler, token
│   ├── docs/            API documentation, database design
│   ├── app.js           Express app setup
│   └── server.js        Entry point
│
├── postman/             Postman collection
├── .env                 Environment variables
└── package.json
```

## Installation

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3000`. Health check: `GET /health`

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Cloudinary (opportunity image uploads) - get these from https://console.cloudinary.com/
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Database Schema

8 Collections with full relationships:

| Collection | Key Fields | Relationships |
|------------|-----------|---------------|
| **Users** | name, email, password, role, skills | — |
| **Opportunities** | title, description, status, location, duration | → User (ngo) |
| **Applications** | status (pending/accepted/rejected/withdrawn) | → User, → Opportunity |
| **Pickups** | address, city, pickupDate, timeSlot, wasteTypes, status | → User (volunteer), → User (ngo) |
| **Messages** | content, isRead, messageType | → User (sender/receiver), → Application |
| **RefreshTokens** | tokenHash, expiresAt, isRevoked, device | → User |
| **Notifications** | type, title, message, isRead | → User (receiver), → User (sender) |
| **AdminLogs** | action, targetType, targetId, details | → User (admin) |

See `src/docs/database.md` for full ER diagram and indexes.

## Authentication Flow

1. **Register** (`POST /api/v1/auth/register`) — creates user, returns JWT
2. **Login** (`POST /api/v1/auth/login`) — validates credentials, returns JWT
3. All protected routes require: `Authorization: Bearer <token>`
4. JWT contains: `{ id, role }` — verified by authMiddleware
5. Role-based access via `authorize('ngo')`, `authorize('admin')`, etc.

## API Modules

### Health

| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Server health check |

### Auth (`/api/v1/auth`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | /register | ❌ | Any | Register new user (volunteer/ngo/admin) |
| POST | /login | ❌ | Any | Login, returns JWT + refresh token |
| POST | /verify-email | ❌ | Any | Verify email with OTP |
| POST | /resend-otp | ❌ | Any | Resend email verification OTP |
| POST | /forgot-password | ❌ | Any | Request password reset OTP |
| POST | /reset-password | ❌ | Any | Reset password with OTP |
| POST | /refresh-token | ❌ | Any | Rotate refresh token, get new access token |
| POST | /logout | JWT | Any | Revoke current refresh token |
| POST | /verify-2fa | ❌ | Any | Verify 2FA OTP (after login if enabled) |
| POST | /resend-2fa | ❌ | Any | Resend 2FA OTP |
| GET | /session | JWT | Any | Validate session, get user + token info |
| POST | /revoke | JWT | Any | Revoke a specific refresh token |
| POST | /logout-all | JWT | Any | Logout from all devices |

### Users (`/api/v1/users`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /profile | JWT | Any | Get own profile |
| PUT | /profile | JWT | Any | Update own profile |

### Opportunities (`/api/v1/opportunities`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | / | JWT | ngo | Create opportunity |
| GET | / | JWT | Any | List (search, filter, paginate, sort) |
| GET | /:id | JWT | Any | Get by ID |
| PUT | /:id | JWT | ngo (owner) | Update |
| PATCH | /:id/status | JWT | ngo (owner), admin | Change status |
| DELETE | /:id | JWT | ngo (owner) | Soft delete |

### Applications (`/api/v1/applications`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | / | JWT | volunteer | Apply to an opportunity |
| GET | /mine | JWT | volunteer | My applications |
| GET | /opportunity/:opportunityId | JWT | ngo, admin | Applicants for an opportunity |
| PATCH | /:id/status | JWT | ngo (owner), admin | Accept/reject application |
| DELETE | /opportunity/:opportunityId | JWT | volunteer | Withdraw application |

### Pickups (`/api/v1/pickups`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | / | JWT | volunteer | Request a pickup |
| GET | /mine | JWT | volunteer | My pickup requests |
| GET | /available | JWT | ngo | Pickups awaiting NGO |
| GET | /accepted | JWT | ngo | Pickups accepted by NGO |
| GET | /:id | JWT | Any | Get by ID |
| PATCH | /:id/accept | JWT | ngo | Accept a pickup |
| PATCH | /:id/decline | JWT | ngo | Decline a pickup |
| PATCH | /:id/complete | JWT | ngo | Complete a pickup |
| PATCH | /:id/cancel | JWT | volunteer, admin | Cancel a pickup |

### Messages (`/api/v1/messages`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /conversations | JWT | Any | List conversations (one row per other user) |
| GET | /:userId | JWT | Any | Full chat history with a user |
| PATCH | /:userId/read | JWT | Any | Mark messages from a user as read |
| POST | / | JWT | Any | Send a message (REST fallback; primary path is socket `message:send`) |

### Notifications (`/api/v1/notifications`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | / | JWT | Any | My notifications |
| GET | /unread-count | JWT | Any | Unread count |
| PATCH | /:id/read | JWT | Any | Mark one as read |
| PATCH | /read-all | JWT | Any | Mark all as read |

### Reports (`/api/v1/reports`)

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| GET | /users | JWT | admin | Users report (summary + user list) |
| GET | /pickups | JWT | admin | Pickups report (summary + pickup list) |
| GET | /opportunities | JWT | admin | Opportunities report (summary + opportunity list) |
| GET | /activity | JWT | admin | Full activity report (merged users + opportunities + applications feed) |

Reports support optional `from`/`to` ISO date filters (UTC; date-only `to` = end-of-day) and an optional `format` param (`json` default | `csv` downloadable file). CSV output is RFC 4180 + UTF-8 BOM with attachment headers; arrays are pipe-joined, `null` → empty; CSV columns match the JSON rows exactly (same privacy whitelist). `page`/`limit` only apply to opportunities/activity in JSON mode; CSV mode rejects them (full export only, 400).

## Milestone 4 — Report Generation Engine ✅ (Complete)

**Requirement:** Develop the backend logic and database queries to generate analytical reports detailing active users, posted opportunities, and volunteer responses. Structure the backend output to support the specific downloadable files required: Users Report, Pickups Report, Opportunities Report, and Full Activity Report.

**Delivered — 4 admin-only downloadable reports:**

| Report | Endpoint | What it contains |
|--------|----------|------------------|
| Users Report | `GET /api/v1/reports/users` | Active users, user details & statistics (by role, new this month, monthly registrations) |
| Pickups Report | `GET /api/v1/reports/pickups` | Pickup/activity data (by status, city, waste type, time slot, monthly) |
| Opportunities Report | `GET /api/v1/reports/opportunities` | NGOs' posted opportunities, details & status |
| Full Activity Report | `GET /api/v1/reports/activity` | Combined users + opportunities + volunteer applications/responses feed |

**Download format:** `?format=csv` → downloadable file (`wastezero-<report>-report-<YYYY-MM-DD>.csv`, RFC 4180 + UTF-8 BOM). `?format=json` (default) → structured data. All reports support optional `from`/`to` UTC date filters. Admin-only access.

## Security Features

- **Password hashing** — bcrypt (never stored in plain text)
- **JWT authentication** — stateless token-based auth
- **Role-based access** — volunteer, ngo, admin roles
- **Ownership verification** — users can only modify their own resources
- **Input validation** — Joi schemas on every endpoint
- **Forbidden fields** — server-managed fields blocked from client
- **Helmet** — security headers
- **CORS** — cross-origin protection
- **Rate limiting** — two-layer defense (global 100 req/min + route-specific limits)
- **Account lockout** — 5 failed login attempts → 30 min auto-unlock
- **Two-factor authentication** — optional TOTP via email
- **Session management** — refresh tokens with rotation, revocation, and remember me
- **Password policy** — min 8 chars, uppercase, lowercase, number, special char
- **Email OTP verification** — bcrypt hashed, rate limited, auto-lock on abuse
- **No console.log** — all logging via Winston

## Scripts

- `npm start` — Start production server
- `npm run dev` — Start development server (with --watch)

## Future Modules (Not Implemented)

- Matching algorithm (skills + location)
- Admin dashboard & analytics

> Messaging (REST + Socket.IO), Notification APIs, Application APIs, Pickup APIs, and the Report Generation Engine are **implemented** — see `src/docs/api.md` for the full endpoint reference.

## Author

Developed as part of Infosys Springboard 7.0 Virtual Internship.

---

**Status:** Milestone 4 — Part 5 (Downloadable CSV Reports) ✅ Complete & Frozen. Full endpoint reference in `src/docs/api.md`.
