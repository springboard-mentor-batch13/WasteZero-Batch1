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
