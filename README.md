# WasteZero - Smart Waste Pickup & Recycling Platform

Backend API for the Infosys Springboard 7.0 Virtual Internship.

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- Winston (logging)
- Joi (validation)
- REST API

## Installation

```bash
npm install
npm run dev
```

Server starts at `http://localhost:3000`. Health check: `GET /health`

## Folder Structure

```
src/
  config/        - Database connection, logger
  constants/     - Role constants
  controllers/   - Request handlers
  services/      - Business logic
  models/        - Mongoose schemas
  routes/        - Express routes (index.js as registry)
  middlewares/   - Auth, role, error handling
  validators/    - Joi validation schemas
  utils/         - ApiResponse, ApiError, asyncHandler
  docs/          - API documentation
```

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## API Modules

### Auth (`/api/v1/auth`)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /register | Register new user (volunteer/ngo/admin) |
| POST | /login | Login, returns JWT |

### Users (`/api/v1/users`)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /profile | JWT | Get own profile |
| PUT | /profile | JWT | Update own profile |

### Health (`/health`)

| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Server health check |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server (with --watch)
