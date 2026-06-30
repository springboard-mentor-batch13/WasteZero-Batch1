# Current Project State

## Project
WasteZero — Smart Waste Pickup & Recycling Platform

## Current Milestone
Milestone 2 — Opportunity Management

## Current Phase
D5 — Opportunity Service (READY TO START)

## Completed Phases
- Milestone 1 ✅ (C1–C5)
- D1 — Schema Review ✅
- D2 — Constants & Model ✅
- D3 — Validators ✅
- D4 — Ownership Middleware ✅

## Current Branch
`feature/opportunity-module`

## Next File to Create
`src/services/opportunityService.js`

## Next Action
Implement Opportunity Service with CRUD, search, filter, pagination, sorting, status transitions, soft delete

## Service API Methods (Approved)
| Method | Purpose |
|--------|---------|
| `createOpportunity(data, userId)` | Create with auto status=OPEN, ngo=userId |
| `getAllOpportunities(query)` | List with search/filter/pagination/sort |
| `getOpportunityById(id)` | Single record |
| `updateOpportunity(id, data, userId)` | Update with status transition validation |
| `deleteOpportunity(id, userId)` | Soft delete |
| `changeStatus(id, newStatus, userId)` | Status transition with rules |

## Blocked
None

## Pending Decisions
None

## Last Updated
2026-06-30 10:45 PM
