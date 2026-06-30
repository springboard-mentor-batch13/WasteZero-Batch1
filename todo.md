# TODO

## Pending

### Milestone 2 — Opportunity Management

#### Phase D1 — Schema Review & Approval
- [ ] Present complete MongoDB schema with field-level explanations
- [ ] Present indexes, validation rules, relationships, authorization rules
- [ ] Wait for explicit approval before writing code

#### Phase D2 — Constants & Model
- [ ] Add `constants/opportunityStatus.js` (enum: OPEN, IN_PROGRESS, CLOSED, CANCELLED)
- [ ] Create `src/models/Opportunity.js` (title, description, requiredSkills[], location, duration, status, maxVolunteers, applicationDeadline, ngo, createdBy, updatedBy, isDeleted, deletedAt)
- [ ] Add indexes (title, status, location, ngo, createdAt)

#### Phase D3 — Validators
- [ ] Create `src/validators/opportunityValidator.js` (create + update schemas with pagination, search, filter params)

#### Phase D4 — Ownership Middleware
- [ ] Create `src/middlewares/ownershipMiddleware.js` (check opportunity.ngo === req.user.id)

#### Phase D5 — Service ✅
- [x] Create `src/services/opportunityService.js` (6 methods: create, list, getById, update, delete, changeStatus)
- [x] Search via $text index
- [x] Filter by status, location, skill
- [x] Pagination (page=1, limit=10, max=100)
- [x] Sorting (newest/oldest)
- [x] Status transition engine
- [x] Soft delete with audit

#### Phase D6 — Controller & Routes
- [ ] Create `src/controllers/opportunityController.js`
- [ ] Create `src/routes/opportunityRoutes.js`
- [ ] Update `src/routes/index.js` — mount at /api/v1/opportunities

#### Phase D7 — Testing & Documentation
- [ ] Test all CRUD + search/filter/pagination scenarios
- [ ] Update `src/docs/api.md` — opportunity endpoints
- [ ] Update README.md
- [ ] Update discussion.txt
- [ ] Update todo.md

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
