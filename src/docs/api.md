# WasteZero API Documentation

Base URL: `/api/v1`

## Health Check

```
GET /health
```

Response: `200 OK`
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "UP",
    "timestamp": "2026-06-30T00:00:00.000Z"
  },
  "timestamp": "2026-06-30T00:00:00.000Z"
}
```

---

## Auth

### Register

```
POST /api/v1/auth/register
```

Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "volunteer",
  "skills": ["sorting", "driving"],
  "location": "New York",
  "bio": "Environment enthusiast"
}
```

Success Response: `201 Created`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "60d...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "volunteer",
      "skills": ["sorting", "driving"],
      "location": "New York",
      "bio": "Environment enthusiast"
    }
  },
  "timestamp": "2026-06-30T00:00:00.000Z"
}
```

Error Responses:
- `400` — Validation failed (missing/invalid fields)
- `409` — Email already exists

---

### Login

```
POST /api/v1/auth/login
```

Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "60d...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "volunteer"
    }
  },
  "timestamp": "2026-06-30T00:00:00.000Z"
}
```

Error Responses:
- `400` — Validation failed
- `401` — Invalid email or password

---

## Users

All User routes require Authentication header:
```
Authorization: Bearer <token>
```

### Get Profile

```
GET /api/v1/users/profile
```

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "_id": "60d...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "volunteer",
      "skills": ["sorting", "driving"],
      "location": "New York",
      "bio": "Environment enthusiast"
    }
  },
  "timestamp": "2026-06-30T00:00:00.000Z"
}
```

### Update Profile

```
PUT /api/v1/users/profile
```

Request Body (at least one field required):
```json
{
  "name": "John Updated",
  "skills": ["sorting", "driving", "management"],
  "location": "Boston"
}
```

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "60d...",
      "name": "John Updated",
      "email": "john@example.com",
      "role": "volunteer",
      "skills": ["sorting", "driving", "management"],
      "location": "Boston",
      "bio": "Environment enthusiast"
    }
  },
  "timestamp": "2026-06-30T00:00:00.000Z"
}
```

Error Responses:
- `400` — Validation failed / No fields provided
- `401` — No token / Invalid token / Expired token
- `404` — User not found

---

## Opportunities

All Opportunity routes require Authentication header:
```
Authorization: Bearer <token>
```

### Create Opportunity

```
POST /api/v1/opportunities
```

Auth: `JWT` | Role: `ngo`

Request Body:
```json
{
  "title": "Beach Cleanup Drive",
  "description": "Join us for a weekend beach cleanup event. Gloves and bags provided.",
  "requiredSkills": ["cleaning", "teamwork"],
  "location": {
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "duration": {
    "value": 4,
    "unit": "hours"
  },
  "maxVolunteers": 20,
  "applicationDeadline": "2026-08-01T00:00:00.000Z"
}
```

Success Response: `201 Created`
```json
{
  "success": true,
  "message": "Opportunity created successfully",
  "data": {
    "opportunity": {
      "_id": "60d...",
      "title": "Beach Cleanup Drive",
      "description": "Join us for a weekend beach cleanup event...",
      "requiredSkills": ["cleaning", "teamwork"],
      "location": { "city": "Mumbai", "state": "Maharashtra" },
      "duration": { "value": 4, "unit": "hours" },
      "status": "OPEN",
      "maxVolunteers": 20,
      "applicationDeadline": "2026-08-01T00:00:00.000Z",
      "ngo": "60d...",
      "createdBy": "60d...",
      "updatedBy": "60d...",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "updatedAt": "2026-07-01T00:00:00.000Z"
    }
  },
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Error Responses:
- `400` — Validation failed
- `401` — No token / Invalid token
- `403` — Only NGOs can create opportunities

---

### Get All Opportunities

```
GET /api/v1/opportunities
```

Auth: `JWT` | Role: `volunteer`, `ngo`, `admin`

Query Parameters (all optional):
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Full-text search in title |
| status | string | Filter: OPEN, IN_PROGRESS, CLOSED, CANCELLED |
| location | string | Filter by city (case-insensitive) |
| skill | string | Filter by required skill |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10, max: 100) |
| sort | string | Sort: newest (default) or oldest |

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Opportunities fetched successfully",
  "data": {
    "opportunities": [
      {
        "_id": "60d...",
        "title": "Beach Cleanup Drive",
        "status": "OPEN",
        "location": { "city": "Mumbai", "state": "Maharashtra" },
        "requiredSkills": ["cleaning", "teamwork"],
        "createdAt": "2026-07-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  },
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

---

### Get Opportunity By ID

```
GET /api/v1/opportunities/:id
```

Auth: `JWT` | Role: `volunteer`, `ngo`, `admin`

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Opportunity fetched successfully",
  "data": {
    "opportunity": {
      "_id": "60d...",
      "title": "Beach Cleanup Drive",
      "description": "Join us for a weekend beach cleanup event...",
      "requiredSkills": ["cleaning", "teamwork"],
      "location": { "city": "Mumbai", "state": "Maharashtra" },
      "duration": { "value": 4, "unit": "hours" },
      "status": "OPEN",
      "maxVolunteers": 20,
      "applicationDeadline": "2026-08-01T00:00:00.000Z",
      "ngo": "60d...",
      "createdBy": "60d...",
      "createdAt": "2026-07-01T00:00:00.000Z",
      "updatedAt": "2026-07-01T00:00:00.000Z"
    }
  },
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Error Responses:
- `401` — No token / Invalid token
- `404` — Opportunity not found

---

### Update Opportunity

```
PUT /api/v1/opportunities/:id
```

Auth: `JWT` | Role: `ngo` (owner only) | Admin can update any

Request Body (at least one field required):
```json
{
  "title": "Updated Beach Cleanup Drive",
  "maxVolunteers": 30,
  "status": "IN_PROGRESS"
}
```

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Opportunity updated successfully",
  "data": {
    "opportunity": {
      "_id": "60d...",
      "title": "Updated Beach Cleanup Drive",
      "status": "IN_PROGRESS",
      "maxVolunteers": 30
    }
  },
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Error Responses:
- `400` — Validation failed
- `401` — No token / Invalid token
- `403` — Forbidden (not owner)
- `404` — Opportunity not found

---

### Change Opportunity Status

```
PATCH /api/v1/opportunities/:id/status
```

Auth: `JWT` | Role: `ngo` (owner only), `admin`

Request Body:
```json
{
  "status": "IN_PROGRESS"
}
```

Valid Transitions:
- OPEN → IN_PROGRESS, CLOSED, CANCELLED
- IN_PROGRESS → CLOSED
- CLOSED → OPEN (Admin only)
- CANCELLED → No transitions (terminal)

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Opportunity status updated successfully",
  "data": {
    "opportunity": {
      "_id": "60d...",
      "status": "IN_PROGRESS"
    }
  },
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Error Responses:
- `400` — Invalid status / Invalid transition
- `401` — No token / Invalid token
- `403` — Forbidden (not owner / only admin can reopen)
- `404` — Opportunity not found

---

### Delete Opportunity

```
DELETE /api/v1/opportunities/:id
```

Auth: `JWT` | Role: `ngo` (owner only) | Admin can delete any

Success Response: `200 OK`
```json
{
  "success": true,
  "message": "Opportunity deleted successfully",
  "data": {
    "id": "60d...",
    "deletedAt": "2026-07-01T00:00:00.000Z"
  },
  "timestamp": "2026-07-01T00:00:00.000Z"
}
```

Error Responses:
- `401` — No token / Invalid token
- `403` — Forbidden (not owner)
- `404` — Opportunity not found

> Note: This is a soft delete. The record is preserved with `isDeleted: true` and `deletedAt` timestamp.

---

## Standard Response Format

Success:
```json
{
  "success": true,
  "message": "",
  "data": {},
  "timestamp": ""
}
```

Error:
```json
{
  "success": false,
  "message": "",
  "errors": [],
  "timestamp": ""
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |
