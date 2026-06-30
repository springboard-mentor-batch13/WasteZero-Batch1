# TODO

## Pending

### Milestone 2 — Opportunity Management (Future)
- [ ] Opportunity CRUD (NGO only)
- [ ] Opportunity listing & filtering

### Milestone 3 — Matching & Communication (Future)
- [ ] Matching algorithm (location + waste type)
- [ ] Real-time messaging (WebSockets)
- [ ] Notification system

### Milestone 4 — Administration & Reporting (Future)
- [ ] Admin dashboard APIs
- [ ] Analytics & reports
- [ ] User/Post moderation
- [ ] Testing & final report

## Completed

### Milestone 1 — User Management ✅

#### Phase C1 — Project Foundation ✅
- [x] `npm init` and install dependencies
- [x] Create `.env`
- [x] Create folder structure
- [x] Create `src/server.js`
- [x] Create `src/app.js`
- [x] Add `GET /health` route
- [x] Verify server starts

#### Phase C2 — Infrastructure ✅
- [x] Create `src/config/database.js`
- [x] Create `src/config/logger.js`
- [x] Create `src/constants/roles.js`
- [x] Create `src/utils/ApiResponse.js`
- [x] Create `src/utils/ApiError.js`
- [x] Create `src/utils/asyncHandler.js`

#### Phase C3 — Authentication Foundation ✅
- [x] Create `src/models/User.js`
- [x] Create `src/validators/authValidator.js`
- [x] Create `src/validators/userValidator.js`
- [x] Create `src/middlewares/errorMiddleware.js`
- [x] Create `src/middlewares/authMiddleware.js`
- [x] Create `src/middlewares/roleMiddleware.js`

#### Phase C4 — Business Logic ✅
- [x] Create `src/services/authService.js`
- [x] Create `src/services/userService.js`
- [x] Create `src/controllers/authController.js`
- [x] Create `src/controllers/userController.js`
- [x] Create `src/routes/authRoutes.js`
- [x] Create `src/routes/userRoutes.js`
- [x] Create `src/routes/index.js`

#### Phase C5 — Testing & Documentation ✅
- [x] Create `src/docs/api.md`
- [x] End-to-end testing (register, login, duplicate, profile, update, invalid login)
- [x] Update README.md
- [x] Update discussion.txt
- [x] Update todo.md

### Code Review Fixes ✅
- [x] **Security:** throw → next() in authMiddleware and roleMiddleware
- [x] **Security:** Added helmet + cors
- [x] **Bug fix:** Role escalation blocked in profile update
- [x] **Bug fix:** Email/password change blocked in profile update
- [x] **Architecture:** JWT signing extracted to utils/token.js
- [x] **Architecture:** User sanitize extracted to utils/token.js
- [x] **Architecture:** Validation error response moved to ApiResponse.validationError()
- [x] **Architecture:** Env validation on startup (missing vars → server fails)
- [x] **Architecture:** Default JWT_SECRET warning on startup
- [x] **Performance:** .lean() added to read-only queries
- [x] **Cleanup:** __v removed from JSON responses via toJSON transform
- [x] **Cleanup:** process.exit(1) removed from database.js, moved to server.js

## Blocked

- None

## Next Sprint

- Milestone 2 — Opportunity Management
