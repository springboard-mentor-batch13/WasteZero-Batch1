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
