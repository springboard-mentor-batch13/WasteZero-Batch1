# Backend Rules

Permanent rules for the WasteZero backend project.

## Folder Structure

```
src/
  config/
    database.js       - MongoDB connection
    logger.js         - Winston logger config
  constants/
    roles.js          - Role constants
  controllers/
    authController.js
    userController.js
  services/
    authService.js
    userService.js
  models/
    User.js
  routes/
    index.js          - Central route registry
    authRoutes.js
    userRoutes.js
  middlewares/
    authMiddleware.js  - JWT verification
    roleMiddleware.js  - Role-based access
    errorMiddleware.js - Global error handler
  validators/
    authValidator.js
    userValidator.js
  utils/
    ApiResponse.js    - Standard success response
    ApiError.js       - Custom error class
    asyncHandler.js   - Async wrapper
  docs/
    api.md            - API documentation
  app.js              - Express app setup
  server.js           - Entry point
```

## Coding Standards

- MVC Architecture
- RESTful APIs
- SOLID Principles
- Services layer for business logic
- Thin controllers (req/res only)
- Async/Await with asyncHandler
- Meaningful variable names
- No duplicate code
- Production-ready code only

## API Standards

Base URL: `/api/v1`

Success:
```json
{
  "success": true,
  "message": "",
  "data": {},
  "timestamp": ""
}
```

Failure:
```json
{
  "success": false,
  "message": "",
  "errors": [],
  "timestamp": ""
}
```

Proper HTTP status codes.

## Environment Variables

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/wastezero
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Git Conventions

### Branch Strategy

```
main                    — Stable, production-ready code
  └── feature/<name>    — New feature development
```

Always branch from `main`. Merge back only after feature is complete and tested.

### Commit Message Format

Conventional Commits:

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`
Scopes: `auth`, `user`, `api`, `config`, `utils`, `model`, etc.

Examples:
```
feat(opportunity): implement create endpoint
fix(auth): prevent role escalation in profile update
docs(api): update endpoint documentation
refactor(utils): extract token helper
```

### Milestone Tags

After each milestone:
```
git tag milestone-<n>-complete
```

### Milestone Freeze Rule

Once a milestone is complete, its APIs are frozen. Do not modify existing endpoints unless it is a critical bug fix. All new development uses feature branches. Preserve backward compatibility with existing `/api/v1` endpoints.

---

## GitHub Push Rule

Hum **milestone-wise push** karenge.

Only push when the user explicitly says:

- `PUSH MILESTONE 1`
- `PUSH MILESTONE 2`
- `PUSH MILESTONE 3`
- `PUSH MILESTONE 4`
- `PUSH FINAL PROJECT`

Never push to GitHub without explicit approval.

---

## Schema Change Rule

Once a schema is approved and implemented, any future change must include:

1. Why the change is needed.
2. Whether it is backward compatible.
3. Whether a migration is required.
4. Which existing APIs are affected.

---

## Status Transitions (Opportunity)

```
OPEN
  ├──> IN_PROGRESS
  ├──> CANCELLED (terminal)
  └──> CLOSED

IN_PROGRESS
  └──> CLOSED

CLOSED
  └──> OPEN (Admin only)

CANCELLED
  └──> No further transitions (terminal)
```

---

## Naming Conventions

- Files: kebab-case (e.g., `auth-routes.js`)
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Models: PascalCase (e.g., `User`)
- Routes: plural nouns (e.g., `/users`)

## Definition of Done (DoD)

Every feature/task is complete ONLY when:

- [ ] Validation implemented
- [ ] Authentication/Authorization handled
- [ ] Business logic in service layer
- [ ] Data persisted correctly
- [ ] Proper HTTP status codes used
- [ ] Standard response format followed
- [ ] Error handling done
- [ ] No hardcoded strings (use constants)
- [ ] Logged appropriately
- [ ] discussion.txt updated
- [ ] todo.md updated
