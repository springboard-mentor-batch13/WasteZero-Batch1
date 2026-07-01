# WasteZero Database Schema & Relationships

## ER Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              USER                                   │
│─────────────────────────────────────────────────────────────────────│
│ _id          (ObjectId) PK                                          │
│ name         (String)                                               │
│ email        (String) [unique]                                      │
│ password     (String) [hashed]                                      │
│ role         (String) [volunteer | ngo | admin]                     │
│ skills       [String]                                               │
│ location     (String)                                               │
│ bio          (String)                                               │
│ createdAt    (Date)                                                 │
│ updatedAt    (Date)                                                 │
└──────────┬──────────────────────────────────────────────────────────┘
           │
           │ 1 ─── creates ────► *
           │
           │
           ├──────────────────────────────────────────────────────────┐
           │ 1 ─── applies ────► *                                    │
           │                                                          │
           │                                                          │
           │                                                          │
           │  ┌───────────────────────────────────────────────────────────┐
           │  │                   APPLICATION                            │
           │  │───────────────────────────────────────────────────────────│
           │  │ _id             (ObjectId) PK                            │
           │  │ opportunity     (ObjectId) FK ───────────────────────┐   │
           │  │ volunteer       (ObjectId) FK ─── (User)             │   │
           │  │ status          (String) [pending|accepted|rejected| │   │
           │  │                              withdrawn]              │   │
           │  │ updatedBy       (ObjectId) FK ─── (User)             │   │
           │  │ reviewedBy      (ObjectId) FK ─── (User)             │   │
           │  │ reviewedAt      (Date)                               │   │
           │  │ createdAt       (Date) ─── appliedAt                 │   │
           │  │ updatedAt       (Date)                               │   │
           │  └──────────────────────────────────────────────────────┘   │
           │                                                             │
           │                                                             │
           │  ┌──────────────────────────────────────────────────────────┐
           │  │                     MESSAGE                               │
           │  │──────────────────────────────────────────────────────────│
           ├──│ sender          (ObjectId) FK                            │
           │  │ receiver        (ObjectId) FK ─── (User)                 │
           │  │ application     (ObjectId) FK ─── (Application) [opt]    │
           │  │ content         (String)                                 │
           │  │ messageType     (String) [text|image|file|system]        │
           │  │ isRead          (Boolean)                                │
           │  │ readAt          (Date)                                   │
           │  │ isDeleted       (Boolean)                                │
           │  │ deletedAt       (Date)                                   │
           │  │ createdAt       (Date) ─── sentAt                        │
           │  │ updatedAt       (Date)                                   │
           │  └──────────────────────────────────────────────────────────┘
           │
           │
           │  ┌──────────────────────────────────────────────────────────┐
           │  │                     ADMINLOG                              │
           │  │──────────────────────────────────────────────────────────│
           └──│ admin           (ObjectId) FK ─── (User)                 │
              │ action          (String) [create|update|delete|restore|   │
              │                           login|logout|approve|reject|    │
              │                           assign|export|import]           │
              │ targetType      (String) [user|opportunity|application|   │
              │                           message|adminlog]               │
              │ targetId        (ObjectId)                                │
              │ details         (Mixed)                                   │
              │ ipAddress       (String)                                  │
              │ userAgent       (String)                                  │
              │ createdAt       (Date)                                    │
              └──────────────────────────────────────────────────────────┘



┌─────────────────────────────────────────────────────────────────────┐
│                          OPPORTUNITY                                │
│─────────────────────────────────────────────────────────────────────│
│ _id              (ObjectId) PK                                      │
│ title            (String)                                           │
│ description      (String)                                           │
│ requiredSkills   [String]                                           │
│ location.city    (String)                                           │
│ location.state   (String)                                           │
│ duration.value   (Number)                                           │
│ duration.unit    (String) [hours|days|weeks|months]                 │
│ status           (String) [open|in_progress|closed|cancelled]       │
│ maxVolunteers    (Number)                                           │
│ applicationDeadline (Date)                                          │
│ ngo              (ObjectId) FK ─── (User)                           │
│ createdBy        (ObjectId) FK ─── (User)                           │
│ updatedBy        (ObjectId) FK ─── (User)                           │
│ isDeleted        (Boolean)                                          │
│ deletedAt        (Date)                                             │
│ createdAt        (Date)                                             │
│ updatedAt        (Date)                                             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Relationship Summary

| From | Relationship | To | Via |
|------|-------------|-----|-----|
| **User** (ngo) | 1 ───→ * | **Opportunity** | `opportunity.ngo` |
| **User** (volunteer) | 1 ───→ * | **Application** | `application.volunteer` |
| **Opportunity** | 1 ───→ * | **Application** | `application.opportunity` |
| **User** (sender) | 1 ───→ * | **Message** | `message.sender` |
| **User** (receiver) | 1 ───→ * | **Message** | `message.receiver` |
| **Application** | 1 ───→ * | **Message** | `message.application` (optional) |
| **User** (admin) | 1 ───→ * | **AdminLog** | `adminLog.admin` |

---

## Indexes

### Users
- `{ email: 1 }` — unique

### Opportunities
- `{ title: 'text' }` — full-text search
- `{ status: 1, 'location.city': 1 }` — filtered listing
- `{ ngo: 1 }` — my-opportunities query
- `{ createdAt: -1 }` — default sorting
- `{ status: 1 }` — status filter

### Applications
- `{ opportunity: 1, volunteer: 1 }` — **unique compound** (no duplicate)
- `{ volunteer: 1 }` — my-applications
- `{ opportunity: 1 }` — applicants per opportunity
- `{ status: 1 }` — status filter

### Messages
- `{ sender: 1, receiver: 1, createdAt: -1 }` — conversation
- `{ receiver: 1, isRead: 1 }` — unread count
- `{ application: 1, createdAt: -1 }` — application chat
- `{ sender: 1 }` — sent messages
- `{ receiver: 1 }` — received messages
- `{ sender: 1, receiver: 1, application: 1 }` — compound conversation lookup

### AdminLogs
- `{ admin: 1, createdAt: -1 }` — admin activity
- `{ targetType: 1, targetId: 1 }` — entity audit trail
- `{ action: 1 }` — action filter
- `{ createdAt: -1 }` — chronological

---

## Status Transitions

### Opportunity
```
OPEN ──────► IN_PROGRESS
  │               │
  ├────► CLOSED ──┘
  │         │
  │         └────► OPEN (admin only)
  │
  └────► CANCELLED (terminal)
```

### Application
```
PENDING ──────► ACCEPTED (terminal)
  │
  ├────► REJECTED (terminal)
  │
  └────► WITHDRAWN (terminal)
```
