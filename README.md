# WasteZero — Smart Waste Pickup & Recycling Platform

WasteZero is a full-stack web platform that helps volunteers schedule waste pickups, connects NGOs with volunteers through recycling and cleanup opportunities, and provides real-time messaging between users. The project is built as a REST API backend (Node.js/Express/MongoDB) paired with an Angular single-page application frontend.

This README documents the features that are **currently implemented** in the codebase.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Real-Time Messaging (Socket.IO)](#real-time-messaging-socketio)
- [Security](#security)
- [Scripts](#scripts)
- [Not Yet Implemented](#not-yet-implemented)

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Database | MongoDB + Mongoose ODM |
| Authentication | JWT (access + refresh tokens) + bcrypt |
| Real-time | Socket.IO |
| Validation | Joi |
| Email | Nodemailer |
| Image storage | Cloudinary |
| Logging | Winston |
| Security | Helmet, CORS, express-rate-limit |
| Architecture | MVC + Service Layer (thin controllers, business logic in services) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Angular (standalone components) |
| Language | TypeScript |
| Styling | SCSS with CSS custom properties |
| Reactive forms | Angular Reactive Forms |
| Real-time client | socket.io-client |
| HTTP | Angular HttpClient with an auth interceptor |

---

## Core Features

### 1. Authentication & Account Security
- Registration with role selection (Volunteer / NGO / Admin)
- Email verification via OTP
- Login with JWT access tokens + rotating refresh tokens
- "Remember me" / multi-device session support, logout and logout-all
- Forgot password / reset password via OTP
- Optional two-factor authentication (email OTP)
- Account lockout after repeated failed login attempts
- Session validation endpoint

### 2. User Profile Management
- View and update personal information (name, email, location, skills, bio)
- Change password (OTP-confirmed)
- Delete own account
- Search users (used to start new conversations)

### 3. Volunteer Opportunities
- NGOs (and admins) can create, edit, and delete volunteering/recycling opportunities
- Each opportunity includes a title, description, required skills, location, duration, optional cover image, and max volunteers
- Public listing with search, status filter, and city filter
- Status lifecycle: `OPEN → IN_PROGRESS → CLOSED`, plus `CANCELLED`, with ownership-based transition rules
- Volunteers can browse and view full opportunity details

### 4. Applications
- Volunteers can apply ("join") to an open opportunity and withdraw later
- NGOs (and admins) can view applicants for their opportunities and accept/reject applications
- Application status lifecycle: `PENDING → ACCEPTED/REJECTED`, with `WITHDRAWN` for volunteer-initiated exits
- Volunteers can view all of their own applications

### 5. Real-Time Messaging
- Direct one-to-one chat between any two users
- Conversation list with last message preview and unread count
- Full message history per conversation, paginated
- Mark conversation as read
- Live delivery via Socket.IO (`message:send`, `message:new`), with a REST fallback endpoint if the socket is unavailable
- Typing indicators and online/offline presence events

### 6. Schedule Pickup (Volunteers only)
- Two-step "Schedule New Pickup" form:
  1. Address, city, pickup date, and preferred time slot
  2. Waste types to recycle (Plastic, Paper, Glass, Metal, Electronic Waste, Organic Waste, Other) and additional notes
- "Pickup History" tab listing all of a volunteer's pickups with status (Pending, In Progress, Completed, Cancelled)
- Cancel a pending/in-progress pickup
- This feature and its sidebar/navigation entry are visible only to users with the **Volunteer** role

### 7. Navigation & Layout
- Shared sidebar and mobile bottom navigation with role-aware menu items
- Responsive layout (desktop sidebar / mobile bottom nav)
- User dropdown with profile access and logout

---

## Roles & Permissions

| Role | Description | Access |
|---|---|---|
| **Volunteer** | Individual who applies to opportunities and schedules pickups | Opportunities (browse/apply/withdraw), Schedule Pickup, Messages, Profile |
| **NGO** | Organization that posts volunteering opportunities | Create/edit/delete own opportunities, review applicants, Messages, Profile |
| **Admin** | Platform administrator | All NGO permissions on any opportunity, plus elevated access on ownership-protected routes |

Role checks are enforced server-side via `roleMiddleware` (allowed roles per route) and `ownershipMiddleware` (users may only modify resources they own, unless they are an admin).

---

## Project Structure

```
WasteZero/
├── Backend/
│   └── src/
│       ├── config/         # DB connection, logger, email, Cloudinary config
│       ├── constants/      # Roles, status enums, waste types, time slots
│       ├── models/         # Mongoose schemas (User, Opportunity, Application, Message, Pickup, AdminLog, RefreshToken)
│       ├── validators/     # Joi request validation schemas
│       ├── middlewares/    # Auth, role, ownership, rate limiting, error handling
│       ├── services/       # Business logic layer
│       ├── controllers/    # Thin request handlers
│       ├── routes/         # Express routers + central registry
│       ├── sockets/        # Socket.IO server, auth handshake, presence
│       ├── utils/          # ApiResponse, ApiError, asyncHandler, token helpers
│       ├── templates/      # Transactional email templates
│       ├── app.js          # Express app setup
│       └── server.js       # Entry point (HTTP + Socket.IO)
│
└── Frontend/
    └── src/app/
        ├── core/interceptors/     # Auth token interceptor
        ├── features/
        │   ├── auth/              # Login / register / verification
        │   ├── profile/           # Personal info + password change
        │   ├── opportunities/     # List, detail, create/edit form
        │   ├── messages/          # Conversation list + chat window
        │   └── pickups/           # Schedule Pickup (form + history)
        └── shared/
            ├── sidebar/           # Desktop navigation
            ├── mobile-bottom-nav/ # Mobile navigation
            └── page-shell/        # Shared page layout (header, sidebar, content)
```

---

## Getting Started

### Prerequisites
- Node.js (LTS)
- A running MongoDB instance (local or Atlas)
- Cloudinary account (for opportunity image uploads)
- SMTP credentials (for OTP / verification emails)

### Backend

```bash
cd Backend
npm install
npm run dev
```

The API starts on `http://localhost:3000` (health check at `GET /health`). Socket.IO shares the same HTTP server/port.

### Frontend

```bash
cd Frontend
npm install
npm start
```

The Angular app starts on `http://localhost:4200` and expects the API at the URL configured in `src/environments/environment.ts`.

---

## Environment Variables

Create a `.env` file inside `Backend/`:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Cloudinary (opportunity image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMTP (OTP / verification emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
FROM_EMAIL=noreply@wastezero.com
```

---

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

### Auth (`/auth`)
| Method | Route | Description |
|---|---|---|
| POST | `/register` | Register a new user |
| POST | `/login` | Login, returns access + refresh token |
| POST | `/verify-email` | Verify email with OTP |
| POST | `/resend-otp` | Resend email verification OTP |
| POST | `/forgot-password` | Request password reset OTP |
| POST | `/reset-password` | Reset password with OTP |
| POST | `/refresh-token` | Rotate refresh token |
| POST | `/logout` | Revoke current refresh token |
| POST | `/verify-2fa` | Verify 2FA OTP after login |
| POST | `/resend-2fa` | Resend 2FA OTP |
| GET | `/session` | Validate current session |
| POST | `/revoke` | Revoke a specific refresh token |
| POST | `/logout-all` | Logout from all devices |

### Users (`/users`)
| Method | Route | Description |
|---|---|---|
| GET | `/search` | Search users (for starting a conversation) |
| GET | `/profile` | Get own profile |
| PUT | `/profile` | Update own profile |
| DELETE | `/profile` | Delete own account |
| POST | `/change-password-init` | Start password change (sends OTP) |
| POST | `/change-password-confirm` | Confirm password change with OTP |

### Opportunities (`/opportunities`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/` | NGO, Admin | Create an opportunity |
| GET | `/` | Any | List opportunities (search/filter/paginate) |
| GET | `/:id` | Any | Get opportunity details |
| PUT | `/:id` | NGO (owner) | Update an opportunity |
| PATCH | `/:id/status` | NGO (owner), Admin | Change opportunity status |
| DELETE | `/:id` | NGO (owner) | Soft-delete an opportunity |

### Applications (`/applications`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/` | Volunteer | Apply to an opportunity |
| GET | `/mine` | Volunteer | List own applications |
| DELETE | `/opportunity/:opportunityId` | Volunteer | Withdraw from an opportunity |
| GET | `/opportunity/:opportunityId` | NGO (owner), Admin | List applicants for an opportunity |
| PATCH | `/:id/status` | NGO (owner), Admin | Accept/reject an application |

### Messages (`/messages`)
| Method | Route | Description |
|---|---|---|
| GET | `/conversations` | List all conversations for the current user |
| GET | `/:userId` | Get message history with a specific user |
| PATCH | `/:userId/read` | Mark a conversation as read |
| POST | `/` | Send a message (REST fallback; primary path is the socket) |

### Pickups (`/pickups`)
| Method | Route | Role | Description |
|---|---|---|---|
| POST | `/` | Volunteer | Schedule a new pickup |
| GET | `/mine` | Volunteer | List own pickups (history) |
| GET | `/:id` | Owner, Admin | Get a single pickup |
| PATCH | `/:id/cancel` | Owner, Admin | Cancel a pending/in-progress pickup |

### Health
| Method | Route | Description |
|---|---|---|
| GET | `/health` | Server health check |

---

## Real-Time Messaging (Socket.IO)

The client connects to the same host/port as the REST API and authenticates the socket handshake with the user's JWT.

| Event | Direction | Description |
|---|---|---|
| `message:send` | Client → Server | Send a message |
| `message:new` | Server → Client | New message delivered to sender + receiver |
| `message:read` | Both | Mark/notify that a conversation was read |
| `typing:start` / `typing:stop` | Both | Typing indicator |
| `presence:update` | Server → Client | A user came online/went offline |
| `presence:list` | Server → Client | Initial list of online user IDs on connect |
| `presence:check` | Client → Server | Check whether a specific user is online |

---

## Security

- Passwords hashed with bcrypt (never stored in plain text)
- Stateless JWT authentication with short-lived access tokens and rotating refresh tokens
- Role-based access control (Volunteer / NGO / Admin)
- Ownership checks so users can only modify resources they own (admins are exempt)
- Joi validation on every write endpoint; server-managed fields (status, ownership, timestamps) are rejected if sent by the client
- Helmet security headers and CORS
- Two-layer rate limiting: a global request limiter plus stricter limits on sensitive auth routes
- Account lockout after repeated failed login attempts
- Optional two-factor authentication via email OTP
- All server-side logging goes through Winston (no `console.log` in request handlers)

---

## Scripts

**Backend**
```bash
npm start   # Start production server
npm run dev # Start development server with file watching
```

**Frontend**
```bash
npm start   # Start Angular dev server (ng serve)
npm run build # Production build
npm test    # Run unit tests
```

---

## Not Yet Implemented

The following are present as UI mockups and/or placeholder navigation links, but do not have working functionality yet:

- Admin dashboard (user management, admin logs, platform-wide reports)
- Volunteer/NGO dashboard (pickup stats, recycling breakdown, CO2 saved, "My Impact")
- In-app notifications
- Settings and Help & Support pages
- Dynamic pickup-agent assignment
