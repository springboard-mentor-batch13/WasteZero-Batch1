# WasteZero — Smart Waste Pickup & Recycling Platform

A full-stack volunteer-opportunity matching platform where NGOs post cleanup/recycling opportunities, volunteers apply and get matched, and both sides coordinate pickups through real-time, end-to-end encrypted messaging.

Built as part of the Infosys Springboard 7.0 Virtual Internship.

```
WasteZero-Batch1/
├── Backend/    Node.js + Express + MongoDB REST API (+ Socket.IO)
├── Frontend/   Angular 22 single-page app
└── README.md   You are here
```

For endpoint-level and framework-level detail, see [`Backend/README.md`](Backend/README.md) and [`Frontend/README.md`](Frontend/README.md).

## Features

- **Auth & accounts** — JWT access/refresh tokens, email OTP verification, forgot/reset password, optional email-based 2FA, account lockout after repeated failed logins, session/device management (`logout-all`, revoke a specific refresh token).
- **Opportunities** — NGOs create, update, and close cleanup/recycling opportunities; volunteers search, filter, and apply.
- **Applications** — accept/reject/withdraw workflow linking volunteers to opportunities.
- **Pickups** — scheduling and management of pickups tied to accepted applications.
- **Notifications** — in-app notifications for relevant account/application/pickup events.
- **Real-time, end-to-end encrypted messaging** — direct messages between users, delivered over Socket.IO with a REST fallback, encrypted client-side so the server only ever stores/relays ciphertext.
- **Multi-device key backup for messaging** — a password-wrapped backup of a user's encryption key pair, so logging in on a second device recovers the *same* keys (and can read message history) instead of generating new, incompatible ones.

## Tech Stack

**Backend**
- Node.js + Express 5, MongoDB + Mongoose
- JWT + bcrypt for auth, Joi for validation, Winston for logging
- Socket.IO for real-time messaging and presence
- Helmet, CORS, rate limiting

**Frontend**
- Angular 22 (standalone components, reactive forms)
- Socket.IO client
- Web Crypto API (RSA-OAEP + AES-GCM) for E2EE, `hash-wasm` (Argon2id) for password-based key derivation

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB running locally or a connection string to a hosted instance
- A Cloudinary account (for opportunity image uploads)

### Backend

```bash
cd Backend
npm install
```

Create a `.env` file (see [`Backend/README.md`](Backend/README.md#environment-variables) for the full list):

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

```bash
npm run dev
```

The API starts at `http://localhost:3000`. Health check: `GET /health`.

### Frontend

```bash
cd Frontend
npm install
ng serve
```

The app starts at `http://localhost:4200` and talks to the API at the `apiUrl` configured in `src/environments/environment.ts` (defaults to `http://localhost:3000/api/v1`).

## Architecture

```
Angular SPA  ──HTTP──►  Express routes ──► Auth/Role/Ownership middleware
     │                        │
     │                        ▼
     │                 Joi validators ──► Controllers (thin) ──► Services ──► MongoDB
     │
     └────WebSocket────►  Socket.IO (real-time messages, presence)
```

- **Thin controllers, fat services** — controllers only parse the request and call a service; business logic and DB access live in the service layer.
- **Standard API response shape** — `{ success, message, data, timestamp }` for every endpoint.
- **Role-based access** — `volunteer`, `ngo`, and `admin` roles, enforced via middleware plus ownership checks on update/delete routes.

## End-to-End Encrypted Messaging

Direct messages are encrypted in the browser before they ever reach the server:

- Each account has an RSA-OAEP (2048-bit) key pair. The private key is generated client-side and never transmitted; only the public key is uploaded so other users can encrypt messages *to* you.
- Each message gets its own random AES-256-GCM key. The message body is encrypted with that key, and the key itself is wrapped (RSA-OAEP encrypted) once for the sender and once for the receiver — so both sides can read their own copy of a conversation, while the server only ever stores and relays ciphertext.

### Multi-device key backup

Because the private key normally lives only in the browser's IndexedDB, opening an account on a new device used to generate a brand-new, unrelated key pair — new messages worked, but nothing encrypted for the original device could be decrypted. This is now solved with a password-wrapped backup:

1. **On the device that first creates the key pair**, the app derives a Key Encryption Key (KEK) from the account password using **Argon2id** (64 MiB memory, 3 iterations — comfortably above OWASP's interactive-hashing minimums), encrypts the key pair with that KEK (AES-256-GCM), and uploads the encrypted blob plus the (non-secret) Argon2id salt to the server.
2. **On a second device**, at login the app checks IndexedDB for a local key pair. If there isn't one, it fetches the encrypted backup, re-derives the same KEK from the password just entered, and decrypts the *original* key pair straight into that device's IndexedDB — restoring full access to message history.
3. **If the password doesn't unlock the backup** (e.g. it predates a password change) the app falls back to generating a fresh key pair rather than blocking the user out of messaging.
4. **On password change**, the app re-encrypts the locally-held key pair under the new password and re-uploads it, so the backup doesn't go stale.

The plaintext password and the KEK derived from it never leave the browser — the server stores and returns only ciphertext, an IV, a salt, and the Argon2id parameters used, none of which are useful without the password.

## Scripts

| Location | Command | Description |
|---|---|---|
| `Backend/` | `npm run dev` | Start the API with `--watch` (auto-restart) |
| `Backend/` | `npm start` | Start the API for production |
| `Frontend/` | `ng serve` | Start the Angular dev server |
| `Frontend/` | `ng build` | Production build, output in `Frontend/dist/` |
| `Frontend/` | `ng test` | Run unit tests (Vitest) |

## Status

Core auth, opportunities, applications, pickups, notifications, and end-to-end encrypted messaging (with multi-device key backup) are implemented. See [`Backend/README.md`](Backend/README.md) for the full API reference and any modules still marked as future work.
